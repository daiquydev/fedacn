import http from '../utils/http'

// Start a new personal activity
export const startPersonalActivity = (data) => http.post('/personal-activities', data)

// Update personal activity (auto-save GPS data)
export const updatePersonalActivity = (activityId, data) => http.put(`/personal-activities/${activityId}`, data)

// Complete personal activity
export const completePersonalActivity = (activityId, data) => http.post(`/personal-activities/${activityId}/complete`, data)

// Discard personal activity
export const discardPersonalActivity = (activityId) => http.post(`/personal-activities/${activityId}/discard`)

// Get user's personal activities
export const getUserPersonalActivities = (params) => http.get('/personal-activities', { params })
