
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { SportType, SkillLevel } from '@/types';
import { toast } from 'sonner';

interface SkillLevelsStepProps {
  selectedSports: string[];
  skillLevels: Record<string, string>;
  skillNotes: Record<string, string>;
  onSubmit: (
    skillLevels: Record<string, string>, 
    skillNotes: Record<string, string>
  ) => void;
  onBack: () => void;
}

const SkillLevelsStep: React.FC<SkillLevelsStepProps> = ({
  selectedSports,
  skillLevels: initialSkillLevels,
  skillNotes: initialSkillNotes,
  onSubmit,
  onBack
}) => {
  const [sports, setSports] = useState<SportType[]>([]);
  const [skillLevelsByType, setSkillLevelsByType] = useState<Record<string, SkillLevel[]>>({});
  const [selectedLevels, setSelectedLevels] = useState<Record<string, string>>(initialSkillLevels);
  const [notes, setNotes] = useState<Record<string, string>>(initialSkillNotes);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Buscar modalidades selecionadas
        const { data: sportsData, error: sportsError } = await supabase
          .from('sport_types')
          .select('*')
          .in('id', selectedSports);
        
        if (sportsError) throw sportsError;
        setSports(sportsData || []);
        
        // Buscar níveis disponíveis para cada modalidade
        for (const sportId of selectedSports) {
          const { data: levelsData, error: levelsError } = await supabase
            .from('skill_levels')
            .select('*')
            .eq('sport_type_id', sportId)
            .order('rank_order', { ascending: true });
          
          if (levelsError) throw levelsError;
          
          setSkillLevelsByType(prev => ({
            ...prev,
            [sportId]: levelsData || []
          }));
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Erro ao carregar níveis de habilidade');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [selectedSports]);

  const handleLevelChange = (sportId: string, levelId: string) => {
    setSelectedLevels(prev => ({
      ...prev,
      [sportId]: levelId
    }));
  };

  const handleNotesChange = (sportId: string, value: string) => {
    setNotes(prev => ({
      ...prev,
      [sportId]: value
    }));
  };

  const handleSubmit = () => {
    // Verificar se todos os esportes têm níveis selecionados
    const allLevelsSelected = selectedSports.every(
      sportId => selectedLevels[sportId]
    );
    
    if (!allLevelsSelected) {
      toast.error('Selecione um nível para cada modalidade');
      return;
    }
    
    onSubmit(selectedLevels, notes);
  };

  const getSportById = (sportId: string) => {
    return sports.find(sport => sport.id === sportId);
  };

  return (
    <>
      <CardHeader>
        <CardTitle>Seu Nível por Modalidade</CardTitle>
        <CardDescription>
          Defina seu nível em cada modalidade esportiva selecionada
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <Accordion type="single" collapsible className="w-full">
            {selectedSports.map((sportId, index) => {
              const sport = getSportById(sportId);
              const levels = skillLevelsByType[sportId] || [];
              
              return (
                <AccordionItem key={sportId} value={`item-${index}`} className="border px-4 rounded-lg mb-4">
                  <AccordionTrigger className="py-4">
                    <div className="flex items-center">
                      <span className="mr-2">{sport?.name}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4 space-y-4">
                    <div>
                      <div className="flex items-center mb-1">
                        <Label htmlFor={`level-${sportId}`} className="mr-2">Seu nível</Label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-5 w-5 p-0">
                              <HelpCircle className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="max-w-xs">
                              <p className="font-medium mb-1">{sport?.name} - Níveis:</p>
                              <ul className="text-xs list-disc pl-4">
                                {levels.map(level => (
                                  <li key={level.id} className="mb-1">
                                    <span className="font-medium">{level.name}</span>
                                    {level.description && ` - ${level.description}`}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Select 
                        value={selectedLevels[sportId] || ""} 
                        onValueChange={(value) => handleLevelChange(sportId, value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione seu nível" />
                        </SelectTrigger>
                        <SelectContent>
                          {levels.map(level => (
                            <SelectItem key={level.id} value={level.id}>
                              {level.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor={`notes-${sportId}`} className="mb-1 block">
                        Observações (opcional)
                      </Label>
                      <Textarea 
                        id={`notes-${sportId}`} 
                        value={notes[sportId] || ""}
                        onChange={(e) => handleNotesChange(sportId, e.target.value)}
                        placeholder="Detalhes adicionais sobre sua experiência, disponibilidade, etc."
                        className="resize-none"
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onBack}>Voltar</Button>
        <Button onClick={handleSubmit}>Próximo</Button>
      </CardFooter>
    </>
  );
};

export default SkillLevelsStep;
