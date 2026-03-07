-- 1. CORRIGER: vendor_profiles - Remplacer l'accès public par un accès authentifié uniquement
DROP POLICY IF EXISTS "Anyone can view vendor profiles" ON public.vendor_profiles;

-- Les utilisateurs authentifiés peuvent voir les vendeurs vérifiés (pour afficher dans le catalogue)
CREATE POLICY "Authenticated users can view verified vendors"
ON public.vendor_profiles
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND (is_verified = true OR user_id = auth.uid())
);

-- 2. RENFORCER: orders - Ajouter une validation explicite
-- Les policies existantes sont correctes mais on ajoute une couche de sécurité supplémentaire
DROP POLICY IF EXISTS "Clients can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Vendors can view orders for their shop" ON public.orders;

CREATE POLICY "Clients can only view their own orders"
ON public.orders
FOR SELECT
USING (auth.uid() IS NOT NULL AND auth.uid() = client_id);

CREATE POLICY "Vendors can only view their shop orders"
ON public.orders
FOR SELECT
USING (auth.uid() IS NOT NULL AND vendor_id = get_vendor_profile_id(auth.uid()));

-- 3. RENFORCER: profiles - S'assurer que les données PII sont protégées
-- Les policies existantes sont correctes, mais on renforce avec une vérification explicite d'authentification
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

CREATE POLICY "Users can only view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Mettre à jour la policy admin aussi pour inclure la vérification d'auth
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

CREATE POLICY "Authenticated admins can view all profiles"
ON public.profiles
FOR SELECT
USING (auth.uid() IS NOT NULL AND has_role(auth.uid(), 'admin'::app_role));