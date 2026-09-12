# CareerOS

Local-only career app. Markdown vault lives at `/Users/greg/Notebooks/CareerOS` and is not part of this repo.

## Packages

- `frontend/` — Vite + Svelte 5 SPA
- `backend/` — Express API (markdown vault path via `DATA_DIR`)
- `nginx/` — vhost and mkcert files
- `playwright/` — site scraper scripts (empty for now)

## First-time setup

1. Map the domain (needs sudo):

```bash
grep -q 'careeros.local' /etc/hosts || echo '127.0.0.1 careeros.local' | sudo tee -a /etc/hosts
```

2. TLS certs (mkcert must already be installed):

```bash
mkcert -cert-file nginx/careeros.local.pem -key-file nginx/careeros.local-key.pem careeros.local
```

3. Nginx (Homebrew already includes `servers/*`). The vhost is already symlinked; Nginx runs as root so reload needs sudo:

```bash
ln -sf /Users/greg/Code/Local/careeros/nginx/careeros.conf /opt/homebrew/etc/nginx/servers/careeros.conf
sudo nginx -t && sudo nginx -s reload
```

4. API:

```bash
cd backend && npm install && pm2 start ecosystem.config.cjs
```

5. Frontend (Nginx serves `frontend/dist`):

```bash
cd frontend && npm install && npm run build
```

Dev UI (proxies `/api` to port 3005):

```bash
cd frontend && npm run dev
```

## Tests

```bash
cd frontend && npm test
cd backend && npm test
```

Playwright scrapers (browsers):

```bash
cd playwright && npm install && npx playwright install
```

## URLs

- App: https://careeros.local
- API (via Nginx): https://careeros.local/api/health
- API direct: http://127.0.0.1:3005/api/health
