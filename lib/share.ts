/**
 * Share a note as a URL with no server involved.
 *
 * The payload is deflated and base64url-encoded, then carried in the URL
 * *fragment* (`/read#…`). Fragments are never sent to the origin server, so a
 * shared note never appears in a request line, an access log, or a proxy cache.
 * Compression is done with the native CompressionStream API — no dependency.
 */

export type SharePayload = {
  /** Schema version, so old links keep working if the format changes. */
  v: 1
  /** Title. */
  t: string
  /** Markdown content. */
  c: string
}

/** Encoded payloads longer than this get a warning in the share dialog. */
export const SHARE_LENGTH_WARNING = 8000

/** Marks a deflated payload. */
const COMPRESSED = 'C'
/** Marks an uncompressed payload, used where CompressionStream is missing. */
const RAW = 'U'

export class ShareDecodeError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options)
    this.name = 'ShareDecodeError'
  }
}

function bytesToBase64Url(bytes: Uint8Array): string {
  // Chunked to avoid blowing the argument limit on large notes.
  const CHUNK = 0x8000
  let binary = ''
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK))
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64UrlToBytes(value: string): Uint8Array {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return bytes
}

async function pump(stream: ReadableStream<Uint8Array>): Promise<Uint8Array> {
  const reader = stream.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
    total += value.length
  }
  const out = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    out.set(chunk, offset)
    offset += chunk.length
  }
  return out
}

function transform(bytes: Uint8Array, stream: CompressionStream | DecompressionStream) {
  const writer = stream.writable.getWriter()
  // Not awaited: the reader below drains the other end concurrently, and awaiting
  // write() first can deadlock on a full internal queue.
  //
  // Both sides reject when the input is not valid deflate data. Swallowing the
  // writable rejections keeps that from surfacing as an unhandled rejection — the
  // readable side below still reports the failure to the caller.
  const ignore = () => {}
  void writer.write(bytes).catch(ignore)
  void writer.close().catch(ignore)
  return pump(stream.readable)
}

const hasCompression = () => typeof CompressionStream === 'function'

export async function encodeNote(note: { title: string; content: string }): Promise<string> {
  const payload: SharePayload = { v: 1, t: note.title, c: note.content }
  const bytes = new TextEncoder().encode(JSON.stringify(payload))
  if (!hasCompression()) return RAW + bytesToBase64Url(bytes)
  return COMPRESSED + bytesToBase64Url(await transform(bytes, new CompressionStream('deflate-raw')))
}

export async function decodeNote(encoded: string): Promise<SharePayload> {
  const trimmed = encoded.trim().replace(/^#/, '')
  if (!trimmed) throw new ShareDecodeError('This link has no note attached.')

  const marker = trimmed[0]
  const body = trimmed.slice(1)
  if (marker !== COMPRESSED && marker !== RAW) {
    throw new ShareDecodeError('This link is not a Margin share link.')
  }

  let json: string
  try {
    const bytes = base64UrlToBytes(body)
    const decoded =
      marker === COMPRESSED ? await transform(bytes, new DecompressionStream('deflate-raw')) : bytes
    json = new TextDecoder().decode(decoded)
  } catch (error) {
    throw new ShareDecodeError('This link looks corrupted or incomplete.', { cause: error })
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch (error) {
    throw new ShareDecodeError('This link looks corrupted or incomplete.', { cause: error })
  }

  if (!isSharePayload(parsed)) {
    throw new ShareDecodeError('This link uses an unsupported format.')
  }
  return parsed
}

function isSharePayload(value: unknown): value is SharePayload {
  if (typeof value !== 'object' || value === null) return false
  const payload = value as Record<string, unknown>
  return payload.v === 1 && typeof payload.t === 'string' && typeof payload.c === 'string'
}

export function buildShareUrl(origin: string, encoded: string) {
  return `${origin.replace(/\/$/, '')}/read#${encoded}`
}
