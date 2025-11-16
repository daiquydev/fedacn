import http from '../utils/http'

// Lấy danh sách thực đơn đã bookmark
export const getBookmarkedMealPlans = async (params = {}) => {
  try {
    const response = await http.get('/meal-plans/bookmarked', { params })
    return response
  } catch (error) {
    console.error('Error fetching bookmarked meal plans:', error)
    throw error
  }
}

// Lấy danh sách thực đơn của tôi
export const getMyMealPlans = async (params = {}) => {
  try {
    const response = await http.get('/meal-plans/my', { params })
    return response
  } catch (error) {
    console.error('Error fetching my meal plans:', error)
    throw error
  }
}

// Lấy chi tiết thực đơn
export const getMealPlanDetail = async (id) => {
  try {
    const response = await http.get(`/meal-plans/${id}`)
    return response
  } catch (error) {
    console.error('Error fetching meal plan detail:', error)
    throw error
  }
}

// Tạo thực đơn mới
export const createMealPlan = async (data) => {
  try {
    const response = await http.post('/meal-plans', data)
    return response
  } catch (error) {
    console.error('Error creating meal plan:', error)
    throw error
  }
}

// Cập nhật thực đơn
export const updateMealPlan = async (id, data) => {
  try {
    const response = await http.put(`/meal-plans/${id}`, data)
    return response
  } catch (error) {
    console.error('Error updating meal plan:', error)
    throw error
  }
}

// Xóa thực đơn
export const deleteMealPlan = async (id) => {
  try {
    const response = await http.delete(`/meal-plans/${id}`)
    return response
  } catch (error) {
    console.error('Error deleting meal plan:', error)
    throw error
  }
}

// Like thực đơn
export const likeMealPlan = async (mealPlanId) => {
  try {
    const response = await http.post('/meal-plans/actions/like', { meal_plan_id: mealPlanId })
    return response
  } catch (error) {
    console.error('Error liking meal plan:', error)
    throw error
  }
}

// Unlike thực đơn
export const unlikeMealPlan = async (mealPlanId) => {
  try {
    const response = await http.post('/meal-plans/actions/unlike', { meal_plan_id: mealPlanId })
    return response
  } catch (error) {
    console.error('Error unliking meal plan:', error)
    throw error
  }
}

// Bookmark thực đơn
export const bookmarkMealPlan = async (mealPlanId, folderName, notes) => {
  try {
    const data = { meal_plan_id: mealPlanId }
    if (folderName) data.folder_name = folderName
    if (notes) data.notes = notes
    
    const response = await http.post('/meal-plans/actions/bookmark', data)
    return response
  } catch (error) {
    console.error('Error bookmarking meal plan:', error)
    throw error
  }
}

// Unbookmark thực đơn
export const unbookmarkMealPlan = async (mealPlanId) => {
  try {
    const response = await http.post('/meal-plans/actions/unbookmark', { meal_plan_id: mealPlanId })
    return response
  } catch (error) {
    console.error('Error unbookmarking meal plan:', error)
    throw error
  }
}

// Áp dụng thực đơn
export const applyMealPlan = async (mealPlanId, title, startDate, targetWeight, notes, reminders) => {
  try {
    const data = {
      meal_plan_id: mealPlanId,
      title,
      start_date: startDate
    }
    if (targetWeight) data.target_weight = targetWeight
    if (notes) data.notes = notes
    if (reminders) data.reminders = reminders
    
    const response = await http.post('/meal-plans/actions/apply', data)
    return response
  } catch (error) {
    console.error('Error applying meal plan:', error)
    throw error
  }
}

// Chia sẻ thực đơn lên trang cá nhân
export const shareMealPlan = async ({ mealPlanId, content, privacy = '0' }) => {
  try {
    const response = await http.post('/posts/actions/share-meal-plan', {
      meal_plan_id: mealPlanId,
      content,
      privacy
    })
    return response
  } catch (error) {
    console.error('Error sharing meal plan:', error)
    throw error
  }
}

// Comment thực đơn
export const commentMealPlan = async (mealPlanId, content, parentId) => {
  try {
    const data = {
      meal_plan_id: mealPlanId,
      content
    }
    if (parentId) data.parent_id = parentId
    
    const response = await http.post('/meal-plans/actions/comment', data)
    return response
  } catch (error) {
    console.error('Error commenting meal plan:', error)
    throw error
  }
}

// Lấy comment của thực đơn
export const getMealPlanComments = async (mealPlanId, params = {}) => {
  try {
    const response = await http.get(`/meal-plans/${mealPlanId}/comments`, { params })
    return response
  } catch (error) {
    console.error('Error fetching meal plan comments:', error)
    throw error
  }
}

// Lấy danh sách thực đơn công khai
export const getPublicMealPlans = async (params = {}) => {
  try {
    const response = await http.get('/meal-plans/public', { params })
    return response
  } catch (error) {
    console.error('Error fetching public meal plans:', error)
    throw error
  }
}

// Lấy thực đơn nổi bật
export const getFeaturedMealPlans = async (params = {}) => {
  try {
    const response = await http.get('/meal-plans/featured', { params })
    return response
  } catch (error) {
    console.error('Error fetching featured meal plans:', error)
    throw error
  }
}

// Lấy thực đơn thịnh hành
export const getTrendingMealPlans = async (params = {}) => {
  try {
    const response = await http.get('/meal-plans/trending', { params })
    return response
  } catch (error) {
    console.error('Error fetching trending meal plans:', error)
    throw error
  }
}
