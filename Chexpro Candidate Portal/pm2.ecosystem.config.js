module.exports = {
  apps: [
    {
      name: 'candidate-api',
      script: './backend/dist/index.js',
      instances: 2,
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '512M',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3004
      },
      error_file: '/var/log/chexpro-candidate/api-error.log',
      out_file: '/var/log/chexpro-candidate/api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true
    },
    {
      name: 'candidate-worker',
      script: './backend/dist/worker.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '256M',
      env_production: {
        NODE_ENV: 'production'
      },
      error_file: '/var/log/chexpro-candidate/worker-error.log',
      out_file: '/var/log/chexpro-candidate/worker-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    }
  ]
};
