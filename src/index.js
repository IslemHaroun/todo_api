const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cache = require('./services/cache.service');
const client = require('prom-client');
const app = express();

app.use(express.json());

// Métriques Prometheus
const register = new client.Registry();
client.collectDefaultMetrics({ register });

// Métriques simples
const httpRequests = new client.Counter({
  name: 'todo_http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'status'],
  registers: [register]
});

// Middleware simple de comptage
app.use((req, res, next) => {
  res.on('finish', () => {
    httpRequests.inc({ method: req.method, status: res.statusCode });
  });
  next();
});

const db = new sqlite3.Database('./data/todo.db');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    description TEXT,
    done BOOLEAN DEFAULT 0
  )`);
});

// Routes existantes...
app.get('/todos', async (req, res) => {
  try {
    const cachedTodos = await cache.get('all-todos');
    if (cachedTodos) {
      console.log(`✅ Cache HIT on worker ${process.pid}`);
      return res.json(cachedTodos);
    }
    
    db.all("SELECT * FROM todos", async (err, rows) => {
      if (err) return res.status(500).json({error: err.message});
      
      await cache.set('all-todos', rows, 30);
      console.log(`✅ Cache MISS -> SET on worker ${process.pid}`);
      
      res.json(rows);
    });
  } catch (error) {
    res.status(500).json({error: 'Server error'});
  }
});

app.post('/todos', async (req, res) => {
  db.run("INSERT INTO todos (title, description) VALUES (?, ?)", 
    [req.body.title, req.body.description || ''], 
    async function(err) {
      if (err) return res.status(500).json({error: err.message});
      
      await cache.del('all-todos');
      res.status(201).json({id: this.lastID, ...req.body, done: false});
    }
  );
});

app.patch('/todos/:id/done', async (req, res) => {
  db.run("UPDATE todos SET done = 1 WHERE id = ?", [req.params.id], async function(err) {
    if (err) return res.status(500).json({error: err.message});
    
    await cache.del('all-todos');
    res.json({id: req.params.id, done: true});
  });
});

// Endpoint des métriques
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.get('/health', (req, res) => {
  res.json({ status: 'UP', worker: process.pid });
});

app.listen(3000, () => console.log(`✅ Worker ${process.pid} with simple metrics started`));
