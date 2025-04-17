
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserLayout } from '@/components/layouts/UserLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { format, addDays, startOfToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, AlertCircle, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { useCourts } from '@/hooks/useCourts';
import { useAvailableTimeSlots } from '@/hooks/useAvailability';
import { useCreateBooking } from '@/hooks/useBookings';
import { Court } from '@/types/court';

const CourtReservation = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedCourt, setSelectedCourt] = useState<string | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const navigate = useNavigate();
  
  // Fetch courts
  const { data: courts, isLoading: isLoadingCourts, error: courtsError } = useCourts();
  
  // Get available time slots for the selected court and date
  const { data: availableTimeSlots, isLoading: isLoadingTimeSlots } = useAvailableTimeSlots(
    selectedCourt, 
    selectedDate || null
  );
  
  // Get the mutation for creating a booking
  const createBooking = useCreateBooking();
  
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
    if (selectedCourt && selectedDate && selectedTimeSlot && availableTimeSlots) {
      const selectedSlot = availableTimeSlots.find(slot => slot.id === selectedTimeSlot);
      
      if (selectedSlot) {
        createBooking.mutate({
          court_id: selectedCourt,
          booking_date: format(selectedDate, 'yyyy-MM-dd'),
          start_time: selectedSlot.startTime,
          end_time: selectedSlot.endTime,
          amount: selectedSlot.price
        }, {
          onSuccess: (response) => {
            // Se houver URL de pagamento, redirecionar para ela
            if (response.payment_url) {
              window.location.href = response.payment_url;
            } else {
              // Caso contrário, redirecionar para minhas reservas
              navigate('/minhas-reservas');
            }
          }
        });
      }
    }
  };

  const getCurrentCourt = (): Court | undefined => {
    if (!selectedCourt || !courts) return undefined;
    return courts.find(court => court.id === selectedCourt);
  };

  const getCourtTypeName = (typeId: string | undefined): string => {
    if (!typeId) return '';
    
    // Mapeamento de tipos de quadra
    const types: Record<string, string> = {
      'beach-tennis': 'Beach Tennis',
      'padel': 'Padel',
      'tennis': 'Tênis',
      'volleyball': 'Vôlei',
      'futsal': 'Futsal',
      'basketball': 'Basquete',
      'pickleball': 'Pickleball'
    };
    
    return types[typeId] || typeId;
  };

  const getCourtTypeStyle = (typeId: string | undefined): { bg: string, text: string } => {
    if (!typeId) return { bg: 'bg-gray-100', text: 'text-gray-800' };
    
    // Estilos para cada tipo de quadra
    const styles: Record<string, { bg: string, text: string }> = {
      'beach-tennis': { bg: 'bg-amber-100', text: 'text-amber-800' },
      'padel': { bg: 'bg-blue-100', text: 'text-blue-800' },
      'tennis': { bg: 'bg-green-100', text: 'text-green-800' },
      'volleyball': { bg: 'bg-purple-100', text: 'text-purple-800' },
      'futsal': { bg: 'bg-red-100', text: 'text-red-800' },
      'basketball': { bg: 'bg-orange-100', text: 'text-orange-800' },
      'pickleball': { bg: 'bg-teal-100', text: 'text-teal-800' }
    };
    
    return styles[typeId] || { bg: 'bg-gray-100', text: 'text-gray-800' };
  };

  // Render loading state for courts
  const renderCourtsSkeleton = () => (
    <div className="space-y-3">
      {[1, 2, 3].map(i => (
        <Card key={i} className="overflow-hidden">
          <CardContent className="p-0">
            <div className="flex flex-col sm:flex-row">
              <div className="sm:w-1/3 h-32 sm:h-auto">
                <Skeleton className="w-full h-full" />
              </div>
              <div className="p-4 flex-1">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full mb-4" />
                <Skeleton className="h-6 w-1/4" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  // Render loading state for time slots
  const renderTimeSlotsSkeleton = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {[1, 2, 3, 4, 5, 6].map(i => (
        <Skeleton key={i} className="h-14 w-full" />
      ))}
    </div>
  );

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
                    const today = startOfToday();
                    // Allow booking up to 30 days in advance by default
                    const maxDate = addDays(today, 30);
                    return date < today || date > maxDate;
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
            
            {courtsError ? (
              <Card>
                <CardContent className="p-4 text-center text-destructive">
                  <AlertCircle className="mx-auto h-8 w-8 mb-2" />
                  <p>Erro ao carregar quadras. Por favor, tente novamente.</p>
                </CardContent>
              </Card>
            ) : isLoadingCourts ? (
              renderCourtsSkeleton()
            ) : courts && courts.length > 0 ? (
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
                            src={court.image_url || '/placeholder.svg'} 
                            alt={court.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="p-4 flex-1">
                          <h3 className="font-medium text-lg">{court.name}</h3>
                          <p className="text-sm text-gray-500 mt-1">{court.description}</p>
                          
                          <div className="mt-2 flex flex-wrap gap-2">
                            <span 
                              className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${
                                getCourtTypeStyle(court.type_id).bg
                              } ${
                                getCourtTypeStyle(court.type_id).text
                              }`}
                            >
                              {getCourtTypeName(court.type_id)}
                            </span>
                            
                            {court.surface_type && (
                              <span className="inline-flex items-center px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                                {court.surface_type}
                              </span>
                            )}
                            
                            {court.has_cover && (
                              <span className="inline-flex items-center px-2 py-1 text-xs rounded-full bg-blue-50 text-blue-700">
                                Coberta
                              </span>
                            )}
                            
                            {court.has_lighting && (
                              <span className="inline-flex items-center px-2 py-1 text-xs rounded-full bg-yellow-50 text-yellow-700">
                                Iluminação
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-4 text-center text-gray-500">
                  <p>Nenhuma quadra disponível no momento.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </section>
        
        {/* Time Slot Selection - Only shown when court is selected */}
        {selectedCourt && (
          <section className="p-4">
            <div className="max-w-lg mx-auto">
              <h2 className="text-lg font-medium mb-4">Escolha um Horário</h2>
              
              {isLoadingTimeSlots ? (
                renderTimeSlotsSkeleton()
              ) : availableTimeSlots && availableTimeSlots.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {availableTimeSlots.map((slot) => (
                    <TooltipProvider key={slot.id}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="relative">
                            <Button
                              variant={selectedTimeSlot === slot.id ? "default" : "outline"}
                              className={`h-auto py-2 w-full flex flex-col ${
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
                            {!slot.available && slot.blockReason && (
                              <span className="absolute top-0 right-0 -mt-1 -mr-1">
                                <Info className="h-4 w-4 text-gray-400" />
                              </span>
                            )}
                          </div>
                        </TooltipTrigger>
                        {!slot.available && slot.blockReason && (
                          <TooltipContent>
                            <p>{slot.blockReason}</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-4 text-center text-gray-500">
                    <p>Nenhum horário disponível para esta data e quadra.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </section>
        )}
        
        {/* Summary and Reserve Button */}
        {selectedCourt && selectedTimeSlot && availableTimeSlots && (
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
                      {getCurrentCourt()?.name}
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
                    disabled={createBooking.isPending}
                  >
                    {createBooking.isPending ? 'Processando...' : 'Reservar e Pagar'}
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
