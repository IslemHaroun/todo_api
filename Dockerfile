FROM node:18

WORKDIR /app

# Installer SQLite et PM2
RUN apt-get update && apt-get install -y sqlite3 && rm -rf /var/lib/apt/lists/*
RUN npm install pm2 -g

COPY package*.json ./
RUN npm install

COPY . .

RUN mkdir -p /app/data

EXPOSE 3000

# Utiliser PM2 au lieu de node direct
CMD ["pm2-runtime", "ecosystem.config.js"]
