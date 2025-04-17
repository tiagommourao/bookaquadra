
import React from 'react';
import { FileDown, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

interface PaymentsHeaderProps {
  onExport: (format: 'csv' | 'excel') => void;
}

export const PaymentsHeader: React.FC<PaymentsHeaderProps> = ({ onExport }) => {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Gerenciamento de Pagamentos</h1>
        <p className="text-muted-foreground">
          Visualize, filtre e gerencie os pagamentos do sistema.
        </p>
      </div>
      
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <FileDown className="mr-2 h-4 w-4" />
              Exportar
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onExport('csv')}>
              <FileDown className="mr-2 h-4 w-4" />
              Exportar como CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onExport('excel')}>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Exportar como Excel
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};
