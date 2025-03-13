
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';
import { Reservation } from '@/types/reservation';

export const useReservationMutations = (fetchReservations: () => Promise<void>) => {
  const addReservation = async (newReservation: Omit<Reservation, 'id' | 'createdAt'>): Promise<Reservation | null> => {
    try {
      // Format the date correctly to prevent timezone issues
      // Get year, month, day components directly from the Date object
      const year = newReservation.fecha.getFullYear();
      const month = String(newReservation.fecha.getMonth() + 1).padStart(2, '0');
      const day = String(newReservation.fecha.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;
      
      console.log('Creating reservation with date:', formattedDate, 'Original date object:', newReservation.fecha);

      const { data, error } = await supabase
        .from('reservations')
        .insert({
          responsable: newReservation.responsable,
          email: newReservation.email,
          motivo: newReservation.motivo,
          fecha: formattedDate, // Use our formatted date string
          inicio: newReservation.inicio,
          fin: newReservation.fin,
          personas: newReservation.personas,
          approved: true // Default to approved
        })
        .select();

      if (error) {
        throw error;
      }

      if (data && data[0]) {
        // When creating the reservation object, ensure we parse the date correctly
        const reservation = {
          id: data[0].id,
          responsable: data[0].responsable,
          email: data[0].email,
          motivo: data[0].motivo,
          fecha: new Date(data[0].fecha), // Ensure date is parsed correctly
          inicio: data[0].inicio,
          fin: data[0].fin,
          personas: data[0].personas,
          createdAt: new Date(data[0].created_at),
          approved: data[0].approved,
          admin_notes: data[0].admin_notes
        };
        
        // Remove the toast from here to avoid duplication
        // The calling component will handle user feedback
        return reservation;
      }
      return null;
    } catch (error) {
      console.error('Error creating reservation:', error);
      toast.error('Error al crear la reserva');
      return null;
    }
  };

  const deleteReservation = async (id: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('reservations')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      // The real-time subscription will handle updating the UI
      toast.success("Reserva eliminada exitosamente");
    } catch (error) {
      console.error('Error deleting reservation:', error);
      toast.error('Error al eliminar la reserva');
    }
  };

  const updateReservation = async (id: string, updatedData: Partial<Omit<Reservation, 'id' | 'createdAt'>>): Promise<void> => {
    try {
      const updateObject: any = { ...updatedData };
      
      if (updatedData.fecha) {
        // Format the date correctly to prevent timezone issues
        const year = updatedData.fecha.getFullYear();
        const month = String(updatedData.fecha.getMonth() + 1).padStart(2, '0');
        const day = String(updatedData.fecha.getDate()).padStart(2, '0');
        updateObject.fecha = `${year}-${month}-${day}`;
      }

      const { error } = await supabase
        .from('reservations')
        .update(updateObject)
        .eq('id', id);

      if (error) {
        throw error;
      }

      // The real-time subscription will handle updating the UI
      toast.success("Reserva actualizada exitosamente");
    } catch (error) {
      console.error('Error updating reservation:', error);
      toast.error('Error al actualizar la reserva');
    }
  };

  return {
    addReservation,
    deleteReservation,
    updateReservation
  };
};
