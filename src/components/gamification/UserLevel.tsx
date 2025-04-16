
import React from 'react';
import { Badge as UIBadge } from '@/components/ui/badge';

type LevelType = 'bronze' | 'silver' | 'gold' | 'legend';

interface UserLevelProps {
  level: LevelType;
  points?: number;
  className?: string;
}

export const UserLevel = ({ level, points, className }: UserLevelProps) => {
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

  const capitalizedLevel = level.charAt(0).toUpperCase() + level.slice(1);

  return (
    <UIBadge 
      className={`${levelColors[level]} px-2 py-0.5 text-xs font-medium ${className}`}
      variant="outline"
    >
      {capitalizedLevel} {levelEmoji[level]} {points !== undefined && `(${points} pts)`}
    </UIBadge>
  );
};
