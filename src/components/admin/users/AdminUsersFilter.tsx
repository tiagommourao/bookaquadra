import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateRange } from "react-day-picker";

export interface AdminUsersFilterProps {
  onClose?: () => void;
  onApply?: (filters: any) => void;
}

export const AdminUsersFilter: React.FC<AdminUsersFilterProps> = ({
  onClose = () => {},
  onApply = () => {}
}) => {
  const [sportFilters, setSportFilters] = useState<string[]>([]);
  const [levelFilters, setLevelFilters] = useState<string[]>([]);
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  
  // Toggle filter selection
  const toggleFilter = (filter: string, currentFilters: string[], setFilters: React.Dispatch<React.SetStateAction<string[]>>) => {
    if (currentFilters.includes(filter)) {
      setFilters(currentFilters.filter(f => f !== filter));
    } else {
      setFilters([...currentFilters, filter]);
    }
  };
  
  // Handle Apply Filters
  const handleApplyFilters = () => {
    onApply({
      sports: sportFilters,
      levels: levelFilters,
      statuses: statusFilters,
      dateRange,
    });
    onClose();
  };
  
  // Clear all filters
  const handleClearFilters = () => {
    setSportFilters([]);
    setLevelFilters([]);
    setStatusFilters([]);
    setDateRange(undefined);
  };
  
  return (
    <Card className="w-full max-w-4xl">
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Sports filter */}
          <div>
            <h4 className="font-medium text-sm mb-2">Modalidades</h4>
            <div className="flex flex-wrap gap-2">
              {['tennis', 'padel', 'beach'].map(sport => {
                const isActive = sportFilters.includes(sport);
                const sportEmoji = sport === 'tennis' ? '🎾' : sport === 'padel' ? '🏓' : '🏝️';
                const sportLabel = sport === 'tennis' ? 'Tênis' : sport === 'padel' ? 'Padel' : 'Beach Tennis';
                
                return (
                  <Badge 
                    key={sport}
                    variant={isActive ? "default" : "outline"}
                    className={`cursor-pointer ${isActive ? '' : 'hover:bg-accent'}`}
                    onClick={() => toggleFilter(sport, sportFilters, setSportFilters)}
                  >
                    {sportEmoji} {sportLabel}
                  </Badge>
                );
              })}
            </div>
          </div>
          
          {/* Levels filter */}
          <div>
            <h4 className="font-medium text-sm mb-2">Nível</h4>
            <div className="flex flex-wrap gap-2">
              {['bronze', 'silver', 'gold', 'legend'].map(level => {
                const isActive = levelFilters.includes(level);
                const levelEmoji = level === 'bronze' ? '🥉' : level === 'silver' ? '🥈' : level === 'gold' ? '🥇' : '👑';
                
                return (
                  <Badge 
                    key={level}
                    variant={isActive ? "default" : "outline"}
                    className={`cursor-pointer ${isActive ? '' : 'hover:bg-accent'}`}
                    onClick={() => toggleFilter(level, levelFilters, setLevelFilters)}
                  >
                    {levelEmoji} {level.charAt(0).toUpperCase() + level.slice(1)}
                  </Badge>
                );
              })}
            </div>
          </div>
          
          {/* Status filter */}
          <div>
            <h4 className="font-medium text-sm mb-2">Status</h4>
            <div className="flex flex-wrap gap-2">
              {['active', 'blocked', 'suspended', 'admin'].map(status => {
                const isActive = statusFilters.includes(status);
                const statusLabel = status === 'active' ? 'Ativo' : 
                                  status === 'blocked' ? 'Bloqueado' : 
                                  status === 'suspended' ? 'Suspenso' : 'Admins';
                                  
                const statusColor = status === 'active' ? 'bg-green-100 text-green-800 border-green-200' :
                                  status === 'blocked' ? 'bg-red-100 text-red-800 border-red-200' :
                                  status === 'suspended' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                                  'bg-blue-100 text-blue-800 border-blue-200';
                
                return (
                  <Badge 
                    key={status}
                    variant="outline"
                    className={`cursor-pointer ${isActive ? statusColor : 'hover:bg-accent'}`}
                    onClick={() => toggleFilter(status, statusFilters, setStatusFilters)}
                  >
                    {statusLabel}
                  </Badge>
                );
              })}
            </div>
          </div>
          
          {/* Date Range filter */}
          <div>
            <h4 className="font-medium text-sm mb-2">Data de Cadastro</h4>
            <Select>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione o período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">Últimos 7 dias</SelectItem>
                <SelectItem value="30days">Últimos 30 dias</SelectItem>
                <SelectItem value="90days">Últimos 90 dias</SelectItem>
                <SelectItem value="thisyear">Este ano</SelectItem>
                <SelectItem value="custom">Período personalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Separator className="my-4" />
        
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Switch id="only-active" />
              <Label htmlFor="only-active">Exibir apenas usuários ativos</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="with-reservations" />
              <Label htmlFor="with-reservations">Com reservas ativas</Label>
            </div>
          </div>
          
          <div className="space-x-2">
            <Button variant="outline" onClick={handleClearFilters}>
              Limpar Filtros
            </Button>
            <Button onClick={handleApplyFilters}>
              Aplicar Filtros
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
