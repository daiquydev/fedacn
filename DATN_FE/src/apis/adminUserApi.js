import http from '../utils/http'

export const getUsersAdmin = (params = {}) => http.get('/admin', { params })
export const deleteUserAdmin = (id) => http.delete(`/admin/${id}`)
export const banUserAdmin = (userId) => http.put('/admin/ban', { user_id: userId })
export const unbanUserAdmin = (userId) => http.put('/admin/unban', { user_id: userId })
