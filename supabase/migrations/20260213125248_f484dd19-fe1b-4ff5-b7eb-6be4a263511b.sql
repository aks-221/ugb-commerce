
-- Update vendor_profiles_public view to include phone and room for direct contact
DROP VIEW IF EXISTS public.vendor_profiles_public;
CREATE VIEW public.vendor_profiles_public
WITH (security_invoker=on) AS
  SELECT id, shop_name, description, pavilion, room, phone, created_at, is_verified
  FROM public.vendor_profiles;

-- Insert default categories if they don't exist
INSERT INTO public.categories (name, icon, description) VALUES
  ('Alimentation', '🍔', 'Nourriture, boissons et snacks')
ON CONFLICT DO NOTHING;

INSERT INTO public.categories (name, icon, description) VALUES
  ('Électronique', '💻', 'Gadgets, accessoires et appareils')
ON CONFLICT DO NOTHING;

INSERT INTO public.categories (name, icon, description) VALUES
  ('Vêtements', '👕', 'Habits, chaussures et accessoires')
ON CONFLICT DO NOTHING;

INSERT INTO public.categories (name, icon, description) VALUES
  ('Services', '🔧', 'Cours particuliers, réparations, etc.')
ON CONFLICT DO NOTHING;

INSERT INTO public.categories (name, icon, description) VALUES
  ('Fournitures', '📚', 'Livres, cahiers et matériel scolaire')
ON CONFLICT DO NOTHING;

INSERT INTO public.categories (name, icon, description) VALUES
  ('Beauté', '💄', 'Cosmétiques et soins personnels')
ON CONFLICT DO NOTHING;
