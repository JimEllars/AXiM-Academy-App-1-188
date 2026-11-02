-- Migration: 20261102000000_academy_affiliate_credentials_rls.sql
-- Description: Unified-commerce hardening for AXiM Academy.
--
--   1. Enrollment columns the checkout path already tried to write
--      (payment_method, tx_hash) plus affiliate attribution and the printed
--      certificate hash.
--   2. RLS for academy_enrollments INSERT/UPDATE (there was none: every live
--      enrollment was rejected) restricted to the learner's own rows, with
--      column-level grants so a client can never mark itself credentialed.
--   3. academy_progress UPDATE policy (upsert of a repeat lesson needs it).
--   4. RLS on academy_promo_codes + academy_validate_promo(); the table had no
--      RLS at all, which let any visitor read every code, including the 100%
--      internal grants, straight off PostgREST.
--   5. RLS on academy_modules/academy_lessons so unlisted/internal content is
--      not world-readable.
--   6. Promo redemption accounting: uses is incremented on enrollment, and the
--      code's linked_affiliate_id becomes the enrollment's affiliate_id.
--
-- STATUS: authored, NOT executed. This workspace has no psql, no Supabase CLI
-- and no link to the Academy project, so the statements below are unverified
-- against a live database and must be applied deliberately:
--     supabase link --project-ref <ref> && supabase db push
-- Do not merge-deploy the frontend that depends on these columns before the
-- push, or checkout keeps failing on PGRST204.

-- ---------------------------------------------------------------------------
-- 1. Columns
-- ---------------------------------------------------------------------------
ALTER TABLE public.academy_enrollments
    ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'fiat',
    ADD COLUMN IF NOT EXISTS tx_hash TEXT,
    ADD COLUMN IF NOT EXISTS affiliate_id TEXT,
    ADD COLUMN IF NOT EXISTS certificate_hash TEXT;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'academy_enrollments_payment_method_check'
    ) THEN
        ALTER TABLE public.academy_enrollments
            ADD CONSTRAINT academy_enrollments_payment_method_check
            CHECK (payment_method IS NULL OR payment_method IN ('fiat', 'crypto', 'internal_grant'));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'academy_enrollments_certificate_hash_check'
    ) THEN
        ALTER TABLE public.academy_enrollments
            ADD CONSTRAINT academy_enrollments_certificate_hash_check
            CHECK (certificate_hash IS NULL OR certificate_hash ~ '^[0-9a-f]{64}$');
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_academy_enrollments_certificate_hash
    ON public.academy_enrollments (certificate_hash)
    WHERE certificate_hash IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_academy_enrollments_affiliate_id
    ON public.academy_enrollments (affiliate_id)
    WHERE affiliate_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 2. Enrollment RLS: learners write their own row, and only safe columns
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Learners can enroll themselves" ON public.academy_enrollments;
CREATE POLICY "Learners can enroll themselves"
ON public.academy_enrollments FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Learners can update their own enrollment" ON public.academy_enrollments;
CREATE POLICY "Learners can update their own enrollment"
ON public.academy_enrollments FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Column-level grants: status, completed_at and sbt_mint_status are credential
-- state. They are written by the completion trigger and by the credential
-- minting Edge Function (service role), never by a browser.
REVOKE UPDATE ON public.academy_enrollments FROM anon, authenticated;
GRANT UPDATE (
    payment_method,
    tx_hash,
    stripe_payment_intent,
    web3_wallet_address,
    applied_promo_code,
    affiliate_id,
    certificate_hash
) ON public.academy_enrollments TO authenticated;

GRANT SELECT ON public.academy_enrollments TO authenticated;
REVOKE ALL ON public.academy_enrollments FROM anon;

-- ---------------------------------------------------------------------------
-- 3. Progress RLS: UPDATE for the upsert path
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can update their own progress" ON public.academy_progress;
CREATE POLICY "Users can update their own progress"
ON public.academy_progress FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.academy_enrollments e
        WHERE e.id = academy_progress.enrollment_id AND e.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.academy_enrollments e
        WHERE e.id = academy_progress.enrollment_id AND e.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Users can view their own progress" ON public.academy_progress;
CREATE POLICY "Users can view their own progress"
ON public.academy_progress FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.academy_enrollments e
        WHERE e.id = academy_progress.enrollment_id AND e.user_id = auth.uid()
    )
);

