
import React from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import FormField from '@/components/reservation/FormField';
import DatePicker from '@/components/reservation/DatePicker';
import TimeSelector from '@/components/reservation/TimeSelector';
import FormFooter from '@/components/reservation/FormFooter';
import { useReservationForm } from '@/hooks/useReservationForm';

const ReservationForm: React.FC = () => {
  const { 
    formState, 
    timeOptions, 
    handleSubmit,
    disabledDays 
  } = useReservationForm();

  const {
    responsable,
    setResponsable,
    email,
    setEmail,
    motivo,
    setMotivo,
    fecha,
    setFecha,
    inicio,
    setInicio,
    fin,
    setFin,
    personas,
    setPersonas,
    formErrors
  } = formState;

  const {
    availableTimes,
    availableEndTimes,
    updateAvailableEndTimes
  } = timeOptions;

  console.log('Available start times:', availableTimes);
  console.log('Available end times:', availableEndTimes);
  console.log('Selected start time:', inicio);
  console.log('Selected end time:', fin);

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-md border border-gray-200 transition-all animate-fade-in">
      <CardContent className="pt-6">
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-6">
          <div className="space-y-4">
            <FormField
              id="responsable"
              label="Responsable de la reserva *"
              value={responsable}
              onChange={(e) => setResponsable(e.target.value)}
              error={formErrors.responsable}
              placeholder="Nombre completo"
            />

            <FormField
              id="email"
              label="Correo electrónico del responsable *"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={formErrors.email}
              placeholder="correo@ejemplo.com"
              type="email"
            />

            <FormField
              id="motivo"
              label="Motivo de la reserva *"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              error={formErrors.motivo}
              placeholder="Describa el motivo de su reserva"
              multiline={true}
              rows={3}
            />

            <DatePicker
              id="fecha"
              label="Fecha *"
              value={fecha}
              onChange={setFecha}
              disabledDays={disabledDays}
              error={formErrors.fecha}
              noAvailableTimes={fecha !== undefined && availableTimes.length === 0}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TimeSelector
                id="inicio"
                label="Inicio *"
                value={inicio}
                onChange={(value) => {
                  setInicio(value);
                  setFin('');
                  updateAvailableEndTimes(value);
                }}
                options={availableTimes}
                disabled={!fecha || availableTimes.length === 0}
                error={formErrors.inicio}
              />

              <TimeSelector
                id="fin"
                label="Fin *"
                value={fin}
                onChange={setFin}
                options={availableEndTimes}
                disabled={!inicio || availableEndTimes.length === 0}
                error={formErrors.fin}
              />
            </div>

            <FormField
              id="personas"
              label="Cantidad de personas *"
              value={personas}
              onChange={(e) => setPersonas(e.target.value)}
              error={formErrors.personas}
              placeholder="Número de asistentes"
              type="number"
              min={1}
            />
          </div>
        </form>
      </CardContent>
      <CardFooter className="bg-gray-50 border-t border-gray-200 rounded-b-lg flex justify-center">
        <FormFooter onSubmit={handleSubmit} />
      </CardFooter>
    </Card>
  );
};

export default ReservationForm;
