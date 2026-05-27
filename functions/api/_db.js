function sanitize(value) {
  if (value === null || value === undefined) return 'NULL'
  if (typeof value === 'number') return String(value)
  if (typeof value === 'boolean') return value ? '1' : '0'
  const str = String(value)
    .replace(/\\/g, '\\\\')
    .replace(/\0/g, '\\0')
    .replace(/'/g, "\\'")
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
  return `'${str}'`
}

function formatSql(sql, params) {
  if (!params || params.length === 0) return sql
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
