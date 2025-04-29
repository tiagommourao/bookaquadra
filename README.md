# BookaQuadra 🎾

## Sobre o Projeto

BookaQuadra é uma aplicação web moderna desenvolvida para facilitar o agendamento e gerenciamento de quadras esportivas. Construída com tecnologias de ponta, a aplicação oferece uma interface intuitiva e responsiva para usuários e administradores.

## 🚀 Tecnologias Utilizadas

- **Frontend:**
  - React 18.3
  - TypeScript
  - Vite
  - Tailwind CSS
  - shadcn/ui (componentes)
  - React Router DOM
  - React Query
  - React Hook Form
  - Zod (validação)

- **Backend:**
  - Supabase
  - Stripe (pagamentos)

- **Estilização:**
  - Tailwind CSS
  - Radix UI
  - Lucide Icons
  - Tailwind Merge
  - Class Variance Authority

## 📁 Estrutura do Projeto

```
src/
├── components/     # Componentes reutilizáveis
├── contexts/      # Contextos React
├── hooks/         # Hooks customizados
├── integrations/  # Integrações com serviços externos
├── lib/          # Utilitários e configurações
├── pages/        # Páginas da aplicação
└── types/        # Definições de tipos TypeScript
```

## 🛠️ Configuração do Ambiente de Desenvolvimento

### Pré-requisitos

- Node.js (versão LTS recomendada)
- npm ou bun

### Instalação

1. Clone o repositório:
```bash
git clone <URL_DO_REPOSITÓRIO>
cd bookaquadra
```

2. Instale as dependências:
```bash
npm install
# ou
bun install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env
```

4. Inicie o servidor de desenvolvimento:
```bash
npm run dev
# ou
bun dev
```

## 🔧 Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Cria a build de produção
- `npm run build:dev` - Cria a build de desenvolvimento
- `npm run lint` - Executa o linter
- `npm run preview` - Visualiza a build de produção localmente

## 📦 Funcionalidades Principais

- 🔐 Autenticação de usuários
- 📅 Sistema de agendamento de quadras
- 💳 Integração com pagamentos (Stripe)
- 📱 Interface responsiva
- 🌓 Modo escuro/claro
- 📊 Dashboard administrativo
- 🔔 Sistema de notificações

## 🔒 Integração com Supabase

O projeto utiliza Supabase para:
- Autenticação de usuários
- Banco de dados
- Armazenamento de arquivos
- Funções serverless
- Real-time subscriptions

## 💅 Componentes UI

Utilizamos shadcn/ui para componentes base, que incluem:
- Formulários
- Modais
- Menus
- Tabelas
- Toasts
- e muito mais...

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 📫 Contato

Para mais informações sobre o projeto, entre em contato através das issues do GitHub ou via email.

---

Desenvolvido com ❤️ pela equipe BookaQuadra
