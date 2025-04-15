
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserLayout } from '@/components/layouts/UserLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Mock data for courts
const courts = [
  { 
    id: '1', 
    name: 'Quadra Beach Tennis 01', 
    type: 'beach-tennis',
    description: 'Quadra oficial de Beach Tennis com areia especial',
    imageUrl: 'https://images.unsplash.com/photo-1562552476-8ac59b2a2e46?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80' 
  },
  { 
    id: '2', 
    name: 'Quadra Padel 01', 
    type: 'padel',
    description: 'Quadra de Padel com paredes de vidro e iluminação LED',
    imageUrl: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80' 
  },
  { 
    id: '3', 
    name: 'Quadra Tênis 01', 
    type: 'tennis',
    description: 'Quadra de saibro oficial para prática de tênis',
    imageUrl: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80' 
  },
  { 
    id: '4', 
    name: 'Quadra Vôlei', 
    type: 'volleyball',
    description: 'Quadra de vôlei com piso emborrachado especial',
    imageUrl: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80' 
  },
];

// Mock data for available time slots
const generateMockTimeSlots = (courtId: string, date: Date) => {
  // In a real app, this would come from an API call based on courtId and date
  const baseSlots = [
    { id: `${courtId}-1`, startTime: '08:00', endTime: '09:00', price: 80, available: true },
    { id: `${courtId}-2`, startTime: '09:00', endTime: '10:00', price: 80, available: true },
    { id: `${courtId}-3`, startTime: '10:00', endTime: '11:00', price: 100, available: true },
    { id: `${courtId}-4`, startTime: '11:00', endTime: '12:00', price: 100, available: false },
    { id: `${courtId}-5`, startTime: '14:00', endTime: '15:00', price: 80, available: true },
    { id: `${courtId}-6`, startTime: '15:00', endTime: '16:00', price: 80, available: true },
    { id: `${courtId}-7`, startTime: '16:00', endTime: '17:00', price: 100, available: true },
    { id: `${courtId}-8`, startTime: '17:00', endTime: '18:00', price: 120, available: false },
    { id: `${courtId}-9`, startTime: '18:00', endTime: '19:00', price: 120, available: true },
    { id: `${courtId}-10`, startTime: '19:00', endTime: '20:00', price: 120, available: true },
    { id: `${courtId}-11`, startTime: '20:00', endTime: '21:00', price: 100, available: true },
    { id: `${courtId}-12`, startTime: '21:00', endTime: '22:00', price: 100, available: true },
  ];
  
  // Make some time slots unavailable based on day of week for variety
  const dayOfWeek = date.getDay();
  return baseSlots.map((slot, index) => {
    if (dayOfWeek === 5 || dayOfWeek === 6) { // Friday and Saturday
      // Make more slots unavailable on weekends
      return { ...slot, available: index % 3 !== 0 ? slot.available : false };
    }
    return slot;
  });
};

