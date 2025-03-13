
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import BlockDateForm from './admin/BlockDateForm';
import ReservationsList from './admin/ReservationsList';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [reservations, setReservations] = useState<any[]>([]);
  const [blockedDates, setBlockedDates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    if (!isAdmin) {
      navigate('/login');
      return;
    }
    
    fetchReservations();
    fetchBlockedDates();
    
    // Subscribe to reservation changes
    const reservationsChannel = supabase
      .channel('reservations_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'reservations' }, 
        () => {
          fetchReservations();
        }
      )
      .subscribe();
      
    // Subscribe to blocked dates changes
    const blockedDatesChannel = supabase
      .channel('blocked_dates_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'blocked_dates' }, 
        () => {
          fetchBlockedDates();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(reservationsChannel);
      supabase.removeChannel(blockedDatesChannel);
    };
  }, [isAdmin, navigate]);

  const fetchReservations = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .order('fecha', { ascending: false });

      if (error) throw error;

      if (data) {
        const formattedReservations = data.map(item => ({
          ...item,
          fecha: new Date(item.fecha),
          createdAt: new Date(item.created_at)
        }));
        setReservations(formattedReservations);
      }
    } catch (error) {
      console.error('Error fetching reservations:', error);
      toast.error('Error al cargar las reservas');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBlockedDates = async () => {
    try {
      const { data, error } = await supabase
        .from('blocked_dates')
        .select('*')
        .order('fecha', { ascending: false });

      if (error) throw error;

      setBlockedDates(data || []);
    } catch (error) {
      console.error('Error fetching blocked dates:', error);
      toast.error('Error al cargar las fechas bloqueadas');
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-2xl">Panel de Administración</CardTitle>
          <CardDescription>Gestione las reservas y bloqueos del Quincho</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Side - Calendar View and Block Controls */}
            <div className="space-y-4 col-span-1">
              <BlockDateForm onBlockSuccess={fetchBlockedDates} />
            </div>

            {/* Right Side - Bookings List and Blocked Dates */}
            <div className="lg:col-span-2">
              <ReservationsList 
                reservations={reservations}
                blockedDates={blockedDates}
                onDelete={fetchReservations}
                onBlockedDateDelete={fetchBlockedDates}
                isLoading={isLoading}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
