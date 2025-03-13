import { supabase } from '@/integrations/supabase/client';
import { User } from './types';
import { toast } from "sonner";

// Function to fetch user profile from Supabase
export const fetchUserProfile = async (userId: string): Promise<boolean> => {
  try {
    console.log('Fetching profile for user:', userId);
    
    // Use the security definer function we created to avoid recursion
    const { data, error } = await supabase
      .rpc('get_profile_by_user_id', { user_id: userId })
      .single();
    
    if (error) {
      console.error('Error fetching profile using RPC:', error);
      
      // Fallback to direct query with basic fields
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', userId)
        .single();
      
      if (profileError) {
        console.error('Error with fallback profile fetch:', profileError);
        
        // Try to create profile if it doesn't exist
        try {
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: userId,
              is_admin: true // Set as admin by default
            })
            .single();
            
          if (insertError) {
            console.error('Error creating profile:', insertError);
            return false;
          }
          
          console.log('Created new profile with admin privileges');
          return true;
        } catch (e) {
          console.error('Exception creating profile:', e);
          return false;
        }
      }
      
      console.log('Profile found with fallback method:', profileData);
      return !!profileData?.is_admin;
    }
    
    console.log('Profile retrieved successfully:', data);
    return !!data?.is_admin;
  } catch (error) {
    console.error('Exception in fetchUserProfile:', error);
    return false;
  }
};

// Function to handle user sign-in
export const handleUserSignIn = async (session: any): Promise<User | null> => {
  if (!session) return null;
  
  try {
    const userId = session.user.id;
    console.log('Handling sign in for user:', userId);
    
    // First check if the user already exists in local storage
    const storedUser = getUserFromLocalStorage();
    if (storedUser && storedUser.email === session.user.email) {
      console.log('Using cached user data from localStorage');
      return storedUser;
    }
    
    // Otherwise fetch fresh data
    const isAdmin = await fetchUserProfile(userId);
    
    // Create user object
    const user: User = {
      email: session.user.email || '',
      isAdmin: isAdmin
    };
    
    console.log('User sign-in processed:', user);
    return user;
  } catch (error) {
    console.error('Error handling sign in:', error);
    return null;
  }
};

// Function to retrieve user from local storage
export const getUserFromLocalStorage = (): User | null => {
  const storedUser = localStorage.getItem('user');
  return storedUser ? JSON.parse(storedUser) : null;
};

// Function to store user in local storage
export const storeUserInLocalStorage = (user: User | null): void => {
  if (user) {
    localStorage.setItem('user', JSON.stringify(user));
  } else {
    localStorage.removeItem('user');
  }
};
