# Image de développement — sert `npm run dev`. Une image de production
# multi-stage (build + next start, ou export statique) est hors périmètre
# de cette étape, à ajouter avant tout déploiement réel.
FROM node:22-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

EXPOSE 3000
