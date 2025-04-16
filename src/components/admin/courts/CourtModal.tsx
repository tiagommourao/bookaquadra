
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { Court, CourtType } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

const formSchema = z.object({
  name: z.string().min(3, { message: 'Nome deve ter pelo menos 3 caracteres' }),
  type_id: z.string().uuid({ message: 'Selecione um tipo de quadra válido' }),
  description: z.string().optional(),
  surface_type: z.string().optional(),
  is_active: z.boolean().default(true),
  has_cover: z.boolean().default(false),
  has_lighting: z.boolean().default(false),
  maintenance_info: z.string().optional(),
  location_info: z.string().optional(),
  dimensions: z.string().optional(),
  capacity: z.coerce.number().optional(),
  accessibility_features: z.string().optional()
});

type CourtFormValues = z.infer<typeof formSchema>;

interface CourtModalProps {
  court: Court | null;
  isOpen: boolean;
  onClose: () => void;
}

export const CourtModal: React.FC<CourtModalProps> = ({
  court,
  isOpen,
  onClose
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch court types
  const { data: courtTypes } = useQuery({
    queryKey: ['courtTypes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('court_types')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as unknown as CourtType[];
    }
  });

  const form = useForm<CourtFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      type_id: '',
      description: '',
      surface_type: '',
      is_active: true,
      has_cover: false,
      has_lighting: false,
      maintenance_info: '',
      location_info: '',
      dimensions: '',
      capacity: undefined,
      accessibility_features: ''
    }
  });

  useEffect(() => {
    if (court) {
      form.reset({
        name: court.name,
        type_id: court.type_id,
        description: court.description || '',
        surface_type: court.surface_type || '',
        is_active: court.is_active,
        has_cover: court.has_cover,
        has_lighting: court.has_lighting,
        maintenance_info: court.maintenance_info || '',
        location_info: court.location_info || '',
        dimensions: court.dimensions || '',
        capacity: court.capacity || undefined,
        accessibility_features: court.accessibility_features || ''
      });
    } else {
      form.reset({
        name: '',
        type_id: '',
        description: '',
        surface_type: '',
        is_active: true,
        has_cover: false,
        has_lighting: false,
        maintenance_info: '',
        location_info: '',
        dimensions: '',
        capacity: undefined,
        accessibility_features: ''
      });
    }
  }, [court, form]);

  const onSubmit = async (values: CourtFormValues) => {
    setIsSubmitting(true);
    
    try {
      if (court) {
        // Update court
        const { error } = await supabase
          .from('courts')
          .update({
            name: values.name,
            type_id: values.type_id,
            description: values.description,
            surface_type: values.surface_type,
            is_active: values.is_active,
            has_cover: values.has_cover,
            has_lighting: values.has_lighting,
            maintenance_info: values.maintenance_info,
            location_info: values.location_info,
            dimensions: values.dimensions,
            capacity: values.capacity,
            accessibility_features: values.accessibility_features
          })
          .eq('id', court.id);
        
        if (error) throw error;
        
        toast({
          title: 'Quadra atualizada',
          description: 'A quadra foi atualizada com sucesso',
        });
      } else {
        // Create court
        const { error } = await supabase
          .from('courts')
          .insert({
            name: values.name,
            type_id: values.type_id,
            description: values.description,
            surface_type: values.surface_type,
            is_active: values.is_active,
            has_cover: values.has_cover,
            has_lighting: values.has_lighting,
            maintenance_info: values.maintenance_info,
            location_info: values.location_info,
            dimensions: values.dimensions,
            capacity: values.capacity,
            accessibility_features: values.accessibility_features
          });
        
        if (error) throw error;
        
        toast({
          title: 'Quadra criada',
          description: 'A quadra foi criada com sucesso',
        });
      }
      
      onClose();
    } catch (error) {
      console.error('Erro ao salvar quadra:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar a quadra',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {court ? 'Editar Quadra' : 'Nova Quadra'}
          </DialogTitle>
          <DialogDescription>
            {court
              ? 'Edite os detalhes da quadra selecionada'
              : 'Adicione uma nova quadra ao sistema'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome da quadra" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Quadra</FormLabel>
                    <Select 
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {courtTypes?.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Descrição da quadra" 
                        className="resize-none" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="surface_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Superfície</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Saibro, Cimento, Sintético" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dimensions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dimensões</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: 10m x 20m" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="capacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Capacidade</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Número de pessoas" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location_info"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Localização</FormLabel>
                    <FormControl>
                      <Input placeholder="Informações sobre localização" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="col-span-2 grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Ativa</FormLabel>
                        <FormDescription>
                          Quadra disponível para reservas
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="has_cover"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Cobertura</FormLabel>
                        <FormDescription>
                          Quadra possui cobertura
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="has_lighting"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Iluminação</FormLabel>
                        <FormDescription>
                          Quadra possui iluminação
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Salvando...' : court ? 'Atualizar' : 'Criar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
