// Instrumentation OpenTelemetry - doit être en premier
require('./middleware/otel');

const express = require('express');
const compression = require('compression');
const dotenv = require('dotenv');
const winston = require('winston');
const morgan = require('morgan');
const { rateLimit } = require('express-rate-limit');

// Initialisation des variables d'environnement
dotenv.config();

// Création de l'application Express
const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares de base
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware de compression gzip
app.use(compression());

// Logger HTTP avec Morgan
app.use(morgan('combined'));

// Rate limiting - 100 requêtes par minute par IP
app.use(rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requêtes par fenêtre
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Trop de requêtes, veuillez réessayer plus tard'
}));

// Middleware d'idempotence (à implémenter plus tard)
// app.use(require('./middleware/idempotency'));

// Routes
app.use('/todos', require('./routes/todos'));

// Route pour les métriques Prometheus
app.get('/metrics', (req, res) => {
  res.set('Content-Type', 'text/plain');
  res.end('Métriques OpenTelemetry disponibles ici');
  // Ce point d'accès sera remplacé par l'exporteur OpenTelemetry
});

// Healthcheck
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP' });
});

// Middleware de gestion des erreurs
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Une erreur est survenue',
    message: process.env.NODE_ENV === 'production' ? 'Erreur interne' : err.message
  });
});

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});

// Gestion de l'arrêt propre
process.on('SIGINT', () => {
  console.log('Arrêt du serveur...');
  process.exit(0);
});

module.exports = app;