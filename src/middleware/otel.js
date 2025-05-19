const opentelemetry = require('@opentelemetry/api');
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { PrometheusExporter } = require('@opentelemetry/exporter-prometheus');

// Configuration de l'exporteur Prometheus
const prometheusExporter = new PrometheusExporter({
  endpoint: '/metrics',
  port: 3000, // Même port que l'application
});

// Configuration du SDK OpenTelemetry
const sdk = new NodeSDK({
  traceExporter: prometheusExporter,
  metricReader: prometheusExporter,
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-http': {
        enabled: true,
      },
      '@opentelemetry/instrumentation-express': {
        enabled: true,
      },
      '@opentelemetry/instrumentation-redis': {
        enabled: true,
      },
    }),
  ],
  serviceName: 'todo-api',
});

// Démarrage du SDK
sdk.start()
  .then(() => console.log('OpenTelemetry initialisé'))
  .catch((error) => console.error('Erreur lors de l\'initialisation d\'OpenTelemetry:', error));

// Arrêt propre lors de la terminaison de l'application
process.on('SIGTERM', () => {
  sdk.shutdown()
    .then(() => console.log('SDK OpenTelemetry arrêté'))
    .catch((error) => console.error('Erreur lors de l\'arrêt du SDK OpenTelemetry:', error))
    .finally(() => process.exit(0));
});

// Création d'un traceur global
const tracer = opentelemetry.trace.getTracer('todo-api-tracer');

module.exports = { tracer };