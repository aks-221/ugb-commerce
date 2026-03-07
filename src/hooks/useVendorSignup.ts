import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface VendorSignupData {
  email: string;
  password: string;
  fullName: string;
  shopName: string;
  pavilion: string;
  room: string;
  phone: string;
  description?: string;
}

interface VendorSignupResult {
  success: boolean;
  error?: string;
}

export const useVendorSignup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: VendorSignupData): Promise<VendorSignupResult> => {
      // 1. Create user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            full_name: data.fullName,
            phone: data.phone,
          },
        },
      });

      if (authError) {
        return { success: false, error: authError.message };
      }

      if (!authData.user) {
        return { success: false, error: "Erreur lors de la création du compte" };
      }

      const userId = authData.user.id;


      // 3. Create vendor profile
      const { error: vendorError } = await supabase
        .from('vendor_profiles')
        .insert({
          user_id: userId,
          shop_name: data.shopName || data.fullName,
          pavilion: data.pavilion,
          room: data.room,
          phone: data.phone,
          description: data.description,
        });

      if (vendorError) {
        return { success: false, error: vendorError.message };
      }

      // 4. Add vendor role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: 'vendor',
        });

      if (roleError) {
        console.error('Role error:', roleError);
        // Don't fail the whole process if role already exists
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (signInError) {
        console.error('Auto-login error:', signInError);
        return { 
          success: true, 
          error: "Compte créé mais connexion automatique échouée. Veuillez vous connecter." 
        };
      }

      return { success: true };
    },
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['user-roles'] });
        queryClient.invalidateQueries({ queryKey: ['vendor-profiles'] });
      }
    },
    onError: (error: Error) => {
      toast.error('Erreur lors de la création du compte vendeur');
      console.error(error);
    },
  });
};