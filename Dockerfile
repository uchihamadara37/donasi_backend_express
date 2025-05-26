# Gunakan node image
FROM node:18

# Set workdir di container
WORKDIR /app

# Copy file project
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy semua file project ke container
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Expose port
EXPOSE 8080

# Jalankan aplikasi
CMD [ "node", "index.js" ]
