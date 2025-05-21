const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cache = require('./services/cache.service');
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
});

// GET /todos avec cache Redis
app.get('/todos', async (req, res) => {
  try {
    // 1. Essayer le cache d'abord
    const cachedTodos = await cache.get('all-todos');
    if (cachedTodos) {
      console.log(`✅ Cache HIT on worker ${process.pid}`);
      return res.json(cachedTodos);
    }
    
    // 2. Si pas en cache, aller en base
    db.all("SELECT * FROM todos", async (err, rows) => {
      if (err) return res.status(500).json({error: err.message});
      
      // 3. Mettre en cache pour 30 secondes
      await cache.set('all-todos', rows, 30);
      console.log(`✅ Cache MISS -> SET on worker ${process.pid}`);
      
      res.json(rows);
    });
  } catch (error) {
    console.error('Error in GET /todos:', error);
    res.status(500).json({error: 'Server error'});
  }
});

// POST /todos avec invalidation du cache
app.post('/todos', async (req, res) => {
  db.run("INSERT INTO todos (title, description) VALUES (?, ?)", 
    [req.body.title, req.body.description || ''], 
    async function(err) {
      if (err) return res.status(500).json({error: err.message});
      
      // Invalider le cache après création
      await cache.del('all-todos');
      console.log(`✅ Cache invalidated after POST on worker ${process.pid}`);
      
      res.status(201).json({id: this.lastID, ...req.body, done: false});
    }
  );
});

// PATCH /todos/:id/done avec invalidation du cache
app.patch('/todos/:id/done', async (req, res) => {
  db.run("UPDATE todos SET done = 1 WHERE id = ?", [req.params.id], async function(err) {
    if (err) return res.status(500).json({error: err.message});
    
    // Invalider le cache après modification
    await cache.del('all-todos');
    console.log(`✅ Cache invalidated after PATCH on worker ${process.pid}`);
    
    res.json({id: req.params.id, done: true});
  });
});

// Route pour vider le cache (debug)
app.delete('/cache', async (req, res) => {
  await cache.flushAll();
  res.json({message: 'Cache cleared'});
});

// Route de stats de cache
app.get('/cache/stats', async (req, res) => {
  try {
    const cachedTodos = await cache.get('all-todos');
    res.json({
      cache_status: cachedTodos ? 'HIT' : 'MISS',
      worker_pid: process.pid
    });
  } catch (error) {
    res.status(500).json({error: error.message});
  }
});

app.listen(3000, () => console.log(`✅ Worker ${process.pid} with Redis cache started`));
