# ToDo API Microservice

Micro-service de gestion de tâches avec optimisations de performance et observabilité.

## Fonctionnalités

- API RESTful pour la gestion de tâches (ToDos)
- Validation de schéma JSON
- Compression gzip
- Rate limiting
- Idempotence via Redis
- File d'attente asynchrone avec BullMQ
- Clustering avec PM2
- Logging structuré avec Winston
- Monitoring avec Prometheus et Grafana
- Instrumentation avec OpenTelemetry

## Prérequis

- Docker et Docker Compose
- Node.js v18+ (pour le développement local)

## Démarrage rapide

1. Cloner le dépôt
2. Lancer l'application avec Docker Compose

```bash
docker-compose up -d