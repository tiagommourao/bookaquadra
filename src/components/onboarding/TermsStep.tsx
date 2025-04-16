
import React from 'react';
import { Button } from '@/components/ui/button';
import { CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSiteSettings } from '@/contexts/SiteSettingsContext';

interface TermsStepProps {
  termsAccepted: boolean;
  onSubmit: (termsAccepted: boolean) => void;
  onBack: () => void;
  isSubmitting: boolean;
}

const TermsStep: React.FC<TermsStepProps> = ({
  termsAccepted,
  onSubmit,
  onBack,
  isSubmitting
}) => {
  const [accepted, setAccepted] = React.useState(termsAccepted);
  const { settings } = useSiteSettings();

  const handleSubmit = () => {
    onSubmit(accepted);
  };

  return (
    <>
      <CardHeader>
        <CardTitle>Termos e Políticas</CardTitle>
        <CardDescription>
          Para concluir seu cadastro, leia e aceite os termos de uso e a política de privacidade
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ScrollArea className="h-60 rounded-md border p-4">
          <div className="space-y-4">
            <h3 className="text-base font-medium">Termos de Uso</h3>
            <p className="text-sm">
              Ao utilizar o BookaQuadra, você concorda com os termos e condições estabelecidos abaixo.
              {settings.cancellationPolicy || `
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec auctor, nisl eget ultricies ultrices, nisl nisl ultricies nisl, nec ultricies nisl nisl nec. Donec auctor, nisl eget ultricies ultrices, nisl nisl ultricies nisl, nec ultricies nisl nisl nec.
                
                1. Reservas e Cancelamentos
                - As reservas são confirmadas mediante pagamento prévio.
                - Os cancelamentos devem ser realizados com antecedência mínima de 24 horas.
                - Cancelamentos com menos de 24 horas de antecedência não são reembolsáveis.
                
                2. Uso das Quadras
                - Os jogadores devem respeitar os horários de início e término das reservas.
                - É proibido o uso de calçados inadequados nas quadras.
                - Danos causados às quadras são de responsabilidade dos jogadores.
                
                3. Sistema de Pontos e Gamificação
                - Os pontos concedidos e benefícios podem ser modificados a qualquer momento.
                - A plataforma se reserva o direito de remover pontos em caso de uso indevido.
              `}
            </p>
            
            <h3 className="text-base font-medium">Política de Privacidade</h3>
            <p className="text-sm">
              Sua privacidade é importante para nós. Esta política descreve quais informações coletamos e como as utilizamos.
              
              {`
                1. Coleta de Dados
                - Coletamos informações pessoais como nome, email, telefone e localização.
                - Informações sobre suas modalidades esportivas, níveis e preferências de jogo.
                - Dados sobre suas reservas e interações com outros jogadores.
                
                2. Uso de Dados
                - Utilizamos seus dados para personalizar sua experiência na plataforma.
                - Podemos enviar notificações sobre partidas, ofertas e novidades.
                - Seus dados esportivos são utilizados no sistema de matchmaking.
                
                3. Compartilhamento
                - Informações básicas do perfil são compartilhadas com outros jogadores.
                - Não vendemos suas informações pessoais a terceiros.
                
                4. Seus Direitos
                - Você pode solicitar acesso, correção ou exclusão de seus dados.
                - Pode optar por não receber notificações a qualquer momento.
              `}
            </p>
          </div>
        </ScrollArea>
        
        <div className="flex items-center space-x-2 pt-2">
          <Checkbox 
            id="terms" 
            checked={accepted}
            onCheckedChange={(checked) => setAccepted(checked === true)}
          />
          <Label htmlFor="terms" className="text-sm">
            Eu li e aceito os Termos de Uso e a Política de Privacidade
          </Label>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onBack} disabled={isSubmitting}>Voltar</Button>
        <Button 
          onClick={handleSubmit} 
          disabled={!accepted || isSubmitting}
        >
          {isSubmitting ? 'Processando...' : 'Concluir'}
        </Button>
      </CardFooter>
    </>
  );
};

export default TermsStep;
