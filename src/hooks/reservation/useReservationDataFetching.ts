
import { useState, useEffect, useRef } from 'react';
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';
import { Reservation, BlockedDate } from '@/types/reservation';

export const useReservationDataFetching = () => {
  // All state declarations first
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // All refs next
  const mountedRef = useRef(true);
  const fetchAttemptsRef = useRef(0);
  const maxRetries = 3;

  // Helper for safe state updates
  const safeUpdate = (callback: () => void) => {
    if (mountedRef.current) {
      callback();
    }
  };

  // Define fetching functions before using them in useEffect
  const fetchReservations = async (): Promise<void> => {
    if (!mountedRef.current) return;
    
    try {
      console.log('Fetching reservations...');
      const { data, error } = await supabase
        .from('reservations')
        .select('*');

      if (error) {
        throw error;
      }

      if (data) {
        console.log('Reservations fetched successfully:', data.length);
        const formattedData = data.map(item => {
          // Console log for debugging date issues
          console.log('Processing reservation date:', item.fecha, 'Type:', typeof item.fecha);
          
          // Explicitly parse the date with local timezone consideration
          const parts = item.fecha.split('-');
          const year = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed in JS
          const day = parseInt(parts[2], 10);
          
          const dateObj = new Date(year, month, day, 12, 0, 0); // Set to noon to avoid timezone issues
          
          return {
            id: item.id,
            responsable: item.responsable,
            email: item.email,
            motivo: item.motivo,
            fecha: dateObj,
            inicio: item.inicio,
            fin: item.fin,
            personas: item.personas,
            createdAt: new Date(item.created_at),
            approved: item.approved,
            admin_notes: item.admin_notes
          };
        });
        
        safeUpdate(() => {
          setReservations(formattedData);
        });
      }
    } catch (error) {
      console.error('Error fetching reservations:', error);
      if (mountedRef.current) {
        toast.error('Error al cargar las reservas');
      }
    }
  };

  const fetchBlockedDates = async (): Promise<void> => {
    if (!mountedRef.current) return;
    
    try {
      console.log('Fetching blocked dates...');
      const { data, error } = await supabase
        .from('blocked_dates')
        .select('*');

      if (error) {
        console.error('Error fetching blocked dates:', error);
        return;
      }

      if (data) {
        console.log('Blocked dates fetched successfully:', data.length);
        const formattedData = data.map(item => {
          // Explicitly parse the date with local timezone consideration
          const parts = item.fecha.split('-');
          const year = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed in JS
          const day = parseInt(parts[2], 10);
          
          const dateObj = new Date(year, month, day, 12, 0, 0); // Set to noon to avoid timezone issues
          
          return {
            id: item.id,
            fecha: dateObj,
            motivo: item.motivo,
            created_at: new Date(item.created_at),
            created_by: item.created_by
          };
        });
        
        safeUpdate(() => {
          setBlockedDates(formattedData);
        });
      }
    } catch (error) {
      console.error('Error fetching blocked dates:', error);
    }
  };

  // useEffect comes last
  useEffect(() => {
    console.log('Initializing reservation data fetching...');
    mountedRef.current = true;
    
    // Fetch initial reservations and blocked dates
    const initialize = async () => {
      console.log('Starting data initialization...');
      try {
        setIsLoading(true);
        
        await fetchReservations();
        await fetchBlockedDates();
        
        console.log('Initial data fetch completed successfully');
        
        if (mountedRef.current) {
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error initializing reservation data:', error);
        
        // Retry logic for initialization
        if (fetchAttemptsRef.current < maxRetries) {
          fetchAttemptsRef.current += 1;
          console.log(`Retrying initialization (attempt ${fetchAttemptsRef.current})...`);
          
          setTimeout(() => {
            if (mountedRef.current) {
              initialize();
            }
          }, 2000); // Wait 2 seconds before retrying
        } else {
          console.error(`Failed to initialize after ${maxRetries} attempts`);
          toast.error('Error al cargar los datos de reservas. Por favor recargue la página.');
          
          if (mountedRef.current) {
            setIsLoading(false);
          }
        }
      }
    };
    
    initialize();

    // Subscribe to realtime changes for reservations
    const reservationsChannel = supabase
      .channel('reservations_realtime')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'reservations' }, 
        (payload) => {
          console.log('Reservations realtime change detected:', payload);
          fetchReservations();
        }
      )
      .subscribe((status) => {
        console.log('Reservations channel status:', status);
      });

    // Subscribe to realtime changes for blocked_dates
    const blockedDatesChannel = supabase
      .channel('blocked_dates_realtime')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'blocked_dates' }, 
        (payload) => {
          console.log('Blocked dates realtime change detected:', payload);
          fetchBlockedDates();
        }
      )
      .subscribe((status) => {
        console.log('Blocked dates channel status:', status);
      });

    return () => {
      console.log('Cleaning up reservation data fetching...');
      mountedRef.current = false;
      supabase.removeChannel(reservationsChannel);
      supabase.removeChannel(blockedDatesChannel);
    };
  }, []);

  return {
    reservations,
    blockedDates,
    isLoading,
    fetchReservations,
    fetchBlockedDates
  };
};
