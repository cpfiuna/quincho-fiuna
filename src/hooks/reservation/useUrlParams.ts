
import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

export const useUrlParams = (
  setFecha: (date: Date) => void,
  setInicio: (time: string) => void,
  setFin: (time: string) => void,
  currentFecha: Date | undefined
) => {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Only process URL parameters if we don't already have a date selected
    if (!currentFecha) {
      const fechaParam = searchParams.get('fecha');
      const horaParam = searchParams.get('hora');
      const finParam = searchParams.get('fin');

      if (fechaParam) {
        try {
          // Parse the date directly without timezone conversion
          // Create a Date object directly from the YYYY-MM-DD format
          // This ensures the date is interpreted correctly without shifting
          console.log('Parsing date from URL param:', fechaParam);
          
          // Split the date string and recreate with consistent time component
          const [year, month, day] = fechaParam.split('-').map(Number);
          const newDate = new Date(year, month - 1, day, 12, 0, 0);
          console.log('Parsed date:', newDate, 'Day:', newDate.getDate());
          
          setFecha(newDate);
        } catch (error) {
          console.error('Error parsing date from URL:', error);
        }
      }

      if (horaParam) {
        setInicio(horaParam);
      }

      if (finParam) {
        setFin(finParam);
      }
    }
  }, [searchParams, setFecha, setInicio, setFin, currentFecha]);
};
