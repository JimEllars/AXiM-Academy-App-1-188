ALTER TABLE public.academy_courses ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'Foundation';

INSERT INTO public.academy_courses (title, price_usd, visibility, category)
VALUES
  ('K-12 & ESL', 0.00, 'public', 'Foundation'),
  ('Game Development & STEM', 99.00, 'public', 'Creative Labs'),
  ('Nexus CRM Mastery & Systems Architecture', 299.00, 'public', 'Professional Edge'),
  ('Internal contractor onboarding', 499.00, 'unlisted', 'Hardware')
ON CONFLICT DO NOTHING;

INSERT INTO public.academy_promo_codes (code, discount_percentage, is_internal_grant, max_uses)
VALUES
  ('AXIM100', 100, true, null),
  ('PARTNER20', 20, false, 100)
ON CONFLICT DO NOTHING;
