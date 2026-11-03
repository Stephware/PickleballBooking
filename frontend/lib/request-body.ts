/** Bound actual streamed bytes; Content-Length may be absent or untrusted. */
export class BodyTooLargeError extends Error {}

export async function readLimitedBody(request: Request, maxBytes: number): Promise<ArrayBuffer> {
  if (Number(request.headers.get("content-length")) > maxBytes)
    throw new BodyTooLargeError();
  const reader = request.body?.getReader();
  if (!reader) return new ArrayBuffer(0);
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel();
        throw new BodyTooLargeError();
      }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const result = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return result.buffer;
}

export async function readLimitedText(request: Request, maxBytes: number): Promise<string> {
  return new TextDecoder().decode(await readLimitedBody(request, maxBytes));
}
