import client from './client'

export const testsAPI = {
  getTopics: () => client.get('/tests/topics'),
  getTest: (params) => client.get('/tests/random', { params }),
  getDailyTest: () => client.get('/tests/daily'),
  getDailyStatus: (telegramId) => client.get(`/tests/daily/status/${telegramId}`),
  submitTest: (payload) => client.post('/tests/submit', payload),
  getHistory: (telegramId) => client.get(`/tests/history/${telegramId}`),
}
