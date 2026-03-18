import client from './client'

export const ratingAPI = {
  getLeaderboard: (params) => client.get('/rating/leaderboard', { params }),
  getMyRank: (telegramId) => client.get(`/rating/rank/${telegramId}`),
}
