
import React from 'react';
import { isToday, isBefore } from 'date-fns';
import { Reservation } from '@/types/reservation';
import { ScrollArea } from '@/components/ui/scroll-area';
import TimeColumn from './timeSlot/TimeColumn';
import TimeSlotCell from './timeSlot/TimeSlotCell';
import { 
  isSameDay, 
  startOfDay, 
  isPastTimeSlot, 
  getNextTimeSlot,
  isTimeSlotInRange
} from '@/utils/calendarUtils';

interface DayViewProps {
  currentDate: Date;
  reservations: Reservation[];
  isDateBlocked: (date: Date) => boolean;
  isTimeSlotAvailable: (date: Date, startTime: string, endTime: string) => boolean;
  timeOptions: string[];
  onTimeSlotClick: (date: Date, time: string) => void;
}

const DayView: React.FC<DayViewProps> = ({ 
  currentDate, 
  reservations, 
  isDateBlocked,
  isTimeSlotAvailable,
  timeOptions,
  onTimeSlotClick
}) => {
  const dayReservations = reservations.filter(r => 
    isSameDay(new Date(r.fecha), currentDate)
  );
  
  // Debug logging to check reservations
  console.log('Day reservations:', dayReservations);
  
  return (
    <div className="space-y-4">
      <ScrollArea className="h-[calc(100vh-280px)]">
        <div className="border rounded-md overflow-hidden">
          {timeOptions.map(time => {
            const nextTime = getNextTimeSlot(time);
            
            // Find all reservations that are visible in this time slot
            const slotReservations = dayReservations.filter(r => {
              // A reservation is visible if the time slot is within its range (inclusive of both start and end)
              return isTimeSlotInRange(time, r.inicio, r.fin);
            });
            
            // Debug each time slot
            if (slotReservations.length > 0) {
              console.log(`Time slot ${time} has reservations:`, slotReservations);
            }
            
            const isTimeSlotFree = isTimeSlotAvailable(currentDate, time, nextTime);
            const isPastDate = isBefore(currentDate, startOfDay());
            const isPastTime = isToday(currentDate) && isPastTimeSlot(time);
            const isTimeSlotDisabled = isPastDate || isPastTime || !isTimeSlotFree;
            
            return (
              <div key={`${currentDate.toISOString()}-${time}`} className="grid grid-cols-12 border-b last:border-b-0">
                <TimeColumn time={time} />
                <TimeSlotCell 
                  time={time}
                  currentDate={currentDate}
                  slotReservations={slotReservations}
                  isTimeSlotDisabled={isTimeSlotDisabled}
                  isDateBlocked={isDateBlocked}
                  onTimeSlotClick={onTimeSlotClick}
                />
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};

export default DayView;
