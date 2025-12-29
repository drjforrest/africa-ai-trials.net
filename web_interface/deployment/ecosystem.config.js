// PM2 ecosystem configuration for african-ai-trials.net
// Deploy with: pm2 start ecosystem.config.js

module.exports = {
  apps: [
    {
      name: 'african-ai-trials-app',
      script: 'npm',
      args: 'start',
      cwd: '/path/to/africa-ai-trials-network',
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOSTNAME: '0.0.0.0'
      },
      error_file: '/var/log/pm2/african-ai-trials.error.log',
      out_file: '/var/log/pm2/african-ai-trials.out.log',
      log_file: '/var/log/pm2/african-ai-trials.combined.log',
      time: true
    },
    {
      name: 'african-ai-trials-monitor',
      script: 'scripts/monitor-database.js',
      cwd: '/path/to/africa-ai-trials-network',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production'
      },
      error_file: '/var/log/pm2/african-ai-trials-monitor.error.log',
      out_file: '/var/log/pm2/african-ai-trials-monitor.out.log',
      log_file: '/var/log/pm2/african-ai-trials-monitor.combined.log',
      time: true
    }
  ]
};