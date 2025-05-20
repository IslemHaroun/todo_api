const express = require('express');
const app = express();
const PORT = 3000;

app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'ToDo API is running!' });
});

app.get('/todos', (req, res) => {
  res.json([{ id: 1, title: 'Test task', done: false }]);
});

app.post('/todos', (req, res) => {
  const { title } = req.body;
  res.status(201).json({ id: 2, title: title || 'Sans titre', done: false });
});

app.patch('/todos/:id/done', (req, res) => {
  res.json({ id: parseInt(req.params.id), done: true });
});

app.get('/health', (req, res) => {
  res.json({ status: 'UP' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Serveur démarré sur le port ${PORT}`);
});
