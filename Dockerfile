FROM node:22-alpine AS builder

RUN apk add --no-cache build-base g++ python3 pkgconfig \
    cairo-dev pango-dev libjpeg-turbo-dev giflib-dev librsvg-dev

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY tsconfig.json tsconfig.build.json ./
COPY src/ src/

RUN npm run build

# ---

FROM node:22-alpine

ENV NODE_ENV=production

WORKDIR /quickchart

RUN apk add --no-cache \
    cairo pango libjpeg-turbo giflib librsvg \
    ttf-dejavu ttf-droid ttf-freefont ttf-liberation \
    font-noto font-noto-emoji fontconfig \
    graphviz && \
    apk add --no-cache --repository https://dl-cdn.alpinelinux.org/alpine/edge/community font-wqy-zenhei && \
    rm -rf /var/cache/apk/*

COPY package.json package-lock.json* ./
RUN apk add --no-cache --virtual .build-deps build-base g++ python3 pkgconfig \
    cairo-dev pango-dev libjpeg-turbo-dev giflib-dev librsvg-dev && \
    npm ci --omit=dev && \
    apk del .build-deps && \
    rm -rf /root/.npm /var/cache/apk/*

COPY --from=builder /app/dist/ dist/

USER node

EXPOSE 3400

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3400/healthcheck || exit 1

ENTRYPOINT ["node", "--max-http-header-size=65536", "dist/index.js"]
