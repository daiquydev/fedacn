// PM2 — Cloudflare quick tunnel (Windows VPS)
// pm2 start C:\fedacn\DATN_BE\deploy\ecosystem.cloudflared.js
// pm2 logs cloudflared --lines 50 --nostream
module.exports = {
  apps: [
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
