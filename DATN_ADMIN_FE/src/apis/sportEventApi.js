import http from '../utils/http'

const adminSportEventApi = {
    getAll: (params) => http.get('/admin/sport-events', { params }),
    getStats: () => http.get('/admin/sport-events/stats'),
    create: (data) => http.post('/admin/sport-events', data),
    update: (id, data) => http.put(`/admin/sport-events/${id}`, data),
    softDelete: (id) => http.delete(`/admin/sport-events/${id}`),
    restore: (id) => http.patch(`/admin/sport-events/${id}/restore`),
    hardDelete: (id) => http.delete(`/admin/sport-events/${id}/hard`)
}

export default adminSportEventApi
