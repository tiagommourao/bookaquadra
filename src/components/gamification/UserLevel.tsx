
import React from 'react';
import { Badge as UIBadge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type LevelType = 'bronze' | 'silver' | 'gold' | 'legend';

interface UserLevelProps {
  level: LevelType;
  points?: number;
  className?: string;
  showDetails?: boolean;
}

export const UserLevel = ({ level, points, className, showDetails = false }: UserLevelProps) => {
  const levelEmoji = {
    bronze: '🥉',
    silver: '🥈',
    gold: '🥇',
    legend: '👑',
  };

  const levelColors = {
    bronze: 'bg-amber-100 text-amber-800 border-amber-200',
    silver: 'bg-slate-100 text-slate-800 border-slate-200',
    gold: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    legend: 'bg-purple-100 text-purple-800 border-purple-200',
  };

  const levelRequirements = {
    bronze: '0-499 pontos',
    silver: '500-999 pontos',
    gold: '1000-1499 pontos',
    legend: '1500+ pontos',
  };

  const levelBenefits = {
    bronze: 'Acesso a eventos da comunidade',
    silver: 'Descontos em horários especiais',
    gold: 'Acesso prioritário a reservas',
    legend: 'Eventos exclusivos e surpresas especiais',
  };

  const capitalizedLevel = level.charAt(0).toUpperCase() + level.slice(1);

  if (showDetails) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <UIBadge 
              className={`${levelColors[level]} px-2 py-0.5 text-xs font-medium cursor-help ${className}`}
              variant="outline"
            >
              {capitalizedLevel} {levelEmoji[level]} {points !== undefined && `(${points} pts)`}
            </UIBadge>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="w-64">
            <div className="space-y-1.5">
              <p className="font-medium">{capitalizedLevel} {levelEmoji[level]}</p>
              <p className="text-xs text-muted-foreground">Requisitos: {levelRequirements[level]}</p>
              <p className="text-xs text-muted-foreground">Benefícios: {levelBenefits[level]}</p>
              {points !== undefined && (
                <div className="text-xs">
                  Seus pontos: <span className="font-medium">{points}</span>
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <UIBadge 
      className={`${levelColors[level]} px-2 py-0.5 text-xs font-medium ${className}`}
      variant="outline"
    >
      {capitalizedLevel} {levelEmoji[level]} {points !== undefined && `(${points} pts)`}
    </UIBadge>
  );
};
