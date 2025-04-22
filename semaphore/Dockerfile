# Use a lightweight Node.js image
FROM node:20-alpine

# Create and set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy application code
COPY . .

# Compile TypeScript to JavaScript
RUN npx tsc

# Expose the port used by Express
EXPOSE 3000

# Command to run the application
CMD ["node", "dist/index.js"] 