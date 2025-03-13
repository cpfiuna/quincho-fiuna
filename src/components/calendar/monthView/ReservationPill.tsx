
import React from 'react';
import { Reservation } from '@/types/reservation';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { formatTimeWithoutSeconds } from '@/utils/calendarUtils';

interface ReservationPillProps {
  reservation: Reservation;
}

const ReservationPill: React.FC<ReservationPillProps> = ({ reservation }) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className="text-xs mb-1 py-1 px-2 rounded-full bg-fiuna-red text-white truncate cursor-pointer inline-block"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            {reservation.motivo}
          </div>
        </TooltipTrigger>
        <TooltipContent className="bg-white p-3 shadow-lg border rounded-md z-50 max-w-[300px]">
          <div className="text-sm">
            <p className="font-semibold">{reservation.motivo}</p>
            <p>{formatTimeWithoutSeconds(reservation.inicio)} - {formatTimeWithoutSeconds(reservation.fin)}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default ReservationPill;
