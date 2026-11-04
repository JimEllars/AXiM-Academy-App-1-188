-- ---------------------------------------------------------------------------
-- Ladder of Value: constrain academy_courses.category to the canonical tracks.
--
-- 20260602000000 added `category TEXT NOT NULL DEFAULT 'Foundation'` and seeded
-- four of the six tracks. Nothing constrained the values, so a new row could
-- land in 'Foundaton' (or 'creative labs', or 'Creative-Labs') and the storefront
-- filter would silently drop it: `courseMatchesTrack()` normalises for
-- comparison but an unrecognised label matches no chip, so the course is
-- invisible in every filtered view while still appearing under "All".
--
-- The list below must stay in step with TRACKS in src/lib/track.js. The
-- normalisation that makes 'creative-labs' and 'Creative Labs' compare equal
-- lives in that module; this constraint is what keeps the *stored* value
-- canonical so a filter can be a plain equality.
--
-- Existing rows are normalised before the constraint is added, so applying this
-- to a database that already holds drifted labels succeeds instead of aborting.
--
-- Operator note: this migration has NOT been executed. Per the working
-- agreement in Continued Development Plan.md, "a migration that has not been
-- executed is not verified" — run it on a preview branch first.
-- ---------------------------------------------------------------------------

-- 1. Normalise anything already stored to the canonical spelling.
UPDATE public.academy_courses
SET category = CASE
    WHEN lower(btrim(category)) IN ('foundation', 'foundations') THEN 'Foundation'
    WHEN lower(regexp_replace(btrim(category), '[^a-zA-Z0-9]+', '-', 'g')) IN ('creative-labs', 'creative-lab', 'creative') THEN 'Creative Labs'
    WHEN lower(regexp_replace(btrim(category), '[^a-zA-Z0-9]+', '-', 'g')) IN ('professional-edge', 'professional', 'pro-edge') THEN 'Professional Edge'
    WHEN lower(btrim(category)) = 'hardware' THEN 'Hardware'
    WHEN lower(btrim(category)) = 'ai' THEN 'AI'
    WHEN lower(btrim(category)) = 'protocol' THEN 'Protocol'
    ELSE 'Foundation'
END
WHERE category NOT IN ('Foundation', 'Creative Labs', 'Professional Edge', 'Hardware', 'AI', 'Protocol');

-- 2. Pin the column to that list. NOT VALID keeps the lock short on a large
--    table, then VALIDATE proves the existing rows in a separate pass.
ALTER TABLE public.academy_courses
    DROP CONSTRAINT IF EXISTS academy_courses_category_check;

ALTER TABLE public.academy_courses
    ADD CONSTRAINT academy_courses_category_check
    CHECK (category IN ('Foundation', 'Creative Labs', 'Professional Edge', 'Hardware', 'AI', 'Protocol'))
    NOT VALID;

ALTER TABLE public.academy_courses
    VALIDATE CONSTRAINT academy_courses_category_check;

-- 3. A partial index for the storefront filter, which is always
--    `WHERE category = $1 AND visibility IN ('public','unlisted')`.
CREATE INDEX IF NOT EXISTS academy_courses_category_visibility_idx
    ON public.academy_courses (category, visibility);
