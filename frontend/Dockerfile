# 1) Build stage
FROM node:18-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
RUN npm run build

# 2) Runtime stage (static files served by nginx)
FROM nginx:alpine
# Remove default site and add our config
RUN rm -f /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf
# Copy built assets
COPY --from=build /app/dist /usr/share/nginx/html
# Expose container port
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]