import client from './client'

export const problemsAPI = {
  getProblems: (params) => client.get('/problems', { params }),
  getProblem: (id) => client.get(`/problems/${id}`),
  checkAnswer: (id, answer) => client.post(`/problems/${id}/check`, { answer }),
}
