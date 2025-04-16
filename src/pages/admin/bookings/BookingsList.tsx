
import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, Plus, Filter, Eye, Edit, Ban, Grid3X3, CalendarDays } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Booking, BookingStatus, Court, PaymentStatus } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { BookingModal } from '@/components/admin/bookings/BookingModal';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  format, 
  isToday, 
  isFuture, 
  isPast, 
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  parseISO,
  isWeekend,
  startOfWeek,
  endOfWeek,
  addDays,
  getDay
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useIsMobile } from '@/hooks/use-mobile';

const BookingsList = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedCourt, setSelectedCourt] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<BookingStatus | 'all'>('all');
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [selectedDayDetails, setSelectedDayDetails] = useState<Date | null>(null);
  
  const isMobile = useIsMobile();

  // Calculate start and end dates based on view mode
  const dateRange = useMemo(() => {
    if (viewMode === 'month') {
      return {
        start: startOfMonth(selectedDate),
        end: endOfMonth(selectedDate)
      };
    } else {
      return {
        start: startOfWeek(selectedDate, { weekStartsOn: 1 }),
        end: endOfWeek(selectedDate, { weekStartsOn: 1 })
      };
    }
  }, [selectedDate, viewMode]);

  // Generate days for the calendar
  const calendarDays = useMemo(() => {
    return eachDayOfInterval({
      start: dateRange.start,
      end: dateRange.end
    });
  }, [dateRange]);

  // Fetch courts
  const { data: courts } = useQuery({
    queryKey: ['courts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courts')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Court[];
    }
  });

  // Fetch bookings for the entire month/week
  const { data: allBookings, isLoading, error, refetch } = useQuery({
    queryKey: ['bookings', dateRange.start, dateRange.end, selectedCourt, selectedStatus],
    queryFn: async () => {
      let query = supabase
        .from('bookings')
        .select(`
          *,
          profiles:user_id (first_name, last_name, phone),
          court:court_id (name)
        `)
        .gte('booking_date', format(dateRange.start, 'yyyy-MM-dd'))
        .lte('booking_date', format(dateRange.end, 'yyyy-MM-dd'));
      
      if (selectedCourt !== 'all') {
        query = query.eq('court_id', selectedCourt);
      }
      
      if (selectedStatus !== 'all') {
        query = query.eq('status', selectedStatus);
      }
      
      query = query.order('booking_date');
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return data as (Booking & {
        profiles: { first_name: string | null; last_name: string | null; phone: string | null };
        court: { name: string };
      })[];
    }
  });

  // Get bookings for a specific day
  const getBookingsForDay = (day: Date) => {
    if (!allBookings) return [];
    
    return allBookings.filter(booking => 
      isSameDay(new Date(booking.booking_date), day)
    );
  };

  // Calculate stats for selected period (week or month)
  const periodStats = useMemo(() => {
    if (!allBookings) {
      return {
        totalBookings: 0,
        pendingBookings: 0,
        paidBookings: 0,
        totalRevenue: 0
      };
    }

    // Filter bookings to current view period
    const periodBookings = allBookings.filter(booking => {
      const bookingDate = new Date(booking.booking_date);
      return bookingDate >= dateRange.start && bookingDate <= dateRange.end;
    });

    return {
      totalBookings: periodBookings.length,
      pendingBookings: periodBookings.filter(b => b.status === 'pending').length,
      paidBookings: periodBookings.filter(b => b.payment_status === 'paid').length,
      totalRevenue: periodBookings
        .filter(b => b.payment_status === 'paid')
        .reduce((sum, booking) => sum + Number(booking.amount), 0)
    };
  }, [allBookings, dateRange]);

  const handleCreateBooking = () => {
    setSelectedBooking(null);
    setIsModalOpen(true);
  };

  const handleViewBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setIsModalOpen(true);
  };

  const handleStatusChange = async (bookingId: string, newStatus: BookingStatus) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', bookingId);
      
      if (error) throw error;
      
      toast({
        title: "Status atualizado",
        description: `Reserva marcada como ${newStatus}`,
      });
      
      refetch();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar o status da reserva",
        variant: "destructive"
      });
    }
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

  const getStatusBadgeVariant = (status: BookingStatus) => {
    switch (status) {
      case 'confirmed':
        return 'default'; // green
      case 'pending':
        return 'secondary'; // yellow
      case 'cancelled':
        return 'destructive'; // red
      case 'completed':
        return 'outline'; // gray
      default:
        return 'default';
    }
  };

  const getPaymentStatusBadgeVariant = (status: PaymentStatus) => {
    switch (status) {
      case 'paid':
        return 'default'; // green
      case 'pending':
        return 'secondary'; // yellow
      case 'failed':
        return 'destructive'; // red
      case 'refunded':
        return 'outline'; // gray
      default:
        return 'default';
    }
  };

  const translateStatus = (status: BookingStatus) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmada';
      case 'pending':
        return 'Pendente';
      case 'cancelled':
        return 'Cancelada';
      case 'completed':
        return 'Concluída';
      default:
        return status;
    }
  };

  const translatePaymentStatus = (status: PaymentStatus) => {
    switch (status) {
      case 'paid':
        return 'Pago';
      case 'pending':
        return 'Pendente';
      case 'failed':
        return 'Falhou';
      case 'refunded':
        return 'Reembolsado';
      default:
        return status;
    }
  };

  // Get cell color based on number of bookings and revenue
  const getCellColor = (bookings: (Booking & {
    profiles: { first_name: string | null; last_name: string | null; phone: string | null };
    court: { name: string };
  })[]) => {
    if (bookings.length === 0) return 'bg-white';
    
    const maxBookingsBeforeRed = 10; // Adjust as needed for your business
    const ratio = Math.min(bookings.length / maxBookingsBeforeRed, 1);
    
    if (ratio < 0.3) return 'bg-green-50 hover:bg-green-100';
    if (ratio < 0.7) return 'bg-yellow-50 hover:bg-yellow-100';
    return 'bg-red-50 hover:bg-red-100';
  };

  // Get days of the week headers
  const weekDays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

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

  const selectedDayBookings = selectedDayDetails 
    ? allBookings?.filter(b => isSameDay(new Date(b.booking_date), selectedDayDetails)) || []
    : [];

  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h1 className="text-2xl font-bold">Reservas</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={toggleViewMode} className="flex items-center gap-1">
              {viewMode === 'month' ? (
                <>
                  <CalendarDays className="h-4 w-4" />
                  <span className="hidden md:inline">Ver Semana</span>
                </>
              ) : (
                <>
                  <Grid3X3 className="h-4 w-4" />
                  <span className="hidden md:inline">Ver Mês</span>
                </>
              )}
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(selectedDate, 'MMMM yyyy', { locale: ptBR })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && handleChangeMonth(date)}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            <Button onClick={handleCreateBooking}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Reserva
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                {viewMode === 'month' ? 'Reservas do Mês' : 'Reservas da Semana'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {periodStats.totalBookings}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Reservas Pendentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {periodStats.pendingBookings}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Pagamentos Confirmados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {periodStats.paidBookings}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                {viewMode === 'month' ? 'Faturamento do Mês' : 'Faturamento da Semana'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {periodStats.totalRevenue.toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <CardTitle>Gerenciar Reservas</CardTitle>
              <CardDescription>
                Calendário de reservas de quadras
              </CardDescription>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 md:mt-0">
              <Select
                value={selectedCourt}
                onValueChange={setSelectedCourt}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por quadra" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as quadras</SelectItem>
                  {courts?.map((court) => (
                    <SelectItem key={court.id} value={court.id}>
                      {court.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={selectedStatus}
                onValueChange={(value) => setSelectedStatus(value as BookingStatus | 'all')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="confirmed">Confirmada</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
                  <SelectItem value="completed">Concluída</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>

          <CardContent>
            {/* Calendar View */}
            {viewMode === 'month' ? (
              // Month view
              <div className="grid grid-cols-7 gap-1 mb-6">
                {/* Calendar headers */}
                {weekDays.map((day) => (
                  <div key={day} className="p-2 text-center font-semibold">
                    {day}
                  </div>
                ))}
                
                {/* Fill in empty spaces before first day of month */}
                {Array.from({ length: getDay(dateRange.start) || 7 }).map((_, index) => (
                  <div key={`empty-start-${index}`} className="h-24 p-1 bg-gray-50 border border-gray-100"></div>
                ))}
                
                {/* Calendar days */}
                {calendarDays.map((day) => {
                  const dayBookings = getBookingsForDay(day);
                  const revenue = dayBookings.reduce((sum, b) => sum + Number(b.amount), 0);
                  
                  return (
                    <div
                      key={day.toISOString()}
                      className={`h-24 p-1 border cursor-pointer transition-all ${
                        isToday(day) ? 'border-primary' : 'border-gray-100'
                      } ${getCellColor(dayBookings)}`}
                      onClick={() => handleDayClick(day)}
                    >
                      <div className="flex justify-between items-start">
                        <span className={`text-sm font-medium ${isWeekend(day) ? 'text-red-500' : ''}`}>
                          {format(day, 'd')}
                        </span>
                        {dayBookings.length > 0 && (
                          <span className="text-xs font-medium bg-primary/10 text-primary px-1 rounded">
                            {dayBookings.length}
                          </span>
                        )}
                      </div>
                      
                      {dayBookings.length > 0 && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="mt-2 text-xs">
                                <div className="font-semibold text-green-700">
                                  R$ {revenue.toFixed(2)}
                                </div>
                                <div className="truncate mt-1">
                                  {dayBookings.length > 2 
                                    ? `${dayBookings.length} reservas`
                                    : dayBookings.slice(0, 2).map((b, i) => (
                                        <div key={i} className="truncate">
                                          {b.start_time.slice(0, 5)} - {b.court?.name}
                                        </div>
                                      ))
                                  }
                                </div>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">
                              <div className="space-y-1">
                                <p className="font-semibold">Reservas do dia {format(day, 'dd/MM')}</p>
                                {dayBookings.slice(0, 5).map((booking, i) => (
                                  <div key={i} className="text-xs">
                                    <span className="font-medium">{booking.start_time.slice(0, 5)}</span> - {booking.court?.name}{' '}
                                    <span className="text-muted-foreground">
                                      {booking.profiles?.first_name || 'Cliente'}
                                    </span>
                                  </div>
                                ))}
                                {dayBookings.length > 5 && (
                                  <p className="text-xs text-muted-foreground">
                                    + {dayBookings.length - 5} mais reservas
                                  </p>
                                )}
                                <p className="font-semibold text-green-600">
                                  Total: R$ {revenue.toFixed(2)}
                                </p>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              // Week view
              <div className="mb-6 overflow-x-auto">
                <table className="min-w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="border p-2 bg-gray-50 w-24">Horário</th>
                      {eachDayOfInterval({
                        start: dateRange.start,
                        end: dateRange.end
                      }).map((day) => (
                        <th key={day.toString()} className={`border p-2 ${isToday(day) ? 'bg-blue-50' : 'bg-gray-50'}`}>
                          <div className="text-center">
                            <div className="font-semibold">{format(day, 'EEEE', { locale: ptBR })}</div>
                            <div className={`text-sm ${isWeekend(day) ? 'text-red-500' : ''}`}>
                              {format(day, 'dd/MM')}
                            </div>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {/* Create rows for each hour from 6:00 to 23:00 */}
                    {Array.from({ length: 18 }).map((_, index) => {
                      const hour = index + 6; // Start at 6:00
                      const hourFormatted = `${hour.toString().padStart(2, '0')}:00`;
                      
                      return (
                        <tr key={hourFormatted} className="hover:bg-gray-50">
                          <td className="border p-2 text-center font-medium">
                            {hourFormatted}
                          </td>
                          
                          {eachDayOfInterval({
                            start: dateRange.start,
                            end: dateRange.end
                          }).map((day) => {
                            const bookingsAtHour = allBookings?.filter(b => 
                              isSameDay(new Date(b.booking_date), day) && 
                              b.start_time.startsWith(hourFormatted.slice(0, 2))
                            ) || [];
                            
                            return (
                              <td 
                                key={`${day.toString()}-${hourFormatted}`} 
                                className={`border p-1 relative min-h-[80px] ${
                                  isToday(day) ? 'bg-blue-50/30' : ''
                                }`}
                                onClick={() => handleDayClick(day)}
                              >
                                {bookingsAtHour.map((booking) => (
                                  <div 
                                    key={booking.id}
                                    className={`text-xs mb-1 p-1 rounded cursor-pointer ${
                                      booking.status === 'confirmed' ? 'bg-green-100' :
                                      booking.status === 'pending' ? 'bg-yellow-100' :
                                      booking.status === 'cancelled' ? 'bg-red-100' : 'bg-gray-100'
                                    }`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleViewBooking(booking);
                                    }}
                                  >
                                    <div className="font-medium truncate">
                                      {booking.start_time.slice(0, 5)}-{booking.end_time.slice(0, 5)}
                                    </div>
                                    <div className="truncate">{booking.court?.name}</div>
                                    <div className="truncate">
                                      {booking.profiles?.first_name || 'Cliente'}
                                    </div>
                                  </div>
                                ))}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Selected Day Details */}
            {selectedDayDetails && (
              <div className="mt-6 border-t pt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">
                    Reservas para {format(selectedDayDetails, 'dd/MM/yyyy', { locale: ptBR })}
                  </h3>
                  <Badge variant={isWeekend(selectedDayDetails) ? 'secondary' : 'outline'}>
                    {format(selectedDayDetails, 'EEEE', { locale: ptBR })}
                  </Badge>
                </div>
                
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Horário</TableHead>
                      <TableHead>Quadra</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Pagamento</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedDayBookings.length > 0 ? (
                      selectedDayBookings.map((booking) => (
                        <TableRow key={booking.id}>
                          <TableCell className="font-medium">
                            {`${booking.start_time.slice(0, 5)} - ${booking.end_time.slice(0, 5)}`}
                          </TableCell>
                          <TableCell>{booking.court?.name}</TableCell>
                          <TableCell>
                            {booking.profiles?.first_name 
                              ? `${booking.profiles.first_name} ${booking.profiles.last_name || ''}`
                              : 'Cliente não identificado'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadgeVariant(booking.status)}>
                              {translateStatus(booking.status)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getPaymentStatusBadgeVariant(booking.payment_status)}>
                              {translatePaymentStatus(booking.payment_status)}
                            </Badge>
                          </TableCell>
                          <TableCell>R$ {booking.amount.toFixed(2)}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewBooking(booking)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewBooking(booking)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            {booking.status !== 'cancelled' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleStatusChange(booking.id, 'cancelled')}
                              >
                                <Ban className="h-4 w-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-4">
                          Nenhuma reserva encontrada para este dia
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
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
