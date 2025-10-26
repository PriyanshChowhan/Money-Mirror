# --- Stage 1: Build the frontend ---
FROM node:20-alpine as build

# Set working directory
WORKDIR /app

# Copy package.json and install deps
COPY package*.json ./
RUN npm install

ARG VITE_API_URL

# Copy the rest of the app
COPY . .

# Build the production-ready files
RUN VITE_API_URL=${VITE_API_URL} npm run build

# --- Stage 2: Serve with nginx ---
FROM nginx:alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy our custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from the previous stage
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]