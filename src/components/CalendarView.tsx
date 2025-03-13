
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useReservations } from '@/context/ReservationContext';
import CalendarHeader from '@/components/calendar/CalendarHeader';
import CalendarViewContent from '@/components/calendar/CalendarViewContent';
import LoadingState from '@/components/calendar/LoadingState';
import ErrorState from '@/components/calendar/ErrorState';
import { useCalendarState } from '@/components/calendar/hooks/useCalendarState';
import { useReservationUpdates } from '@/components/calendar/hooks/useReservationUpdates';
import { handleTimeSlotClick } from '@/components/calendar/TimeSlotUtils';

const CalendarView: React.FC = () => {
  const navigate = useNavigate();
  const { reservations, isDateBlocked, isTimeSlotAvailable, isLoading, dataInitialized } = useReservations();
  
  // Use the extracted hooks
  const { 
    currentDate, 
    setCurrentDate, 
    view, 
    setView, 
    nextHandler, 
    prevHandler, 
    todayHandler 
  } = useCalendarState();
  
  // Use the reservation updates hook for side effects
  useReservationUpdates(reservations, isLoading, dataInitialized);

  // Handler for day click in month view
  const handleDayClick = (day: Date) => {
    setCurrentDate(day);
    setView('day');
  };

  // Delegate to the extracted utility function
  const onTimeSlotClick = (date: Date, time: string) => {
    handleTimeSlotClick(date, time, navigate);
  };

  console.log('CalendarView rendering, isLoading:', isLoading);

  // Handle the case when data is still initializing
  if (isLoading) {
    return <LoadingState />;
  }

  // Handle the case when there was an error loading data
  if (!isLoading && reservations.length === 0 && !dataInitialized) {
    return <ErrorState />;
  }

  return (
    <div className="bg-white p-2 sm:p-4 rounded-lg shadow-sm border border-gray-100 animate-fade-in w-full">
      <CalendarHeader 
        currentDate={currentDate}
        view={view}
        onPrev={prevHandler}
        onNext={nextHandler}
        onToday={todayHandler}
        onViewChange={setView}
      />
      
      <CalendarViewContent
        view={view}
        currentDate={currentDate}
        reservations={reservations}
        isDateBlocked={isDateBlocked}
        isTimeSlotAvailable={isTimeSlotAvailable}
        onDayClick={handleDayClick}
        onTimeSlotClick={onTimeSlotClick}
      />
    </div>
  );
};

export default CalendarView;