-- ---------------------------------------------------------------------------
-- 4. Promo codes: close the world-readable table, validate through an RPC
-- ---------------------------------------------------------------------------
ALTER TABLE public.academy_promo_codes ENABLE ROW LEVEL SECURITY;

-- No direct SELECT: a promotion list is a pricing document. Without this, any
-- visitor can enumerate AXIM100 (100% internal grant) with the anon key.
REVOKE ALL ON public.academy_promo_codes FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.academy_validate_promo(p_code TEXT)
RETURNS TABLE (
    code TEXT,
    discount_percentage NUMERIC,
    is_internal_grant BOOLEAN,
    linked_affiliate_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT p.code, p.discount_percentage, p.is_internal_grant, p.linked_affiliate_id
    FROM public.academy_promo_codes p
    WHERE upper(p.code) = upper(btrim(p_code))
      AND (p.valid_until IS NULL OR p.valid_until > NOW())
      AND (p.max_uses IS NULL OR p.uses < p.max_uses)
    LIMIT 1;
END;
$$;

REVOKE ALL ON FUNCTION public.academy_validate_promo(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.academy_validate_promo(TEXT) TO anon, authenticated;

-- Redemption accounting: increment uses and inherit affiliate attribution on
-- enrollment. Runs server-side so the browser cannot inflate or skip it.
CREATE OR REPLACE FUNCTION public.academy_apply_promo_on_enrollment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    promo RECORD;
BEGIN
    IF NEW.applied_promo_code IS NULL THEN
        RETURN NEW;
    END IF;

    SELECT * INTO promo
    FROM public.academy_promo_codes
    WHERE upper(code) = upper(NEW.applied_promo_code)
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Unknown promo code %', NEW.applied_promo_code
            USING ERRCODE = 'foreign_key_violation';
    END IF;

    IF promo.valid_until IS NOT NULL AND promo.valid_until <= NOW() THEN
        RAISE EXCEPTION 'Promo code % has expired', NEW.applied_promo_code
            USING ERRCODE = 'check_violation';
    END IF;

    IF promo.max_uses IS NOT NULL AND promo.uses >= promo.max_uses THEN
        RAISE EXCEPTION 'Promo code % is exhausted', NEW.applied_promo_code
            USING ERRCODE = 'check_violation';
    END IF;

    UPDATE public.academy_promo_codes
    SET uses = uses + 1
    WHERE id = promo.id;

    NEW.applied_promo_code := promo.code;
    IF NEW.affiliate_id IS NULL AND promo.linked_affiliate_id IS NOT NULL THEN
        NEW.affiliate_id := promo.linked_affiliate_id::text;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS academy_apply_promo_on_enrollment ON public.academy_enrollments;
CREATE TRIGGER academy_apply_promo_on_enrollment
BEFORE INSERT ON public.academy_enrollments
FOR EACH ROW EXECUTE FUNCTION public.academy_apply_promo_on_enrollment();

-- ---------------------------------------------------------------------------
-- 5. Course structure RLS (modules/lessons had none)
-- ---------------------------------------------------------------------------
ALTER TABLE public.academy_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_lessons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Modules of visible courses" ON public.academy_modules;
CREATE POLICY "Modules of visible courses"
ON public.academy_modules FOR SELECT
TO anon, authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.academy_courses c
        WHERE c.id = academy_modules.course_id
          AND c.visibility <> 'archived'
    )
);

DROP POLICY IF EXISTS "Lessons of visible courses" ON public.academy_lessons;
CREATE POLICY "Lessons of visible courses"
ON public.academy_lessons FOR SELECT
TO anon, authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.academy_modules m
        JOIN public.academy_courses c ON c.id = m.course_id
        WHERE m.id = academy_lessons.module_id
          AND c.visibility <> 'archived'
    )
);

-- Unlisted courses stay out of public browsing but must be resolvable by a
-- signed-in learner following a direct link (internal contractor onboarding).
DROP POLICY IF EXISTS "Unlisted courses for signed-in learners" ON public.academy_courses;
CREATE POLICY "Unlisted courses for signed-in learners"
ON public.academy_courses FOR SELECT
TO authenticated
USING (visibility = 'unlisted');
