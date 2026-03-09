import http from '../utils/http'

export const getEquipment = () => http.get('/equipment')
