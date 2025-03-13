
import React from 'react';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { Reservation } from '@/types/reservation';
import { formatTimeWithoutSeconds } from '@/utils/calendarUtils';

interface ReservationTooltipProps {
  reservation: Reservation;
  children: React.ReactNode;
}

const ReservationTooltip: React.FC<ReservationTooltipProps> = ({ reservation, children }) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent className="bg-white p-3 shadow-lg border rounded-md z-50">
          <div className="text-sm">
            <p className="font-semibold">{reservation.motivo}</p>
            <p>{formatTimeWithoutSeconds(reservation.inicio)} - {formatTimeWithoutSeconds(reservation.fin)}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default ReservationTooltip;
