import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/types/database';
import { toast } from 'sonner';

export const useProducts = (filters?: {
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
}) => {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: async () => {
      // Get current date for daily rotation
      const today = new Date();
      const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
      
      let query = supabase
        .from('products')
        .select(`
          *,
          vendor:vendor_profiles_public(*),
          category:categories(*)
        `)
        .eq('is_available', true)
        .gt('stock', 0);
      
      // Apply filters first
      if (filters?.categoryId) {
        query = query.eq('category_id', filters.categoryId);
      }
      if (filters?.minPrice !== undefined) {
        query = query.gte('price', filters.minPrice);
      }
      if (filters?.maxPrice !== undefined) {
        query = query.lte('price', filters.maxPrice);
      }
      if (filters?.search) {
        query = query.ilike('name', `%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      // Apply daily rotation + popularity sorting in JavaScript
      const sortedProducts = (data as Product[]).sort((a, b) => {
        // Get vendor hash for rotation (based on vendor_id)
        const vendorAHash = a.vendor_id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const vendorBHash = b.vendor_id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        
        // Daily rotation offset
        const rotationOffset = dayOfYear % 7; // Rotate every 7 days
        
        // Calculate rotation score (lower = higher priority)
        const rotationScoreA = (vendorAHash + rotationOffset) % 100;
        const rotationScoreB = (vendorBHash + rotationOffset) % 100;
        
        // If rotation scores are very different, prioritize rotation
        if (Math.abs(rotationScoreA - rotationScoreB) > 20) {
          return rotationScoreA - rotationScoreB;
        }
        
        // Otherwise, prioritize by popularity (created_at as proxy for popularity)
        // Newer products get slight priority within same rotation group
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      
      return sortedProducts;
    },
  });
};

export const useProduct = (id: string) => {
  return useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          vendor:vendor_profiles_public(*),
          category:categories(*)
        `)
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data as Product | null;
    },
    enabled: !!id,
  });
};

export const useVendorProducts = (vendorId?: string) => {
  return useQuery({
    queryKey: ['vendor-products', vendorId],
    queryFn: async () => {
      if (!vendorId) return [];
      
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(*)
        `)
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Product[];
    },
    enabled: !!vendorId,
  });
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (product: {
      vendor_id: string;
      category_id?: string;
      name: string;
      description?: string;
      price: number;
      image_url?: string;
      stock: number;
    }) => {
      const { data, error } = await supabase
        .from('products')
        .insert(product)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-products'] });
      toast.success('Produit ajouté avec succès');
    },
    onError: (error) => {
      toast.error('Erreur lors de l\'ajout du produit');
      console.error(error);
    },
  });
};

export const useUpdateProduct = () => {
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
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-products'] });
      toast.success('Produit mis à jour');
    },
    onError: (error) => {
      toast.error('Erreur lors de la mise à jour');
      console.error(error);
    },
  });
};

export const useDeleteProduct = () => {
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
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-products'] });
      toast.success('Produit supprimé');
    },
    onError: (error) => {
      toast.error('Erreur lors de la suppression');
      console.error(error);
    },
  });
};
