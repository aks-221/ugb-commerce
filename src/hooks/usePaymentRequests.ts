import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface PaymentRequest {
  id: string;
  vendor_id: string;
  amount: number;
  payment_method: string;
  transaction_reference: string | null;
  status: string;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
  vendor?: {
    id: string;
    shop_name: string;
    phone: string;
    user_id: string;
  };
}

export const useVendorPaymentRequests = (vendorId: string | undefined) => {
  return useQuery({
    queryKey: ["payment-requests", "vendor", vendorId],
    queryFn: async () => {
      if (!vendorId) return [];
      const { data, error } = await supabase
        .from("payment_requests" as any)
        .select("*")
        .eq("vendor_id", vendorId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as PaymentRequest[];
    },
    enabled: !!vendorId,
  });
};

export const useCreatePaymentRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      vendorId,
      paymentMethod,
      transactionReference,
    }: {
      vendorId: string;
      paymentMethod: string;
      transactionReference?: string;
    }) => {
      const { data, error } = await supabase
        .from("payment_requests" as any)
        .insert({
          vendor_id: vendorId,
          amount: 1000,
          payment_method: paymentMethod,
          transaction_reference: transactionReference || null,
        } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-requests"] });
      toast.success("Demande de paiement envoyée ! L'admin va vérifier.");
    },
    onError: (error: any) => {
      toast.error("Erreur: " + error.message);
    },
  });
};

export const useAllPaymentRequests = () => {
  return useQuery({
    queryKey: ["payment-requests", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_requests" as any)
        .select("*, vendor:vendor_profiles!payment_requests_vendor_id_fkey(id, shop_name, phone, user_id)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as PaymentRequest[];
    },
  });
};

export const useUpdatePaymentRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      requestId,
      status,
      adminNote,
    }: {
      requestId: string;
      status: string;
      adminNote?: string;
    }) => {
      const { error } = await supabase
        .from("payment_requests" as any)
        .update({ status, admin_note: adminNote || null } as any)
        .eq("id", requestId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-requests"] });
    },
  });
};
