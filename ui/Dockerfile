# syntax=docker.io/docker/dockerfile:1.7-labs@sha256:b99fecfe00268a8b556fad7d9c37ee25d716ae08a5d7320e6d51c4dd83246894

# Stage 1: Build the production bundle.
# Bun is the package manager and script runner; the Vite/TypeScript toolchain
# runs on Node, matching the repository's `bun install` + `bun run build` flow.
FROM oven/bun:1.3.14-slim@sha256:d56a2534ffd262e92c12fd3249d3924d296d97086da773f821d7d0477435ea04 AS bun
FROM node:18@sha256:c6ae79e38498325db67193d391e6ec1d224d96c693a8a4d943498556716d3783 AS build

WORKDIR /ui

COPY --from=bun /usr/local/bin/bun /usr/local/bin/bun

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build

# Stage 2: Serve the built bundle with nginx.
FROM nginx:stable-alpine

# Remove default nginx config
RUN rm -f /etc/nginx/conf.d/default.conf

# Copy nginx config template (uses envsubst for API_URL / OIDC_PROXY_URL)
COPY nginx.conf /etc/nginx/templates/default.conf.template

# Copy built static files
COPY --from=build /ui/build /usr/share/nginx/html

# Copy entrypoint script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 80

# Environment variables with defaults.
# These are non-sensitive runtime configuration — not secrets.
# UC_AUTH_ENABLED controls whether the login UI is shown.
# OIDC client IDs are public values (the app is a public OIDC client using PKCE).
ENV API_URL=http://server:8080 \
    UC_API_URL="" \
    UC_AUTH_ENABLED=false \
    UC_OIDC_AUTHORITY="" \
    UC_OIDC_CLIENT_ID="" \
    UC_OIDC_SCOPES="openid profile email"

ENTRYPOINT ["/docker-entrypoint.sh"]
