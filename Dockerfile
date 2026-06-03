# syntax=docker/dockerfile:1

# --- Étape de build : compile la PWA (Vite) ---
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# --- Étape runtime : serveur proxy Hono + fichiers statiques ---
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Code serveur (exécuté via tsx) + types partagés + build client.
COPY server ./server
COPY shared ./shared
COPY --from=build /app/dist ./dist

EXPOSE 3001

# Coolify peut s'appuyer sur ce healthcheck.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3001/api/session > /dev/null 2>&1 || exit 1

CMD ["npm", "start"]
