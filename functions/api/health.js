import { getDb } from './_db.js'

function isProduction(env) {
  return env?.ENVIRONMENT === 'production' || env?.NODE_ENV === 'production'
}

export async function onRequestGet({ env }) {
  const vars = {
    TIDB_HOST: !!env.TIDB_HOST,
    TIDB_USERNAME: !!env.TIDB_USERNAME,
    TIDB_PASSWORD: !!env.TIDB_PASSWORD,
    TIDB_DATABASE: !!env.TIDB_DATABASE,
  }

  const missing = Object.entries(vars)
    .filter(([, v]) => !v)
    .map(([k]) => k)

  if (missing.length > 0) {
    return Response.json({
      ok: false,
      error: `Environment variable tidak ditemukan: ${missing.join(', ')}`,
      vars,
    }, { status: 503 })
  }

  try {
    const db = getDb(env)
    await db.execute('SELECT 1')
    return Response.json({ ok: true, db: 'connected', vars })
  } catch (e) {
    const prod = isProduction(env)
    return Response.json({
      ok: false,
      error: prod ? 'Database tidak dapat diakses' : e.message,
      vars,
      hint: !prod && e.message?.includes('Access denied')
        ? 'Password salah atau IP Cloudflare Worker diblokir di TiDB IP Allowlist. Cek Settings → Security di TiDB Cloud Console dan set ke Allow All (0.0.0.0/0).'
        : null,
    }, { status: 503 })
  }
}
