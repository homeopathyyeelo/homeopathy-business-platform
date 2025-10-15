FROM node:20-alpine
WORKDIR /app
COPY package.json /app/package.json
RUN npm ci --omit=dev || npm install --omit=dev
COPY src /app/src
ENV KAFKA_BROKER=kafka:29092
CMD ["npm","start"]


