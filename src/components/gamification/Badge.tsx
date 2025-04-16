
import React from 'react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface BadgeProps {
  name: string;
  icon: React.ReactNode;
  description: string;
  isEarned?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Badge = ({
  name,
  icon,
  description,
  isEarned = true,
  size = 'md',
  className,
}: BadgeProps) => {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'flex items-center justify-center rounded-full',
              isEarned ? 'bg-primary/10 text-primary' : 'bg-gray-200 text-gray-400',
              sizeClasses[size],
              className
            )}
          >
            {icon}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top">
          <div className="text-center">
            <p className="font-medium">{name}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
