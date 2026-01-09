# Use an official Node.js runtime as the base image
FROM node:18

# Set working directory inside the container
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the entire backend code into the container
COPY . .

# Expose the backend port
EXPOSE 5000

# Start the backend server from src/index.js
CMD ["node", "src/index.js"]
