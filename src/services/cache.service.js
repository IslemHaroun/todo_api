const { createClient } = require('redis');

// Connexion à Redis
let redisClient;

const connectRedis = async () => {
  if (redisClient) return redisClient;
  
  redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  });
  
  redisClient.on('error', (err) => {
    console.error('Erreur Redis:', err);
  });
  
  await redisClient.connect();
  return redisClient;
};

// Cache TTL en secondes
const DEFAULT_TTL = 60; // 1 minute

// Service de cache
const cacheService = {
  // Récupérer une valeur du cache
  get: async (key) => {
    try {
      const redis = await connectRedis();
      const value = await redis.get(`cache:${key}`);
      
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Erreur lors de la récupération du cache:', error);
      return null;
    }
  },
  
  // Mettre une valeur en cache
  set: async (key, value, ttl = DEFAULT_TTL) => {
    try {
      const redis = await connectRedis();
      await redis.set(`cache:${key}`, JSON.stringify(value), {
        EX: ttl
      });
      
      return true;
    } catch (error) {
      console.error('Erreur lors de la mise en cache:', error);
      return false;
    }
  },
  
  // Supprimer une valeur du cache
  del: async (key) => {
    try {
      const redis = await connectRedis();
      await redis.del(`cache:${key}`);
      
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression du cache:', error);
      return false;
    }
  },
  
  // Vider le cache (uniquement les clés de l'application)
  flush: async () => {
    try {
      const redis = await connectRedis();
      const keys = await redis.keys('cache:*');
      
      if (keys.length > 0) {
        await redis.del(keys);
      }
      
      return true;
    } catch (error) {
      console.error('Erreur lors du vidage du cache:', error);
      return false;
    }
  }
};

module.exports = cacheService;