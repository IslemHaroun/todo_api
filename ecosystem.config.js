module.exports = {
    apps: [{
      name: 'todo-api',
      script: 'src/index.js',
      instances: 'max', // Utilise tous les CPUs disponibles
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      combine_logs: true
    }]
  };