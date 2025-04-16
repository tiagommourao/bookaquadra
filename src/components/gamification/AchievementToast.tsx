
import React from 'react';
import { Badge } from './Badge';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AchievementToastProps {
  name: string;
  description: string;
  icon: React.ReactNode;
  onCongratulate?: (userId: string) => void;
  userId?: string;
  userName?: string;
}

export const AchievementToast = ({
  name,
  description,
  icon,
  onCongratulate,
  userId,
  userName
}: AchievementToastProps) => {
  const { toast } = useToast();
  
  const handleCongratulate = () => {
    if (onCongratulate && userId) {
      onCongratulate(userId);
      toast({
        description: `Você parabenizou ${userName || 'o usuário'} pela conquista!`,
      });
    }
  };
  
  return (
    <div className="flex items-start gap-4">
      <div className="flex-shrink-0">
        <Badge
          name={name}
          description={description}
          icon={icon}
          size="md"
        />
      </div>
      <div className="flex-1">
        <h4 className="text-sm font-medium">{userName ? `${userName} conquistou` : 'Você conquistou'}</h4>
        <p className="text-sm font-medium text-primary mt-0.5">{name}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
        
        {onCongratulate && userId && (
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2 h-7 text-xs"
            onClick={handleCongratulate}
          >
            <Heart className="h-3 w-3 mr-1" /> Parabenizar
          </Button>
        )}
      </div>
    </div>
  );
};
