# Secure Chat Lab

Private DM chat lab for AppSec portfolio work — harden-in-place on Express / React / Prisma (SQLite).

Not a production messenger. Scope is intentional and documented in [`SECURITY.md`](./SECURITY.md).

## What it does

- Private direct messages only (no public/general chat as a security feature)
- Real-time delivery via Socket.IO with room ACL
- Media uploads with magic-bytes checks; images re-encoded with Sharp
- Authenticated media serving (`GET /api/media/*`) — no public `express.static` on uploads
- Short-lived access JWT in memory; HttpOnly refresh cookie with rotation and reuse detection

## Verifiable security controls

| Control | Where |
|---------|--------|
| Shared AuthZ for DM list/create | `server/src/services/accessControl.ts` |
| Socket room allowlist (`user:` / `dm:`) | `server/src/socket/index.ts` |
| Client `mediaUrl` banned | socket + message controller |
| HttpOnly refresh + family revoke-on-reuse | `server/src/services/authService.ts` |
| Prod JWT secret entropy fail-closed | `server/src/middleware/requireStrongSecrets.ts` |
| Email only on own auth responses | serializers / `userPublicSelect` |
| Magic-bytes + Sharp image pipeline | `fileValidator.ts`, `uploadPipeline.ts` |
| Path-safe unlink | `server/src/utils/uploads.ts` |
| Threat model | [`SECURITY.md`](./SECURITY.md) |
| Text DM E2EE (scoped) | `src/features/e2ee/`, ADR [`docs/adr/0001-e2ee-scope.md`](./docs/adr/0001-e2ee-scope.md) |

## E2EE (text DMs)

Text DMs encrypt with WebCrypto when both sides have identity keys. A **lock** on a bubble means the payload on the server is an opaque envelope (`contentFormat: e2ee-v1`), not readable plaintext. Compare fingerprints in the peer profile out-of-band.

**Single-device caveat:** keys live in this browser profile (IndexedDB). A new device gets a new key; old messages will not decrypt there, and the peer sees a key-change warning until they explicitly trust the new key.

Media attachments stay **unencrypted** (server upload pipeline).

## Out of scope

Signal-style X3DH / Double Ratchet · multi-device sync · WAF · pin / edit / delete / read receipts (stripped)

## Stack

- Frontend: React, Vite, Zustand, TanStack Query, Axios, Socket.IO client
- Backend: Express 5, TypeScript, Prisma (SQLite), Socket.IO, Multer, Sharp, JWT, argon2id (bcrypt verify for legacy)
- Edge (compose): nginx reverse proxy serves the SPA with CSP and proxies `/api` + `/socket.io`

## Setup

```bash
npm install
cd server && npm install
cp .env.example .env   # set a strong JWT_SECRET
npx prisma migrate dev
npm run dev            # from server/
```

Frontend (repo root):

```bash
npm install
npm run dev
```

Open http://localhost:5173 — API defaults to http://localhost:5000.

### Environment

`server/.env`:

```bash
PORT=5000
CLIENT_URL=http://localhost:5173
DATABASE_URL=file:./prisma/webchat.db
JWT_SECRET=<at-least-32-chars-in-production>
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL_DAYS=7
COOKIE_SECURE=false
```

## Tests & CI

```bash
npm test                        # frontend unit tests (vitest)
npm run e2e                     # Playwright smoke (spins up server + vite)
cd server && npm run test:coverage  # server security/unit tests + coverage gate
cd server && npx tsc -p tsconfig.json --noEmit
npm run lint       # root
npm run semgrep    # SAST (JS/TS/Node/Express/OWASP/secrets + project rules)
npm run semgrep:ci # same packs; fail on ERROR severity
```

GitHub Actions (`.github/workflows/ci.yml`, SHA-pinned actions, least-privilege token):

- **frontend** — lint, unit tests, production build, blocking `npm audit --omit=dev --audit-level=high`
- **server** — typecheck, security/unit tests with coverage thresholds, blocking runtime-deps audit
- **e2e** — Playwright smoke: register → login → DM between two users → logout
- **docker** — multi-stage server image build (`Dockerfile`)
- **semgrep** — ERROR-severity gate + SARIF upload to code scanning
- **CodeQL** (`codeql.yml`) — weekly + per-PR JS/TS analysis

Dependabot watches npm (root + server), GitHub Actions, and the Docker base image weekly.

## Docker

```bash
# Full stack: API + nginx SPA proxy (CSP, /api + /socket.io)
export JWT_SECRET=<at-least-32-chars>
# Optional: CLIENT_URL=http://localhost  COOKIE_SECURE=true  PROXY_PORT=80
docker compose up -d --build
# Open http://localhost  (SPA same-origin → /api and /socket.io)

# Or build/run the API image alone:
docker build -t webchat-server .
docker run --rm -p 5000:5000 \
  -e JWT_SECRET=<at-least-32-chars> \
  -e CLIENT_URL=http://localhost:5173 \
  -v webchat-data:/data -v webchat-uploads:/app/uploads \
  webchat-server
```

If you change `PROXY_PORT`, set `CLIENT_URL` to the same browser origin (including port), e.g. `PROXY_PORT=8080` → `CLIENT_URL=http://localhost:8080`. Cookie-auth routes (`/api/auth/refresh`, `/api/auth/logout`) use an Origin allowlist against `CLIENT_URL` — a mismatch returns 403.

Compose services:

| Service | Role |
|---------|------|
| `server` | API + Socket.IO (internal only; `TRUST_PROXY=1` by default) |
| `proxy` | Multi-stage `Dockerfile.web` — Vite build + pinned nginx; CSP on SPA; proxies `/api` and `/socket.io` |

Dev without Docker still uses Vite (`npm run dev`) with its `/api` proxy — Playwright e2e stays on that path. Production SPA build leaves `VITE_API_URL` empty so the browser talks same-origin through nginx.

Behind TLS termination set `COOKIE_SECURE=true` and point `CLIENT_URL` at the public origin.

### Backup / restore

Online backup (correct under WAL — do not `cp` a live SQLite file):

```bash
docker compose exec server node scripts/backup.mjs
```

Writes `webchat-<ISO>/{webchat.db, uploads/}` under `BACKUP_DIR` (default `/backups`), pruning to `BACKUP_KEEP` (default 7).

Restore: stop the stack, copy a backup set's `webchat.db` into the data volume and `uploads/` into the uploads volume, then start again.

## License

MIT
