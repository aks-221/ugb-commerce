
-- Update the public SELECT policy on products to also check vendor subscription status
DROP POLICY "Anyone can view available products" ON public.products;

CREATE POLICY "Anyone can view available products from active vendors"
ON public.products
FOR SELECT
USING (
  is_available = true
  AND stock > 0
  AND EXISTS (
    SELECT 1 FROM public.vendor_profiles vp
    WHERE vp.id = products.vendor_id
    AND vp.subscription_status IN ('active', 'trial')
  )
);
