import http from '../utils/http'

const sportCategoryApi = {
    getAll: () => {
        return http.get('/sport-categories')
    }
}

export default sportCategoryApi
