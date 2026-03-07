
-- Drop all existing restrictive policies on products
DROP POLICY IF EXISTS "Anyone can view available products" ON public.products;
DROP POLICY IF EXISTS "Vendors can manage their own products" ON public.products;
DROP POLICY IF EXISTS "Admins can manage all products" ON public.products;

-- Recreate as PERMISSIVE policies (default)
CREATE POLICY "Anyone can view available products"
ON public.products
FOR SELECT
USING ((is_available = true) AND (stock > 0));

CREATE POLICY "Vendors can manage their own products"
ON public.products
FOR ALL
USING (vendor_id = get_vendor_profile_id(auth.uid()));

CREATE POLICY "Admins can manage all products"
ON public.products
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));
