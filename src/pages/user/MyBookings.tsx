
import React, { useState } from 'react';
import { UserLayout } from '@/components/layouts/UserLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, MapPin, AlertCircle, CheckCircle2, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BookingStatus, PaymentStatus } from '@/types';

// Mock data for bookings
const mockBookings = [
  {
    id: '1',
    courtId: '1',
    courtName: 'Quadra Beach Tennis 01',
    courtType: 'beach-tennis',
    date: new Date(2023, 5, 30, 14, 0),
    startTime: '14:00',
    endTime: '15:00',
    price: 80,
    status: 'confirmed' as BookingStatus,
    paymentStatus: 'paid' as PaymentStatus,
    createdAt: new Date(2023, 5, 28, 10, 30),
  },
  {
    id: '2',
    courtId: '2',
    courtName: 'Quadra Padel 01',
    courtType: 'padel',
    date: new Date(2023, 5, 25, 16, 0),
    startTime: '16:00',
    endTime: '17:00',
    price: 100,
    status: 'confirmed' as BookingStatus,
    paymentStatus: 'pending' as PaymentStatus,
    createdAt: new Date(2023, 5, 20, 18, 45),
  },
  {
    id: '3',
    courtId: '3',
    courtName: 'Quadra Tênis 01',
    courtType: 'tennis',
    date: new Date(2023, 5, 22, 9, 0),
    startTime: '09:00',
    endTime: '10:30',
    price: 120,
    status: 'cancelled' as BookingStatus,
    paymentStatus: 'refunded' as PaymentStatus,
    createdAt: new Date(2023, 5, 19, 12, 15),
  },
  {
    id: '4',
    courtId: '1',
    courtName: 'Quadra Beach Tennis 01',
    courtType: 'beach-tennis',
    date: new Date(2023, 5, 20, 18, 0),
    startTime: '18:00',
    endTime: '19:00',
    price: 100,
    status: 'completed' as BookingStatus,
    paymentStatus: 'paid' as PaymentStatus,
    createdAt: new Date(2023, 5, 15, 9, 20),
  },
];

const MyBookings = () => {
  const [activeTab, setActiveTab] = useState('upcoming');
  
  // Filter bookings based on active tab
  const filteredBookings = mockBookings.filter((booking) => {
    const now = new Date();
    
    if (activeTab === 'upcoming') {
      return booking.date > now && booking.status !== 'cancelled';
    } else if (activeTab === 'past') {
      return booking.date < now || booking.status === 'completed';
    } else {
      return booking.status === 'cancelled';
    }
  });

  // Format date for display
  const formatBookingDate = (date: Date) => {
    return format(date, "EEEE, d 'de' MMMM", { locale: ptBR });
  };
  
  // Handle cancellation of a booking
  const handleCancelBooking = (bookingId: string) => {
    // In a real app, call an API to cancel the booking
    console.log(`Cancelling booking ${bookingId}`);
    // After API call, update the UI
    // For now, we'll just log it
  };
  
  // Handle adding a booking to Google Calendar
  const handleAddToCalendar = (booking: any) => {
    // In a real app, create a Google Calendar event
    const event = {
      title: `Reserva de quadra - ${booking.courtName}`,
      description: `Reserva de quadra esportiva no BookaQuadra. Local: ${booking.courtName}`,
      startTime: `${format(booking.date, 'yyyy-MM-dd')}T${booking.startTime}:00`,
      endTime: `${format(booking.date, 'yyyy-MM-dd')}T${booking.endTime}:00`,
    };
    
    console.log('Adding to calendar', event);
    // This would integrate with Google Calendar API
  };

  // Render status badge based on booking status
  const renderStatusBadge = (status: BookingStatus, paymentStatus: PaymentStatus) => {
    if (status === 'cancelled') {
      return (
        <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full flex items-center">
          <AlertCircle className="h-3 w-3 mr-1" />
          Cancelado
        </span>
      );
    } else if (status === 'completed') {
      return (
        <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full flex items-center">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Concluído
        </span>
      );
    } else if (paymentStatus === 'pending') {
      return (
        <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full flex items-center">
          <AlertCircle className="h-3 w-3 mr-1" />
          Pagamento Pendente
        </span>
      );
    } else {
      return (
        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full flex items-center">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Confirmado
        </span>
      );
    }
  };

  // Render booking card
  const renderBookingCard = (booking: any) => {
    const isPast = new Date(booking.date) < new Date();
    const canCancel = !isPast && booking.status !== 'cancelled' && booking.status !== 'completed';
    
    return (
      <Card key={booking.id} className="mb-3">
        <CardContent className="p-0">
          <div className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium">{booking.courtName}</h3>
                <div className="flex items-center text-sm text-gray-500 mt-1">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>{formatBookingDate(booking.date)}</span>
                </div>
                <div className="flex items-center text-sm text-gray-500 mt-1">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>{booking.startTime} - {booking.endTime}</span>
                </div>
              </div>
              <div>
                {renderStatusBadge(booking.status, booking.paymentStatus)}
              </div>
            </div>
            
            <div className="mt-4 pt-3 border-t flex flex-wrap justify-between items-center">
              <div className="text-sm">
                <span className="font-medium">Valor:</span> R$ {booking.price.toFixed(2)}
              </div>
              <div className="flex space-x-2 mt-2 sm:mt-0">
                {!isPast && booking.status === 'confirmed' && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="text-xs flex items-center"
                    onClick={() => handleAddToCalendar(booking)}
                  >
                    <CalendarIcon className="h-3 w-3 mr-1" />
                    Add ao Calendário
                  </Button>
                )}
                
                {canCancel && (
                  <Button 
                    size="sm" 
                    variant="destructive"
                    className="text-xs"
                    onClick={() => handleCancelBooking(booking.id)}
                  >
                    Cancelar
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <UserLayout>
      {/* Header */}
      <section className="bg-primary text-primary-foreground p-6">
        <div className="max-w-lg mx-auto">
          <h1 className="text-2xl font-bold">Minhas Reservas</h1>
          <p className="mt-1 opacity-90">
            Gerencie suas reservas de quadras
          </p>
        </div>
      </section>
      
      {/* Tabs and Bookings */}
      <section className="p-4 pb-20">
        <div className="max-w-lg mx-auto">
          <Tabs defaultValue="upcoming" onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="upcoming">Próximas</TabsTrigger>
              <TabsTrigger value="past">Passadas</TabsTrigger>
              <TabsTrigger value="cancelled">Canceladas</TabsTrigger>
            </TabsList>
            
            <TabsContent value="upcoming" className="mt-0">
              {filteredBookings.length > 0 ? (
                filteredBookings.map(renderBookingCard)
              ) : (
                <Card className="border-dashed">
                  <CardContent className="p-6 text-center">
                    <p className="text-gray-500 mb-4">Você não tem reservas futuras</p>
                    <Button onClick={() => window.location.href = '/reservar'}>
                      Fazer uma Reserva
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            <TabsContent value="past" className="mt-0">
              {filteredBookings.length > 0 ? (
                filteredBookings.map(renderBookingCard)
              ) : (
                <Card className="border-dashed">
                  <CardContent className="p-6 text-center">
                    <p className="text-gray-500">Você ainda não tem histórico de reservas</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            <TabsContent value="cancelled" className="mt-0">
              {filteredBookings.length > 0 ? (
                filteredBookings.map(renderBookingCard)
              ) : (
                <Card className="border-dashed">
                  <CardContent className="p-6 text-center">
                    <p className="text-gray-500">Você não tem reservas canceladas</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </UserLayout>
  );
};

export default MyBookings;
