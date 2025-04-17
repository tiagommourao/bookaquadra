
import React, { useState, useEffect } from 'react';
import { UserLayout } from '@/components/layouts/UserLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, MapPin, AlertCircle, CheckCircle2, Calendar as CalendarIcon, Loader2, CreditCard } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useUserBookings, useCancelBooking } from '@/hooks/useBookings';
import { supabase } from '@/integrations/supabase/client';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from '@/hooks/use-toast';
import { Booking } from '@/types/booking';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

const MyBookings = () => {
  const [activeTab, setActiveTab] = useState('upcoming');
  const [cancelConfirmationOpen, setCancelConfirmationOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  
  const { data: bookings, isLoading, error, refetch } = useUserBookings();
  const cancelBooking = useCancelBooking();
  
  useEffect(() => {
    refetch();
  }, [activeTab, refetch]);
  
  const filteredBookings = bookings?.filter((booking) => {
    const bookingDate = parseISO(`${booking.booking_date}T${booking.start_time}`);
    const now = new Date();
    
    if (activeTab === 'upcoming') {
      return bookingDate > now && booking.status !== 'cancelled';
    } else if (activeTab === 'past') {
      return bookingDate < now || booking.status === 'completed';
    } else {
      return booking.status === 'cancelled';
    }
  }) || [];

  const formatBookingDate = (dateStr: string) => {
    return format(parseISO(dateStr), "EEEE, d 'de' MMMM", { locale: ptBR });
  };
  
  const handleRequestCancel = (bookingId: string) => {
    setSelectedBookingId(bookingId);
    setCancelConfirmationOpen(true);
  };
  
  const handleConfirmCancel = async () => {
    if (selectedBookingId) {
      try {
        await cancelBooking.mutateAsync(selectedBookingId);
        setCancelConfirmationOpen(false);
      } catch (error) {
        console.error("Erro ao cancelar reserva:", error);
        // Toast already shown by useCancelBooking hook
      }
    }
  };
  
  const handleAddToCalendar = (booking: any) => {
    const court = booking.court?.name || "Quadra";
    const startDateTime = `${booking.booking_date}T${booking.start_time}:00`;
    const endDateTime = `${booking.booking_date}T${booking.end_time}:00`;
    
    const eventDetails = {
      text: `Reserva de quadra - ${court}`,
      details: `Reserva de quadra esportiva no BookaQuadra.\nLocal: ${court}`,
      location: court,
      dates: `${startDateTime.replace(/-|:/g, '')}/${endDateTime.replace(/-|:/g, '')}`
    };
    
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventDetails.text)}&details=${encodeURIComponent(eventDetails.details)}&location=${encodeURIComponent(eventDetails.location)}&dates=${eventDetails.dates}`;
    
    window.open(googleCalendarUrl, '_blank');
  };

  const getCourtTypeName = (typeId: string | null | undefined): string => {
    if (!typeId) return '';
    
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

  const renderStatusBadge = (status: string, paymentStatus: string) => {
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
    } else if (paymentStatus === 'paid') {
      return (
        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full flex items-center">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Confirmado
        </span>
      );
    } else if (paymentStatus === 'rejected' || paymentStatus === 'failed') {
      return (
        <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full flex items-center">
          <AlertCircle className="h-3 w-3 mr-1" />
          Pagamento Recusado
        </span>
      );
    } else if (paymentStatus === 'expired') {
      return (
        <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full flex items-center">
          <AlertCircle className="h-3 w-3 mr-1" />
          Pagamento Expirado
        </span>
      );
    } else {
      return (
        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full flex items-center">
          <Clock className="h-3 w-3 mr-1" />
          Pendente
        </span>
      );
    }
  };

  const renderBookingCard = (booking: any) => {
    const bookingDate = parseISO(`${booking.booking_date}T${booking.start_time}`);
    const isPast = bookingDate < new Date();
    const canCancel = !isPast && booking.status !== 'cancelled' && booking.status !== 'completed';
    const canPay = booking.payment_status === 'pending' && !isPast && booking.status !== 'cancelled';
    const court = booking.court || {};
    
    return (
      <Card key={booking.id} className="mb-3">
        <CardContent className="p-0">
          <div className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium">{court.name || "Quadra"}</h3>
                <div className="flex items-center text-sm text-gray-500 mt-1">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>{formatBookingDate(booking.booking_date)}</span>
                </div>
                <div className="flex items-center text-sm text-gray-500 mt-1">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>{booking.start_time.substring(0, 5)} - {booking.end_time.substring(0, 5)}</span>
                </div>
              </div>
              <div>
                {renderStatusBadge(booking.status, booking.payment_status)}
              </div>
            </div>
            
            <div className="mt-4 pt-3 border-t flex flex-wrap justify-between items-center">
              <div className="text-sm">
                <span className="font-medium">Valor:</span> R$ {Number(booking.amount).toFixed(2)}
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
                
                {canPay && (
                  <Button 
                    size="sm" 
                    onClick={() => handlePayment(booking)}
                    className="text-xs flex items-center"
                    disabled={isProcessingPayment}
                  >
                    {isProcessingPayment ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-3 w-3 mr-1" />
                        Pagar
                      </>
                    )}
                  </Button>
                )}
                
                {canCancel && (
                  <Button 
                    size="sm" 
                    variant="destructive"
                    className="text-xs"
                    onClick={() => handleRequestCancel(booking.id)}
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

  const handlePayment = async (booking: Booking) => {
    try {
      setIsProcessingPayment(true);
      
      toast({
        title: "Processando pagamento",
        description: "Aguarde enquanto preparamos seu pagamento...",
      });
      
      console.log("Enviando requisição de pagamento para booking_id:", booking.id);
      
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: { booking_id: booking.id }
      });
      
      if (error) {
        console.error('Erro na função create-payment:', error);
        throw new Error(error.message || "Erro ao processar pagamento");
      }
      
      console.log("Resposta da função create-payment:", data);
      
      // Verificar erros específicos
      if (data?.error) {
        if (data?.setup_required) {
          toast({
            title: "Configuração necessária",
            description: "A integração com o gateway de pagamento não está configurada. Entre em contato com o suporte.",
            variant: "destructive",
            duration: 6000
          });
          return;
        }
        throw new Error(data.error);
      }
      
      if (!data?.payment_url && !data?.sandbox_url) {
        console.error('Resposta inesperada:', data);
        throw new Error("Não foi possível gerar o link de pagamento");
      }
      
      // Determinar qual URL usar com base no ambiente
      let paymentUrl;
      if (data.environment === 'production') {
        paymentUrl = data.payment_url || data.prod_url;
      } else {
        paymentUrl = data.sandbox_url;
      }
      
      if (paymentUrl) {
        window.location.href = paymentUrl;
      } else {
        throw new Error("URL de pagamento não disponível");
      }
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      toast({
        title: "Erro no pagamento",
        description: error.message || "Ocorreu um erro ao processar o pagamento. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return (
    <UserLayout>
      <section className="bg-primary text-primary-foreground p-6">
        <div className="max-w-lg mx-auto">
          <h1 className="text-2xl font-bold">Minhas Reservas</h1>
          <p className="mt-1 opacity-90">
            Gerencie suas reservas de quadras
          </p>
        </div>
      </section>
      
      <section className="p-4 pb-20">
        <div className="max-w-lg mx-auto">
          <Tabs defaultValue="upcoming" onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="upcoming">Próximas</TabsTrigger>
              <TabsTrigger value="past">Passadas</TabsTrigger>
              <TabsTrigger value="cancelled">Canceladas</TabsTrigger>
            </TabsList>
            
            {isLoading ? (
              <div className="flex justify-center items-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Carregando suas reservas...</span>
              </div>
            ) : error ? (
              <Card className="border-dashed">
                <CardContent className="p-6 text-center">
                  <AlertCircle className="h-8 w-8 mx-auto text-destructive mb-2" />
                  <p className="text-destructive mb-4">Erro ao carregar suas reservas</p>
                  <Button onClick={() => refetch()}>
                    Tentar Novamente
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
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
              </>
            )}
          </Tabs>
        </div>
      </section>
      
      <Dialog open={cancelConfirmationOpen} onOpenChange={setCancelConfirmationOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Cancelamento</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja cancelar esta reserva? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancelConfirmationOpen(false)}
              disabled={cancelBooking.isPending}
            >
              Voltar
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmCancel}
              disabled={cancelBooking.isPending}
            >
              {cancelBooking.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancelando...
                </>
              ) : (
                'Sim, Cancelar Reserva'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </UserLayout>
  );
};

export default MyBookings;
