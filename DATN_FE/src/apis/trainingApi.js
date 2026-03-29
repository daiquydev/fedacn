import http from '../utils/http'

export const getTrainings = (params) => http.get('/trainings', { params })
export const getTraining = (id) => http.get(`/trainings/${id}`)
export const createTraining = (data) => http.post('/trainings', data)
export const updateTraining = (id, data) => http.put(`/trainings/${id}`, data)
export const deleteTraining = (id) => http.delete(`/trainings/${id}`)
export const joinTraining = (id) => http.post(`/trainings/${id}/join`)
export const quitTraining = (id) => http.post(`/trainings/${id}/quit`)
export const getMyTrainings = (params) => http.get('/trainings/my', { params })
export const getLeaderboard = (params) => http.get(`/trainings/${params.trainingId}/leaderboard`, { params })
