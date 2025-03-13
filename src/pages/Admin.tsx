
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminPanel from '@/components/AdminPanel';
import Header from '@/components/Header';
import { motion } from 'framer-motion';
import Footer from '@/components/Footer';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

const Admin = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if admin is logged in
    const checkAdminStatus = async () => {
      try {
        // First, check localStorage for admin session
        const adminLoggedIn = localStorage.getItem('adminLoggedIn') === 'true';
        const adminEmail = localStorage.getItem('adminEmail');
        const adminToken = localStorage.getItem('adminToken');
        const tokenExpiry = localStorage.getItem('adminTokenExpiry');
        
        console.log("Admin logged in status:", adminLoggedIn);
        
        if (!adminLoggedIn) {
          console.log("Admin not logged in, redirecting to home");
          toast.error('Acceso no autorizado');
          navigate('/', { replace: true });
          return;
        }
        
        // If token exists, validate it's not expired
        if (adminToken && tokenExpiry) {
          const expiryTime = parseInt(tokenExpiry);
          if (expiryTime && Date.now() > expiryTime) {
            console.log("Admin session expired, redirecting to home");
            localStorage.removeItem('adminLoggedIn');
            localStorage.removeItem('adminEmail');
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminTokenExpiry');
            toast.error('Sesión expirada, inicie sesión nuevamente');
            navigate('/', { replace: true });
            return;
          }
        }
        
        // Check with Supabase if we have a valid session
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData && sessionData.session) {
          console.log("Verified Supabase session");
        } else if (adminEmail) {
          // If no valid Supabase session but we have admin email in localStorage,
          // we're using the fallback admin mechanism
          console.log("Using fallback admin auth mechanism");
        } else {
          console.log("No valid admin session found, redirecting to home");
          localStorage.removeItem('adminLoggedIn');
          toast.error('Sesión inválida, inicie sesión nuevamente');
          navigate('/', { replace: true });
          return;
        }
        
        // Admin is logged in
        console.log("Admin is logged in, showing admin panel");
        setIsAdmin(true);
      } catch (error) {
        console.error('Error checking admin status:', error);
        toast.error('Error de autenticación');
        navigate('/', { replace: true });
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminStatus();
    
    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        // User signed out, clear admin state
        localStorage.removeItem('adminLoggedIn');
        localStorage.removeItem('adminEmail');
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminTokenExpiry');
        setIsAdmin(false);
        navigate('/', { replace: true });
      }
    });
    
    // Cleanup listener on unmount
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-solid border-fiuna-red border-r-transparent align-[-0.125em]"></div>
        <p className="mt-4 text-gray-600">Cargando panel de administración...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <main className="flex-1 container mx-auto p-4 md:p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <AdminPanel />
        </motion.div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Admin;
