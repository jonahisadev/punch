# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

ARG GITHUB_TOKEN

COPY package.json yarn.lock ./

RUN echo "@jonahisadev:registry=https://npm.pkg.github.com" > .npmrc && \
    echo "//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}" >> .npmrc

RUN yarn install --frozen-lockfile

COPY . .

RUN yarn build

# Final stage
FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/package.json /app/yarn.lock ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/index.js"]
