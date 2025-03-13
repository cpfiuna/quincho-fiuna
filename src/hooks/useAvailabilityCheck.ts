
import { isBefore } from 'date-fns';
import { Reservation, BlockedDate } from '@/types/reservation';
import { useDateTimeUtils } from './useDateTimeUtils';

export const useAvailabilityCheck = (
  reservations: Reservation[], 
  blockedDates: BlockedDate[]
) => {
  const { timeToDate, isSameDay, isDateWithinBlockedPeriod, isTimeSlotWithinBlockedPeriod, doTimeRangesOverlap } = useDateTimeUtils();

  const getReservationsByDate = (date: Date) => {
    return reservations.filter(reservation => {
      const resDate = new Date(reservation.fecha);
      // Debug log to verify date comparison
      console.log('Comparing dates:', {
        displayDate: date.toISOString(),
        reservationDate: resDate.toISOString(),
        isSameDay: isSameDay(resDate, date),
        displayDay: date.getDate(),
        reservationDay: resDate.getDate()
      });
      return isSameDay(resDate, date);
    });
  };

  const isDateBlocked = (date: Date) => {
    return isDateWithinBlockedPeriod(date, blockedDates);
  };

  const isTimeSlotBlocked = (date: Date, startTime: string, endTime: string) => {
    return isTimeSlotWithinBlockedPeriod(date, startTime, endTime, blockedDates);
  };

  const isTimeSlotAvailable = (date: Date, startTime: string, endTime: string, excludeId?: string) => {
    // Debug log to check the date we're verifying
    console.log('Checking availability for:', {
      date: date.toISOString(),
      day: date.getDate(),
      startTime,
      endTime
    });
    
    // Check if time is in the past
    const now = new Date();
    const slotStart = timeToDate(date, startTime);
    
    if (isBefore(slotStart, now)) {
      return false;
    }
    
    // Check if end time is before or equal to start time
    const slotEnd = timeToDate(date, endTime);
    if (slotEnd <= slotStart) {
      return false;
    }
    
    // Check if time slot is blocked
    if (isTimeSlotBlocked(date, startTime, endTime)) {
      return false;
    }
    
    // Check for overlaps with existing reservations
    const reservationsOnDate = getReservationsByDate(date);
    console.log('Reservations on date:', reservationsOnDate.length, 'for date:', date.toISOString());
    
    return !reservationsOnDate.some(reservation => {
      // Skip the current reservation if we're checking for updates
      if (excludeId && reservation.id === excludeId) {
        return false;
      }
      
      // Check for any overlap between the requested time slot and existing reservations
      return doTimeRangesOverlap(
        startTime,
        endTime,
        reservation.inicio,
        reservation.fin
      );
    });
  };

  return {
    getReservationsByDate,
    isDateBlocked,
    isTimeSlotAvailable
  };
};
