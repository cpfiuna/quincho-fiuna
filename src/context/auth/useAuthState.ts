
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from './types';
import { toast } from "sonner";
import { 
  handleUserSignIn, 
  getUserFromLocalStorage, 
  storeUserInLocalStorage,
  fetchUserProfile
} from './utils';

export const useAuthState = () => {
  const [user, setUser] = useState<User | null>(() => {
    return getUserFromLocalStorage();
  });
  const [loading, setLoading] = useState(true);

  const isAuthenticated = !!user;
  const isAdmin = user?.isAdmin || false;
  const isLoggedIn = isAuthenticated;

  useEffect(() => {
    // Check current session on mount
    const checkCurrentSession = async () => {
      try {
        setLoading(true);
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error checking session:', error);
          return;
        }
        
        if (session) {
          console.log('Session found on mount:', session.user.email);
          const newUser = await handleUserSignIn(session);
          if (newUser) {
            setUser(newUser);
            storeUserInLocalStorage(newUser);
          }
        } else {
          console.log('No session found on mount');
        }
      } catch (err) {
        console.error('Error in checkCurrentSession:', err);
      } finally {
        setLoading(false);
      }
    };
    
    checkCurrentSession();
    
    // Set up Supabase auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        if (event === 'SIGNED_IN' && session) {
          try {
            setLoading(true);
            console.log('Processing SIGNED_IN event');
            const newUser = await handleUserSignIn(session);
            if (newUser) {
              console.log('Setting user after sign in:', newUser);
              setUser(newUser);
              storeUserInLocalStorage(newUser);
              toast.success('Inicio de sesión exitoso');
            }
          } catch (err) {
            console.error('Error handling SIGNED_IN event:', err);
          } finally {
            setLoading(false);
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('User signed out, clearing user data');
          setUser(null);
          storeUserInLocalStorage(null);
          toast.info('Sesión cerrada');
        } else if (event === 'USER_UPDATED' && session) {
          // Handle user data update
          try {
            setLoading(true);
            const newUser = await handleUserSignIn(session);
            if (newUser) {
              setUser(newUser);
              storeUserInLocalStorage(newUser);
            }
          } catch (error) {
            console.error('Error updating user data:', error);
          } finally {
            setLoading(false);
          }
        }
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      console.log('Login attempt with email:', email);
      const { error, data } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        console.error('Login error:', error.message);
        toast.error('Credenciales incorrectas');
        return false;
      }
      
      console.log('Login successful:', data.user?.email);
      
      // Ensure the user has admin privileges
      if (data?.user) {
        try {
          await fetchUserProfile(data.user.id);
        } catch (err) {
          console.error('Error setting up user profile:', err);
          // Continue anyway since authentication succeeded
        }
      }
      
      return true;
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Error al iniciar sesión');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      setUser(null);
      storeUserInLocalStorage(null);
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Error al cerrar sesión');
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    login,
    logout,
    isAuthenticated,
    isAdmin,
    isLoggedIn,
    loading
  };
};
