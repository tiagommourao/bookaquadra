
import React, { useState } from 'react';
import { Trophy, Award, Medal, Star, Zap, Activity, ThumbsUp, Map, Users, Calendar, Sparkles } from 'lucide-react';
import { Badge } from './Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface BadgeType {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  isEarned: boolean;
  isNew?: boolean;
  isSeasonal?: boolean;
  category: 'attendance' | 'social' | 'sports' | 'special' | 'location';
  earnedDate?: string;
}

interface BadgesGridProps {
  badges?: BadgeType[];
  maxDisplay?: number;
  showCategories?: boolean;
  smallTitle?: string;
}

export const BadgesGrid = ({ 
  badges: propBadges, 
  maxDisplay = 6, 
  showCategories = false,
  smallTitle 
}: BadgesGridProps) => {
  // Default badges if none provided
  const defaultBadges: BadgeType[] = [
    { 
      id: '1', 
      name: 'Fair Play', 
      description: 'Recebeu 5 avaliações positivas', 
      icon: <ThumbsUp className="h-5 w-5" />,
      isEarned: true,
      category: 'social'
    },
    { 
      id: '2', 
      name: '10 Jogos', 
      description: 'Completou 10 reservas', 
      icon: <Award className="h-5 w-5" />,
      isEarned: true,
      category: 'attendance'
    },
    { 
      id: '3', 
      name: 'Padelista Pro', 
      description: 'Jogou padel 5 vezes', 
      icon: <Trophy className="h-5 w-5" />,
      isEarned: false,
      category: 'sports'
    },
    { 
      id: '4', 
      name: 'Madrugador', 
      description: '3 jogos antes das 8h', 
      icon: <Zap className="h-5 w-5" />,
      isEarned: false,
      category: 'attendance'
    },
    { 
      id: '5', 
      name: 'Fidelidade', 
      description: 'Reservou 3 meses seguidos', 
      icon: <Star className="h-5 w-5" />,
      isEarned: true,
      category: 'attendance',
      earnedDate: '15/03/2025'
    },
    { 
      id: '6', 
      name: 'Multi-esporte', 
      description: 'Jogou 3 modalidades diferentes', 
      icon: <Activity className="h-5 w-5" />,
      isEarned: false,
      category: 'sports'
    },
    { 
      id: '7', 
      name: 'Explorador', 
      description: 'Jogou em 5 quadras diferentes', 
      icon: <Medal className="h-5 w-5" />,
      isEarned: true,
      category: 'location'
    },
    { 
      id: '8', 
      name: 'Aniversário 2025', 
      description: 'Jogou no aniversário do clube', 
      icon: <Calendar className="h-5 w-5" />,
      isEarned: true,
      isNew: true,
      isSeasonal: true,
      category: 'special',
      earnedDate: '10/04/2025'
    },
    { 
      id: '9', 
      name: 'Primeiro Jogo 2025', 
      description: 'Primeira partida do ano', 
      icon: <Sparkles className="h-5 w-5" />,
      isEarned: true,
      isSeasonal: true,
      category: 'special',
      earnedDate: '05/01/2025'
    }
  ];

  const badges = propBadges || defaultBadges;
  const earnedBadges = badges.filter(badge => badge.isEarned).length;
  const totalBadges = badges.length;
  
  // Get unique categories
  const categories = [...new Set(badges.map(badge => badge.category))];
  
  if (showCategories && categories.length > 1) {
    return (
      <div className="space-y-4">
        {smallTitle && (
          <h3 className="text-sm font-medium text-muted-foreground mb-2">{smallTitle}</h3>
        )}
        
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="all">Todas ({badges.length})</TabsTrigger>
            {categories.includes('special') && (
              <TabsTrigger value="special">Especiais</TabsTrigger>
            )}
            <TabsTrigger value="earned">Conquistadas ({earnedBadges})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            <div className="grid grid-cols-4 gap-2">
              {badges.slice(0, maxDisplay).map((badge) => (
                <div key={badge.id} className="flex flex-col items-center">
                  <Badge
                    name={badge.name}
                    icon={badge.icon}
                    description={badge.description}
                    isEarned={badge.isEarned}
                    isNew={badge.isNew}
                    isSeasonal={badge.isSeasonal}
                    category={badge.category}
                    earnedDate={badge.earnedDate}
                    size="md"
                  />
                </div>
              ))}
            </div>
            {totalBadges > maxDisplay && (
              <div className="text-center text-xs text-muted-foreground mt-2">
                Mostrando {Math.min(maxDisplay, badges.length)} de {totalBadges} conquistas
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="special">
            <div className="grid grid-cols-4 gap-2">
              {badges
                .filter(badge => badge.category === 'special')
                .map((badge) => (
                  <div key={badge.id} className="flex flex-col items-center">
                    <Badge
                      name={badge.name}
                      icon={badge.icon}
                      description={badge.description}
                      isEarned={badge.isEarned}
                      isNew={badge.isNew}
                      isSeasonal={badge.isSeasonal}
                      category={badge.category}
                      earnedDate={badge.earnedDate}
                      size="md"
                    />
                  </div>
                ))}
            </div>
          </TabsContent>
          
          <TabsContent value="earned">
            <div className="grid grid-cols-4 gap-2">
              {badges
                .filter(badge => badge.isEarned)
                .slice(0, maxDisplay)
                .map((badge) => (
                  <div key={badge.id} className="flex flex-col items-center">
                    <Badge
                      name={badge.name}
                      icon={badge.icon}
                      description={badge.description}
                      isEarned={true}
                      isNew={badge.isNew}
                      isSeasonal={badge.isSeasonal}
                      category={badge.category}
                      earnedDate={badge.earnedDate}
                      size="md"
                    />
                  </div>
                ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {smallTitle && (
        <h3 className="text-sm font-medium text-muted-foreground mb-2">{smallTitle}</h3>
      )}
      
      <div className="grid grid-cols-4 gap-2">
        {badges.slice(0, maxDisplay).map((badge) => (
          <div key={badge.id} className="flex flex-col items-center">
            <Badge
              name={badge.name}
              icon={badge.icon}
              description={badge.description}
              isEarned={badge.isEarned}
              isNew={badge.isNew}
              isSeasonal={badge.isSeasonal}
              category={badge.category}
              earnedDate={badge.earnedDate}
              size="md"
            />
          </div>
        ))}
      </div>
      
      {totalBadges > maxDisplay && (
        <div className="text-center text-xs text-muted-foreground">
          Mostrando {Math.min(maxDisplay, badges.length)} de {totalBadges} conquistas ({earnedBadges} desbloqueadas)
        </div>
      )}
    </div>
  );
};
