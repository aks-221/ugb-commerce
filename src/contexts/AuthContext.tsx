import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AppRole, Profile, VendorProfile } from '@/types/database';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: AppRole[];
  vendorProfile: VendorProfile | null;
  loading: boolean;
  dataLoading: boolean;
  signUp: (email: string, password: string, fullName: string, phone?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  isVendor: boolean;
  isAdmin: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [vendorProfile, setVendorProfile] = useState<VendorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);

  const withTimeout = <T,>(promise: PromiseLike<T>, timeoutMs: number, label: string): Promise<T> => {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`${label} timed out after ${timeoutMs / 1000}s`));
      }, timeoutMs);

      Promise.resolve(promise)
        .then((value) => {
          clearTimeout(timer);
          resolve(value);
        })
        .catch((error) => {
          clearTimeout(timer);
          reject(error);
        });
    });
  };

  const fetchUserData = async (userId: string) => {
    setDataLoading(true);

    try {
      // Étape 1 : profile + roles seulement (rapide pour tout le monde)
      const [profileResult, rolesResult] = await withTimeout<any>(
        Promise.all([
          supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle(),
          supabase.from('user_roles').select('role').eq('user_id', userId),
        ]),
        10000,
        'fetchUserData'
      );

      setProfile(profileResult.data as Profile | null);

      const userRoles = (rolesResult.data || []).map((r: { role: AppRole }) => r.role as AppRole);
      setRoles(userRoles);

      // Étape 2 : vendor_profiles SEULEMENT si vendeur
      if (userRoles.includes('vendor')) {
        const vendorResult = await withTimeout<any>(
          supabase.from('vendor_profiles').select('*').eq('user_id', userId).maybeSingle(),
          7000,
          'fetchVendorProfile'
        );
        setVendorProfile(vendorResult?.data as VendorProfile | null);
      } else {
        setVendorProfile(null);
      }

    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setDataLoading(false);
    }
  };
  const refreshProfile = async () => {
    if (user) {
      await fetchUserData(user.id);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          await fetchUserData(newSession.user.id);
        } else {
          if (event === 'SIGNED_OUT') {
            setProfile(null);
            setRoles([]);
            setVendorProfile(null);
        }
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

   

  const signUp = async (email: string, password: string, fullName: string, phone?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          full_name: fullName,
          phone: phone?.trim() || null,
        },
      },
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setRoles([]);
    setVendorProfile(null);
  };

  const isVendor = roles.includes('vendor');
  const isAdmin = roles.includes('admin');


  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        roles,
        vendorProfile,
        loading,
        dataLoading,
        signUp,
        signIn,
        signOut,
        isVendor,
        isAdmin,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};