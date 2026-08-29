FROM node:22-alpine AS base
WORKDIR /app
COPY package.json ./
RUN npm install

FROM base AS development
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev", "--", "--hostname", "0.0.0.0"]

FROM base AS build
COPY . .
RUN npm run build

FROM node:22-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/package.json ./
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
RUN npm install --omit=dev
EXPOSE 3000
CMD ["npm", "run", "start"]
