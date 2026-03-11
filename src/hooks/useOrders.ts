import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Order, OrderItem } from '@/types/database';
import { toast } from 'sonner';

export const useClientOrders = (clientId?: string) => {
  return useQuery({
    queryKey: ['client-orders', clientId],
    queryFn: async () => {
      if (!clientId) return [];
      
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          vendor:vendor_profiles(*),
          items:order_items(
            *,
            product:products(*)
          )
        `)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Order[];
    },
    enabled: !!clientId,
  });
};

export const useVendorOrders = (vendorId?: string) => {
  return useQuery({
    queryKey: ['vendor-orders', vendorId],
    queryFn: async () => {
      if (!vendorId) return [];
      
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          items:order_items(
            *,
            product:products(*)
          )
        `)
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Fetch client profiles separately
      
      const { data: user } = await supabase.auth.getUser();
      const { data: profiles } = await supabase
        .rpc('get_order_client_profiles', { _vendor_user_id: user.user?.id });
      
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      
      return data.map(order => ({
        ...order,
        client: profileMap.get(order.client_id),
      })) as Order[];
    },
    enabled: !!vendorId,
  });
};

export const useCreateOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      clientId,
      vendorId,
      totalAmount,
      message,
      items,
      orderType = 'cart',
    }: {
      clientId: string;
      vendorId: string;
      totalAmount: number;
      message?: string;
      orderType?: 'cart' | 'whatsapp';
      items: { productId: string; quantity: number; unitPrice: number }[];
    }) => {
      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          client_id: clientId,
          vendor_id: vendorId,
          total_amount: totalAmount,
          message,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.productId,
        quantity: item.quantity,
        unit_price: item.unitPrice,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      return order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-orders'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-orders'] });
      toast.success('Commande envoyée au vendeur');
    },
    onError: (error) => {
      toast.error('Erreur lors de la commande');
      console.error(error);
    },
  });
};

export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: 'pending' | 'completed' | 'cancelled' }) => {
      const { data, error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-orders'] });
      queryClient.invalidateQueries({ queryKey: ['client-orders'] });
      toast.success('Statut mis à jour');
    },
    onError: (error) => {
      toast.error('Erreur lors de la mise à jour');
      console.error(error);
    },
  });
};
