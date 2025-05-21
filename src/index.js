const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const app = express();

app.use(express.json());

const db = new sqlite3.Database('./data/todo.db');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    description TEXT,
    done BOOLEAN DEFAULT 0
  )`);
  
  // Ajouter l'index pour optimiser les requêtes sur done
  db.run(`CREATE INDEX IF NOT EXISTS idx_todos_done ON todos(done)`, (err) => {
    if (err) console.error('Index creation error:', err);
    else console.log('✅ Index on done column ready');
  });
});

app.get('/todos', (req, res) => {
  db.all("SELECT * FROM todos", (err, rows) => {
    if (err) return res.status(500).json({error: err.message});
    res.json(rows);
  });
});

app.post('/todos', (req, res) => {
  db.run("INSERT INTO todos (title, description) VALUES (?, ?)", 
    [req.body.title, req.body.description || ''], 
    function(err) {
      if (err) return res.status(500).json({error: err.message});
      res.status(201).json({id: this.lastID, ...req.body, done: false});
    }
  );
});

app.patch('/todos/:id/done', (req, res) => {
  db.run("UPDATE todos SET done = 1 WHERE id = ?", [req.params.id], function(err) {
    if (err) return res.status(500).json({error: err.message});
    res.json({id: req.params.id, done: true});
  });
});

app.listen(3000, () => console.log('✅ Server with SQLite + Index started'));
