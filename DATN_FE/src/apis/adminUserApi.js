import http from '../utils/http'

export const getUsersAdmin = (params = {}) => http.get('/admin', { params })
export const deleteUserAdmin = (id) => http.delete(`/admin/${id}`)
