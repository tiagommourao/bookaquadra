
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface NextAchievementProps {
  name: string;
  description: string;
  progress: number;
  className?: string;
}

export const NextAchievement = ({ 
  name, 
  description, 
  progress, 
  className 
}: NextAchievementProps) => {
  return (
    <Card className={`bg-primary/5 border border-primary/20 ${className}`}>
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-full">
            <Trophy className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-medium">{name}</h4>
            <p className="text-xs text-muted-foreground">{description}</p>
            <div className="mt-2 space-y-1">
              <Progress value={progress} className="h-1.5" />
              <div className="text-xs text-right text-muted-foreground">{progress}%</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
