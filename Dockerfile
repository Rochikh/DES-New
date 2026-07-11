# --- Build du client React ---
FROM node:22-alpine AS client-build
WORKDIR /app/client
COPY client/package.json client/package-lock.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# --- Build du serveur Express ---
FROM node:22-alpine AS server-build
WORKDIR /app/server
COPY server/package.json server/package-lock.json ./
RUN npm ci
COPY server/ ./
RUN npm run build && npm prune --omit=dev

# --- Image finale ---
FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY --from=server-build /app/server/node_modules server/node_modules
COPY --from=server-build /app/server/dist server/dist
COPY --from=server-build /app/server/package.json server/package.json
COPY --from=client-build /app/client/dist client/dist
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD wget -qO- http://localhost:3000/api/health || exit 1
WORKDIR /app/server
CMD ["node", "dist/index.js"]
