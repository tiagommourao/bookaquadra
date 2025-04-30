# Estágio de desenvolvimento
FROM node:20-alpine AS development

WORKDIR /app

# Copiar arquivos de configuração
COPY package*.json ./
COPY tsconfig*.json ./
COPY vite.config.ts ./
COPY tailwind.config.ts ./
COPY postcss.config.js ./

# Instalar dependências
RUN npm install

# Copiar código fonte
COPY src/ ./src/
COPY public/ ./public/
COPY index.html ./

# Expor porta
EXPOSE 5173

# Comando para desenvolvimento
CMD ["npm", "run", "dev", "--", "--host"]

# Estágio de build
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY tsconfig*.json ./
COPY vite.config.ts ./
COPY tailwind.config.ts ./
COPY postcss.config.js ./

RUN npm install

COPY src/ ./src/
COPY public/ ./public/
COPY index.html ./

RUN npm run build

# Estágio de produção
FROM nginx:alpine AS production

# Copiar configuração do nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar build do estágio anterior
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"] 