const { createClient } = require('redis');

let redisClient;

const connectRedis = async () => {
  if (redisClient) return redisClient;
  
  redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://redis:6379'
  });
  
  redisClient.on('error', (err) => {
    console.error('Redis error:', err);
  });
  
  await redisClient.connect();
  console.log(`✅ Redis connected on worker ${process.pid}`);
  return redisClient;
};

// Service de cache
const cacheService = {
  // Récupérer depuis le cache
  get: async (key) => {
    try {
      const redis = await connectRedis();
      const value = await redis.get(`cache:${key}`);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  },
  
  // Mettre en cache
  set: async (key, value, ttl = 30) => {
    try {
      const redis = await connectRedis();
      await redis.setEx(`cache:${key}`, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  },
  
  // Supprimer du cache
  del: async (key) => {
    try {
      const redis = await connectRedis();
      await redis.del(`cache:${key}`);
      return true;
    } catch (error) {
      console.error('Cache del error:', error);
      return false;
    }
  },
  
  // Vider le cache
  flushAll: async () => {
    try {
      const redis = await connectRedis();
      await redis.flushAll();
      return true;
    } catch (error) {
      console.error('Cache flush error:', error);
      return false;
    }
  }
};

module.exports = cacheService;
