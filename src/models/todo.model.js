const knex = require('knex');
const path = require('path');

// Configuration de la base de données avec Knex
const db = knex({
  client: 'sqlite3',
  connection: {
    filename: process.env.DB_PATH || path.join(__dirname, '../../data/todo.db')
  },
  useNullAsDefault: true,
  pool: {
    afterCreate: (conn, cb) => {
      // Activer les clés étrangères
      conn.run('PRAGMA foreign_keys = ON', cb);
    }
  }
});

// Initialisation de la table todos si elle n'existe pas
async function initDatabase() {
  const exists = await db.schema.hasTable('todos');
  
  if (!exists) {
    await db.schema.createTable('todos', table => {
      table.increments('id').primary();
      table.string('title').notNullable();
      table.string('description').nullable();
      table.boolean('done').defaultTo(false);
      table.timestamps(true, true);
    });
    
    // Création d'un index pour accélérer les recherches sur le statut 'done'
    await db.schema.raw('CREATE INDEX idx_todos_done ON todos (done)');
    
    console.log('Base de données initialisée avec succès');
  }
}

// Appel de l'initialisation
initDatabase().catch(err => {
  console.error('Erreur lors de l\'initialisation de la base de données:', err);
  process.exit(1);
});

// Export du modèle ToDo
module.exports = {
  // Créer une tâche
  create: async (todoData) => {
    return await db('todos').insert(todoData).returning('*');
  },
  
  // Lister toutes les tâches
  findAll: async () => {
    return await db('todos').select('*');
  },
  
  // Trouver une tâche par son ID
  findById: async (id) => {
    return await db('todos').where({ id }).first();
  },
  
  // Marquer une tâche comme terminée
  markAsDone: async (id) => {
    return await db('todos').where({ id }).update({ done: true });
  },
  
  // Pour plus tard: méthodes supplémentaires (update, delete, etc.)
  update: async (id, data) => {
    return await db('todos').where({ id }).update(data);
  },
  
  delete: async (id) => {
    return await db('todos').where({ id }).delete();
  },
  
  // Exporter l'instance de base de données pour d'autres usages
  db
};