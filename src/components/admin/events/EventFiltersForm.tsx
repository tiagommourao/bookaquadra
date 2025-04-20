
import React from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EventFilters } from '@/hooks/admin/useEventsData';
import { useAvailableCourts } from '@/hooks/admin/useEventsData';
import { format } from 'date-fns';

interface EventFiltersFormProps {
  initialFilters?: EventFilters;
  onApplyFilters: (filters: EventFilters) => void;
  onCancel: () => void;
}

export function EventFiltersForm({ initialFilters = {}, onApplyFilters, onCancel }: EventFiltersFormProps) {
  const { data: courts, isLoading: isLoadingCourts } = useAvailableCourts();
  
  const form = useForm<EventFilters>({
    defaultValues: {
      startDate: initialFilters.startDate || '',
      endDate: initialFilters.endDate || '',
      courtId: initialFilters.courtId || '',
      status: initialFilters.status,
      eventType: initialFilters.eventType,
    },
  });

  const handleSubmit = (values: EventFilters) => {
    // Filtrar valores vazios
    const cleanedFilters: EventFilters = {};
    
    if (values.startDate) cleanedFilters.startDate = values.startDate;
    if (values.endDate) cleanedFilters.endDate = values.endDate;
    if (values.courtId) cleanedFilters.courtId = values.courtId;
    if (values.status) cleanedFilters.status = values.status;
    if (values.eventType) cleanedFilters.eventType = values.eventType;
    
    onApplyFilters(cleanedFilters);
  };

  const handleClearFilters = () => {
    form.reset({
      startDate: '',
      endDate: '',
      courtId: '',
      status: undefined,
      eventType: undefined,
    });
    
    onApplyFilters({});
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data Início</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data Fim</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="courtId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quadra</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value || ''}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a quadra" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">Todas as quadras</SelectItem>
                      {courts?.map(court => (
                        <SelectItem key={court.id} value={court.id}>
                          {court.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value || ''}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">Todos os status</SelectItem>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                      <SelectItem value="finished">Finalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="eventType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Evento</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value || ''}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">Todos os tipos</SelectItem>
                      <SelectItem value="tournament">Torneio</SelectItem>
                      <SelectItem value="special_class">Aula Especial</SelectItem>
                      <SelectItem value="day_use">Day Use</SelectItem>
                      <SelectItem value="private_event">Evento Privado</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={handleClearFilters}>
                Limpar filtros
              </Button>
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
              <Button type="submit">
                Aplicar filtros
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
