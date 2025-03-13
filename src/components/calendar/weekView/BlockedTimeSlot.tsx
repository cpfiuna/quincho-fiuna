
import React from 'react';

const BlockedTimeSlot: React.FC = () => {
  return (
    <div className="absolute inset-0 m-1 bg-red-100 text-red-600 text-xs p-1 flex items-center justify-center rounded-md">
      No disponible
    </div>
  );
};

export default BlockedTimeSlot;
