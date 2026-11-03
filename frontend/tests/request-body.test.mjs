import assert from "node:assert/strict";
import test from "node:test";
import { BodyTooLargeError, readLimitedBody, readLimitedText } from "../lib/request-body.ts";

test("body limit counts UTF-8 bytes rather than string characters", async () => {
  await assert.rejects(readLimitedText(new Request("http://local", {
    method: "POST", body: "ééé",
  }), 5), BodyTooLargeError);
  assert.equal(await readLimitedText(new Request("http://local", {
    method: "POST", body: "éé",
  }), 4), "éé");
});

test("chunked bodies exceeding the limit are cancelled before buffering the rest", async () => {
  let cancelled = false;
  const body = new ReadableStream({
    pull(controller) { controller.enqueue(new Uint8Array(4)); },
    cancel() { cancelled = true; },
  });
  const request = new Request("http://local", { method: "POST", body, duplex: "half" });
  await assert.rejects(readLimitedBody(request, 5), BodyTooLargeError);
  assert.equal(cancelled, true);
});

test("declared oversized requests are rejected and empty bodies are accepted", async () => {
  await assert.rejects(readLimitedBody(new Request("http://local", {
    method: "POST", headers: { "Content-Length": "100" }, body: "x",
  }), 5), BodyTooLargeError);
  assert.equal((await readLimitedBody(new Request("http://local"), 5)).byteLength, 0);
});
