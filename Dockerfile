# Build Expo web
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# These are injected at build time for app.config.js (Expo extra)
ARG API_URL
ARG FIREBASE_API_KEY
ARG FIREBASE_AUTH_DOMAIN
ARG FIREBASE_PROJECT_ID
ARG FIREBASE_STORAGE_BUCKET
ARG FIREBASE_MESSAGING_SENDER_ID
ARG FIREBASE_APP_ID
ARG FIREBASE_MEASUREMENT_ID
ARG NUMISTA_API_KEY
ARG NUMISTA_USER_ID

ENV API_URL=$API_URL \
  FIREBASE_API_KEY=$FIREBASE_API_KEY \
  FIREBASE_AUTH_DOMAIN=$FIREBASE_AUTH_DOMAIN \
  FIREBASE_PROJECT_ID=$FIREBASE_PROJECT_ID \
  FIREBASE_STORAGE_BUCKET=$FIREBASE_STORAGE_BUCKET \
  FIREBASE_MESSAGING_SENDER_ID=$FIREBASE_MESSAGING_SENDER_ID \
  FIREBASE_APP_ID=$FIREBASE_APP_ID \
  FIREBASE_MEASUREMENT_ID=$FIREBASE_MEASUREMENT_ID \
  NUMISTA_API_KEY=$NUMISTA_API_KEY \
  NUMISTA_USER_ID=$NUMISTA_USER_ID

# Produces static web build into ./dist
RUN npx expo export -p web


# Serve static with nginx
FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
