# Security Policy — Secure Chat Lab

## Threat model (STRIDE)

### Authentication & sessions

| STRIDE | Threat | Mitigation |
|--------|--------|------------|
| Spoofing | Stolen access JWT | Short-lived access token kept in memory only; bound to refresh `familyId` via `sid` claim |
| Spoofing | Stolen refresh token | HttpOnly cookie, `SameSite=Lax`, path `/api/auth` |
| Spoofing | Password offline crack | argon2id (`memoryCost: 19456`, `timeCost: 2`, `parallelism: 1`); transparent bcrypt→argon2id rehash on successful login. During migration, bcrypt-vs-argon2 timing difference vs the dummy pad is accepted. |
| Tampering | Refresh token reuse | Rotation + `familyId` revoke-on-reuse (1s grace so concurrent double-refresh does not kill the winner; losers get `REFRESH_CONCURRENT` without clearing the rotated cookie) |
| Tampering | CSRF on cookie endpoints | Data mutations are Bearer-only (no cookie auth); the two cookie-authenticated endpoints (`/refresh`, `/logout`) are protected by `SameSite=Lax` + an Origin allowlist (`requireSameOrigin`). Token-based CSRF middleware is intentionally not used — CodeQL's `js/missing-csrf-middleware` alert is dismissed with this rationale |
| Tampering | Access JWT after logout | In-memory revocation store: `revokeFamily(sid)` on per-device logout; `revokeAllForUser` (iat cutoff) on logout-everywhere; enforced in `protect` and socket handshake |
| Elevation | Cross-device logout blast | `POST /api/auth/logout` revokes only the presented refresh family; `POST /api/auth/logout-all` (Bearer) revokes all sessions |
| Elevation | Weak prod secrets | Fail-closed `JWT_SECRET` entropy check |
| Denial of service | Request floods | Per-IP rate limits on auth, refresh, logout, search, profile writes, reads (`readLimiter`), and media GETs (`mediaLimiter`). Behind nginx set `TRUST_PROXY=1` so limits key on the real client IP (not the proxy). |
| Denial of service / ops | Process crash / data loss | `docker-compose` `restart: unless-stopped`; online SQLite+uploads backup script; graceful-shutdown 10s exit fuse |
| Tampering / XSS | SPA script injection | nginx CSP on SPA responses (`script-src 'self'`; `style-src` allows `'unsafe-inline'` for React inline styles only) |

### Messages (REST)

| STRIDE | Threat | Mitigation |
|--------|--------|------------|
| Information disclosure | IDOR list/read DM | Shared `assertCanListDm`; `GET /api/messages?receiverId=` returns only the caller's thread with that peer (empty list is OK — not a cross-DM dump) |
| Tampering | Client-supplied `mediaUrl` | Ignored; media only from upload pipeline |
| Elevation | Public/general message surface | Wave 1 is private DM only |
| Elevation / abuse | Unwanted DMs | Block list enforced at `createMessage` choke point (both directions; same `DM_BLOCKED` either way so the response does not reveal who blocked whom). Existing history remains readable; blocked users stay visible in search. |

### Socket.IO

| STRIDE | Threat | Mitigation |
|--------|--------|------------|
| Spoofing | Unauthenticated socket | JWT required on handshake |
| Spoofing | Revoked access JWT reconnect | Handshake rejects revoked payloads with `TOKEN_REVOKED`; socket stores `data.sid` for per-device disconnect |
| Elevation | Arbitrary `join_room` | Allowlist `user:<self>` and canonical own `dm:a:b` (sorted ids only) |
| Tampering | Client `mediaUrl` on send | Ignored; text DM only via socket |
| Denial of service | Event flood | Per-user socket rate limit on `message_send` and `join_room` |
| Denial of service | Join phantom DM rooms | `join_room` requires allowlist + existing peer user id |

### Uploads

| STRIDE | Threat | Mitigation |
|--------|--------|------------|
| Tampering | MIME confusion | Magic-bytes check (`file-type`); stored extension from detected type, not client `originalname` |
| Tampering | Image polyglot / metadata | Sharp re-encode to WebP (animated preserved); `limitInputPixels` + max dimension resize |
| Tampering | Non-image avatar/banner | Profile uploads allow images only; separate avatar/banner size caps |
| Information disclosure | Public static uploads | No `express.static` on `/uploads`; authenticated `GET /api/media/*` |
| Information disclosure | IDOR on DM attachments | `media/` GETs require DM participant via `assertCanAccessMediaAttachment`; avatars/covers stay any-authenticated |
| Elevation | Path traversal on unlink/GET | Resolve under `uploads/` only; replace avatar/banner unlinks old file via `safeUnlinkFromServerRoot` |

## Controls mapping

