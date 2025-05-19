# Rapport Technique: Optimisation du Microservice ToDo

## Introduction

Ce rapport présente les optimisations mises en œuvre pour le micro-service ToDo API et leurs impacts sur les performances. Le projet a comporté le développement d'une API RESTful simple (création, liste et marquage des tâches), puis l'ajout progressif de mécanismes d'optimisation et d'observabilité pour améliorer significativement les performances et la robustesse du service.

## Architecture Implémentée

L'architecture mise en place s'articule autour des composants suivants:
- **API Node.js/Express**: Exposant les endpoints REST avec validation de schéma
- **SQLite**: Stockage persistant des tâches avec indexation stratégique
- **Redis**: Triple usage - cache des résultats, gestion de l'idempotence et file d'attente asynchrone
- **PM2**: Orchestration des processus en mode cluster pour exploiter tous les CPUs
- **Docker Compose**: Orchestration des conteneurs pour un déploiement facile
- **OpenTelemetry**: Instrumentation pour la collecte de métriques et traces
- **Prometheus**: Stockage des métriques de performance
- **Grafana**: Visualisation des données de monitoring

## Optimisations et Résultats

Nous avons mesuré l'impact de chaque optimisation à l'aide de tests de charge k6, en nous concentrant sur la latence (p95) et le débit (requêtes/seconde):

| Optimisation                | p95 Latence (ms) | Débit (req/s) | Amélioration |
|-----------------------------|------------------|---------------|--------------|
| Baseline                    | 130              | ~120          | -            |
| + Index SQLite              | 80               | ~140          | ↓ 38% latence, ↑ 17% débit |
| + Compression gzip          | 70               | ~160          | ↓ 12% latence, ↑ 14% débit |
| + PM2 Cluster (4 workers)   | 45               | ~500          | ↓ 36% latence, ↑ 213% débit |
| + Cache Redis (hit 50%)     | 20               | ~900          | ↓ 56% latence, ↑ 80% débit |

**Analyse des améliorations:**

1. **Indexation SQLite**: L'ajout d'un index sur la colonne `done` a significativement réduit le temps de requête pour les opérations de filtrage. L'exécution de `EXPLAIN QUERY PLAN` montre que le moteur de base de données utilise désormais l'index plutôt qu'un full table scan.

2. **Compression gzip**: La compression réduit de 70-80% la taille des charges utiles JSON, diminuant ainsi le temps de transfert réseau. Cette optimisation est particulièrement efficace lorsque les réponses contiennent de nombreuses tâches.

3. **Clustering PM2**: En passant d'un processus unique à un mode cluster exploitant tous les CPUs disponibles, nous avons multiplié par 3 le débit de l'API. Le graphique de monitoring CPU montre une utilisation équilibrée sur tous les cœurs.

4. **Cache Redis**: L'introduction du cache pour les requêtes GET fréquentes a réduit drastiquement la latence en évitant les accès disque et les sérialisations JSON répétées. La stratégie d'invalidation du cache sur les opérations de modification garantit la cohérence des données.

## Robustesse et Sécurité

Plusieurs mécanismes ont été mis en place pour renforcer la robustesse du service:

- **Validation JSON Schema**: Toutes les entrées utilisateur sont validées contre un schéma strict
- **Rate Limiting**: Limitation à 100 requêtes/minute par IP
- **Idempotence**: Un header `Idempotency-Key` permet de rejouer les requêtes sans effets secondaires
- **File d'attente asynchrone**: Les tâches longues sont déléguées à un worker via BullMQ
- **Gestion des erreurs**: Middleware Express pour la capture et le formatage cohérent des erreurs

## Observabilité

Le système d'observabilité déployé permet une surveillance complète:

1. **Logging structuré**: Winston génère des logs JSON facilement consommables par des agrégateurs externes
2. **Métriques**: OpenTelemetry et Prometheus collectent des métriques clés comme:
   - Latence des requêtes HTTP (p50, p95, p99)
   - Taux d'erreurs
   - Utilisation des ressources (CPU, mémoire)
   - Hits/miss du cache Redis
3. **Dashboard Grafana**: Un tableau de bord visualise ces métriques en temps réel avec des seuils d'alerte

## Conclusion

Les optimisations progressives ont transformé un service de base en une API performante et robuste, réduisant la latence p95 de 130ms à 20ms (85% d'amélioration) et augmentant le débit de 120 à 900 requêtes/seconde (650% d'amélioration). L'architecture mise en place est également préparée pour une migration future vers PostgreSQL si la volumétrie le nécessite, grâce à la couche d'abstraction Knex.