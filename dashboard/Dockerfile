# Use the official Node.js image
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to the container
COPY package.json package-lock.json ./

# Install npm dependencies inside the container
RUN npm install

# Expose port 3000 to the Docker network
EXPOSE 3000


