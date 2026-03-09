import http from '../utils/http'

// Get all saved workouts for current user
export const getSavedWorkouts = () => http.get('/saved-workouts')

// Save a new workout template
export const createSavedWorkout = (data) => http.post('/saved-workouts', data)

// Update only the schedule of a saved workout
export const updateSavedWorkoutSchedule = (id, schedule) =>
    http.patch(`/saved-workouts/${id}/schedule`, { schedule })

// Delete a saved workout
export const deleteSavedWorkout = (id) => http.delete(`/saved-workouts/${id}`)

// Get expanded workout events for calendar for a date range
export const getWorkoutCalendarEvents = (startDate, endDate) =>
    http.get(`/saved-workouts/calendar?start_date=${startDate}&end_date=${endDate}`)
