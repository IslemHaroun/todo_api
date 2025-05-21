FROM node:18

WORKDIR /app

# Installer SQLite
RUN apt-get update && apt-get install -y sqlite3 && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install

COPY . .

RUN mkdir -p /app/data

EXPOSE 3000

CMD ["node", "src/index.js"]
