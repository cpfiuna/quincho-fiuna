
import React, { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, 
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter, 
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Trash2, Users, Info, Search } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Reservation } from '@/types/reservation';
import ReservationDetailDialog from './ReservationDetailDialog';
import BlockedDatesList from './BlockedDatesList';

interface ReservationsListProps {
  reservations: Reservation[];
  blockedDates: any[];
  onDelete: () => void;
  onBlockedDateDelete: () => void;
  isLoading: boolean;
}

const ReservationsList: React.FC<ReservationsListProps> = ({ 
  reservations, 
  blockedDates, 
  onDelete,
  onBlockedDateDelete,
  isLoading 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const deleteReservation = async (id: string) => {
    try {
      const { error } = await supabase
        .from('reservations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Reserva eliminada exitosamente');
      setShowDeleteDialog(false);
      onDelete();
    } catch (error) {
      console.error('Error deleting reservation:', error);
      toast.error('Error al eliminar la reserva');
    }
  };

  const filteredReservations = reservations.filter(reservation => {
    const searchTermLower = searchTerm.toLowerCase();
    return (
      reservation.responsable.toLowerCase().includes(searchTermLower) ||
      reservation.email.toLowerCase().includes(searchTermLower) ||
      reservation.motivo.toLowerCase().includes(searchTermLower) ||
      format(new Date(reservation.fecha), 'dd/MM/yyyy').includes(searchTerm)
    );
  });

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <CardTitle className="text-lg">Reservas y Fechas Bloqueadas</CardTitle>
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input
              placeholder="Buscar reservas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 max-w-xs"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-2">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fiuna-red"></div>
          </div>
        ) : (
          <ScrollArea className="h-[calc(100vh-300px)]">
            <div className="space-y-3 p-2">
              <BlockedDatesList 
                blockedDates={blockedDates} 
                onDelete={onBlockedDateDelete} 
              />
              
              <h3 className="text-md font-medium mb-2 px-3">Reservas</h3>
              {filteredReservations.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No se encontraron reservas</p>
              ) : (
                filteredReservations.map(reservation => (
                  <Card key={reservation.id} className="overflow-hidden shadow-sm border border-gray-200">
                    <CardHeader className="p-3 bg-gray-50 border-b">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="text-base font-medium">{reservation.motivo}</CardTitle>
                          <CardDescription className="text-xs mt-1">
                            {format(new Date(reservation.fecha), 'EEEE d MMMM, yyyy', { locale: es })}
                          </CardDescription>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 p-2 hidden sm:flex"
                            onClick={() => {
                              setSelectedReservation(reservation);
                              setShowDetailDialog(true);
                            }}
                          >
                            Ver detalles
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0 sm:hidden"
                            onClick={() => {
                              setSelectedReservation(reservation);
                              setShowDetailDialog(true);
                            }}
                          >
                            <Info className="h-4 w-4" />
                          </Button>
                          <AlertDialog open={showDeleteDialog && selectedReservation?.id === reservation.id}>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="destructive"
                                size="sm"
                                className="h-8 p-2"
                                onClick={() => {
                                  setSelectedReservation(reservation);
                                  setShowDeleteDialog(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción eliminará permanentemente la reserva de {reservation.responsable} para el{' '}
                                  {format(new Date(reservation.fecha), 'dd/MM/yyyy', { locale: es })}.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel onClick={() => setShowDeleteDialog(false)}>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteReservation(reservation.id)}>
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-3 pt-3">
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <p><span className="font-medium">Horario:</span> {reservation.inicio} - {reservation.fin}</p>
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-1 text-gray-500" />
                            <span>{reservation.personas} personas</span>
                          </div>
                        </div>
                        <p><span className="font-medium">Responsable:</span> {reservation.responsable}</p>
                        <p><span className="font-medium">Email:</span> {reservation.email}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        )}

        <ReservationDetailDialog
          reservation={selectedReservation}
          isOpen={showDetailDialog}
          onClose={() => setShowDetailDialog(false)}
        />
      </CardContent>
    </Card>
  );
};

export default ReservationsList;
