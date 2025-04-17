
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';
import { ExternalLink } from 'lucide-react';

export const MercadoPagoDocumentation: React.FC = () => {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Documentação da Integração</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Esta página ajuda você a entender como configurar e usar a integração do Mercado Pago no sistema BookaQuadra.
              Siga os passos abaixo para uma configuração adequada.
            </p>

            <Separator />
            
            <h3 className="text-md font-medium">Visão Geral</h3>
            <p className="text-sm text-gray-600">
              A integração com o Mercado Pago permite receber pagamentos online para reservas de quadras esportivas. 
              Você precisa configurar credenciais fornecidas pelo Mercado Pago e definir algumas configurações adicionais.
            </p>

            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>Passo 1: Criar conta no Mercado Pago</AccordionTrigger>
                <AccordionContent>
                  <ol className="list-decimal pl-5 space-y-2 text-sm text-gray-600">
                    <li>Acesse o <a href="https://www.mercadopago.com.br" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center">site do Mercado Pago <ExternalLink className="h-3 w-3 ml-1" /></a> e crie sua conta comercial caso ainda não possua.</li>
                    <li>Complete o processo de verificação da conta (pode incluir validação de dados pessoais, bancários e documentos).</li>
                    <li>Acesse o painel do Mercado Pago para obter suas credenciais de integração.</li>
                  </ol>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2">
                <AccordionTrigger>Passo 2: Obter credenciais de acesso</AccordionTrigger>
                <AccordionContent>
                  <ol className="list-decimal pl-5 space-y-2 text-sm text-gray-600">
                    <li>No painel do Mercado Pago, acesse <strong>Desenvolvedor</strong> &gt; <strong>Credenciais</strong>.</li>
                    <li>
                      Você encontrará dois ambientes:
                      <ul className="list-disc pl-5 mt-1">
                        <li><strong>Produção:</strong> Para receber pagamentos reais</li>
                        <li><strong>Teste (Sandbox):</strong> Para testar a integração sem movimentar dinheiro real</li>
                      </ul>
                    </li>
                    <li>Em cada ambiente, copie os seguintes dados:
                      <ul className="list-disc pl-5 mt-1">
                        <li><strong>Public Key:</strong> Usada no frontend para inicializar formulários de pagamento</li>
                        <li><strong>Access Token:</strong> Usado no backend para processar pagamentos (mantenha seguro!)</li>
                        <li><strong>Client ID e Client Secret:</strong> Usados para identificar sua aplicação</li>
                      </ul>
                    </li>
                    <li>Cole esses dados nos campos correspondentes nesta página de configuração.</li>
                  </ol>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3">
                <AccordionTrigger>Passo 3: Configurar Webhooks</AccordionTrigger>
                <AccordionContent>
                  <ol className="list-decimal pl-5 space-y-2 text-sm text-gray-600">
                    <li>O Webhook é essencial para que o Mercado Pago possa notificar o sistema quando um pagamento for aprovado, rejeitado ou tiver status alterado.</li>
                    <li>No painel do Mercado Pago, acesse <strong>Desenvolvedor</strong> &gt; <strong>Webhooks</strong>.</li>
                    <li>Clique em <strong>Criar webhook</strong> e adicione a URL que aparece no campo "URL para Webhook" desta página de configuração.</li>
                    <li>Selecione os eventos <strong>payment</strong> e <strong>merchant_order</strong> para receber notificações relevantes.</li>
                    <li>Salve a configuração no painel do Mercado Pago.</li>
                    <li>Após configurar, teste a integração usando o botão "Testar Conexão" nesta página.</li>
                  </ol>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4">
                <AccordionTrigger>Passo 4: Testar a integração</AccordionTrigger>
                <AccordionContent>
                  <ol className="list-decimal pl-5 space-y-2 text-sm text-gray-600">
                    <li>Inicialmente, configure o ambiente como <strong>Sandbox</strong> para realizar testes.</li>
                    <li>Use o botão <strong>Testar Conexão</strong> para verificar se suas credenciais estão corretas.</li>
                    <li>Faça alguns pagamentos de teste utilizando os <a href="https://www.mercadopago.com.br/developers/pt/docs/checkout-api/integration-test/test-cards" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center">cartões de teste <ExternalLink className="h-3 w-3 ml-1" /></a> fornecidos pelo Mercado Pago.</li>
                    <li>Verifique se as notificações de pagamento estão sendo recebidas corretamente.</li>
                    <li>Quando estiver tudo funcionando no ambiente de testes, mude para o ambiente de <strong>Produção</strong> para começar a receber pagamentos reais.</li>
                  </ol>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5">
                <AccordionTrigger>Boas práticas de segurança</AccordionTrigger>
                <AccordionContent>
                  <ul className="list-disc pl-5 space-y-2 text-sm text-gray-600">
                    <li><strong>Nunca compartilhe</strong> seus Access Tokens ou Client Secrets. Estas são informações sensíveis.</li>
                    <li><strong>Limite o acesso</strong> a esta página apenas para administradores de confiança.</li>
                    <li><strong>Monitore regularmente</strong> o histórico de alterações para detectar atividades suspeitas.</li>
                    <li><strong>Teste periodicamente</strong> a conexão para garantir que a integração continua funcionando.</li>
                    <li><strong>Mantenha suas credenciais atualizadas</strong> caso o Mercado Pago solicite renovação.</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-lg">Links úteis</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li>
              <a 
                href="https://www.mercadopago.com.br/developers/pt/docs"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline flex items-center"
              >
                Documentação oficial do Mercado Pago
                <ExternalLink className="h-3.5 w-3.5 ml-1" />
              </a>
            </li>
            <li>
              <a 
                href="https://www.mercadopago.com.br/developers/panel"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline flex items-center"
              >
                Painel de desenvolvedor do Mercado Pago
                <ExternalLink className="h-3.5 w-3.5 ml-1" />
              </a>
            </li>
            <li>
              <a 
                href="https://www.mercadopago.com.br/developers/pt/docs/checkout-api/integration-test/test-cards"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline flex items-center"
              >
                Cartões para testes
                <ExternalLink className="h-3.5 w-3.5 ml-1" />
              </a>
            </li>
            <li>
              <a 
                href="https://www.mercadopago.com.br/developers/pt/docs/checkout-api/webhooks"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline flex items-center"
              >
                Configuração de Webhooks
                <ExternalLink className="h-3.5 w-3.5 ml-1" />
              </a>
            </li>
          </ul>
        </CardContent>
      </Card>
    </>
  );
};
