const TodoModel = require('../models/todo.model');
const { createTodoQueue } = require('../services/queue.service');
const { createLogger } = require('winston');
const { format, transports } = require('winston');

// Configuration du logger Winston
const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  defaultMeta: { service: 'todo-controller' },
  transports: [
    new transports.Console(),
    new transports.File({ filename: 'logs/error.log', level: 'error' }),
    new transports.File({ filename: 'logs/combined.log' })
  ]
});

module.exports = {
  // Créer une nouvelle tâche
  createTodo: async (req, res) => {
    try {
      const newTodo = await TodoModel.create(req.body);
      
      // Ajout d'un job dans la queue pour traitement asynchrone
      const job = await createTodoQueue.add('process-todo', {
        todoId: newTodo.id,
        action: 'create'
      }, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 }
      });
      
      logger.info(`Tâche créée avec l'ID ${newTodo.id}, job ${job.id} ajouté à la queue`);
      
      res.status(201).json(newTodo);
    } catch (error) {
      logger.error(`Erreur lors de la création de la tâche: ${error.message}`, { error });
      res.status(500).json({ error: 'Erreur lors de la création de la tâche' });
    }
  },
  
  // Lister toutes les tâches
  getAllTodos: async (req, res) => {
    try {
      const todos = await TodoModel.findAll();
      logger.info(`${todos.length} tâches récupérées`);
      res.status(200).json(todos);
    } catch (error) {
      logger.error(`Erreur lors de la récupération des tâches: ${error.message}`, { error });
      res.status(500).json({ error: 'Erreur lors de la récupération des tâches' });
    }
  },
  
  // Marquer une tâche comme terminée
  markTodoAsDone: async (req, res) => {
    try {
      const { id } = req.params;
      
      // Vérifier si la tâche existe
      const todo = await TodoModel.findById(id);
      if (!todo) {
        logger.warn(`Tentative de marquer comme terminée une tâche inexistante: ${id}`);
        return res.status(404).json({ error: 'Tâche non trouvée' });
      }
      
      // Mettre à jour la tâche
      await TodoModel.markAsDone(id);
      
      // Ajouter un job dans la queue pour traitement asynchrone
      const job = await createTodoQueue.add('process-todo', {
        todoId: id,
        action: 'done'
      }, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 }
      });
      
      logger.info(`Tâche ${id} marquée comme terminée, job ${job.id} ajouté à la queue`);
      
      res.status(200).json({ id, done: true });
    } catch (error) {
      logger.error(`Erreur lors du marquage de la tâche ${req.params.id}: ${error.message}`, { error });
      res.status(500).json({ error: 'Erreur lors du marquage de la tâche comme terminée' });
    }
  }
};