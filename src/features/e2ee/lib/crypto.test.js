// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  decryptDm,
  encryptDm,
  exportPublicJwk,
  fingerprint,
  generateIdentityKeyPair,
  importPeerPublicJwk,
} from "./crypto.js";
import { b64ToBytes, bytesToB64, parseEnvelope } from "./envelope.js";

describe("e2ee crypto core", () => {
  it("round-trip both directions with same pair secret", async () => {
    const alice = await generateIdentityKeyPair();
    const bob = await generateIdentityKeyPair();
    const alicePub = await exportPublicJwk(alice);
    const bobPub = await exportPublicJwk(bob);

    const aToB = await encryptDm({
      myPrivate: alice.privateKey,
      peerPublicJwk: bobPub,
      senderId: "alice",
      receiverId: "bob",
      plaintext: "hello-bob",
    });
    expect(await decryptDm({
      myPrivate: bob.privateKey,
      peerPublicJwk: alicePub,
      senderId: "alice",
      receiverId: "bob",
      envelope: aToB,
    })).toBe("hello-bob");

    const bToA = await encryptDm({
      myPrivate: bob.privateKey,
      peerPublicJwk: alicePub,
      senderId: "bob",
      receiverId: "alice",
      plaintext: "hello-alice",
    });
    expect(await decryptDm({
      myPrivate: alice.privateKey,
      peerPublicJwk: bobPub,
      senderId: "bob",
      receiverId: "alice",
      envelope: bToA,
    })).toBe("hello-alice");
  });

  it("sender self-decrypts own envelope (history reload)", async () => {
    const alice = await generateIdentityKeyPair();
    const bob = await generateIdentityKeyPair();
    const bobPub = await exportPublicJwk(bob);

    const envelope = await encryptDm({
      myPrivate: alice.privateKey,
      peerPublicJwk: bobPub,
      senderId: "alice",
      receiverId: "bob",
      plaintext: "self-history",
    });

    expect(await decryptDm({
      myPrivate: alice.privateKey,
      peerPublicJwk: bobPub,
      senderId: "alice",
      receiverId: "bob",
      envelope,
    })).toBe("self-history");
  });

  it("tamper ct/iv/salt → DECRYPT_FAILED", async () => {
    const alice = await generateIdentityKeyPair();
    const bob = await generateIdentityKeyPair();
    const alicePub = await exportPublicJwk(alice);
    const bobPub = await exportPublicJwk(bob);

    const envelope = await encryptDm({
      myPrivate: alice.privateKey,
      peerPublicJwk: bobPub,
      senderId: "alice",
      receiverId: "bob",
      plaintext: "secret",
    });

    const flip = (field) => {
      const parsed = parseEnvelope(envelope);
      const bytes = b64ToBytes(parsed[field]);
      bytes[0] ^= 0xff;
      parsed[field] = bytesToB64(bytes);
      return JSON.stringify(parsed);
    };

    for (const field of /** @type {const} */ (["ct", "iv", "salt"])) {
      await expect(
        decryptDm({
          myPrivate: bob.privateKey,
          peerPublicJwk: alicePub,
          senderId: "alice",
          receiverId: "bob",
          envelope: flip(field),
        })
      ).rejects.toMatchObject({ code: "DECRYPT_FAILED" });
    }
  });

  it("AAD binding: swapped ids or third party fail", async () => {
    const alice = await generateIdentityKeyPair();
    const bob = await generateIdentityKeyPair();
    const carol = await generateIdentityKeyPair();
    const alicePub = await exportPublicJwk(alice);
    const bobPub = await exportPublicJwk(bob);

    const envelope = await encryptDm({
      myPrivate: alice.privateKey,
      peerPublicJwk: bobPub,
      senderId: "alice",
      receiverId: "bob",
      plaintext: "bound",
    });

    await expect(
      decryptDm({
        myPrivate: bob.privateKey,
        peerPublicJwk: alicePub,
        senderId: "bob",
        receiverId: "alice",
        envelope,
      })
    ).rejects.toMatchObject({ code: "DECRYPT_FAILED" });

    await expect(
      decryptDm({
        myPrivate: carol.privateKey,
        peerPublicJwk: alicePub,
        senderId: "alice",
        receiverId: "bob",
        envelope,
      })
    ).rejects.toMatchObject({ code: "DECRYPT_FAILED" });
  });

  it("fingerprint stable across export/import, differs between keys", async () => {
    const alice = await generateIdentityKeyPair();
    const bob = await generateIdentityKeyPair();
    const alicePubJwk = await exportPublicJwk(alice);
    const fp1 = await fingerprint(alice.publicKey);
    const reimported = await importPeerPublicJwk(alicePubJwk);
    const fp2 = await fingerprint(reimported);
    expect(fp1).toBe(fp2);
    expect(fp1).toMatch(
      /^[0-9a-f]{4}( [0-9a-f]{4}){7}$/
    );
    const bobFp = await fingerprint(bob.publicKey);
    expect(bobFp).not.toBe(fp1);
  });
});
