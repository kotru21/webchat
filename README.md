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

## Out of scope

E2EE · argon2 · WAF · full SPA CSP without reverse proxy · pin / edit / delete / read receipts (stripped)

## Stack

- Frontend: React, Vite, Zustand, TanStack Query, Axios, Socket.IO client
- Backend: Express 5, TypeScript, Prisma (SQLite), Socket.IO, Multer, Sharp, JWT, bcryptjs

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
cd server && npm test
cd server && npx tsc -p tsconfig.json --noEmit
npm run lint       # root
npm run semgrep    # SAST (JS/TS/Node/Express/OWASP/secrets + project rules)
npm run semgrep:ci # same packs; fail on ERROR severity
```

GitHub Actions runs lint, typecheck, security/unit tests, and Semgrep SAST. See `.github/workflows/ci.yml` and [`SECURITY.md`](./SECURITY.md).

## License

MIT
