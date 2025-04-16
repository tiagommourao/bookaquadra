
import React from 'react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';

interface BadgeProps {
  name: string;
  icon: React.ReactNode;
  description: string;
  isEarned?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  isNew?: boolean;
  isSeasonal?: boolean;
  category?: 'attendance' | 'social' | 'sports' | 'special' | 'location';
  earnedDate?: string;
}

export const Badge = ({
  name,
  icon,
  description,
  isEarned = true,
  size = 'md',
  className,
  isNew = false,
  isSeasonal = false,
  category,
  earnedDate,
}: BadgeProps) => {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
  };

  const categoryColors = {
    attendance: 'bg-blue-50 border-blue-100',
    social: 'bg-green-50 border-green-100',
    sports: 'bg-amber-50 border-amber-100',
    special: 'bg-purple-50 border-purple-100',
    location: 'bg-orange-50 border-orange-100',
  };

  const { toast } = useToast();

  // If this badge is newly earned, show a toast notification
  React.useEffect(() => {
    if (isNew && isEarned) {
      toast({
        title: "🎉 Nova conquista desbloqueada!",
        description: `Parabéns! Você ganhou o badge ${name}.`,
        duration: 5000,
      });
    }
  }, [isNew, isEarned, name, toast]);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'flex items-center justify-center rounded-full relative',
              isEarned 
                ? category 
                  ? `${categoryColors[category]} text-foreground border`
                  : 'bg-primary/10 text-primary'
                : 'bg-gray-200 text-gray-400',
              sizeClasses[size],
              className
            )}
          >
            {icon}
            {isSeasonal && isEarned && (
              <div className="absolute -top-1 -right-1 bg-red-500 w-3 h-3 rounded-full border border-white"></div>
            )}
            {isNew && isEarned && (
              <div className="absolute -top-1 -right-1 bg-yellow-400 text-xs text-white rounded-full h-4 w-4 flex items-center justify-center border border-white">
                ✨
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="w-52">
          <div className="text-center space-y-1">
            <p className="font-medium">{name}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
            {earnedDate && isEarned && (
              <p className="text-xs text-primary font-medium">Conquistado em: {earnedDate}</p>
            )}
            {isSeasonal && isEarned && (
              <p className="text-xs bg-red-50 text-red-600 rounded px-1 py-0.5 inline-block">Edição Limitada</p>
            )}
            {!isEarned && (
              <p className="text-xs italic">Complete os requisitos para desbloquear</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
