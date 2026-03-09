import http from '../utils/http'

export const getMuscleGroups = () => http.get('/muscle-groups')
