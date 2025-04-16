
import React from 'react';
import { Trophy, Award, Medal, Star, Zap, Activity, ThumbsUp } from 'lucide-react';
import { Badge } from './Badge';

interface BadgeType {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  isEarned: boolean;
}

interface BadgesGridProps {
  badges?: BadgeType[];
  maxDisplay?: number;
}

export const BadgesGrid = ({ badges: propBadges, maxDisplay = 6 }: BadgesGridProps) => {
  // Default badges if none provided
  const defaultBadges: BadgeType[] = [
    { 
      id: '1', 
      name: 'Fair Play', 
      description: 'Recebeu 5 avaliações positivas', 
      icon: <ThumbsUp className="h-5 w-5" />,
      isEarned: true
    },
    { 
      id: '2', 
      name: '10 Jogos', 
      description: 'Completou 10 reservas', 
      icon: <Award className="h-5 w-5" />,
      isEarned: true
    },
    { 
      id: '3', 
      name: 'Padelista Pro', 
      description: 'Jogou padel 5 vezes', 
      icon: <Trophy className="h-5 w-5" />,
      isEarned: false
    },
    { 
      id: '4', 
      name: 'Madrugador', 
      description: '3 jogos antes das 8h', 
      icon: <Zap className="h-5 w-5" />,
      isEarned: false
    },
    { 
      id: '5', 
      name: 'Fidelidade', 
      description: 'Reservou 3 meses seguidos', 
      icon: <Star className="h-5 w-5" />,
      isEarned: true
    },
    { 
      id: '6', 
      name: 'Multi-esporte', 
      description: 'Jogou 3 modalidades diferentes', 
      icon: <Activity className="h-5 w-5" />,
      isEarned: false
    },
    { 
      id: '7', 
      name: 'Explorador', 
      description: 'Jogou em 5 quadras diferentes', 
      icon: <Medal className="h-5 w-5" />,
      isEarned: true
    }
  ];

  const badges = propBadges || defaultBadges;
  const displayBadges = badges.slice(0, maxDisplay);
  const earnedBadges = badges.filter(badge => badge.isEarned).length;
  const totalBadges = badges.length;

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-4 gap-2">
        {displayBadges.map((badge) => (
          <div key={badge.id} className="flex flex-col items-center">
            <Badge
              name={badge.name}
              icon={badge.icon}
              description={badge.description}
              isEarned={badge.isEarned}
              size="md"
            />
          </div>
        ))}
      </div>
      
      {totalBadges > maxDisplay && (
        <div className="text-center text-xs text-muted-foreground">
          Mostrando {displayBadges.length} de {totalBadges} conquistas ({earnedBadges} desbloqueadas)
        </div>
      )}
    </div>
  );
};
