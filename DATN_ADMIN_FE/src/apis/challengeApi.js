import http from '../utils/http'

const adminChallengeApi = {
    getAll: (params) => http.get('/admin/challenges', { params }),
    getStats: () => http.get('/admin/challenges/stats'),
    deleteChallenge: (id) => http.delete(`/admin/challenges/${id}`),
    // legacy alias
    forceCancel: (id) => http.delete(`/admin/challenges/${id}`),
    restore: (id) => http.patch(`/admin/challenges/${id}/restore`),
    getParticipants: (id) => http.get(`/admin/challenges/${id}/participants`),
    getLeaderboard: (id, params) => http.get(`/admin/challenges/${id}/leaderboard`, { params })
}

export default adminChallengeApi
