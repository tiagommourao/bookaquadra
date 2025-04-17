import { format, differenceInHours, isBefore, addHours, addDays, parseISO } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

export const isFullHourTime = (value: string) => {
  const regex = /^([0-1]?[0-9]|2[0-3]):00$/;
  return regex.test(value);
};

export const fetchApplicableSchedules = async (courtId: string, bookingDate: Date, dayOfWeek: number) => {
  if (!courtId || !bookingDate) {
    return [];
  }
  
  // Ajuste para garantir que o dia da semana está correto (1 = segunda, 7 = domingo)
  const adjustedDayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek;
  
  const { data: schedules, error } = await supabase
    .from('schedules')
    .select('*')
    .eq('court_id', courtId)
    .eq('day_of_week', adjustedDayOfWeek);
    
  if (error) {
    console.error('Error fetching schedules:', error);
    return [];
  }
  
  return schedules || [];
};

// Função para formatar datas de maneira consistente para o banco de dados, sem problemas de timezone
export const formatDateForDB = (date: Date | string): string => {
  if (!date) return '';
  
  // Se for string, converte para Date usando parseISO (mantém a data exata)
  const dateObj = typeof date === 'string' ? parseISO(date) : new Date(date);
  
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

export const checkBookingConflict = async (
  courtId: string, 
  bookingDate: Date,
  startTime: string,
  endTime: string,
  currentBookingId?: string
) => {
  if (!courtId || !bookingDate || !startTime || !endTime) {
    return false;
  }
  
  try {
    const bookingDateStr = formatDateForDB(bookingDate);
    
    // Modificado para não considerar reservas canceladas como conflitos
    const { data: existingBookings, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('court_id', courtId)
      .eq('booking_date', bookingDateStr)
      .neq('status', 'cancelled'); // Ignora reservas canceladas ao verificar conflitos
      
    if (error) {
      console.error('Error checking booking conflicts:', error);
      return false;
    }
    
    const conflict = existingBookings?.find(existingBooking => {
      if (currentBookingId && existingBooking.id === currentBookingId) return false;
      
      const [startHour, startMin] = startTime.split(':').map(Number);
      const [endHour, endMin] = endTime.split(':').map(Number);
      
      const [existingStartHour, existingStartMin] = existingBooking.start_time.split(':').map(Number);
      const [existingEndHour, existingEndMin] = existingBooking.end_time.split(':').map(Number);
      
      const newStart = new Date(bookingDate);
      newStart.setHours(startHour, startMin, 0, 0);
      
      const newEnd = new Date(bookingDate);
      newEnd.setHours(endHour, endMin, 0, 0);
      if (newEnd <= newStart) {
        newEnd.setDate(newEnd.getDate() + 1);
      }
      
      const existingStart = new Date(bookingDate);
      existingStart.setHours(existingStartHour, existingStartMin, 0, 0);
      
      const existingEnd = new Date(bookingDate);
      existingEnd.setHours(existingEndHour, existingEndMin, 0, 0);
      if (existingEnd <= existingStart) {
        existingEnd.setDate(existingEnd.getDate() + 1);
      }
      
      if (newStart < existingEnd && newEnd > existingStart) {
        return true;
      }
    });
    
    return !!conflict;
  } catch (error) {
    console.error('Error in checkBookingConflict:', error);
    return false;
  }
};

// Função para encontrar e calcular o preço correto para cada hora específica
const findScheduleForHour = (schedules, hourStart, bookingDate) => {
  if (!schedules || schedules.length === 0) {
    console.warn('No schedules provided for price calculation');
    return null;
  }

  const bookingDay = bookingDate.getDay();
  const isWeekend = [0, 6].includes(bookingDay); // 0 = Sunday, 6 = Saturday
  
  // Vamos ordenar as faixas de horário para garantir processamento consistente
  const sortedSchedules = [...schedules].sort((a, b) => {
    const [aStartHour] = a.start_time.split(':').map(Number);
    const [bStartHour] = b.start_time.split(':').map(Number);
    return aStartHour - bStartHour;
  });
  
  // Hora exata da reserva para esta iteração
  const exactHour = new Date(hourStart);
  
  // Procura a faixa que contém esta hora específica
  for (const schedule of sortedSchedules) {
    const [startHour, startMin] = schedule.start_time.split(':').map(Number);
    const [endHour, endMin] = schedule.end_time.split(':').map(Number);
    
    // Cria objetos Date para os horários das faixas
    const scheduleStart = new Date(bookingDate);
    scheduleStart.setHours(startHour, startMin, 0, 0);
    
    const scheduleEnd = new Date(bookingDate);
    scheduleEnd.setHours(endHour, endMin, 0, 0);
    
    // Trata faixas que passam para o dia seguinte
    if (scheduleEnd <= scheduleStart) {
      scheduleEnd.setDate(scheduleEnd.getDate() + 1);
    }
    
    // Verifica se a hora atual está dentro da faixa
    // Inclui o início (>=) e exclui o final (<)
    if (exactHour >= scheduleStart && exactHour < scheduleEnd) {
      // Retorna a faixa e o preço apropriado (fim de semana ou dia normal)
      const price = isWeekend && schedule.price_weekend ? 
        schedule.price_weekend : 
        schedule.price;
      
      console.log(`Hour ${format(exactHour, 'HH:mm')} fits in schedule ${schedule.start_time}-${schedule.end_time}: R$ ${price}`);
      
      return {
        schedule,
        price
      };
    }
  }
  
  console.warn(`No schedule found for time: ${format(exactHour, 'HH:mm')}`);
  // Nenhuma faixa encontrada para esta hora
  return null;
};

export const calculateTotalAmount = (
  startTime: string,
  endTime: string,
  bookingDate: Date,
  schedules: any[],
  isMonthly: boolean,
  weekCount: number
) => {
  if (!startTime || !endTime || !bookingDate || schedules.length === 0) {
    console.warn('Missing required data for price calculation');
    return 0;
  }

  console.log(`Calculating price for booking from ${startTime} to ${endTime} on ${format(bookingDate, 'yyyy-MM-dd')}`);
  console.log(`Available schedules:`, schedules);

  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  // Cria objetos Date para horários de início e fim
  const startDate = new Date(bookingDate);
  startDate.setHours(startHour, startMin, 0, 0);
  
  const endDate = new Date(bookingDate);
  endDate.setHours(endHour, endMin, 0, 0);
  
  // Se o horário final for anterior ao inicial, assumimos que é do dia seguinte
  if (endDate <= startDate) {
    endDate.setDate(endDate.getDate() + 1);
  }
  
  // Calcula o valor total somando cada hora individualmente
  let totalAmount = 0;
  let currentHour = new Date(startDate);
  let hourlyBreakdown = [];
  
  // Para cada hora dentro do intervalo da reserva
  while (currentHour < endDate) {
    // Encontra a faixa aplicável e o valor para esta hora específica
    const nextHour = new Date(currentHour);
    nextHour.setHours(nextHour.getHours() + 1);
    
    const scheduleInfo = findScheduleForHour(schedules, currentHour, bookingDate);
    
    if (!scheduleInfo) {
      console.warn(`No pricing found for time slot starting at ${format(currentHour, 'HH:mm')}`);
    } else {
      totalAmount += scheduleInfo.price;
      
      // Registra o detalhamento de preços para debugging
      hourlyBreakdown.push({
        hour: format(currentHour, 'HH:mm'),
        schedule: `${scheduleInfo.schedule.start_time}-${scheduleInfo.schedule.end_time}`,
        price: scheduleInfo.price
      });
    }
    
    // Avança para a próxima hora
    currentHour = nextHour;
  }
  
  console.log('Hourly price breakdown:', hourlyBreakdown);
  console.log(`Raw total before adjustments: R$ ${totalAmount.toFixed(2)}`);
  
  // Aplica desconto para mensalistas, se aplicável
  let finalAmount = totalAmount;
  if (isMonthly && schedules.length > 0) {
    // Encontra o maior percentual de desconto entre as faixas
    const monthlyDiscountPercent = Math.max(...schedules.map(s => s.monthly_discount || 0));
    
    if (monthlyDiscountPercent > 0) {
      const discountAmount = totalAmount * (monthlyDiscountPercent / 100);
      finalAmount = totalAmount - discountAmount;
      console.log(`Applied monthly discount of ${monthlyDiscountPercent}%: -R$ ${discountAmount.toFixed(2)}`);
    }
  }
  
  // Multiplica pelo número de semanas para reservas mensais
  finalAmount = finalAmount * weekCount;
  
  if (weekCount > 1) {
    console.log(`Multiplied by ${weekCount} weeks: R$ ${finalAmount.toFixed(2)}`);
  }
  
  console.log(`Final calculated amount: R$ ${finalAmount.toFixed(2)}`);
  
  return Number(finalAmount.toFixed(2));
};
