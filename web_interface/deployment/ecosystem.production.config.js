module.exports = {
  apps: [
    {
      name: 'african-ai-trials-app',
      script: 'npm',
      args: 'start',
      cwd: '/Users/jforrest/production/african-ai-trials',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: ,
        HOSTNAME: '0.0.0.0'
      },
      error_file: '/Users/jforrest/production/african-ai-trials/logs/app.error.log',
      out_file: '/Users/jforrest/production/african-ai-trials/logs/app.out.log',
      log_file: '/Users/jforrest/production/african-ai-trials/logs/app.combined.log',
      time: true
    }
  ]
};
