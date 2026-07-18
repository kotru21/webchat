# Security Policy — Secure Chat Lab

## Threat model (STRIDE)

### Authentication & sessions

| STRIDE | Threat | Mitigation |
|--------|--------|------------|
| Spoofing | Stolen access JWT | Short-lived access token kept in memory only |
| Spoofing | Stolen refresh token | HttpOnly cookie, `SameSite=Lax`, path `/api/auth` |
| Tampering | Refresh token reuse | Rotation + `familyId` revoke-on-reuse (1s grace so concurrent double-refresh does not kill the winner) |
| Elevation | Weak prod secrets | Fail-closed `JWT_SECRET` entropy check |

### Messages (REST)

| STRIDE | Threat | Mitigation |
|--------|--------|------------|
| Information disclosure | IDOR list/read DM | Shared `assertCanListDm`; `GET /api/messages?receiverId=` returns only the caller's thread with that peer (empty list is OK — not a cross-DM dump) |
| Tampering | Client-supplied `mediaUrl` | Ignored; media only from upload pipeline |
| Elevation | Public/general message surface | Wave 1 is private DM only |

### Socket.IO

| STRIDE | Threat | Mitigation |
|--------|--------|------------|
| Spoofing | Unauthenticated socket | JWT required on handshake |
| Elevation | Arbitrary `join_room` | Allowlist `user:<self>` and canonical own `dm:a:b` (sorted ids only) |
| Tampering | Client `mediaUrl` on send | Ignored; text DM only via socket |
| Denial of service | Event flood | Per-user socket rate limit |

### Uploads

| STRIDE | Threat | Mitigation |
|--------|--------|------------|
| Tampering | MIME confusion | Magic-bytes check (`file-type`) |
| Tampering | Image polyglot / metadata | Sharp re-encode to WebP for images |
| Information disclosure | Public static uploads | No `express.static` on `/uploads`; authenticated `GET /api/media/*` |
| Information disclosure | IDOR on DM attachments | `media/` GETs require DM participant via `assertCanAccessMediaAttachment`; avatars/banners stay any-authenticated |
| Elevation | Path traversal on unlink/GET | Resolve under `uploads/` only |

## Controls mapping

| Threat | Control | Code |
|--------|---------|------|
| IDOR list DM | `assertCanListDm` — `?receiverId=` is caller's thread with peer only | `server/src/services/accessControl.ts`, `messageService.ts` |
| IDOR media attachment GET | `assertCanAccessMediaAttachment` (DM participants); avatars/banners auth-only | `server/src/routes/mediaRoutes.ts`, `accessControl.ts` |
| Arbitrary `join_room` | allowlist `user:` / `dm:` | `server/src/socket/index.ts`, `server/src/socket/rooms.ts` |
| Client `mediaUrl` | ignored; upload-only | `server/src/socket/index.ts`, `server/src/controllers/messageController.ts` |
| Refresh theft/reuse | HttpOnly + rotation + family revoke | `server/src/services/authService.ts`, `server/src/middleware/cookies.ts` |
| Upload type confusion | magic-bytes + sharp | `server/src/middleware/fileValidator.ts`, `server/src/services/uploadPipeline.ts` |
| Path traversal unlink | `safeUnlinkFromServerRoot` | `server/src/utils/uploads.ts` |
| Public media scrape | authenticated media GET + DM ACL for `media/` | `server/src/routes/mediaRoutes.ts` |
| Weak JWT in prod | `assertStrongSecretsOrThrow` | `server/src/middleware/requireStrongSecrets.ts` |
| Email PII leak | public DTO without email | `server/src/utils/serializers.ts`, `server/src/services/dbShapes.ts` |

## Out of scope (wave 1)

- End-to-end encryption (E2EE)
- argon2 (bcrypt remains)
- WAF / CDN edge rules
- Full SPA Content-Security-Policy without reverse-proxy story
- Email verification flows

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
