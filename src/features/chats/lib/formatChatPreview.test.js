import { describe, expect, it } from "vitest";
import { resolveChatPreview, truncatePreview } from "./formatChatPreview.js";

const envelope = JSON.stringify({
  v: 1,
  alg: "ECDH-P256+HKDF-SHA256+A256GCM",
  salt: "aaa",
  iv: "bbb",
  ct: "ccc",
});

describe("resolveChatPreview", () => {
  it("shows plain text truncated", () => {
    const long = "a".repeat(40);
    expect(resolveChatPreview({ content: long, contentFormat: "plain" })).toEqual({
      kind: "text",
      text: truncatePreview(long),
    });
  });

  it("never surfaces e2ee envelope JSON as preview text", () => {
    const preview = resolveChatPreview({
      content: envelope,
      contentFormat: "e2ee-v1",
    });
    expect(preview.text).not.toContain('"v":1');
    expect(preview.text).not.toContain("ECDH");
    expect(preview).toEqual({
      kind: "e2ee-locked",
      text: "Зашифрованное сообщение",
    });
  });

  it("uses decrypted plaintext for e2ee when available", () => {
    expect(
      resolveChatPreview(
        { content: envelope, contentFormat: "e2ee-v1" },
        { decryptedText: "secret hello" }
      )
    ).toEqual({ kind: "text", text: "secret hello" });
  });

  it("shows pending placeholder while decrypting", () => {
    expect(
      resolveChatPreview(
        { content: envelope, contentFormat: "e2ee-v1" },
        { decryptPending: true }
      )
    ).toEqual({ kind: "e2ee-pending", text: "…" });
  });

  it("prefers media labels over content", () => {
    expect(
      resolveChatPreview({
        content: envelope,
        contentFormat: "e2ee-v1",
        mediaUrl: "/api/media/x",
        mediaType: "image",
      })
    ).toEqual({ kind: "image", text: "Изображение" });
  });
});
