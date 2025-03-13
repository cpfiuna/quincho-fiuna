
import React from 'react';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { PlusCircle } from 'lucide-react';
import { Reservation } from '@/types/reservation';
import { formatTimeWithoutSeconds } from '@/utils/calendarUtils';

interface TimeSlotCellProps {
  time: string;
  currentDate: Date;
  slotReservations: Reservation[];
  isTimeSlotDisabled: boolean;
  isDateBlocked: (date: Date) => boolean;
  onTimeSlotClick: (date: Date, time: string) => void;
}

const TimeSlotCell: React.FC<TimeSlotCellProps> = ({
  time,
  currentDate,
  slotReservations,
  isTimeSlotDisabled,
  isDateBlocked,
  onTimeSlotClick
}) => {
  return (
    <div 
      className={`col-span-10 py-2 px-3 relative min-h-[70px] flex items-center
        ${!isTimeSlotDisabled ? 'cursor-pointer hover:bg-gray-50' : ''}
        ${isTimeSlotDisabled && isDateBlocked(currentDate) ? 'bg-red-50' : ''}
        ${isTimeSlotDisabled && !isDateBlocked(currentDate) ? 'bg-gray-50' : ''}`}
      onClick={!isTimeSlotDisabled ? () => onTimeSlotClick(currentDate, time) : undefined}
    >
      {slotReservations.length > 0 ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="w-full h-full p-2 rounded-md bg-fiuna-red text-white cursor-pointer">
                <div className="font-medium">{slotReservations[0].motivo}</div>
              </div>
            </TooltipTrigger>
            <TooltipContent className="bg-white p-3 shadow-lg border rounded-md z-50 max-w-[300px]">
              <div className="text-sm space-y-2">
                <p className="font-semibold">{slotReservations[0].motivo}</p>
                <p><span className="font-medium">Horario:</span> {formatTimeWithoutSeconds(slotReservations[0].inicio)} - {formatTimeWithoutSeconds(slotReservations[0].fin)}</p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : !isTimeSlotDisabled ? (
        <div className="flex items-center justify-center w-full text-sm text-gray-600">
          <PlusCircle className="w-4 h-4 mr-1" />
          Reservar horario
        </div>
      ) : isDateBlocked(currentDate) ? (
        <div className="text-xs text-red-600 flex items-center justify-center w-full">
          No disponible
        </div>
      ) : null}
    </div>
  );
};

export default TimeSlotCell;
