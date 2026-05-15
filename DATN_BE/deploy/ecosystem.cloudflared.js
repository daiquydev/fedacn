// PM2 — Cloudflare quick tunnel (trycloudflare.com)
// Chạy: pm2 start C:\fedacn\DATN_BE\deploy\ecosystem.cloudflared.js
module.exports = {
  apps: [
    {
      name: 'cloudflared',
      script: 'C:\\tools\\cloudflared\\cloudflared.exe',
      args: ['tunnel', '--url', 'http://127.0.0.1:5000', '--protocol', 'http2'],
      interpreter: 'none',
      autorestart: true,
      watch: false,
      max_restarts: 20,
      restart_delay: 5000
    }
  ]
}
