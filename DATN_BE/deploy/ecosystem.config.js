// ecosystem.config.js - Production VPS (DATN_BE + Cloudflare tunnel)
// Chạy: cd C:\fedacn\DATN_BE && pm2 start deploy\ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'DATN_BE',
      script: './dist/index.js',
      cwd: 'C:\\fedacn\\DATN_BE',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      restart_delay: 3000,
      kill_timeout: 5000
    },
    {
      name: 'cloudflared',
      script: 'C:\\tools\\cloudflared\\cloudflared.exe',
      args: 'tunnel --url http://127.0.0.1:5000 --protocol http2',
      cwd: 'C:\\tools\\cloudflared',
      interpreter: 'none',
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_restarts: 50,
      min_uptime: '10s',
      restart_delay: 5000
    }
  ]
}
