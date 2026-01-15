import http from '../utils/http'

const mealPlanApi = {
  // Lấy danh sách thực đơn công khai
  getMealPlans(params = {}) {
    return http.get('/meal-plans/public', { params })
  },

  // Lấy chi tiết thực đơn
  getMealPlanDetail(id) {
    return http.get(`/meal-plans/${id}`)
  },

  // Tạo thực đơn mới
  createMealPlan(data) {
    return http.post('/meal-plans', data)
  },

  // Cập nhật thực đơn
  updateMealPlan(id, data) {
    return http.put(`/meal-plans/${id}`, data)
  },

  // Xóa thực đơn
  deleteMealPlan(id) {
    return http.delete(`/meal-plans/${id}`)
  },

  // Lấy thực đơn của tôi
  getMyMealPlans(params = {}) {
    return http.get('/meal-plans/my', { params })
  },

  // Like/Unlike thực đơn
  likeMealPlan(mealPlanId) {
    return http.post('/meal-plans/actions/like', { meal_plan_id: mealPlanId })
  },

  unlikeMealPlan(mealPlanId) {
    return http.post('/meal-plans/actions/unlike', { meal_plan_id: mealPlanId })
  },

  // Bookmark/Unbookmark thực đơn
  bookmarkMealPlan(mealPlanId, folderName = '', notes = '') {
    return http.post('/meal-plans/actions/bookmark', { 
      meal_plan_id: mealPlanId,
      folder_name: folderName,
      notes: notes
    })
  },

  unbookmarkMealPlan(mealPlanId) {
    return http.post('/meal-plans/actions/unbookmark', { meal_plan_id: mealPlanId })
  },

  // Lấy thực đơn đã bookmark
  getBookmarkedMealPlans(params = {}) {
    return http.get('/meal-plans/bookmarked', { params })
  },

  // Bình luận thực đơn
  commentMealPlan(mealPlanId, content, parentId = null) {
    return http.post('/meal-plans/actions/comment', {
      meal_plan_id: mealPlanId,
      content: content,
      parent_id: parentId
    })
  },

  // Lấy bình luận thực đơn
  getMealPlanComments(id, params = {}) {
    return http.get(`/meal-plans/${id}/comments`, { params })
  },

  // Áp dụng thực đơn vào lịch
  applyMealPlan(mealPlanId, data) {
    return http.post('/meal-plans/actions/apply', {
      meal_plan_id: mealPlanId,
      ...data
    })
  },

  // Lấy thực đơn phổ biến
  getPopularMealPlans(params = {}) {
    return http.get('/meal-plans/popular', { params })
  },

  // Lấy thực đơn đã thích
  getLikedMealPlans(params = {}) {
    return http.get('/meal-plans/liked', { params })
  },

  // Lấy thông tin bạn bè áp dụng & lời mời
  getMealPlanSocialContext(id) {
    return http.get(`/meal-plans/${id}/social-context`)
  },

  // Gửi lời mời tham gia thực đơn
  inviteFriendToMealPlan(mealPlanId, friendId, note = '') {
    const payload = { friend_id: friendId }
    if (note?.trim()) payload.note = note.trim()
    return http.post(`/meal-plans/${mealPlanId}/invites`, payload)
  }
}

export default mealPlanApi