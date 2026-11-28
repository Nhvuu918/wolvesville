FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci --include=dev --include=optional; else npm install --include=dev --include=optional; fi
COPY . .
RUN npm run build && npm run verify:source && node --test tests/immersive03-*.test.mjs tests/immersive-career.test.mjs tests/immersive-social.test.mjs tests/startup-config.test.mjs
RUN npm prune --omit=dev --include=optional && node -e "Promise.all([import('pg'),import('sharp')]).catch(e=>{console.error('Required runtime dependency unavailable');process.exit(1)})"
FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production HOST=0.0.0.0
COPY --from=build --chown=node:node /app/package*.json ./
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/frontend ./frontend
COPY --from=build --chown=node:node /app/data ./data
COPY --from=build --chown=node:node /app/backend/src/persistence/migrations ./backend/src/persistence/migrations
COPY --from=build --chown=node:node /app/scripts ./scripts
COPY --from=build --chown=node:node /app/docs/full50-handover/OWNER_DECISIONS_MASTER.json ./docs/full50-handover/OWNER_DECISIONS_MASTER.json
USER node
EXPOSE 3212
CMD ["npm","start"]
