const MAX_JSON_BYTES = 64 * 1024
const PROD_ERROR_MSG = 'Terjadi kesalahan pada server'

function isProduction(env) {
  return env?.ENVIRONMENT === 'production' || env?.NODE_ENV === 'production'
}

export function parseId(raw) {
  if (raw === undefined || raw === null || raw === '') return null
  const n = Number(raw)
  if (!Number.isInteger(n) || n <= 0 || n > Number.MAX_SAFE_INTEGER) return null
  return n
}

export async function readJson(request) {
  const contentLength = Number(request.headers.get('content-length') ?? 0)
  if (contentLength > MAX_JSON_BYTES) {
    const err = new Error('Payload terlalu besar')
    err.status = 413
    throw err
  }
  try {
    return await request.json()
  } catch {
    const err = new Error('Body JSON tidak valid')
    err.status = 400
    throw err
  }
}

export function errorResponse(err, env) {
  const status = err?.status ?? 500
  // Error 4xx (kesalahan klien) selalu menampilkan pesan asli karena tidak
  // membocorkan internal. Error 5xx di-mask di production agar tidak
  // membocorkan struktur DB/koneksi.
  const message = status >= 500 && isProduction(env)
    ? PROD_ERROR_MSG
    : (err?.message ?? PROD_ERROR_MSG)
  return Response.json({ error: message }, { status })
}

export function badRequest(message) {
  return Response.json({ error: message }, { status: 400 })
}

export function notFound(message = 'Tidak ditemukan') {
  return Response.json({ error: message }, { status: 404 })
}

export function isDuplicateError(e) {
  return typeof e?.message === 'string' && e.message.includes('Duplicate')
}
