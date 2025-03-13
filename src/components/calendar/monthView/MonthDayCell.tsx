
import React from 'react';
import { isBefore, startOfDay } from 'date-fns';
import { Reservation } from '@/types/reservation';
import DayNumber from './DayNumber';
import DayCellContent from './DayCellContent';

interface MonthDayCellProps {
  day: Date;
  monthStart: Date;
  reservations: Reservation[];
  isDateBlocked: (date: Date) => boolean;
  onDayClick: (day: Date) => void;
}

const MonthDayCell: React.FC<MonthDayCellProps> = ({
  day,
  monthStart,
  reservations,
  isDateBlocked,
  onDayClick
}) => {
  const today = new Date();
  const isCurrentDay = 
    day.getDate() === today.getDate() && 
    day.getMonth() === today.getMonth() && 
    day.getFullYear() === today.getFullYear();
    
  const isCurrentMonth = day.getMonth() === monthStart.getMonth();
  const isPastDay = isBefore(day, startOfDay(new Date()));
  const isDayBlocked = isDateBlocked(day);
  
  // Filter reservations for this specific day using direct date component comparison
  // Filter out past reservations - if a reservation has already happened, don't display it
  const dayReservations = reservations.filter(r => {
    // Check if it's the same day
    if (!(r.fecha.getDate() === day.getDate() &&
        r.fecha.getMonth() === day.getMonth() &&
        r.fecha.getFullYear() === day.getFullYear())) {
      return false;
    }
    
    // Check if the reservation is in the past
    const now = new Date();
    const reservationEnd = new Date(r.fecha);
    const [endHours, endMinutes] = r.fin.split(':').map(Number);
    reservationEnd.setHours(endHours, endMinutes, 0, 0);
    
    // If reservation end time is in the past, filter it out
    if (reservationEnd < now) {
      return false;
    }
    
    return true;
  });
  
  return (
    <div 
      className={`relative p-1 sm:p-2 border border-gray-100 min-h-[70px] sm:min-h-[80px] overflow-hidden month-day-cell
        ${!isCurrentMonth ? 'bg-gray-50 text-gray-400' : 'bg-white'}
        ${isCurrentDay ? 'bg-fiuna-red/10' : ''}
        ${isPastDay || isDayBlocked ? 'opacity-60' : ''}
        cursor-pointer hover:bg-gray-50`}
      onClick={() => !isPastDay && onDayClick(day)}
    >
      <div className="text-left">
        <DayNumber 
          day={day}
          isCurrentDay={isCurrentDay}
          isDayBlocked={isDayBlocked}
        />
        <div className="clear-both"></div>
      </div>
      <DayCellContent 
        isDayBlocked={isDayBlocked}
        dayReservations={dayReservations}
      />
    </div>
  );
};

export default MonthDayCell;
