FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies and generate package-lock.json
RUN npm install

# Copy source code
COPY . .

# Default port (can be overridden by environment variable)
ENV PORT=5001

# Expose the port
EXPOSE ${PORT}

# Start the server
CMD ["node", "server.js"]