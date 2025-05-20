FROM node:18-alpine

# Installer les dépendances nécessaires pour SQLite
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Installer PM2 globalement
RUN npm install pm2 -g

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm install

# Copier le reste des fichiers
COPY . .

# Créer les répertoires nécessaires
RUN mkdir -p /app/data /app/logs

# Exposer le port
EXPOSE 3000

# Commande de démarrage
CMD ["node", "src/index.js"]
