
import { useState, useEffect, createContext, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/types/database';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, name: string, role?: string) => Promise<{ error: any }>;
  createUser: (email: string, password: string, name: string, role: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

export const useAuthProvider = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const setupAuth = async () => {
      try {
        // Get initial session
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (mounted) {
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
          
          if (initialSession?.user) {
            // Fetch user profile
            const { data: profileData } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', initialSession.user.id)
              .single();
            
            if (mounted && profileData) {
              setProfile({
                ...profileData,
                role: profileData.role as 'admin' | 'manager' | 'worker'
              });
            }
          }
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error setting up auth:', error);
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log('Auth state changed:', event, session);
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch user profile in background
          setTimeout(async () => {
            if (!mounted) return;
            
            try {
              const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();
              
              if (mounted && profileData) {
                setProfile({
                  ...profileData,
                  role: profileData.role as 'admin' | 'manager' | 'worker'
                });
              }
            } catch (error) {
              console.error('Error fetching profile:', error);
            }
          }, 0);
        } else {
          setProfile(null);
        }
        
        if (event === 'SIGNED_OUT') {
          setProfile(null);
          console.log('User signed out successfully');
          // Redirect to root path after sign out
          window.location.href = '/';
        }
      }
    );

    setupAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, name: string, role: string = 'worker') => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role,
        },
        emailRedirectTo: `${window.location.origin}/`,
      },
    });
    return { error };
  };

  const createUser = async (email: string, password: string, name: string, role: string) => {
    try {
      console.log('=== CREATE USER FUNCTION DEBUG ===');
      console.log('Input parameters:', { email, password: '***', name, role });
      console.log('Current session:', session);
      console.log('Current user:', user);
      console.log('Current profile:', profile);

      // Verifica se o usuário atual tem permissão
      if (!profile) {
        console.error('No profile available for createUser');
        return { error: new Error('Usuário não autenticado') };
      }

      if (!['admin', 'manager'].includes(profile.role)) {
        console.error('User role not authorized for createUser:', profile.role);
        return { error: new Error('Usuário não tem permissão para criar funcionários') };
      }

      console.log('User has permission, proceeding with user creation...');

      // Usar signUp normal - é o método que funciona sem requer service role
      console.log('Creating user via signUp...');
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role,
          },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (signUpError) {
        console.error('SignUp error:', signUpError);
        return { error: signUpError };
      }

      console.log('User created successfully via signUp');
      return { error: null };
    } catch (error) {
      console.error('=== CREATE USER ERROR ===');
      console.error('Error in createUser:', error);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      console.log('Iniciando logout...');
      
      // Clear local state first
      setUser(null);
      setProfile(null);
      setSession(null);
      
      // Then sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Erro ao fazer logout:', error);
        throw error;
      }
      
      console.log('Logout realizado com sucesso');
      
    } catch (error) {
      console.error('Erro durante o processo de logout:', error);
      // Even if there's an error, clear the local state and redirect
      setUser(null);
      setProfile(null);
      setSession(null);
      window.location.href = '/';
    }
  };

  return {
    user,
    profile,
    session,
    signIn,
    signUp,
    createUser,
    signOut,
    isLoading,
  };
};

export { AuthContext };
