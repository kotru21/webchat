# ADR 0001 — Scoped E2EE for text DMs

## Status

Accepted (Wave 3)

## Context

Wave 1–2 delivered a hardened *plaintext* private-DM AppSec lab. Reviewers and portfolio readers reasonably ask whether “secure chat” includes end-to-end encryption. Full messenger-grade E2EE (Signal X3DH + Double Ratchet, MLS, multi-device sync, sealed sender) is a large product surface that would dominate the lab and obscure the AuthZ / upload / session controls already documented in `SECURITY.md`.

We still need an honest browser E2EE story: what WebCrypto can protect, what it cannot, and how the client behaves under key change and key-stripping.

## Decision

Ship **scoped E2EE for text DMs only**:

1. **Static-static ECDH (P-256) + HKDF-SHA-256 + AES-GCM**, one identity key pair per logged-in account per browser profile (IndexedDB key `identity:<userId>`), per-message salt/IV. Envelope stored as `Message.content` with `contentFormat: "e2ee-v1"`.
2. **No Double Ratchet / X3DH / MLS** — no forward secrecy, no post-compromise security.
3. **TOFU pinning** of peer public keys in IndexedDB under `<ownerUserId>:<peerId>`, with hard-block on mismatch and **encrypt-lock** if a pinned peer’s key later 404s (downgrade resistance on the client).
4. **Media stays outside E2EE** — the wave-1 magic-bytes + Sharp pipeline remains the control for uploads.
5. **No new crypto dependencies** — WebCrypto only; server stores opaque strings and validates envelope/JWK *shape*.

## Consequences

### Positive

- Database dumps, stolen backups, and a passive/honest-but-curious server operator cannot read text DM *content*.
- Design is **stateless and multi-tab-safe**: both parties derive the same pair secret and can decrypt the whole thread (including the sender reloading history).
- Reviewable crypto surface (~hundreds of lines) instead of vendoring a protocol stack.
- Honest threat-model text in `SECURITY.md` / this ADR — no “military-grade” / “like Signal” claims.

### Negative / accepted risks

- Compromise of either party’s identity private key decrypts that pair’s **entire** E2EE history.
- Actively malicious server can still ship exfiltrating JS (CSP mitigates, does not eliminate). XSS and device compromise remain out of scope for E2EE.
- Metadata (who talks to whom, when, sizes) remains visible to the server.
- Single device per user: a new browser profile generates a new key; old ciphertext is unreadable there; peers see a key-change warning.
- Media messages remain plaintext on the server by design.

### Why these specifics

| Choice | Why |
|--------|-----|
| Static-static ECDH + HKDF vs Double Ratchet | Stateless, multi-tab, both-side history decrypt; FS/PCS explicitly traded away |
| P-256 vs X25519 | Universal WebCrypto support in browsers we target |
| TOFU + manual fingerprints vs key transparency | Fits a lab; no transparency log infrastructure |
| Encrypt-lock on 404 | Client-side answer to a key-stripping server; never silent downgrade once pinned |
| Media excluded | Keep wave-1 server-side content inspection pipeline |

## References

- `docs/WAVE3-PLAN.md` (normative crypto §3)
- `SECURITY.md` — E2EE (text DMs)
- `src/features/e2ee/lib/crypto.js`, `keyStore.js`
