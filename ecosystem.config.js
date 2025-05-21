module.exports = {
  apps: [{
    name: 'todo-api',
    script: 'src/index.js',
    instances: 'max', // Utilise tous les CPUs disponibles
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '256M',
    env: {
      NODE_ENV: 'production'
    }
  }]
};
