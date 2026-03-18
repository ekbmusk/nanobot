import client from './client'

export const aiAPI = {
  askQuestion: (payload) => client.post('/ai/ask', payload),
  getHistory: (telegramId) => client.get(`/ai/history/${telegramId}`),
  clearHistory: (telegramId) => client.delete(`/ai/history/${telegramId}`),
  getHint: (problemId, telegramId) =>
    client.post('/ai/hint', { problem_id: problemId, telegram_id: telegramId }),
}
