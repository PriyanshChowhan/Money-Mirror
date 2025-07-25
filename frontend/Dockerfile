# --- Stage 1: Build the frontend ---
FROM node:20-alpine as build

# Set working directory
WORKDIR /app

# Copy package.json and install deps
COPY package*.json ./
RUN npm install

# Copy the rest of the app
COPY . .

# Build the production-ready files
RUN npm run build

# --- Stage 2: Serve with nginx ---
FROM nginx:alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy our custom nginx config
COPY default.conf /etc/nginx/conf.d/default.conf

# Copy built assets from the previous stage
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]