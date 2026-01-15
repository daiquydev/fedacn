import http from '../utils/http'

export const getUserMealSchedules = async (params = {}) => {
  try {
    const response = await http.get('/user-meal-schedules', { params })
    return response
  } catch (error) {
    console.error('Error fetching user meal schedules:', error)
    throw error
  }
}

export const getUserMealScheduleDetail = async (scheduleId) => {
  try {
    const response = await http.get(`/user-meal-schedules/${scheduleId}`)
    return response
  } catch (error) {
    console.error('Error fetching meal schedule detail:', error)
    throw error
  }
}

export const getActiveMealSchedule = async () => {
  try {
    const response = await http.get('/user-meal-schedules/active')
    return response?.data?.result || null
  } catch (error) {
    if (error.response?.status === 404) {
      return null
    }
    throw error
  }
}

export const completeMealItem = async (mealItemId) => {
  try {
    const response = await http.post('/user-meal-schedules/meal-items/complete', { meal_item_id: mealItemId })
    return response
  } catch (error) {
    console.error('Error completing meal item:', error)
    throw error
  }
}

export const skipMealItem = async (mealItemId, notes) => {
  try {
    const response = await http.post('/user-meal-schedules/meal-items/skip', {
      meal_item_id: mealItemId,
      notes
    })
    return response
  } catch (error) {
    console.error('Error skipping meal item:', error)
    throw error
  }
}

export const deleteUserMealSchedule = async (scheduleId) => {
  try {
    const response = await http.delete(`/user-meal-schedules/${scheduleId}`)
    return response
  } catch (error) {
    console.error('Error deleting meal schedule:', error)
    throw error
  }
}

export const getScheduleOverviewStats = async (scheduleId) => {
  try {
    const response = await http.get(`/user-meal-schedules/${scheduleId}/overview`)
    return response
  } catch (error) {
    console.error('Error fetching schedule overview stats:', error)
    throw error
  }
}

export const getScheduleProgressReport = async (scheduleId) => {
  try {
    const response = await http.get(`/user-meal-schedules/${scheduleId}/progress`)
    return response
  } catch (error) {
    console.error('Error fetching schedule progress report:', error)
    throw error
  }
}

export const getScheduleMealsByDay = async ({ scheduleId, date, dayNumber }) => {
  try {
    if (!scheduleId) throw new Error('scheduleId is required')
    const params = { schedule_id: scheduleId }
    if (Number.isFinite(dayNumber)) {
      params.day_number = dayNumber
    } else if (date) {
      params.date = date
    } else {
      throw new Error('Either date or dayNumber is required')
    }
    const response = await http.get('/user-meal-schedules/meal-items/day', { params })
    return response?.data?.result || []
  } catch (error) {
    console.error('Error fetching meals by day:', error)
    throw error
  }
}
