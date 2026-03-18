import client from './client'

export const usersAPI = {
  register: (payload) => client.post('/users/register', payload),
  setLevel: (telegram_id, level) => client.post('/users/level', { telegram_id, level }),
  toggleNotifications: (telegram_id, enabled) =>
    client.patch(`/users/${telegram_id}/notifications`, { enabled }),
}
