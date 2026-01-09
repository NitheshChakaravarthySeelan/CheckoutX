FROM node:20-alpine
WORKDIR /app
COPY package.json .
COPY pnpm-lock.yaml .
RUN pnpm install --prod
COPY . .
RUN pnpm run build
CMD ["pnpm", "start"]