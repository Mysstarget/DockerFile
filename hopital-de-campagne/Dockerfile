FROM node:22-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY src ./src
COPY sql ./sql
COPY scripts ./scripts
COPY public ./public
USER node
EXPOSE 3000
CMD ["node", "src/server.js"]
