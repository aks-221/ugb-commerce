import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Favorite } from '@/types/database';
import { toast } from 'sonner';

export const useFavorites = (userId?: string) => {
  return useQuery({
    queryKey: ['favorites', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('favorites')
        .select(`
          *,
          product:products(
            *,
            vendor:vendor_profiles_public(*),
            category:categories(*)
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Favorite[];
    },
    enabled: !!userId,
  });
};

export const useToggleFavorite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, productId, isFavorite }: { userId: string; productId: string; isFavorite: boolean }) => {
      if (isFavorite) {
        // Remove from favorites
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', userId)
          .eq('product_id', productId);

        if (error) throw error;
      } else {
        // Add to favorites
        const { error } = await supabase
          .from('favorites')
          .insert({ user_id: userId, product_id: productId });

        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['favorites', variables.userId] });
      toast.success(variables.isFavorite ? 'Retiré des favoris' : 'Ajouté aux favoris');
    },
    onError: (error) => {
      toast.error('Erreur');
      console.error(error);
    },
  });
};
