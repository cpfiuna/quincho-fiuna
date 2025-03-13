
import React from 'react';
import { format, isBefore } from 'date-fns';
import { es } from 'date-fns/locale';
import { Reservation } from '@/context/ReservationContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Card, 
  CardContent
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';

interface AgendaViewProps {
  reservations: Reservation[];
}

const AgendaView: React.FC<AgendaViewProps> = ({ reservations }) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const futureReservations = reservations
    .filter(r => !isBefore(new Date(r.fecha), today))
    .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
  
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium mb-2">Próximas reservas</h2>
      <ScrollArea className="h-[calc(100vh-230px)]">
        <div className="space-y-3">
          {futureReservations.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No hay reservas próximas</p>
          ) : (
            futureReservations.map(reservation => (
              <Card key={reservation.id} className="overflow-hidden shadow-sm border border-gray-200">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-fiuna-red" />
                      <span className="font-medium">{reservation.inicio} - {reservation.fin}</span>
                    </div>
                    <Badge className="bg-fiuna-red hover:bg-fiuna-darkred">
                      {format(new Date(reservation.fecha), 'dd/MM/yyyy', { locale: es })}
                    </Badge>
                  </div>
                  <div className="font-medium text-gray-800">
                    {reservation.motivo}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default AgendaView;
