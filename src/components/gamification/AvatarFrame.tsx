
import React from 'react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

type FrameType = 'none' | 'bronze' | 'silver' | 'gold' | 'legend';

interface AvatarFrameProps {
  src?: string;
  fallback: string;
  frameType: FrameType;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const AvatarFrame = ({
  src,
  fallback,
  frameType = 'none',
  size = 'md',
  className,
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
  };

  return (
    <div className={cn('relative inline-block', className)}>
      <Avatar className={cn(
        sizeClasses[size],
        frameStyles[frameType],
        'ring-offset-background ring-offset-2'
      )}>
        <AvatarImage src={src} alt={fallback} />
        <AvatarFallback>{fallback.charAt(0)}</AvatarFallback>
      </Avatar>
      
      {frameType === 'legend' && (
        <div className="absolute -bottom-1 -right-1 bg-purple-500 text-white rounded-full p-0.5 text-xs border-2 border-white">
          👑
        </div>
      )}
    </div>
  );
};
