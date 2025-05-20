const knex = require('knex');

const db = knex({
  client: 'sqlite3',
  connection: { filename: '/app/data/todo.db' },
  useNullAsDefault: true
});

// Créer la table
db.schema.hasTable('todos').then(exists => {
  if (!exists) {
    return db.schema.createTable('todos', table => {
      table.increments('id').primary();
      table.string('title').notNullable();
      table.string('description').defaultTo('');
      table.boolean('done').defaultTo(false);
      table.timestamps(true, true);
    });
  }
});

module.exports = {
  findAll: () => db('todos').select('*').orderBy('id', 'desc'),
  create: (data) => db('todos').insert(data).returning('*'),
  markAsDone: (id) => db('todos').where('id', id).update('done', true).returning('*')
};
