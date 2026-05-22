FROM node:24-alpine AS runtime

WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY apps ./apps
COPY packages ./packages
COPY infra ./infra
COPY scripts ./scripts
COPY services/api-prototype ./services/api-prototype
COPY data/.gitkeep ./data/.gitkeep

RUN mkdir -p /app/data && chown -R node:node /app/data
USER node

EXPOSE 3000
CMD ["node", "services/api-prototype/src/server.js"]
