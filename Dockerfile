# BusinessOS Angular image.
# Build from BusinessOS_UI:
#   docker build -t businessos-web .
#
# The same image is used for every environment. Public API settings come from
# /app-config.json, which Compose mounts over the file baked into the image.

FROM node:22-bookworm-slim AS build
WORKDIR /src

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build:prod

FROM nginxinc/nginx-unprivileged:1.28-alpine AS final

COPY nginx.http.conf /etc/nginx/conf.d/default.conf
COPY --from=build /src/dist/business-os.web/browser /usr/share/nginx/html

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -q -O /dev/null http://127.0.0.1:8080/nginx-health || exit 1
