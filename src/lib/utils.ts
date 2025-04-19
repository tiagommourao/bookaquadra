
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Funções de formatação de data
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '-';
  return format(new Date(date), 'dd/MM/yyyy', { locale: ptBR })
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return '-';
  return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: ptBR })
}

// Função para mapear dias da semana
export function getDayName(dayNumber: number): string {
  const days = [
    'Domingo',
    'Segunda-feira',
    'Terça-feira',
    'Quarta-feira',
    'Quinta-feira',
    'Sexta-feira',
    'Sábado'
  ];
  return days[dayNumber] || '';
}

// Função para formatar modalidade esportiva
export function formatSportName(sportName: string): string {
  const sportIcons: Record<string, string> = {
    'tennis': '🎾 Tênis',
    'padel': '🏓 Padel',
    'beach_tennis': '🏝️ Beach Tennis',
    'squash': '🏸 Squash',
    'Tênis': '🎾 Tênis',
    'Padel': '🏓 Padel',
    'Beach Tennis': '🏝️ Beach Tennis',
    'Squash': '🏸 Squash',
  };
  
  return sportIcons[sportName] || sportName;
}
