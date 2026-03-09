import http from '../utils/http'

// Get all exercises
export const getAllExercises = () => http.get('/exercises')

// Filter exercises by equipment and muscles
export const filterExercises = (equipment, muscles) => {
    const params = {}
    if (equipment && equipment.length > 0) params.equipment = equipment.join(',')
    if (muscles && muscles.length > 0) params.muscles = muscles.join(',')
    return http.get('/exercises/filter', { params })
}

// Get single exercise
export const getExerciseById = (id) => http.get(`/exercises/${id}`)

// Smart workout: suggest exercises by target kcal
export const suggestExercisesByKcal = ({ kcal_target, equipment = [], muscles = [], duration_minutes = 45 }) =>
    http.post('/exercises/suggest-by-kcal', { kcal_target, equipment, muscles, duration_minutes })
