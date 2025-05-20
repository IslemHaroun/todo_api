const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Chemin vers la base de données
const dbPath = path.join(__dirname, '../data/todo.db');
console.log('Database path:', dbPath);

// Créer/ouvrir la base de données
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Erreur ouverture DB:', err.message);
  } else {
    console.log('✅ Connecté à SQLite');
  }
});

// Créer la table si elle n'existe pas
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    done BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) {
      console.error('Erreur création table:', err);
    } else {
      console.log('✅ Table todos créée/vérifiée');
    }
  });
  
  // Créer l'index pour les performances
  db.run(`CREATE INDEX IF NOT EXISTS idx_todos_done ON todos(done)`);
});

module.exports = db;
