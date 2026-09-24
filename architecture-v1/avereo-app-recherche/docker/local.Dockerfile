# Image locale uniquement : SPA construite et servie sans le sas CONNECT
# (le sas PHP n'a de sens que derrière CONNECT, voir docs/deployment.md).
FROM node:22-alpine AS build
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY frontend/ ./
# « ← CONNECT » ramène au CONNECT local Docker (compose.c7.yaml), pas à la production
ENV VITE_CONNECT_URL=http://127.0.0.1:8080/
RUN npm test \
    && npx vite build \
    && rm -rf dist/connect dist/index.php dist/.htaccess

FROM nginx:1.27-alpine
COPY docker/nginx.local.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
