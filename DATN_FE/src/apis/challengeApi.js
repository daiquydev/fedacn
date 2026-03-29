import http from '../utils/http'

export const getChallenges = (params) => http.get('/challenges', { params })
export const getChallenge = (id) => http.get(`/challenges/${id}`)
export const createChallenge = (data) => http.post('/challenges', data)
export const updateChallenge = (id, data) => http.put(`/challenges/${id}`, data)
export const deleteChallenge = (id) => http.delete(`/challenges/${id}`)
export const joinChallenge = (id) => http.post(`/challenges/${id}/join`)
export const quitChallenge = (id) => http.post(`/challenges/${id}/quit`)
export const getMyChallenges = (params) => http.get('/challenges/my', { params })
export const getMyCreatedChallenges = (params) => http.get('/challenges/my-created', { params })
export const addChallengeProgress = (id, data) => http.post(`/challenges/${id}/progress`, data)
export const getChallengeProgress = (id, params) => http.get(`/challenges/${id}/progress`, { params })
export const getChallengeLeaderboard = (id, params) => http.get(`/challenges/${id}/leaderboard`, { params })
export const getChallengeParticipants = (id) => http.get(`/challenges/${id}/participants`)
export const getUserChallengeProgress = (challengeId, userId) => http.get(`/challenges/${challengeId}/progress/${userId}`)
export const getChallengeActivity = (challengeId, activityId) => http.get(`/challenges/${challengeId}/activity/${activityId}`)

// Soft-delete challenge progress entry
export const deleteChallengeProgress = (challengeId, progressId) =>
    http.patch(`/challenges/${challengeId}/progress/${progressId}/soft-delete`)

