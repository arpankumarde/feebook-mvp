FROM node:20-slim AS builder

RUN apt update && apt install -y libc6 openssl

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY . .

RUN npm -g i pnpm@latest && pnpm install && pnpm prisma generate

RUN pnpm run build

FROM node:20-slim AS runner

RUN apt update && apt install -y libc6 openssl

WORKDIR /app

COPY --from=builder /app ./

RUN npm -g i pnpm@latest && pnpm install --production

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

EXPOSE 3000

CMD ["pnpm", "start"]
