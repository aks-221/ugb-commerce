
-- 1. Allow anyone to view available products (no auth required)
DROP POLICY IF EXISTS "Authenticated users can view available products" ON public.products;
CREATE POLICY "Anyone can view available products"
  ON public.products FOR SELECT
  USING (is_available = true AND stock > 0);

-- 2. Allow anyone to view categories (no auth required)
DROP POLICY IF EXISTS "Authenticated users can view categories" ON public.categories;
CREATE POLICY "Anyone can view categories"
  ON public.categories FOR SELECT
  USING (true);

-- 3. Allow anyone to view vendor public profiles (no auth required on the base table for the view)
DROP POLICY IF EXISTS "Authenticated users can view verified vendors" ON public.vendor_profiles;
CREATE POLICY "Anyone can view vendors via public view"
  ON public.vendor_profiles FOR SELECT
  USING (true);
