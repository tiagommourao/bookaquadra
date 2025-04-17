
import React from 'react';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';

interface PaymentFiltersProps {
  filters: {
    status: string;
    paymentMethod: string;
    startDate: string;
    endDate: string;
    minAmount: string;
    maxAmount: string;
    search: string;
  };
  onChange: (filters: Partial<PaymentFiltersProps['filters']>) => void;
}

export const PaymentFilters: React.FC<PaymentFiltersProps> = ({ filters, onChange }) => {
  const handleReset = () => {
    onChange({
      status: '',
      paymentMethod: '',
      startDate: '',
      endDate: '',
      minAmount: '',
      maxAmount: '',
      search: '',
    });
  };

  return (
    <div className="bg-white p-4 rounded-md shadow-sm border space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-lg">Filtros</h3>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleReset}
          className="h-8 px-2 text-muted-foreground"
        >
          <X className="h-4 w-4 mr-1" /> Limpar filtros
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Status</label>
          <Select 
            value={filters.status} 
            onValueChange={(value) => onChange({ status: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos os status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="paid">Pago</SelectItem>
              <SelectItem value="rejected">Recusado</SelectItem>
              <SelectItem value="expired">Expirado</SelectItem>
              <SelectItem value="refunded">Reembolsado</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Método de Pagamento</label>
          <Select 
            value={filters.paymentMethod} 
            onValueChange={(value) => onChange({ paymentMethod: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos os métodos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os métodos</SelectItem>
              <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
              <SelectItem value="debit_card">Cartão de Débito</SelectItem>
              <SelectItem value="boleto">Boleto</SelectItem>
              <SelectItem value="pix">PIX</SelectItem>
              <SelectItem value="bank_transfer">Transferência Bancária</SelectItem>
              <SelectItem value="cash">Dinheiro</SelectItem>
              <SelectItem value="other">Outro</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Data de Início</label>
          <Input 
            type="date" 
            value={filters.startDate} 
            onChange={(e) => onChange({ startDate: e.target.value })}
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Data de Fim</label>
          <Input 
            type="date" 
            value={filters.endDate} 
            onChange={(e) => onChange({ endDate: e.target.value })}
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Valor Mínimo (R$)</label>
          <Input 
            type="number" 
            min="0" 
            step="0.01" 
            placeholder="Valor mínimo" 
            value={filters.minAmount} 
            onChange={(e) => onChange({ minAmount: e.target.value })}
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Valor Máximo (R$)</label>
          <Input 
            type="number" 
            min="0" 
            step="0.01" 
            placeholder="Valor máximo" 
            value={filters.maxAmount} 
            onChange={(e) => onChange({ maxAmount: e.target.value })}
          />
        </div>
        
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium">Busca</label>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              type="text" 
              placeholder="Buscar por ID, usuário ou reserva..." 
              value={filters.search} 
              onChange={(e) => onChange({ search: e.target.value })}
              className="pl-9"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
