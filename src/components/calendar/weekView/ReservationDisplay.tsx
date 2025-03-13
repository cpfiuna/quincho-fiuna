
import React from 'react';
import { Reservation } from '@/types/reservation';
import ReservationTooltip from './ReservationTooltip';

interface ReservationDisplayProps {
  reservation: Reservation;
}

const ReservationDisplay: React.FC<ReservationDisplayProps> = ({ reservation }) => {
  return (
    <ReservationTooltip reservation={reservation}>
      <div className="absolute inset-0 m-0.5 sm:m-1 bg-fiuna-red text-white text-xs p-1 sm:p-2 truncate rounded-md flex items-center justify-center">
        {reservation.motivo}
      </div>
    </ReservationTooltip>
  );
};

export default ReservationDisplay;
