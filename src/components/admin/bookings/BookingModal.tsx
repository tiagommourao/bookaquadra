
import React, { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Booking } from '@/types';
import { BookingForm } from './BookingForm';
import { useBookingForm } from './hooks/useBookingForm';
import { useBookingData } from './hooks/useBookingData';

interface BookingModalProps {
  booking: Booking | null;
  isOpen: boolean;
  onClose: () => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  booking,
  isOpen,
  onClose
}) => {
  const { users, courts } = useBookingData();
  
  // Log booking data when opening for editing
  useEffect(() => {
    if (booking && isOpen) {
      console.log('Opening booking for edit:', {
        ...booking,
        start_time_value: booking.start_time,
        end_time_value: booking.end_time,
        start_time_type: typeof booking.start_time,
        end_time_type: typeof booking.end_time
      });
    }
  }, [booking, isOpen]);
  
  const {
    form,
    isSubmitting,
    courtRate,
    bookingHours,
    selectedSchedules,
    weeks,
    scheduleConflict,
    isValidatingSchedule,
    watchIsMonthly,
    handleSubmit
  } = useBookingForm({ booking, onClose });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {booking ? 'Editar Reserva' : 'Nova Reserva'}
          </DialogTitle>
          <DialogDescription>
            {booking
              ? 'Visualize ou edite os detalhes da reserva'
              : 'Crie uma nova reserva no sistema'}
          </DialogDescription>
        </DialogHeader>

        <BookingForm 
          form={form}
          users={users}
          courts={courts}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          courtRate={courtRate}
          bookingHours={bookingHours}
          selectedSchedules={selectedSchedules}
          weeks={weeks}
          scheduleConflict={scheduleConflict}
          isValidatingSchedule={isValidatingSchedule}
          watchIsMonthly={watchIsMonthly}
          onCancel={onClose}
          isUpdating={!!booking}
        />
      </DialogContent>
    </Dialog>
  );
};
