import { useState, useEffect, useCallback } from 'react'

export function useApi(path) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/${path}`)
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Request gagal' }))
        throw new Error(err.error || 'Request gagal')
      }
      setData(await res.json())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [path])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { data, loading, error, refetch }
}

export async function apiRequest(method, path, body) {
  const options = { method, headers: {} }
  if (body !== undefined) {
    options.headers['Content-Type'] = 'application/json'
    options.body = JSON.stringify(body)
  }
  const res = await fetch(`/api/${path}`, options)
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request gagal' }))
    throw new Error(err.error || 'Request gagal')
  }
  if (res.status === 204) return null
  return res.json()
}
