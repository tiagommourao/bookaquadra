
import React from 'react';
import { AvatarFrame } from './AvatarFrame';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';

type FrameType = 'none' | 'bronze' | 'silver' | 'gold' | 'legend' | 'tennis' | 'padel' | 'beach' | 'special';

interface FrameSelectorProps {
  avatarSrc?: string;
  fallback: string;
  userLevel: string;
  selectedFrame: FrameType;
  onFrameChange: (frame: FrameType) => void;
  unlockedFrames?: FrameType[];
}

export const FrameSelector = ({
  avatarSrc,
  fallback,
  userLevel,
  selectedFrame,
  onFrameChange,
  unlockedFrames = ['none', 'bronze']
}: FrameSelectorProps) => {
  const { toast } = useToast();
  
  // Define which frames are unlocked based on level
  const getAvailableFrames = () => {
    const levelFrames: Record<string, FrameType[]> = {
      bronze: ['none', 'bronze'],
      silver: ['none', 'bronze', 'silver'],
      gold: ['none', 'bronze', 'silver', 'gold'],
      legend: ['none', 'bronze', 'silver', 'gold', 'legend']
    };
    
    // Combine level frames with any special unlocked frames
    return Array.from(new Set([
      ...(levelFrames[userLevel] || ['none']),
      ...unlockedFrames
    ]));
  };

  const availableFrames = getAvailableFrames();

  // Frame display data
  const frameData: Record<FrameType, { title: string, description: string }> = {
    none: { 
      title: 'Sem moldura', 
      description: 'Perfil padrão sem decoração' 
    },
    bronze: { 
      title: 'Bronze', 
      description: 'Moldura nível Bronze' 
    },
    silver: { 
      title: 'Prata', 
      description: 'Moldura nível Prata' 
    },
    gold: { 
      title: 'Ouro', 
      description: 'Moldura nível Ouro' 
    },
    legend: { 
      title: 'Lenda', 
      description: 'Moldura exclusiva para Lendas' 
    },
    tennis: { 
      title: 'Tênis', 
      description: 'Para os entusiastas do tênis' 
    },
    padel: { 
      title: 'Padel', 
      description: 'Para os amantes de padel' 
    },
    beach: { 
      title: 'Beach Tennis', 
      description: 'Para os fãs de beach tennis' 
    },
    special: { 
      title: 'Edição Especial', 
      description: 'Moldura de evento especial' 
    }
  };

  const handleFrameChange = (value: string) => {
    const frame = value as FrameType;
    onFrameChange(frame);
    
    toast({
      title: "Moldura atualizada",
      description: `Sua moldura foi alterada para ${frameData[frame].title}`,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-center mb-6">
        <AvatarFrame
          src={avatarSrc} 
          fallback={fallback}
          frameType={selectedFrame}
          size="xl"
          showTooltip={true}
        />
      </div>
      
      <h3 className="text-sm font-medium mb-2">Escolha sua moldura</h3>
      
      <RadioGroup 
        value={selectedFrame} 
        onValueChange={handleFrameChange}
        className="grid grid-cols-2 gap-2"
      >
        {(Object.keys(frameData) as FrameType[])
          .filter(frame => availableFrames.includes(frame))
          .map(frame => (
            <div key={frame} className="relative">
              <RadioGroupItem 
                value={frame} 
                id={`frame-${frame}`}
                className="peer sr-only"
              />
              <Label
                htmlFor={`frame-${frame}`}
                className="flex items-center gap-2 rounded-md border-2 border-muted p-2 hover:bg-muted peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
              >
                <div>
                  <AvatarFrame
                    fallback={fallback.charAt(0)}
                    frameType={frame}
                    size="sm"
                  />
                </div>
                <div className="text-sm">
                  <div className="font-medium">{frameData[frame].title}</div>
                  <div className="text-xs text-muted-foreground">{frameData[frame].description}</div>
                </div>
              </Label>
            </div>
          ))}
      </RadioGroup>
      
      {!availableFrames.includes(selectedFrame) && (
        <div className="text-sm text-amber-600 mt-2">
          Algumas molduras estão bloqueadas. Continue jogando para desbloqueá-las!
        </div>
      )}
    </div>
  );
};
