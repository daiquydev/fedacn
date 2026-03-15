import http from '../utils/http'

// ==================== CHALLENGE CRUD ====================
export const getHabitChallenges = (params) => http.get('/habit-challenges', { params })
export const getHabitChallenge = (id) => http.get(`/habit-challenges/${id}`)
export const createHabitChallenge = (data) => http.post('/habit-challenges', data)
export const updateHabitChallenge = (id, data) => http.put(`/habit-challenges/${id}`, data)
export const deleteHabitChallenge = (id) => http.delete(`/habit-challenges/${id}`)

// ==================== PARTICIPATION ====================
export const joinHabitChallenge = (id) => http.post(`/habit-challenges/${id}/join`)
export const quitHabitChallenge = (id) => http.post(`/habit-challenges/${id}/quit`)
export const setBuddy = (id, buddyId) => http.post(`/habit-challenges/${id}/set-buddy`, { buddyId })
export const getMyHabitChallenges = (params) => http.get('/habit-challenges/user/my-challenges', { params })
export const getParticipants = (id) => http.get(`/habit-challenges/${id}/participants`)

// ==================== CHECK-IN ====================
export const checkin = (id, data) => http.post(`/habit-challenges/${id}/checkin`, data)
export const getCheckins = (id, params) => http.get(`/habit-challenges/${id}/checkins`, { params })
export const getCheckinFeed = (id, params) => http.get(`/habit-challenges/${id}/checkins/feed`, { params })
export const likeCheckin = (id, checkinId) => http.post(`/habit-challenges/${id}/checkins/${checkinId}/like`)

// ==================== BADGES ====================
export const getUserBadges = () => http.get('/habit-challenges/user/badges')
export const getBadgesForChallenge = (id) => http.get(`/habit-challenges/${id}/badges`)

// ==================== NEW: XP & PROFILE ====================
export const getChallengeProfile = () => http.get('/habit-challenges/user/profile')
export const getLeaderboard = (params) => http.get('/habit-challenges/leaderboard', { params })
export const useStreakFreeze = (id) => http.post(`/habit-challenges/${id}/streak-freeze`)
