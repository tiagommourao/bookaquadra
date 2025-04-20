
import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Court, EventType, EventStatus } from "@/types";
import { useCreateEvent, useEvent, useUpdateEvent } from "@/hooks/admin/useEventsData";
import { ptBR } from "date-fns/locale";

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string | null;
  courts: Court[];
}

// Event form schema
const eventSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  description: z.string().optional(),
  start_datetime: z.date({
    required_error: "Data e hora de início são obrigatórias",
  }),
  end_datetime: z.date({
    required_error: "Data e hora de fim são obrigatórias",
  }),
  event_type: z.enum(['tournament', 'class', 'day_use', 'private'] as const, {
    required_error: "Tipo de evento é obrigatório",
  }),
  status: z.enum(['active', 'inactive', 'completed'] as const, {
    required_error: "Status é obrigatório",
  }),
  registration_fee: z.string().optional(),
  max_capacity: z.string().optional(),
  block_courts: z.boolean().default(true),
  notify_clients: z.boolean().default(false),
  court_ids: z.array(z.string()).min(1, "Selecione pelo menos uma quadra"),
});

type EventFormValues = z.infer<typeof eventSchema>;

export const EventModal: React.FC<EventModalProps> = ({ isOpen, onClose, eventId, courts }) => {
  const [startDatetime, setStartDatetime] = useState<Date | undefined>();
  const [endDatetime, setEndDatetime] = useState<Date | undefined>();
  const { data: event, isLoading: isLoadingEvent } = useEvent(eventId);
  const { mutate: createEvent, isPending: isCreating } = useCreateEvent();
  const { mutate: updateEvent, isPending: isUpdating } = useUpdateEvent();

  const isLoading = isLoadingEvent || isCreating || isUpdating;
  const isEdit = !!eventId;

  // Form setup
  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      name: "",
      description: "",
      event_type: "tournament" as EventType,
      status: "active" as EventStatus,
      block_courts: true,
      notify_clients: false,
      court_ids: [],
    }
  });

  // Handle form submission
  const onSubmit = (values: EventFormValues) => {
    const eventData = {
      name: values.name,
      description: values.description || "",
      start_datetime: values.start_datetime.toISOString(),
      end_datetime: values.end_datetime.toISOString(),
      event_type: values.event_type,
      status: values.status,
      registration_fee: values.registration_fee ? parseFloat(values.registration_fee) : undefined,
      max_capacity: values.max_capacity ? parseInt(values.max_capacity, 10) : undefined,
      block_courts: values.block_courts,
      notify_clients: values.notify_clients,
    };

    if (isEdit && eventId) {
      updateEvent(
        {
          eventId,
          event: eventData,
          courtIds: values.court_ids,
        },
        {
          onSuccess: onClose,
        }
      );
    } else {
      createEvent(
        {
          event: eventData as Omit<Event, 'id' | 'created_at' | 'updated_at'>,
          courtIds: values.court_ids,
        },
        {
          onSuccess: onClose,
        }
      );
    }
  };

  // Load event data when editing
  useEffect(() => {
    if (event && isEdit) {
      // Set start and end datetime for the time picker inputs
      const startDate = new Date(event.start_datetime);
      const endDate = new Date(event.end_datetime);
      
      setStartDatetime(startDate);
      setEndDatetime(endDate);
      
      const courtIds = event.events_courts?.map((ec: any) => ec.court_id) || [];
      
      form.reset({
        name: event.name,
        description: event.description || "",
        start_datetime: startDate,
        end_datetime: endDate,
        event_type: event.event_type as EventType,
        status: event.status as EventStatus,
        registration_fee: event.registration_fee?.toString() || "",
        max_capacity: event.max_capacity?.toString() || "",
        block_courts: event.block_courts,
        notify_clients: event.notify_clients,
        court_ids: courtIds,
      });
    } else {
      form.reset({
        name: "",
        description: "",
        event_type: "tournament" as EventType,
        status: "active" as EventStatus,
        block_courts: true,
        notify_clients: false,
        court_ids: [],
      });
      setStartDatetime(undefined);
      setEndDatetime(undefined);
    }
  }, [event, isEdit, form]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar Evento" : "Criar Novo Evento"}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Evento</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Digite o nome do evento" 
                        disabled={isLoading}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Event Type */}
              <FormField
                control={form.control}
                name="event_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Evento</FormLabel>
                    <Select
                      disabled={isLoading}
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="tournament">Torneio</SelectItem>
                        <SelectItem value="class">Aula Especial</SelectItem>
                        <SelectItem value="day_use">Day Use</SelectItem>
                        <SelectItem value="private">Evento Privado</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descreva os detalhes do evento"
                      disabled={isLoading}
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Start Datetime */}
              <FormField
                control={form.control}
                name="start_datetime"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data e Hora de Início</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                            disabled={isLoading}
                          >
                            {field.value ? (
                              format(field.value, "PPP HH:mm", {
                                locale: ptBR,
                              })
                            ) : (
                              <span>Selecione a data e hora</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(date) => {
                            if (date) {
                              const newDate = new Date(date);
                              if (startDatetime) {
                                newDate.setHours(startDatetime.getHours());
                                newDate.setMinutes(startDatetime.getMinutes());
                              }
                              field.onChange(newDate);
                              setStartDatetime(newDate);
                            }
                          }}
                          disabled={isLoading}
                          initialFocus
                          locale={ptBR}
                        />
                        <div className="p-3 border-t border-border">
                          <Input
                            type="time"
                            value={startDatetime ? format(startDatetime, "HH:mm") : ""}
                            onChange={(e) => {
                              const [hours, minutes] = e.target.value.split(":");
                              const newDate = field.value ? new Date(field.value) : new Date();
                              newDate.setHours(parseInt(hours, 10));
                              newDate.setMinutes(parseInt(minutes, 10));
                              field.onChange(newDate);
                              setStartDatetime(newDate);
                            }}
                            disabled={isLoading}
                          />
                        </div>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* End Datetime */}
              <FormField
                control={form.control}
                name="end_datetime"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data e Hora de Término</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                            disabled={isLoading}
                          >
                            {field.value ? (
                              format(field.value, "PPP HH:mm", {
                                locale: ptBR,
                              })
                            ) : (
                              <span>Selecione a data e hora</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(date) => {
                            if (date) {
                              const newDate = new Date(date);
                              if (endDatetime) {
                                newDate.setHours(endDatetime.getHours());
                                newDate.setMinutes(endDatetime.getMinutes());
                              }
                              field.onChange(newDate);
                              setEndDatetime(newDate);
                            }
                          }}
                          disabled={isLoading}
                          initialFocus
                          locale={ptBR}
                        />
                        <div className="p-3 border-t border-border">
                          <Input
                            type="time"
                            value={endDatetime ? format(endDatetime, "HH:mm") : ""}
                            onChange={(e) => {
                              const [hours, minutes] = e.target.value.split(":");
                              const newDate = field.value ? new Date(field.value) : new Date();
                              newDate.setHours(parseInt(hours, 10));
                              newDate.setMinutes(parseInt(minutes, 10));
                              field.onChange(newDate);
                              setEndDatetime(newDate);
                            }}
                            disabled={isLoading}
                          />
                        </div>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Registration Fee */}
              <FormField
                control={form.control}
                name="registration_fee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor da Inscrição (R$)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        min="0"
                        placeholder="0,00" 
                        disabled={isLoading}
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>Deixe em branco se for gratuito</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Max Capacity */}
              <FormField
                control={form.control}
                name="max_capacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Capacidade Máxima</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1"
                        placeholder="Ilimitado" 
                        disabled={isLoading}
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>Deixe em branco se for ilimitado</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Court Selection */}
            <FormField
              control={form.control}
              name="court_ids"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quadras Utilizadas</FormLabel>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                    {courts.map((court) => (
                      <FormItem
                        key={court.id}
                        className="flex flex-row items-start space-x-3 space-y-0"
                      >
                        <FormControl>
                          <Checkbox
                            disabled={isLoading}
                            checked={field.value?.includes(court.id)}
                            onCheckedChange={(checked) => {
                              const currentValue = [...(field.value || [])];
                              if (checked) {
                                field.onChange([...currentValue, court.id]);
                              } else {
                                field.onChange(
                                  currentValue.filter((id) => id !== court.id)
                                );
                              }
                            }}
                          />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">
                          {court.name}
                        </FormLabel>
                      </FormItem>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Status */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      disabled={isLoading}
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Ativo</SelectItem>
                        <SelectItem value="inactive">Inativo</SelectItem>
                        <SelectItem value="completed">Finalizado</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Banner URL - Can be implemented later with file upload */}
              <FormItem>
                <FormLabel>Banner URL (Opcional)</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="URL da imagem do banner" 
                    disabled={true}
                    value=""
                  />
                </FormControl>
                <FormDescription>Upload de imagens será implementado em breve</FormDescription>
              </FormItem>
            </div>

            <div className="space-y-4">
              {/* Block Courts */}
              <FormField
                control={form.control}
                name="block_courts"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Bloquear quadras para reservas comuns durante o evento
                      </FormLabel>
                      <FormDescription>
                        Quando ativado, as quadras selecionadas ficarão indisponíveis para reservas normais durante o período do evento
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              {/* Notify Clients */}
              <FormField
                control={form.control}
                name="notify_clients"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Notificar clientes sobre este evento
                      </FormLabel>
                      <FormDescription>
                        Enviar notificações aos clientes sobre a criação ou alteração deste evento
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Salvando..." : isEdit ? "Salvar Alterações" : "Criar Evento"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
