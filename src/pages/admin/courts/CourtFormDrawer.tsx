
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';

const courtSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  type: z.enum(['beach-tennis', 'padel', 'tennis', 'volleyball', 'other'], {
    required_error: 'Selecione o tipo de quadra',
  }),
  description: z.string().optional(),
  image_url: z.string().url('URL inválida').nullable().optional(),
  is_active: z.boolean().default(true),
});

type CourtFormValues = z.infer<typeof courtSchema>;

interface Court {
  id: string;
  name: string;
  type: string;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
}

interface CourtFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  court: Court | null;
  onSubmitSuccess: () => void;
}

export const CourtFormDrawer = ({
  isOpen,
  onClose,
  court,
  onSubmitSuccess,
}: CourtFormDrawerProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CourtFormValues>({
    resolver: zodResolver(courtSchema),
    defaultValues: {
      name: '',
      type: 'tennis',
      description: '',
      image_url: '',
      is_active: true,
    },
  });

  // Reset form when court changes or drawer opens/closes
  useEffect(() => {
    if (isOpen) {
      if (court) {
        form.reset({
          name: court.name,
          type: court.type as CourtFormValues['type'],
          description: court.description || '',
          image_url: court.image_url || '',
          is_active: court.is_active,
        });
      } else {
        form.reset({
          name: '',
          type: 'tennis',
          description: '',
          image_url: '',
          is_active: true,
        });
      }
    }
  }, [court, isOpen, form]);

  const onSubmit = async (data: CourtFormValues) => {
    setIsSubmitting(true);
    try {
      if (court) {
        // Update existing court
        const { error } = await supabase
          .from('courts')
          .update({
            name: data.name,
            type: data.type,
            description: data.description || null,
            image_url: data.image_url || null,
            is_active: data.is_active,
          })
          .eq('id', court.id);

        if (error) throw error;

        toast({
          title: 'Quadra atualizada',
          description: 'As informações da quadra foram atualizadas com sucesso.',
        });
      } else {
        // Create new court
        const { error } = await supabase.from('courts').insert({
          name: data.name,
          type: data.type,
          description: data.description || null,
          image_url: data.image_url || null,
          is_active: data.is_active,
        });

        if (error) throw error;

        toast({
          title: 'Quadra criada',
          description: 'A nova quadra foi cadastrada com sucesso.',
        });
      }

      onSubmitSuccess();
    } catch (error) {
      console.error('Error saving court:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Ocorreu um erro ao salvar a quadra.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent className="h-[85vh] md:max-w-xl mx-auto">
        <DrawerHeader>
          <DrawerTitle>{court ? 'Editar Quadra' : 'Nova Quadra'}</DrawerTitle>
          <DrawerDescription>
            {court
              ? 'Atualize as informações da quadra existente.'
              : 'Preencha os dados para cadastrar uma nova quadra.'}
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 overflow-y-auto flex-1">
          <Form {...form}>
            <form
              id="court-form"
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6 pb-10"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Quadra</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Quadra de Tênis 01" {...field} />
                    </FormControl>
                    <FormDescription>
                      Nome de identificação da quadra ou área
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Quadra</FormLabel>
                    <FormControl>
                      <select
                        className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        {...field}
                      >
                        <option value="beach-tennis">Beach Tennis</option>
                        <option value="padel">Padel</option>
                        <option value="tennis">Tênis</option>
                        <option value="volleyball">Vôlei</option>
                        <option value="other">Outro</option>
                      </select>
                    </FormControl>
                    <FormDescription>
                      Selecione a modalidade da quadra
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descreva detalhes sobre a quadra..."
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormDescription>
                      Informações adicionais como superfície, iluminação, etc.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="image_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL da Imagem</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://exemplo.com/imagem.jpg"
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormDescription>
                      URL da imagem da quadra (opcional)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Quadra Ativa</FormLabel>
                      <FormDescription>
                        Quadras inativas não estarão disponíveis para reserva
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>

        <DrawerFooter>
          <Button
            type="submit"
            form="court-form"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? 'Salvando...'
              : court
              ? 'Atualizar Quadra'
              : 'Cadastrar Quadra'}
          </Button>
          <DrawerClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};
