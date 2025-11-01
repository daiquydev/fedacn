import { useState, useCallback } from 'react'
import { toast } from 'react-toastify'
import mealPlanApi from '../apis/mealPlanApi'

export const useMealPlans = () => {
  const [mealPlans, setMealPlans] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 1,
    total_items: 0,
    items_per_page: 10
  })

  const fetchMealPlans = useCallback(async (params = {}) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await mealPlanApi.getMealPlans(params)
      
      if (params.page > 1) {
        // Load more - append to existing data
        setMealPlans(prev => [...prev, ...response.data.result.meal_plans])
      } else {
        // New search/filter - replace data
        setMealPlans(response.data.result.meal_plans)
      }
      
      setPagination(response.data.result.pagination)
    } catch (err) {
      setError(err.response?.data?.message || err.message)
      toast.error('Không thể tải danh sách thực đơn')
    } finally {
      setLoading(false)
    }
  }, []) // Removed initialParams dependency

  const createMealPlan = async (data) => {
    try {
      setLoading(true)
      const response = await mealPlanApi.createMealPlan(data)
      toast.success('Tạo thực đơn thành công!')
      
      // Refresh danh sách
      await fetchMealPlans({ page: 1, limit: 12 })
      return response.data.result
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể tạo thực đơn')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const likeMealPlan = async (id) => {
    try {
      await mealPlanApi.likeMealPlan(id)
      
      // Update local state
      setMealPlans(prev => prev.map(plan => 
        plan._id === id 
          ? { ...plan, is_liked: true, likes_count: (plan.likes_count || 0) + 1 }
          : plan
      ))
      
      toast.success('Đã thích thực đơn!')
    } catch (err) {
      toast.error('Không thể thích thực đơn')
    }
  }

  const unlikeMealPlan = async (id) => {
    try {
      await mealPlanApi.unlikeMealPlan(id)
      
      // Update local state
      setMealPlans(prev => prev.map(plan => 
        plan._id === id 
          ? { ...plan, is_liked: false, likes_count: Math.max((plan.likes_count || 1) - 1, 0) }
          : plan
      ))
      
      toast.success('Đã bỏ thích thực đơn!')
    } catch (err) {
      toast.error('Không thể bỏ thích thực đơn')
    }
  }

  const bookmarkMealPlan = async (id, folder_name = '', notes = '') => {
    try {
      await mealPlanApi.bookmarkMealPlan(id, folder_name, notes)
      
      // Update local state
      setMealPlans(prev => prev.map(plan => 
        plan._id === id 
          ? { ...plan, is_bookmarked: true, bookmarks_count: (plan.bookmarks_count || 0) + 1 }
          : plan
      ))
      
      toast.success('Đã lưu thực đơn!')
    } catch (err) {
      toast.error('Không thể lưu thực đơn')
    }
  }

  const unbookmarkMealPlan = async (id) => {
    try {
      await mealPlanApi.unbookmarkMealPlan(id)
      
      // Update local state
      setMealPlans(prev => prev.map(plan => 
        plan._id === id 
          ? { ...plan, is_bookmarked: false, bookmarks_count: Math.max((plan.bookmarks_count || 1) - 1, 0) }
          : plan
      ))
      
      toast.success('Đã bỏ lưu thực đơn!')
    } catch (err) {
      toast.error('Không thể bỏ lưu thực đơn')
    }
  }

  return {
    mealPlans,
    loading,
    error,
    pagination,
    fetchMealPlans,
    createMealPlan,
    likeMealPlan,
    unlikeMealPlan,
    bookmarkMealPlan,
    unbookmarkMealPlan
  }
}