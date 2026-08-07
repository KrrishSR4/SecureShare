FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

EXPOSE 5173

# Start Vite dev server on all network interfaces for Docker Compose routing
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
