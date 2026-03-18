import client from './client'

export const progressAPI = {
  getUserProgress: (telegramId) => client.get(`/progress/${telegramId}`),
  updateProgress: (payload) => client.post('/progress/update', payload),
}
