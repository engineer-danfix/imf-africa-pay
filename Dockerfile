# Use Node.js LTS version
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install backend dependencies
RUN npm ci --only=production

# Copy backend source code
COPY . .

# Install frontend dependencies
RUN cd src && npm ci --only=production

# Build frontend
RUN cd src && npm run build

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "start"]