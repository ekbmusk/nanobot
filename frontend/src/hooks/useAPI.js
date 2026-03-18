import { useState, useCallback } from 'react'

/**
 * Generic API hook for loading states and error handling.
 * Usage:
 *   const { data, loading, error, execute } = useAPI(theoryAPI.getTopics)
 */
export function useAPI(apiFn) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const execute = useCallback(async (...args) => {
    setLoading(true)
    setError(null)
    try {
      const result = await apiFn(...args)
      setData(result)
      return result
    } catch (err) {
      const msg = err?.response?.data?.detail || err.message || 'Қате орын алды'
      setError(msg)
      return null
    } finally {
      setLoading(false)
    }
  }, [apiFn])

  const reset = useCallback(() => {
    setData(null)
    setError(null)
  }, [])

  return { data, loading, error, execute, reset }
}
