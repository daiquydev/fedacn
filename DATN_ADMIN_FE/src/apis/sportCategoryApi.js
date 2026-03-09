import http from '../utils/http'

const sportCategoryApi = {
    getAll: () => {
        return http.get('/admin/sport-categories')
    },
    create: (data) => {
        return http.post('/admin/sport-categories', data)
    },
    update: (id, data) => {
        return http.put(`/admin/sport-categories/${id}`, data)
    },
    // Soft delete (trash button)
    delete: (id) => {
        return http.delete(`/admin/sport-categories/${id}`)
    },
    // Restore soft-deleted category
    restore: (id) => {
        return http.patch(`/admin/sport-categories/${id}/restore`)
    }
}

export default sportCategoryApi
