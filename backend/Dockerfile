FROM node:18-alpine

WORKDIR /app

# Install dependencies first (caching)
COPY package*.json ./
RUN npm install

# Copy source
COPY . .

# Expose port
EXPOSE 3000

# Start command
CMD ["npm", "start"]
