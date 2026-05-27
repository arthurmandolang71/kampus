// TiDB Cloud HTTP API tidak mendukung prepared statements (placeholder `?`)
// secara native — request body hanya menerima { query }. Karena itu, kita
// melakukan binding manual dengan validasi ketat di sisi client agar tidak
// rentan SQL injection.

const MAX_STRING_LENGTH = 65535

function sanitizeString(value) {
  const str = String(value)
  if (str.length > MAX_STRING_LENGTH) {
    throw new Error('Parameter string melebihi batas panjang')
  }
  // Escape sesuai aturan MySQL string literal.
  // Catatan: kita tidak mendukung sql_mode NO_BACKSLASH_ESCAPES; TiDB Cloud
  // default tidak mengaktifkan mode tersebut.
  const escaped = str
    .replace(/\\/g, '\\\\')
    .replace(/\0/g, '\\0')
    .replace(/\x1a/g, '\\Z')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
  return `'${escaped}'`
}

function sanitize(value) {
  if (value === null || value === undefined) return 'NULL'
  if (typeof value === 'boolean') return value ? '1' : '0'
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new Error('Parameter number harus finite (bukan NaN/Infinity)')
    }
    return String(value)
  }
  if (typeof value === 'bigint') return value.toString()
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      throw new Error('Parameter Date tidak valid')
    }
    return sanitizeString(value.toISOString().slice(0, 19).replace('T', ' '))
  }
  if (typeof value === 'string') return sanitizeString(value)
  // Tolak tipe lain (object, array, function) untuk menghindari binding
  // yang tidak terduga.
  throw new Error(`Tipe parameter tidak didukung: ${typeof value}`)
}

function formatSql(sql, params) {
  const expected = (sql.match(/\?/g) || []).length
  if (expected !== params.length) {
    throw new Error(
      `Jumlah parameter tidak cocok: SQL butuh ${expected}, diberikan ${params.length}`
    )
  }
  if (expected === 0) return sql
  let i = 0
  return sql.replace(/\?/g, () => sanitize(params[i++]))
}

function parseRows(types, rawRows) {
  if (!Array.isArray(rawRows) || !Array.isArray(types)) return []
  return rawRows.map(rawRow =>
    types.reduce((obj, field, idx) => {
      obj[field.name] = rawRow[idx]
      return obj
    }, {})
  )
}

async function tidbExecute(env, sql) {
  const url = `https://http-${env.TIDB_HOST}/v1beta/sql`
  const auth = btoa(`${env.TIDB_USERNAME}:${env.TIDB_PASSWORD}`)

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${auth}`,
      'TiDB-Database': env.TIDB_DATABASE,
    },
    body: JSON.stringify({ query: sql }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message ?? `TiDB HTTP ${res.status}`)
  }

  return res.json()
}

export function getDb(env) {
  const missing = ['TIDB_HOST', 'TIDB_USERNAME', 'TIDB_PASSWORD', 'TIDB_DATABASE']
    .filter(k => !env[k])
  if (missing.length > 0) {
    throw new Error(`Environment variable tidak dikonfigurasi: ${missing.join(', ')}`)
  }
  return {
    async execute(sql, params) {
      const formatted = formatSql(sql, params ?? [])
      const resp = await tidbExecute(env, formatted)
      return parseRows(resp?.types, resp?.rows)
    },
  }
}
