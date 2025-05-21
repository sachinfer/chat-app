FROM node:18 AS build
WORKDIR /app
COPY package*.json ./
ENV NODE_ENV=development
ENV NODE_TLS_REJECT_UNAUTHORIZED=0
RUN npm ci
COPY . .
RUN npx vite build

FROM node:18 AS prod
WORKDIR /app
RUN npm config set strict-ssl false
RUN npm install -g serve
COPY --from=build /app/dist ./dist
EXPOSE 5173
CMD ["serve", "-s", "dist", "-l", "5173"]