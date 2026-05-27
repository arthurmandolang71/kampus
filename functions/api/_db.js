import { connect } from '@tidbcloud/serverless'

export function getDb(env) {
  return connect({
    host: env.TIDB_HOST,
    username: env.TIDB_USERNAME,
    password: env.TIDB_PASSWORD,
    database: env.TIDB_DATABASE,
  })
}
