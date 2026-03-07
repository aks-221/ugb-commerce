
-- Create a database function to expire subscriptions past their end date
CREATE OR REPLACE FUNCTION public.expire_vendor_subscriptions()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  updated_count integer;
BEGIN
  UPDATE vendor_profiles
  SET subscription_status = 'expired',
      updated_at = now()
  WHERE subscription_status IN ('active', 'trial')
    AND subscription_end_date IS NOT NULL
    AND subscription_end_date < now();
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;