| Threat | Control | Code |
|--------|---------|------|
| IDOR list DM | `assertCanListDm` — `?receiverId=` is caller's thread with peer only | `server/src/services/accessControl.ts`, `messageService.ts` |
| IDOR media attachment GET | `assertCanAccessMediaAttachment` (DM participants); avatars/covers auth-only | `server/src/routes/mediaRoutes.ts`, `accessControl.ts` |
| Arbitrary `join_room` | allowlist `user:` / `dm:` + peer exists + rate limit | `server/src/socket/index.ts`, `server/src/socket/rooms.ts` |
| Client `mediaUrl` | ignored; upload-only | `server/src/socket/index.ts`, `server/src/controllers/messageController.ts` |
| Refresh theft/reuse | HttpOnly + rotation + family revoke | `server/src/services/authService.ts`, `server/src/middleware/cookies.ts` |
| Password storage | argon2id + legacy bcrypt verify/migrate | `server/src/utils/passwords.ts`, `server/src/services/authService.ts` |
| Access JWT after logout | `sid`-bound access tokens + in-memory revocation | `server/src/services/tokenRevocation.ts`, `server/src/middleware/auth.ts`, `server/src/socket/index.ts` |
| Per-device / logout-everywhere | family-only logout vs `logout-all` | `server/src/services/authService.ts`, `server/src/controllers/authController.ts` |
| Unwanted DMs | block list at `createMessage` | `server/src/services/blockService.ts`, `server/src/services/messageService.ts` |
| Logout leaves socket open | per-family `disconnect` / `disconnectSockets` on `user:<id>` | `server/src/controllers/authController.ts`, `server/src/socket/index.ts` |
| Upload orphan on 4xx | `cleanupUploadsOnError` unlinks multer files when status ≥400 | `server/src/middleware/cleanupUploadsOnError.ts` |
| Upload type confusion | magic-bytes + sharp (`limitInputPixels`, resize, animated WebP); ext from `file-type` | `server/src/middleware/fileValidator.ts`, `server/src/services/uploadPipeline.ts` |
| Path traversal unlink | `safeUnlinkFromServerRoot` on profile replace | `server/src/utils/uploads.ts`, `server/src/services/authService.ts` |
| Public media scrape | authenticated media GET + DM ACL for `media/` | `server/src/routes/mediaRoutes.ts` |
| Weak JWT in prod | `assertStrongSecretsOrThrow` | `server/src/middleware/requireStrongSecrets.ts` |
| Email PII leak | public DTO without email | `server/src/utils/serializers.ts`, `server/src/services/dbShapes.ts` |
| SPA XSS / mixed content | nginx CSP + companion headers | `deploy/nginx/default.conf`, `Dockerfile.web` |
| Rate-limit IP collapse behind proxy | `TRUST_PROXY` → `app.set("trust proxy", 1)` | `server/src/config/env.ts`, `server/src/app.ts` |

## Out of scope

- End-to-end encryption (E2EE)
- WAF / CDN edge rules
- Email verification flows
- Distributed / multi-instance rate limiting or revocation stores (`express-rate-limit` and access-token revocation remain in-memory / single-instance; use `TRUST_PROXY=1` behind the compose nginx so per-IP limits see the real client)

## CI security gates

`.github/workflows/ci.yml` (SHA-pinned actions, top-level `permissions: contents: read`, per-ref concurrency):

- Blocking `npm audit --omit=dev --audit-level=high` for runtime deps (root + server); full audit stays informational
- Server tests run with coverage thresholds (regression floor)
- Playwright e2e smoke exercises the real auth/DM/logout flow
- Docker job builds the server image from `Dockerfile` (secrets/DBs excluded via `.dockerignore`)
- CodeQL (`codeql.yml`) analyzes JS/TS per PR and weekly; Semgrep uploads SARIF to code scanning

## Static analysis (Semgrep)

CI runs Semgrep on every push/PR (`.github/workflows/ci.yml`) with:

- Registry packs: `p/javascript`, `p/typescript`, `p/nodejs`, `p/expressjs`, `p/owasp-top-ten`, `p/secrets`
- Project rules: `.semgrep/rules/` (upload static serving, client `mediaUrl` persistence, hard-coded JWT secrets, media `sendFile` without DM ACL)
- Ignore policy: `.semgrepignore` (deps, build output, generated Prisma client, uploads — security tests under `server/src/__tests__/security` remain in scope)
- Gate: fails the job on **ERROR** severity findings

Locally (requires [Semgrep CLI](https://semgrep.dev/docs/getting-started/)):

```bash
npm run semgrep      # full report
npm run semgrep:ci   # ERROR-only, non-zero exit on findings
```

## Reporting

Please report vulnerabilities via GitHub Security Advisories for this repository, or contact the maintainer privately. Do not open public issues with exploit details until a fix is available.
