// ecosystem.config.js - Production (VPS)
module.exports = {
  apps: [
    {
      name: 'DATN_BE',
      script: './dist/index.js',
      instances: 1,
      autorestart: true,
      watch: false,           // Tắt watch trên production
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      // Log files
      out_file: '/var/log/pm2/datn_be_out.log',
      error_file: '/var/log/pm2/datn_be_error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      // Restart delay
      restart_delay: 3000,
      // Kill timeout
      kill_timeout: 5000
    }
  ]
}
