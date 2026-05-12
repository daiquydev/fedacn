import http from '../utils/http'

const sportCategoryApi = {
    getAll: () => {
        return http.get('/sport-categories')
    },
    /** Trả về TẤT CẢ danh mục kèm trường isDeleted — dùng để resolve tên hiển thị trên UI */
    getAllWithStatus: () => {
        return http.get('/sport-categories/all')
    }
}

export default sportCategoryApi