const CourtReservation = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedCourt, setSelectedCourt] = useState<string | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const navigate = useNavigate();
  
  // Get available time slots for the selected court and date
  const availableTimeSlots = selectedCourt && selectedDate 
    ? generateMockTimeSlots(selectedCourt, selectedDate)
    : [];

  // Handle court selection
  const handleCourtSelect = (courtId: string) => {
    setSelectedCourt(courtId);
    setSelectedTimeSlot(null); // Reset time slot when changing courts
  };

  // Handle time slot selection
  const handleTimeSlotSelect = (slotId: string) => {
    setSelectedTimeSlot(slotId);
  };

  // Handle reservation submission
  const handleReserve = () => {
    if (selectedCourt && selectedDate && selectedTimeSlot) {
      // In a real app, make an API call to create the reservation
      console.log('Creating reservation', { 
        courtId: selectedCourt,
        date: selectedDate,
        timeSlotId: selectedTimeSlot 
      });
      
      // Navigate to payment page (mock navigation)
      navigate('/pagamento');
    }
  };

  return (
    <UserLayout>
      <div className="pb-20">
        {/* Header */}
        <section className="bg-primary text-primary-foreground p-6">
          <div className="max-w-lg mx-auto">
            <h1 className="text-2xl font-bold">Reservar Quadra</h1>
            <p className="mt-1 opacity-90">
              Escolha uma data, quadra e horário para sua atividade
            </p>
          </div>
        </section>
        
        {/* Date Selection */}
        <section className="p-4">
          <div className="max-w-lg mx-auto">
            <h2 className="text-lg font-medium mb-4">Selecione uma Data</h2>
            <Card>
              <CardContent className="p-4">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="pointer-events-auto"
                  locale={ptBR}
                  disabled={(date) => {
                    // Disable past dates
                    const now = new Date();
                    now.setHours(0, 0, 0, 0);
                    return date < now;
                  }}
                />
              </CardContent>
            </Card>
          </div>
        </section>
        
        {/* Court Selection */}
        <section className="p-4">
          <div className="max-w-lg mx-auto">
            <h2 className="text-lg font-medium mb-4">Escolha uma Quadra</h2>
            <div className="space-y-3">
              {courts.map((court) => (
                <Card 
                  key={court.id}
                  className={`overflow-hidden cursor-pointer transition-all ${
                    selectedCourt === court.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => handleCourtSelect(court.id)}
                >
                  <CardContent className="p-0">
                    <div className="flex flex-col sm:flex-row">
                      <div className="sm:w-1/3 h-32 sm:h-auto relative">
                        <img 
                          src={court.imageUrl} 
                          alt={court.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-4 flex-1">
                        <h3 className="font-medium text-lg">{court.name}</h3>
                        <p className="text-sm text-gray-500 mt-1">{court.description}</p>
                        
                        <div className="mt-2">
                          <span 
                            className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${
                              court.type === 'beach-tennis' 
                                ? 'bg-amber-100 text-amber-800'
                                : court.type === 'padel' 
                                  ? 'bg-blue-100 text-blue-800'
                                  : court.type === 'tennis'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-purple-100 text-purple-800'
                            }`}
                          >
                            {court.type === 'beach-tennis' 
                              ? 'Beach Tennis'
                              : court.type === 'padel'
                                ? 'Padel'
                                : court.type === 'tennis'
                                  ? 'Tênis'
                                  : 'Vôlei'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
        
        {/* Time Slot Selection - Only shown when court is selected */}
        {selectedCourt && (
          <section className="p-4">
            <div className="max-w-lg mx-auto">
              <h2 className="text-lg font-medium mb-4">Escolha um Horário</h2>
              
              {availableTimeSlots.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {availableTimeSlots.map((slot) => (
                    <Button
                      key={slot.id}
                      variant={selectedTimeSlot === slot.id ? "default" : "outline"}
                      className={`h-auto py-2 flex flex-col ${
                        !slot.available ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      disabled={!slot.available}
                      onClick={() => handleTimeSlotSelect(slot.id)}
                    >
                      <span>{slot.startTime} - {slot.endTime}</span>
                      <span className="text-xs mt-1">
                        R$ {slot.price.toFixed(2)}
                      </span>
                    </Button>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-4 text-center text-gray-500">
                    Nenhum horário disponível para esta data e quadra.
                  </CardContent>
                </Card>
              )}
            </div>
          </section>
        )}
        
        {/* Summary and Reserve Button */}
        {selectedCourt && selectedTimeSlot && (
          <section className="p-4 mb-4">
            <div className="max-w-lg mx-auto">
              <Card className="bg-accent">
                <CardContent className="p-4">
                  <h3 className="font-medium">Resumo da Reserva</h3>
                  <div className="mt-2 space-y-2 text-sm">
                    <p>
                      <span className="font-medium">Data:</span>{' '}
                      {selectedDate ? format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR }) : ''}
                    </p>
                    <p>
                      <span className="font-medium">Quadra:</span>{' '}
                      {courts.find(c => c.id === selectedCourt)?.name}
                    </p>
                    <p>
                      <span className="font-medium">Horário:</span>{' '}
                      {availableTimeSlots.find(s => s.id === selectedTimeSlot)?.startTime} - {
                        availableTimeSlots.find(s => s.id === selectedTimeSlot)?.endTime
                      }
                    </p>
                    <p>
                      <span className="font-medium">Valor:</span>{' '}
                      R$ {availableTimeSlots.find(s => s.id === selectedTimeSlot)?.price.toFixed(2)}
                    </p>
                  </div>
                  
                  <Button
                    className="w-full mt-4"
                    onClick={handleReserve}
                  >
                    Reservar e Pagar
                  </Button>
                </CardContent>
              </Card>
            </div>
          </section>
        )}
      </div>
    </UserLayout>
  );
};

export default CourtReservation;
