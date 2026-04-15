import http from '../utils/http'

export const getChallenges = (params) => http.get('/challenges', { params })
export const getChallengeFeed = (params) => http.get('/challenges/feed', { params })
export const getChallenge = (id) => http.get(`/challenges/${id}`)
export const createChallenge = (data) => http.post('/challenges', data)
export const updateChallenge = (id, data) => http.put(`/challenges/${id}`, data)
export const deleteChallenge = (id) => http.delete(`/challenges/${id}`)
export const reportChallenge = (id, body) => http.post(`/challenges/${id}/report`, body)
export const joinChallenge = (id) => http.post(`/challenges/${id}/join`)
export const quitChallenge = (id) => http.post(`/challenges/${id}/quit`)
export const inviteFriendToChallenge = (challengeId, friendId) => http.post(`/challenges/${challengeId}/invite`, { friendId })
export const getMyChallenges = (params) => http.get('/challenges/my', { params })
export const getMyCreatedChallenges = (params) => http.get('/challenges/my-created', { params })
export const getChallengeStats = (params) => http.get('/challenges/stats', { params })
export const getPublicUserChallenges = (userId, params) => http.get(`/challenges/user/${userId}/joined`, { params })
export const addChallengeProgress = (id, data) => http.post(`/challenges/${id}/progress`, data)
export const getChallengeProgress = (id, params) => http.get(`/challenges/${id}/progress`, { params })
export const getChallengeLeaderboard = (id, params) => http.get(`/challenges/${id}/leaderboard`, { params })
export const getChallengeParticipants = (id) => http.get(`/challenges/${id}/participants`)
export const getUserChallengeProgress = (challengeId, userId) => http.get(`/challenges/${challengeId}/progress/${userId}`)
export const getChallengeActivity = (challengeId, activityId) => http.get(`/challenges/${challengeId}/activity/${activityId}`)
export const getChallengeProgressEntry = (challengeId, progressId) => http.get(`/challenges/${challengeId}/progress-entry/${progressId}`)

// Soft-delete challenge progress entry
export const deleteChallengeProgress = (challengeId, progressId) =>
    http.patch(`/challenges/${challengeId}/progress/${progressId}/soft-delete`)

// AI review meal image against challenge requirements
export const reviewMealImageAI = (data) => http.post('/ai/review-meal-image', data)

// Day Comments
export const createChallengeDayComment = (challengeId, body) =>
  http.post(`/challenges/${challengeId}/day-comments`, body)
export const getChallengeDayComments = (challengeId, params) =>
  http.get(`/challenges/${challengeId}/day-comments`, { params })
export const getChallengeDayChildComments = (challengeId, commentId, params) =>
  http.get(`/challenges/${challengeId}/day-comments/${commentId}/replies`, { params })
export const deleteChallengeDayComment = (challengeId, commentId) =>
  http.delete(`/challenges/${challengeId}/day-comments/${commentId}`)
