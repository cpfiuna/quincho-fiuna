
import { useNavigate } from 'react-router-dom';
import { isBefore, startOfDay, isToday as isDateToday } from 'date-fns';
import { toast } from 'sonner';
import { useReservations } from '@/context/ReservationContext';

export const useReservationSubmit = () => {
  const navigate = useNavigate();
  const { addReservation, isTimeSlotAvailable } = useReservations();

  const submitReservation = async (formData: {
    responsable: string;
    email: string;
    motivo: string;
    fecha: Date;
    inicio: string;
    fin: string;
    personas: number;
  }, validateForm: () => boolean) => {
    if (validateForm()) {
      const { fecha, inicio, fin } = formData;
      
      if (fecha && inicio && fin) {
        if (isBefore(fecha, startOfDay(new Date()))) {
          toast.error('No se pueden realizar reservas para fechas pasadas');
          return false;
        }
        
        if (isDateToday(fecha)) {
          const currentTime = new Date();
          const [hours, minutes] = inicio.split(':').map(Number);
          if (currentTime.getHours() > hours || (currentTime.getHours() === hours && currentTime.getMinutes() > minutes)) {
            toast.error('No se pueden realizar reservas para horarios pasados');
            return false;
          }
        }
        
        if (isTimeSlotAvailable(fecha, inicio, fin)) {
          const newReservation = await addReservation(formData);
          
          if (newReservation) {
            // Single toast notification instead of multiple
            toast.success('Reserva creada exitosamente');
            
            setTimeout(() => {
              navigate('/calendario');
            }, 1500);
            
            return true;
          }
        } else {
          toast.error('El horario seleccionado ya está ocupado', {
            description: 'Por favor seleccione otro horario',
          });
        }
      }
    } else {
      toast.error('Por favor complete todos los campos requeridos');
    }
    
    return false;
  };

  return {
    submitReservation
  };
};
