import { connect } from '@tidbcloud/serverless'

function normalizeRows(result) {
  if (Array.isArray(result)) return result
  if (result && Array.isArray(result.rows)) return result.rows
  return []
}

export function getDb(env) {
  const client = connect({
    host: env.TIDB_HOST,
    username: env.TIDB_USERNAME,
    password: env.TIDB_PASSWORD,
    database: env.TIDB_DATABASE,
  })

  return {
    async execute(sql, params) {
      const result = await client.execute(sql, params ?? [])
      return normalizeRows(result)
    },
  }
}
