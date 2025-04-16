
import React from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';

interface PeriodStats {
  totalBookings: number;
  pendingBookings: number;
  paidBookings: number;
  totalRevenue: number;
}

interface BookingStatCardsProps {
  periodStats: PeriodStats;
  viewMode: 'month' | 'week';
}

export const BookingStatCards = ({ periodStats, viewMode }: BookingStatCardsProps) => {
  return (
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
  );
};
