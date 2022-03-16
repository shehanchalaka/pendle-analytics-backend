# Build stage
FROM node:lts-alpine as build

WORKDIR /tmp
COPY package*.json ./

RUN npm ci
COPY . .
RUN npm run build

# Release stage
FROM node:lts-alpine as release
ENV NODE_ENV=production

WORKDIR /app
COPY package*.json ./

RUN npm ci --production --ignore-scripts=false 

COPY bin bin
COPY --from=build /tmp/lib lib

ENV PORT=8080
USER node
EXPOSE $PORT

CMD ["node", "./bin/server"]