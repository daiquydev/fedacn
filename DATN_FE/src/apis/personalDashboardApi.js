import http from '../utils/http'

// Get personal dashboard stats overview
export const getPersonalDashboardStats = async () => {
  try {
    const response = await http.get('/personal-dashboard/stats')
    return response.data
  } catch (error) {
    console.error('Error fetching personal dashboard stats:', error)
    throw error
  }
}

// Get calories consumption history
export const getCaloriesHistory = async (days = 30) => {
  try {
    const response = await http.get('/personal-dashboard/calories-history', {
      params: { days }
    })
    return response.data
  } catch (error) {
    console.error('Error fetching calories history:', error)
    throw error
  }
}

// Get today's meals
export const getTodayMeals = async () => {
  try {
    const response = await http.get('/personal-dashboard/today-meals')
    return response.data
  } catch (error) {
    console.error('Error fetching today meals:', error)
    throw error
  }
}

// Get meal plan application history
export const getMealPlanHistory = async (page = 1, limit = 10) => {
  try {
    const response = await http.get('/personal-dashboard/meal-plan-history', {
      params: { page, limit }
    })
    return response.data
  } catch (error) {
    console.error('Error fetching meal plan history:', error)
    throw error
  }
}

// Get personal posts statistics
export const getPersonalPostsStats = async () => {
  try {
    const response = await http.get('/personal-dashboard/posts-stats')
    return response.data
  } catch (error) {
    console.error('Error fetching personal posts stats:', error)
    throw error
  }
}

// Get nutrition trend data
export const getNutritionTrend = async (days = 7) => {
  try {
    const response = await http.get('/personal-dashboard/nutrition-trend', {
      params: { days }
    })
    return response.data
  } catch (error) {
    console.error('Error fetching nutrition trend:', error)
    throw error
  }
}

// Get training summary overview (range: today | 7days | 1month | 6months | all; optional startDate/endDate YYYY-MM-DD)
export const getTrainingSummary = async (params = 'all') => {
  try {
    const q =
      typeof params === 'string'
        ? { range: params }
        : { range: params.range ?? 'all', ...(params.startDate && params.endDate ? { startDate: params.startDate, endDate: params.endDate } : {}) }
    const response = await http.get('/personal-dashboard/training-summary', { params: q })
    return response.data
  } catch (error) {
    console.error('Error fetching training summary:', error)
    throw error
  }
}    

