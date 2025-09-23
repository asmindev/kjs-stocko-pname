FROM node:20-alpine

WORKDIR /app

# Install dependency sistem yang dibutuhkan Prisma & build
RUN apk add --no-cache openssl bash

# Copy package.json & yarn.lock untuk caching
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy semua source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

EXPOSE 3000

CMD ["yarn", "dev"]
