
import React from 'react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type FrameType = 'none' | 'bronze' | 'silver' | 'gold' | 'legend' | 'tennis' | 'padel' | 'beach' | 'special';

interface AvatarFrameProps {
  src?: string;
  fallback: string;
  frameType: FrameType;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showTooltip?: boolean;
}

export const AvatarFrame = ({
  src,
  fallback,
  frameType = 'none',
  size = 'md',
  className,
  showTooltip = false,
}: AvatarFrameProps) => {
  const sizeClasses = {
    sm: 'h-10 w-10',
    md: 'h-16 w-16',
    lg: 'h-20 w-20',
    xl: 'h-24 w-24',
  };

  const frameStyles = {
    none: '',
    bronze: 'ring-amber-400 ring-2',
    silver: 'ring-slate-400 ring-2',
    gold: 'ring-yellow-400 ring-2',
    legend: 'ring-purple-500 ring-[3px]',
    tennis: 'ring-green-500 ring-2',
    padel: 'ring-blue-500 ring-2',
    beach: 'ring-orange-500 ring-2',
    special: 'ring-gradient-to-r from-pink-500 via-purple-500 to-blue-500 ring-[3px]',
  };

  const frameTitles = {
    none: 'Sem moldura',
    bronze: 'Moldura Bronze',
    silver: 'Moldura Prata',
    gold: 'Moldura Ouro',
    legend: 'Moldura Lenda',
    tennis: 'Moldura Tênis',
    padel: 'Moldura Padel',
    beach: 'Moldura Beach Tennis',
    special: 'Moldura Edição Especial',
  };

  const frameDescriptions = {
    none: 'Sem moldura',
    bronze: 'Conquista o nível Bronze',
    silver: 'Conquista o nível Prata',
    gold: 'Conquista o nível Ouro',
    legend: 'Conquista o nível Lenda',
    tennis: 'Jogue 10 partidas de tênis',
    padel: 'Jogue 10 partidas de padel',
    beach: 'Jogue 10 partidas de beach tennis',
    special: 'Edição limitada sazonal',
  };
  
  // Special styles for the avatar badge depending on frame type
  const badgeIcon = frameType === 'legend' ? '👑' :
                    frameType === 'padel' ? '🏓' :
                    frameType === 'tennis' ? '🎾' :
                    frameType === 'beach' ? '🏝️' :
                    frameType === 'special' ? '🌟' : null;
  
  const badgeColor = frameType === 'legend' ? 'bg-purple-500' :
                     frameType === 'padel' ? 'bg-blue-500' :
                     frameType === 'tennis' ? 'bg-green-500' :
                     frameType === 'beach' ? 'bg-orange-500' :
                     frameType === 'special' ? 'bg-pink-500' : null;

  const avatar = (
    <Avatar className={cn(
      sizeClasses[size],
      frameStyles[frameType],
      'ring-offset-background ring-offset-2'
    )}>
      <AvatarImage src={src} alt={fallback} />
      <AvatarFallback>{fallback.charAt(0)}</AvatarFallback>
    </Avatar>
  );

  const avatarWithBadge = (
    <div className="relative inline-block">
      {avatar}
      {badgeIcon && (
        <div className={`absolute -bottom-1 -right-1 ${badgeColor} text-white rounded-full p-0.5 text-xs border-2 border-white`}>
          {badgeIcon}
        </div>
      )}
    </div>
  );

  if (showTooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn('relative inline-block', className)}>
              {badgeIcon ? avatarWithBadge : avatar}
            </div>
          </TooltipTrigger>
          <TooltipContent side="top">
            <div className="text-center">
              <p className="font-medium">{frameTitles[frameType]}</p>
              <p className="text-xs text-muted-foreground">{frameDescriptions[frameType]}</p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className={cn('relative inline-block', className)}>
      {badgeIcon ? avatarWithBadge : avatar}
    </div>
  );
};
