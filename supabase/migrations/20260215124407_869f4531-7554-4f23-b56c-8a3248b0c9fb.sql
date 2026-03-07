
-- Fix profiles policies: drop restrictive, recreate as permissive
DROP POLICY IF EXISTS "Users can only view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

CREATE POLICY "Users can only view their own profile"
ON public.profiles FOR SELECT
USING ((auth.uid() IS NOT NULL) AND (auth.uid() = user_id));

CREATE POLICY "Authenticated admins can view all profiles"
ON public.profiles FOR SELECT
USING ((auth.uid() IS NOT NULL) AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Fix user_roles policies: drop restrictive, recreate as permissive
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can delete roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can self-assign vendor or client role" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can assign admin role" ON public.user_roles;

CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
ON public.user_roles FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update roles"
ON public.user_roles FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete roles"
ON public.user_roles FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can self-assign vendor or client role"
ON public.user_roles FOR INSERT
WITH CHECK ((auth.uid() = user_id) AND (role = ANY (ARRAY['client'::app_role, 'vendor'::app_role])));

CREATE POLICY "Only admins can assign admin role"
ON public.user_roles FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND (role = 'admin'::app_role));

-- Fix vendor_profiles policies: drop restrictive, recreate as permissive
DROP POLICY IF EXISTS "Vendors can update their own profile" ON public.vendor_profiles;
DROP POLICY IF EXISTS "Vendors can insert their own profile" ON public.vendor_profiles;
DROP POLICY IF EXISTS "Admins can manage all vendor profiles" ON public.vendor_profiles;
DROP POLICY IF EXISTS "Anyone can view vendors via public view" ON public.vendor_profiles;

CREATE POLICY "Vendors can update their own profile"
ON public.vendor_profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Vendors can insert their own profile"
ON public.vendor_profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all vendor profiles"
ON public.vendor_profiles FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view vendors via public view"
ON public.vendor_profiles FOR SELECT
USING (true);

-- Fix favorites policies
DROP POLICY IF EXISTS "Users can view their own favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users can manage their own favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users can delete their own favorites" ON public.favorites;

CREATE POLICY "Users can view their own favorites"
ON public.favorites FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own favorites"
ON public.favorites FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites"
ON public.favorites FOR DELETE
USING (auth.uid() = user_id);

-- Fix orders policies
DROP POLICY IF EXISTS "Clients can create orders" ON public.orders;
DROP POLICY IF EXISTS "Vendors can update their orders status" ON public.orders;
DROP POLICY IF EXISTS "Admins can manage all orders" ON public.orders;
DROP POLICY IF EXISTS "Clients can only view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Vendors can only view their shop orders" ON public.orders;

CREATE POLICY "Clients can create orders"
ON public.orders FOR INSERT
WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Vendors can update their orders status"
ON public.orders FOR UPDATE
USING (vendor_id = get_vendor_profile_id(auth.uid()));

CREATE POLICY "Admins can manage all orders"
ON public.orders FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Clients can only view their own orders"
ON public.orders FOR SELECT
USING ((auth.uid() IS NOT NULL) AND (auth.uid() = client_id));

CREATE POLICY "Vendors can only view their shop orders"
ON public.orders FOR SELECT
USING ((auth.uid() IS NOT NULL) AND (vendor_id = get_vendor_profile_id(auth.uid())));

-- Fix order_items policies
DROP POLICY IF EXISTS "Users can view their order items" ON public.order_items;
DROP POLICY IF EXISTS "Vendors can view their order items" ON public.order_items;
DROP POLICY IF EXISTS "Users can insert order items" ON public.order_items;
DROP POLICY IF EXISTS "Admins can manage all order items" ON public.order_items;

CREATE POLICY "Users can view their order items"
ON public.order_items FOR SELECT
USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.client_id = auth.uid()));

CREATE POLICY "Vendors can view their order items"
ON public.order_items FOR SELECT
USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.vendor_id = get_vendor_profile_id(auth.uid())));

CREATE POLICY "Users can insert order items"
ON public.order_items FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.client_id = auth.uid()));

CREATE POLICY "Admins can manage all order items"
ON public.order_items FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix categories policies
DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
DROP POLICY IF EXISTS "Anyone can view categories" ON public.categories;

CREATE POLICY "Admins can manage categories"
ON public.categories FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view categories"
ON public.categories FOR SELECT
USING (true);
