
import React, { useState } from 'react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { PaymentsHeader } from '@/components/admin/payments/PaymentsHeader';
import { PaymentsTable } from '@/components/admin/payments/PaymentsTable';
import { PaymentModal } from '@/components/admin/payments/PaymentModal';
import { PaymentFilters } from '@/components/admin/payments/PaymentFilters';
import { PaymentStatCards } from '@/components/admin/payments/PaymentStatCards';
import { usePaymentsData } from '@/hooks/admin/usePaymentsData';
import { Payment } from '@/types/payment';
import { Loader2 } from 'lucide-react';

const PaymentsList: React.FC = () => {
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',  // Changed from empty string to 'all'
    paymentMethod: 'all',  // Changed from empty string to 'all'
    startDate: '',
    endDate: '',
    minAmount: '',
    maxAmount: '',
    search: '',
  });
  
  const { 
    payments, 
    isLoading, 
    refetch, 
    statistics,
    exportPayments
  } = usePaymentsData(filters);

  const handlePaymentClick = (payment: Payment) => {
    setSelectedPayment(payment);
    setIsModalOpen(true);
  };

  const handleFilterChange = (newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleExport = (format: 'csv' | 'excel') => {
    exportPayments(format);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <PaymentsHeader onExport={handleExport} />
        
        <PaymentStatCards statistics={statistics} isLoading={isLoading} />
        
        <PaymentFilters 
          filters={filters} 
          onChange={handleFilterChange} 
        />
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <PaymentsTable 
            payments={payments} 
            onPaymentClick={handlePaymentClick} 
          />
        )}
        
        {selectedPayment && (
          <PaymentModal 
            payment={selectedPayment}
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setSelectedPayment(null);
            }} 
            onStatusUpdate={() => {
              setIsModalOpen(false);
              refetch();
            }}
          />
        )}
      </div>
    </AdminLayout>
  );
};

export default PaymentsList;
