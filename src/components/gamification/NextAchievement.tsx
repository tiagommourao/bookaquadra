
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

interface NextAchievementProps {
  name: string;
  description: string;
  progress: number;
  className?: string;
  onShare?: () => void;
}

export const NextAchievement = ({ 
  name, 
  description, 
  progress, 
  className,
  onShare
}: NextAchievementProps) => {
  const { toast } = useToast();
  
  const handleShare = () => {
    if (onShare) {
      onShare();
    } else {
      // Fallback if no share handler provided
      toast({
        title: "Compartilhado!",
        description: `Você compartilhou seu progresso na conquista ${name}`,
      });
    }
  };

  // Dynamic styling based on progress
  const getProgressColor = () => {
    if (progress >= 75) return "bg-green-500";
    if (progress >= 50) return "bg-blue-500";
    if (progress >= 25) return "bg-yellow-500";
    return "bg-primary";
  };

  const isNearlyComplete = progress >= 75;

  return (
    <Card className={cn(
      isNearlyComplete ? "bg-green-50 border-green-200" : "bg-primary/5 border border-primary/20",
      className
    )}>
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2 rounded-full",
            isNearlyComplete ? "bg-green-100" : "bg-primary/10" 
          )}>
            <Trophy className={cn(
              "h-4 w-4",
              isNearlyComplete ? "text-green-600" : "text-primary"
            )} />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-medium">{name}</h4>
            <p className="text-xs text-muted-foreground">{description}</p>
            <div className="mt-2 space-y-1">
              <Progress 
                value={progress} 
                className={cn(
                  "h-1.5",
                  progress >= 75 && "bg-green-200",
                  progress >= 50 && progress < 75 && "bg-blue-200",
                  progress >= 25 && progress < 50 && "bg-yellow-200"
                )}
                indicatorClassName={getProgressColor()}
              />
              <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">{progress}%</div>
                
                {progress > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 text-xs px-2"
                    onClick={handleShare}
                  >
                    Compartilhar
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
