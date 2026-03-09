import http from '../utils/http'

// Admin APIs for workout management
export const adminGetEquipment = () => http.get('/admin/equipment')
export const adminCreateEquipment = (data) => http.post('/admin/equipment', data)
export const adminUpdateEquipment = (id, data) => http.put(`/admin/equipment/${id}`, data)
export const adminDeleteEquipment = (id) => http.delete(`/admin/equipment/${id}`)

export const adminGetMuscleGroups = () => http.get('/admin/muscle-groups')
export const adminCreateMuscleGroup = (data) => http.post('/admin/muscle-groups', data)
export const adminUpdateMuscleGroup = (id, data) => http.put(`/admin/muscle-groups/${id}`, data)
export const adminDeleteMuscleGroup = (id) => http.delete(`/admin/muscle-groups/${id}`)

export const adminGetExercises = (params) => http.get('/admin/exercises', { params })
export const adminCreateExercise = (data) => http.post('/admin/exercises', data)
export const adminUpdateExercise = (id, data) => http.put(`/admin/exercises/${id}`, data)
export const adminDeleteExercise = (id) => http.delete(`/admin/exercises/${id}`)
