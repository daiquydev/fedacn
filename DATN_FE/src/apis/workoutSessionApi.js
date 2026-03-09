import http from '../utils/http'

// Create workout session
export const createWorkoutSession = (data) => http.post('/workout-sessions', data)

// Update workout session
export const updateWorkoutSession = (id, data) => http.put(`/workout-sessions/${id}`, data)

// Complete workout session
export const completeWorkoutSession = (id, data) => http.put(`/workout-sessions/${id}/complete`, data)

// Quit workout session
export const quitWorkoutSession = (id) => http.put(`/workout-sessions/${id}/quit`)

// Get workout history
export const getWorkoutHistory = (params) => http.get('/workout-sessions/history', { params })

// Get single session
export const getWorkoutSession = (id) => http.get(`/workout-sessions/${id}`)
