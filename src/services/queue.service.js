const { Queue, Worker } = require('bullmq');
const { createClient } = require('redis');

// Connexion à Redis pour BullMQ
const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
};

// Création de la queue pour le traitement asynchrone des tâches
const createTodoQueue = new Queue('todo-processing', { connection });

// Création du worker pour traiter les jobs de la queue
const worker = new Worker('todo-processing', async (job) => {
  console.log(`Traitement du job ${job.id} avec les données:`, job.data);
  
  // Simuler un traitement asynchrone
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Traitement en fonction de l'action
  switch (job.data.action) {
    case 'create':
      console.log(`Tâche ${job.data.todoId} traitée avec succès (création)`);
      break;
    case 'done':
      console.log(`Tâche ${job.data.todoId} traitée avec succès (terminée)`);
      break;
    default:
      console.log(`Action inconnue pour la tâche ${job.data.todoId}`);
  }
  
  return { processed: true, todoId: job.data.todoId };
}, { connection });

// Gestion des événements du worker
worker.on('completed', (job) => {
  console.log(`Job ${job.id} complété avec succès`);
});

worker.on('failed', (job, err) => {
  console.error(`Job ${job.id} a échoué avec l'erreur:`, err);
});

module.exports = {
  createTodoQueue,
  worker
};