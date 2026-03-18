import client from './client'

const ADMIN_PREFIX = '/api/admin'

export const adminAPI = {
    login: (payload) => client.post(`${ADMIN_PREFIX}/login`, payload),

    getStats: () => client.get(`${ADMIN_PREFIX}/stats`),

    getProblems: (params) => client.get(`${ADMIN_PREFIX}/problems`, { params }),
    createProblem: (payload) => client.post(`${ADMIN_PREFIX}/problems`, payload),
    updateProblem: (id, payload) => client.put(`${ADMIN_PREFIX}/problems/${id}`, payload),
    deleteProblem: (id) => client.delete(`${ADMIN_PREFIX}/problems/${id}`),
    bulkProblems: (file) => {
        const form = new FormData()
        form.append('file', file)
        return client.post(`${ADMIN_PREFIX}/problems/bulk`, form, {
            headers: { 'Content-Type': 'multipart/form-data' },
        })
    },

    getTests: (params) => client.get(`${ADMIN_PREFIX}/tests`, { params }),
    syncTests: () => client.post(`${ADMIN_PREFIX}/tests/sync`),
    createTest: (payload) => client.post(`${ADMIN_PREFIX}/tests`, payload),
    updateTest: (id, payload) => client.put(`${ADMIN_PREFIX}/tests/${id}`, payload),
    deleteTest: (id) => client.delete(`${ADMIN_PREFIX}/tests/${id}`),

    getTheory: () => client.get(`${ADMIN_PREFIX}/theory`),
    updateTheory: (topicId, payload) => client.put(`${ADMIN_PREFIX}/theory/${topicId}`, payload),

    getUsers: (params) => client.get(`${ADMIN_PREFIX}/users`, { params }),
    getUserById: (id) => client.get(`${ADMIN_PREFIX}/users/${id}`),
    toggleUserBan: (id, payload) => client.patch(`${ADMIN_PREFIX}/users/${id}/ban`, payload),
    toggleNotifications: (id, payload) => client.patch(`${ADMIN_PREFIX}/users/${id}/notifications`, payload),
    exportUsers: () => client.get(`${ADMIN_PREFIX}/users/export`, { responseType: 'blob' }),

    sendBroadcast: (payload) => client.post(`${ADMIN_PREFIX}/broadcast`, payload),
    getBroadcastHistory: () => client.get(`${ADMIN_PREFIX}/broadcast/history`),
}