FROM node:26-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code and Prisma schema
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the TypeScript code
RUN npm run build

EXPOSE 4000

# Run database migrations before starting the server
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
