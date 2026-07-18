# syntax=docker/dockerfile:1
# Server API image (SPA is built/served separately, e.g. behind a reverse proxy).

FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY server/package.json server/package-lock.json ./
RUN npm ci
COPY server/tsconfig.json server/prisma.config.ts ./
COPY server/prisma ./prisma
COPY server/src ./src
# generate only emits the client — any DATABASE_URL satisfies prisma.config.ts
RUN DATABASE_URL="file:./prisma/build-placeholder.db" npx prisma generate \
  && npx tsc -p tsconfig.json

FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY server/package.json server/package-lock.json ./
# prisma CLI stays for `migrate deploy` at container start.
RUN npm ci --omit=dev \
  && npm install --no-save "prisma@$(node -p "require('./package.json').devDependencies.prisma")" \
  && npm cache clean --force
COPY --from=build /app/dist ./dist
COPY server/prisma/schema.prisma ./prisma/schema.prisma
COPY server/prisma/migrations ./prisma/migrations
COPY server/prisma.config.ts ./
# SQLite lives on a volume; uploads dir must be writable by the app user.
ENV DATABASE_URL="file:/data/webchat.db"
RUN mkdir -p /data /app/uploads && chown -R node:node /data /app/uploads
USER node
VOLUME ["/data", "/app/uploads"]
EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s \
  CMD node -e "fetch('http://localhost:'+(process.env.PORT||5000)+'/health').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
