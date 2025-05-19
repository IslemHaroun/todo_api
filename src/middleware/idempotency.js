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

// Middleware d'idempotence
const idempotency = async (req, res, next) => {
  // Vérifier si l'en-tête Idempotency-Key est présent
  const idempotencyKey = req.header('Idempotency-Key');
  
  if (!idempotencyKey) {
    return next();
  }
  
  try {
    const redis = await connectRedis();
    const keyPrefix = 'idempotency:';
    const keyName = `${keyPrefix}${idempotencyKey}`;
    
    // Vérifier si cette clé a déjà été utilisée
    const existingResponse = await redis.get(keyName);
    
    if (existingResponse) {
      // Requête déjà traitée, renvoyer la réponse stockée
      const parsedResponse = JSON.parse(existingResponse);
      return res.status(parsedResponse.status).json(parsedResponse.body);
    }
    
    // Capturer la réponse pour la stocker
    const originalSend = res.send;
    res.send = function(body) {
      // Stocker la réponse dans Redis avec une expiration de 24h
      const responseData = {
        status: res.statusCode,
        body: body instanceof Object ? body : JSON.parse(body),
        timestamp: Date.now()
      };
      
      redis.set(keyName, JSON.stringify(responseData), {
        EX: 86400 // 24 heures en secondes
      }).catch(err => console.error('Erreur lors du stockage Redis:', err));
      
      // Continuer avec l'envoi normal
      originalSend.call(this, body);
    };
    
    next();
  } catch (error) {
    console.error('Erreur dans le middleware d\'idempotence:', error);
    next();
  }
};

module.exports = idempotency;