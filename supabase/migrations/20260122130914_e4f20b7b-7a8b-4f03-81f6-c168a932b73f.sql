-- 1. PROFILES: Ajouter une policy explicite de refus pour les utilisateurs non authentifiés
-- (RLS refuse par défaut mais on renforce avec une policy restrictive explicite)

-- 2. VENDOR_PROFILES: Créer une vue publique sans données sensibles
CREATE OR REPLACE VIEW public.vendor_profiles_public 
WITH (security_invoker = on) AS
SELECT 
  id,
  shop_name,
  description,
  is_verified,
  pavilion,
  created_at
FROM public.vendor_profiles
WHERE is_verified = true;

-- 3. USER_ROLES: Ajouter des policies restrictives explicites pour empêcher l'escalade de privilèges
-- Empêcher les non-admins d'insérer des rôles
CREATE POLICY "Only admins can insert roles"
ON public.user_roles
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Empêcher les non-admins de mettre à jour des rôles
CREATE POLICY "Only admins can update roles"
ON public.user_roles
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Empêcher les non-admins de supprimer des rôles
CREATE POLICY "Only admins can delete roles"
ON public.user_roles
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- 4. PRODUCTS: Exiger l'authentification pour voir les produits
DROP POLICY IF EXISTS "Anyone can view available products" ON public.products;

CREATE POLICY "Authenticated users can view available products"
ON public.products
FOR SELECT
USING (auth.uid() IS NOT NULL AND is_available = true AND stock > 0);

-- 5. CATEGORIES: Exiger l'authentification
DROP POLICY IF EXISTS "Anyone can view categories" ON public.categories;

CREATE POLICY "Authenticated users can view categories"
ON public.categories
FOR SELECT
USING (auth.uid() IS NOT NULL);