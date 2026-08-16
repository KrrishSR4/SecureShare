FROM node:22-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install && npm cache clean --force

# Copy source code
COPY . .

# Set proper ownership and switch to non-root user
RUN chown -R node:node /app
USER node

EXPOSE 5173

# Start Vite dev server on all network interfaces for Docker Compose routing
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
