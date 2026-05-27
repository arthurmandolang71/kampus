// CORS middleware
// - Frontend di-serve dari origin yang sama dengan API (Cloudflare Pages),
//   sehingga request normal tidak butuh CORS sama sekali.
// - Untuk preview deploy atau dev lokal lintas-origin, daftar origin yang
//   diizinkan bisa diatur via env `CORS_ALLOWED_ORIGINS` (comma-separated).
// - Tidak menggunakan wildcard `*` agar tidak membuka API ke origin pihak
//   ketiga sembarangan, meskipun saat ini belum ada auth.

const DEFAULT_DEV_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:8788',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:8788',
]

function allowedOrigins(env) {
  const fromEnv = (env?.CORS_ALLOWED_ORIGINS ?? '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
  return new Set([...DEFAULT_DEV_ORIGINS, ...fromEnv])
}

function corsHeadersFor(request, env) {
  const origin = request.headers.get('Origin')
  const headers = {
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  }
  if (origin && allowedOrigins(env).has(origin)) {
    headers['Access-Control-Allow-Origin'] = origin
  }
  return headers
}

export async function onRequest({ request, env, next }) {
  const cors = corsHeadersFor(request, env)

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors })
  }

  const response = await next()
  const newHeaders = new Headers(response.headers)
  Object.entries(cors).forEach(([k, v]) => newHeaders.set(k, v))
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  })
}
