FROM node:20-alpine3.20

ENV NODE_ENV production

WORKDIR /quickchart

RUN apk add --upgrade apk-tools && \
    apk add --no-cache --virtual .build-deps yarn git build-base g++ python3 && \
    apk add --no-cache --virtual .npm-deps cairo-dev pango-dev libjpeg-turbo-dev librsvg-dev && \
    apk add --no-cache --virtual .fonts libmount ttf-dejavu ttf-droid ttf-freefont ttf-liberation font-noto font-noto-emoji fontconfig && \
    apk add --no-cache --repository https://dl-cdn.alpinelinux.org/alpine/edge/community font-wqy-zenhei && \
    apk add --no-cache libimagequant-dev && \
    apk add --no-cache vips-dev && \
    apk add --no-cache --virtual .runtime-deps graphviz

COPY package*.json .
COPY yarn.lock .
RUN yarn install --production

RUN apk update && \
    rm -rf /var/cache/apk/* /tmp/* && \
    apk del .build-deps

COPY *.js ./
COPY lib/*.js lib/
COPY LICENSE .

EXPOSE 3400

ENTRYPOINT ["node", "--max-http-header-size=65536", "index.js"]
