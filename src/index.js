const express = require('express');
const app = express();
const PORT = 3000;

console.log('🚀 Démarrage de l\'application...');

app.use(express.json());

// Stockage temporaire en mémoire
let todos = [
  { id: 1, title: 'Test task', description: 'Une tâche de test', done: false }
];
let nextId = 2;

app.get('/', (req, res) => {
  res.json({ message: 'ToDo API is running!' });
});

app.get('/todos', (req, res) => {
  console.log(`GET /todos - Returning ${todos.length} todos`);
  res.json(todos);
});

app.post('/todos', (req, res) => {
  const { title, description } = req.body;
  
  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }
  
  const newTodo = {
    id: nextId++,
    title: title,
    description: description || '',
    done: false,
    created_at: new Date().toISOString()
  };
  
  todos.push(newTodo);
  console.log(`POST /todos - Created todo with ID ${newTodo.id}`);
  res.status(201).json(newTodo);
});

app.patch('/todos/:id/done', (req, res) => {
  const id = parseInt(req.params.id);
  const todo = todos.find(t => t.id === id);
  
  if (!todo) {
    return res.status(404).json({ error: 'Todo not found' });
  }
  
  todo.done = true;
  console.log(`PATCH /todos/${id}/done - Marked as done`);
  res.json(todo);
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'UP',
    todos_count: todos.length,
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Serveur démarré sur le port ${PORT}`);
});

process.on('SIGINT', () => {
  console.log('\n🛑 Arrêt du serveur...');
  process.exit(0);
});
