
-- Table pour les demandes de paiement d'abonnement
CREATE TABLE public.payment_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL REFERENCES public.vendor_profiles(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL DEFAULT 1000,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('wave', 'orange_money', 'cash')),
  transaction_reference TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;

-- Vendors can view their own payment requests
CREATE POLICY "Vendors can view their own payment requests"
ON public.payment_requests
FOR SELECT
USING (vendor_id = get_vendor_profile_id(auth.uid()));

-- Vendors can create payment requests
CREATE POLICY "Vendors can create payment requests"
ON public.payment_requests
FOR INSERT
WITH CHECK (vendor_id = get_vendor_profile_id(auth.uid()));

-- Admins can manage all payment requests
CREATE POLICY "Admins can manage all payment requests"
ON public.payment_requests
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_payment_requests_updated_at
BEFORE UPDATE ON public.payment_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
