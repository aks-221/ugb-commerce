import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Profile, VendorProfile, Product, Order } from '@/types/database';
import { toast } from 'sonner';

// Admin: All profiles
export const useAllProfiles = () => {
  return useQuery({
    queryKey: ['admin-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Profile[];
    },
  });
};

// Admin: All vendors
export const useAllVendors = () => {
  return useQuery({
    queryKey: ['admin-vendors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendor_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as VendorProfile[];
    },
  });
};

// Admin: All products
export const useAllProducts = () => {
  return useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          vendor:vendor_profiles(*),
          category:categories(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Product[];
    },
  });
};

// Admin: All orders
// Admin: All orders
export const useAllOrders = () => {
  return useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
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
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Filtre les client_id null (commandes anonymes WhatsApp)
      const clientIds = [...new Set(data.map(o => o.client_id).filter(Boolean))];
      
      let profileMap = new Map();
      if (clientIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('*')
          .in('user_id', clientIds);
        profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      }

      return data.map(order => ({
        ...order,
        client: order.client_id ? profileMap.get(order.client_id) : null,
      })) as Order[];
    },
  });
};

// Admin: Update vendor status
export const useUpdateVendorStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      vendorId, 
      updates 
    }: { 
      vendorId: string; 
      updates: Partial<Pick<VendorProfile, 'is_verified' | 'subscription_status' | 'subscription_start_date' | 'subscription_end_date'>> 
    }) => {
      const { data, error } = await supabase
        .from('vendor_profiles')
        .update(updates)
        .eq('id', vendorId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-vendors'] });
      toast.success('Vendeur mis à jour');
    },
    onError: (error) => {
      toast.error('Erreur lors de la mise à jour');
      console.error(error);
    },
  });
};

// Admin: Update product
export const useAdminUpdateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Product> & { id: string }) => {
      const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Produit mis à jour');
    },
    onError: (error) => {
      toast.error('Erreur lors de la mise à jour');
      console.error(error);
    },
  });
};

// Admin: Delete product
export const useAdminDeleteProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Produit supprimé');
    },
    onError: (error) => {
      toast.error('Erreur lors de la suppression');
      console.error(error);
    },
  });
};

// Admin stats
export const useAdminStats = () => {
  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [
        { count: totalOrders },
        { count: totalProducts },
        { count: totalVendors },
        { count: totalClients },
        { data: recentOrders },
      ] = await Promise.all([
        supabase.from('orders').select('*', { count: 'exact', head: true }),
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('vendor_profiles').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('total_amount').order('created_at', { ascending: false }).limit(100),
      ]);

      const totalRevenue = recentOrders?.reduce((sum, o) => sum + Number(o.total_amount), 0) || 0;

      return {
        totalOrders: totalOrders || 0,
        totalProducts: totalProducts || 0,
        totalVendors: totalVendors || 0,
        totalClients: totalClients || 0,
        totalRevenue,
      };
    },
  });
};
