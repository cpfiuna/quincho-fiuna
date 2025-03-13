
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { isBefore, startOfDay } from 'date-fns';
import { BlockedDate } from '@/types/reservation';
import { timeOptions } from '@/utils/timeUtils';
import { toast } from 'sonner';

export const useBlockedDates = (isTimeSlotAvailable: (date: Date, startTime: string, endTime: string) => boolean) => {
  // Blocked dates from the database
  const [blockedDates, setBlockedDates] = useState<Date[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch blocked dates from the database
  useEffect(() => {
    fetchBlockedDates();
    
    const subscription = supabase
      .channel('blocked_dates_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'blocked_dates' }, 
        () => {
          fetchBlockedDates();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchBlockedDates = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('blocked_dates')
        .select('fecha, start_time, end_time');

      if (error) {
        console.error('Error fetching blocked dates:', error);
        toast.error('Error al cargar fechas bloqueadas');
        return;
      }

      if (data) {
        setBlockedDates(data.map(item => new Date(item.fecha)));
      }
    } catch (error) {
      console.error('Error fetching blocked dates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Check if a date should be disabled in the calendar
  const disabledDays = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (isBefore(date, today)) {
      return true;
    }
    
    if (blockedDates.some(blockedDate => 
      blockedDate.getDate() === date.getDate() && 
      blockedDate.getMonth() === date.getMonth() && 
      blockedDate.getFullYear() === date.getFullYear()
    )) {
      return true;
    }
    
    const anySlotAvailable = timeOptions.some(startTime => 
      timeOptions.some(endTime => 
        endTime > startTime && isTimeSlotAvailable(date, startTime, endTime)
      )
    );
    
    return !anySlotAvailable;
  };

  const isDateBlocked = (date: Date) => {
    return blockedDates.some(blockedDate =>
      blockedDate.getDate() === date.getDate() &&
      blockedDate.getMonth() === date.getMonth() &&
      blockedDate.getFullYear() === date.getFullYear()
    );
  };

  return {
    blockedDates,
    isDateBlocked,
    disabledDays,
    fetchBlockedDates,
    isLoading
  };
};
