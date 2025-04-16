
import React, { useState } from 'react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Booking } from '@/types';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import { BookingModal } from '@/components/admin/bookings/BookingModal';
import { useBookingsData } from '@/hooks/admin/useBookingsData';
import { BookingsHeader } from '@/components/admin/bookings/BookingsHeader';
import { BookingStatCards } from '@/components/admin/bookings/BookingStatCards';
import { BookingsFilters } from '@/components/admin/bookings/BookingsFilters';
import { MonthCalendarView } from '@/components/admin/bookings/MonthCalendarView';
import { WeekCalendarView } from '@/components/admin/bookings/WeekCalendarView';
import { BookingDetailsTable } from '@/components/admin/bookings/BookingDetailsTable';
import { useIsMobile } from '@/hooks/use-mobile';

const BookingsList = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const isMobile = useIsMobile();

  const {
    selectedDate,
    setSelectedDate,
    selectedCourt,
    setSelectedCourt,
    selectedStatus,
    setSelectedStatus: setSelectedStatusBase,
    viewMode,
    setViewMode,
    selectedDayDetails,
    setSelectedDayDetails,
    dateRange,
    calendarDays,
    courts,
    allBookings,
    isLoading,
    error,
    refetch,
    getBookingsForDay,
    periodStats,
    getCellColor,
    weekDays,
    selectedDayBookings
  } = useBookingsData();

  // Type-safe wrapper around setSelectedStatus
  const setSelectedStatus = (value: string) => {
    setSelectedStatusBase(value as any);
  };

  const handleCreateBooking = () => {
    setSelectedBooking(null);
    setIsModalOpen(true);
  };

  const handleEditBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    refetch();
  };

  const handleDayClick = (day: Date) => {
    setSelectedDayDetails(day);
    setSelectedDate(day);
  };

  const handleChangeMonth = (date: Date) => {
    setSelectedDate(date);
    setSelectedDayDetails(null);
  };

  const toggleViewMode = () => {
    setViewMode(viewMode === 'month' ? 'week' : 'month');
    setSelectedDayDetails(null);
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="container mx-auto py-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Carregando reservas...</h1>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="container mx-auto py-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Erro ao carregar reservas</h1>
          </div>
          <p className="text-red-500">Erro: {(error as Error).message}</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        <BookingsHeader
          selectedDate={selectedDate}
          viewMode={viewMode}
          onChangeMonth={handleChangeMonth}
          onToggleViewMode={toggleViewMode}
          onCreateBooking={handleCreateBooking}
        />

        <BookingStatCards
          periodStats={periodStats}
          viewMode={viewMode}
        />

        <Card>
          <CardHeader className="flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <CardTitle>Gerenciar Reservas</CardTitle>
              <CardDescription>
                Calendário de reservas de quadras
              </CardDescription>
            </div>
            <BookingsFilters
              selectedCourt={selectedCourt}
              setSelectedCourt={setSelectedCourt}
              selectedStatus={selectedStatus}
              setSelectedStatus={setSelectedStatus}
              courts={courts}
            />
          </CardHeader>

          <CardContent>
            {viewMode === 'month' ? (
              <MonthCalendarView
                calendarDays={calendarDays}
                dateRange={dateRange}
                getBookingsForDay={getBookingsForDay}
                getCellColor={getCellColor}
                handleDayClick={handleDayClick}
                weekDays={weekDays}
              />
            ) : (
              <WeekCalendarView
                dateRange={dateRange}
                allBookings={allBookings}
                handleDayClick={handleDayClick}
                handleEditBooking={handleEditBooking}
              />
            )}

            {selectedDayDetails && (
              <BookingDetailsTable
                selectedDayDetails={selectedDayDetails}
                selectedDayBookings={selectedDayBookings}
                handleEditBooking={handleEditBooking}
              />
            )}
          </CardContent>
          <CardFooter className="flex justify-between border-t pt-6">
            <p className="text-sm text-muted-foreground">
              Total: {allBookings?.length || 0} reservas encontradas no período
            </p>
          </CardFooter>
        </Card>
      </div>
      
      {isModalOpen && (
        <BookingModal
          booking={selectedBooking}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}
    </AdminLayout>
  );
};

export default BookingsList;
