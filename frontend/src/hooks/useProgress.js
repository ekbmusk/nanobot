import { useState, useCallback } from 'react'
import { progressAPI } from '../api/progress'
import { useUserStore } from '../store/userStore'

export function useProgress() {
  const { user } = useUserStore()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchProgress = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    setError(null)
    try {
      const data = await progressAPI.getUserProgress(user.id)
      setStats(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  const updateProgress = useCallback(async (topicId, score) => {
    if (!user?.id) return
    try {
      await progressAPI.updateProgress({ telegram_id: user.id, topic_id: topicId, score })
      await fetchProgress()
    } catch (err) {
      setError(err.message)
    }
  }, [user?.id, fetchProgress])

  return { stats, loading, error, fetchProgress, updateProgress }
}
