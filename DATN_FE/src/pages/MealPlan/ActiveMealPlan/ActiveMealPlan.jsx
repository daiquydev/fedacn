import { useEffect, useMemo, useState } from 'react'
import { FaCalendarAlt, FaCheckCircle, FaClock, FaExclamationTriangle, FaChevronLeft, FaTimesCircle } from 'react-icons/fa'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import {
  getActiveMealSchedule,
  getUserMealScheduleDetail,
  deleteUserMealSchedule,
  getScheduleOverviewStats,
  completeMealItem,
  skipMealItem
} from '../../../services/userMealScheduleService'
import { getMealPlanDetail } from '../../../services/mealPlanService'
import Loading from '../../../components/GlobalComponents/Loading'

const STATUS_BADGES = {
  0: { label: 'Đang áp dụng', className: 'bg-emerald-100 text-emerald-700' },
  1: { label: 'Hoàn thành', className: 'bg-blue-100 text-blue-700' },
  2: { label: 'Tạm dừng', className: 'bg-amber-100 text-amber-700' },
  3: { label: 'Hủy', className: 'bg-gray-200 text-gray-600' }
}

const formatDate = (value) => {
  if (!value) return 'Không xác định'
  const date = new Date(value)
  return new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date)
}

export default function ActiveMealPlan() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [scheduleDetail, setScheduleDetail] = useState(null)
  const [linkedPlan, setLinkedPlan] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [mealsForDate, setMealsForDate] = useState([])
  const [overviewStats, setOverviewStats] = useState(null)
  const [progressReport, setProgressReport] = useState(null)
  const [cancelling, setCancelling] = useState(false)
  const todayKey = useMemo(() => new Date().toISOString().split('T')[0], [])

  const fetchActiveSchedule = async () => {
    try {
      setLoading(true)
      const activeSchedule = await getActiveMealSchedule()
      if (!activeSchedule) {
        setErrorMessage('Bạn chưa áp dụng thực đơn nào gần đây. Hãy áp dụng một thực đơn để bắt đầu theo dõi.')
        setScheduleDetail(null)
        setLinkedPlan(null)
        return
      }

      const detailResponse = await getUserMealScheduleDetail(activeSchedule._id)
      const detail = detailResponse.data?.result
      setScheduleDetail(detail)

      const mealPlanId = detail?.meal_plan_id?._id || detail?.meal_plan_id
      if (mealPlanId) {
        const planResponse = await getMealPlanDetail(mealPlanId)
        setLinkedPlan(planResponse.data?.result ?? null)
      } else {
        setLinkedPlan(null)
      }

      try {
        const overviewResponse = await getScheduleOverviewStats(activeSchedule._id)
        const statsPayload = overviewResponse.data?.result || null
        setOverviewStats(statsPayload)
        setProgressReport(statsPayload)
      } catch (statsError) {
        console.error('Error loading schedule stats:', statsError)
        setOverviewStats(null)
        setProgressReport(null)
      }

      const availableDates = Object.keys(detail?.meals_by_date || {}).sort()
      const initialDate = availableDates.includes(todayKey) ? todayKey : availableDates[0] || ''
      setSelectedDate(initialDate)
      setErrorMessage('')
    } catch (error) {
      console.error('Error fetching active meal schedule detail:', error)
      setErrorMessage('Không thể tải thực đơn đang áp dụng. Vui lòng thử lại sau.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchActiveSchedule()
  }, [])

  useEffect(() => {
    if (!scheduleDetail?.meals_by_date) {
      setMealsForDate([])
      return
    }

    if (selectedDate && scheduleDetail.meals_by_date[selectedDate]) {
      setMealsForDate(scheduleDetail.meals_by_date[selectedDate])
      return
    }

    const fallbackDates = Object.keys(scheduleDetail.meals_by_date).sort()
    if (!fallbackDates.length) {
      setMealsForDate([])
      if (selectedDate) {
        setSelectedDate('')
      }
      return
    }

    setSelectedDate(fallbackDates[0])
    setMealsForDate(scheduleDetail.meals_by_date[fallbackDates[0]])
  }, [selectedDate, scheduleDetail])

  const progressStats = useMemo(() => {
    if (!scheduleDetail?.meals_by_date) return { total: 0, completed: 0 }
    const allItems = Object.values(scheduleDetail.meals_by_date).flat()
    const total = allItems.length
    const completed = allItems.filter((item) => item.status === 1 || item.status === 'completed').length
    return { total, completed }
  }, [scheduleDetail])

  const todaysNutrition = useMemo(() => {
    if (!mealsForDate.length) {
      return { calories: 0, protein: 0, carbs: 0, fat: 0 }
    }
    return mealsForDate.reduce(
      (acc, meal) => ({
        calories: acc.calories + (meal.calories || meal.recipe_id?.calories || 0),
        protein: acc.protein + (meal.protein || meal.recipe_id?.protein || 0),
        carbs: acc.carbs + (meal.carbs || meal.recipe_id?.carbohydrate || 0),
        fat: acc.fat + (meal.fat || meal.recipe_id?.fat || 0)
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    )
  }, [mealsForDate])

  const handleCancelSchedule = async () => {
    if (!scheduleDetail?._id) return
    const confirmed = window.confirm('Bạn chắc chắn muốn bỏ áp dụng thực đơn này? Những bữa ăn đã lên lịch sẽ bị xóa.')
    if (!confirmed) return

    try {
      setCancelling(true)
      await deleteUserMealSchedule(scheduleDetail._id)
      toast.success('Đã bỏ áp dụng thực đơn hiện tại')
      await fetchActiveSchedule()
    } catch (error) {
      console.error('Error cancelling meal schedule:', error)
      toast.error('Không thể bỏ áp dụng thực đơn. Vui lòng thử lại.')
    } finally {
      setCancelling(false)
    }
  }

  const handleCompleteMeal = async (mealItemId) => {
    if (!mealItemId) return
    try {
      await completeMealItem(mealItemId)
      toast.success('Đã đánh dấu bữa ăn hoàn thành')
      await fetchActiveSchedule()
    } catch (error) {
      console.error('Error completing meal item:', error)
      toast.error('Không thể cập nhật trạng thái bữa ăn')
    }
  }

  const handleSkipMeal = async (mealItemId) => {
    if (!mealItemId) return
    const confirmed = window.confirm('Bạn muốn bỏ qua bữa ăn này?')
    if (!confirmed) return
    try {
      await skipMealItem(mealItemId)
      toast.info('Đã ghi nhận bữa ăn bị bỏ qua')
      await fetchActiveSchedule()
    } catch (error) {
      console.error('Error skipping meal item:', error)
      toast.error('Không thể cập nhật trạng thái bữa ăn')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading className="flex flex-col items-center gap-3 text-gray-600" />
      </div>
    )
  }

  if (errorMessage) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
        <FaExclamationTriangle className="text-4xl text-amber-500 mb-4" />
        <p className="text-gray-700 dark:text-gray-300 mb-4">{errorMessage}</p>
        <button
          type="button"
          onClick={() => navigate('/meal-plan')}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
        >
          Khám phá thực đơn
        </button>
      </div>
    )
  }

  const statusBadge = STATUS_BADGES[scheduleDetail?.status ?? 0]

  return (
    <div className="min-h-screen py-6 px-4 md:px-6">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 mb-4 hover:text-gray-900"
      >
        <FaChevronLeft /> Trở lại
      </button>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-sm text-gray-500">Thực đơn đang áp dụng</p>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{scheduleDetail?.title || 'Không xác định'}</h1>
            <div className="mt-2 flex flex-wrap gap-3 text-sm text-gray-600 dark:text-gray-400">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusBadge?.className}`}>
                {statusBadge?.label || 'Đang áp dụng'}
              </span>
              {scheduleDetail?.start_date && (
                <span className="inline-flex items-center gap-1">
                  <FaCalendarAlt /> Bắt đầu: {formatDate(scheduleDetail.start_date)}
                </span>
              )}
              {scheduleDetail?.duration && <span>Thời lượng: {scheduleDetail.duration} ngày</span>}
              {linkedPlan && (
                <button
                  type="button"
                  onClick={() => navigate(`/meal-plan/${linkedPlan._id}`)}
                  className="text-emerald-600 hover:text-emerald-700"
                >
                  Xem thực đơn gốc
                </button>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-3 w-full md:w-72">
            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4">
              <p className="text-sm text-gray-600 dark:text-gray-300">Tiến độ hoàn thành</p>
              <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{progressStats.completed}/{progressStats.total}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Bữa đã hoàn thành</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Hiệu suất: {progressReport?.completion_rate ? `${progressReport.completion_rate}%` : 'Đang cập nhật'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleCancelSchedule}
              disabled={cancelling}
              className="w-full px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm hover:bg-red-50 disabled:opacity-60"
            >
              {cancelling ? 'Đang hủy...' : 'Bỏ áp dụng thực đơn'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow">
            <div className="border-b border-gray-100 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Bữa ăn trong ngày</h2>
                <p className="text-sm text-gray-500">Chọn ngày để xem chi tiết bữa ăn đã được lên lịch.</p>
              </div>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-transparent"
              />
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-right w-full md:w-auto">
                {selectedDate
                  ? `${formatDate(selectedDate)}${selectedDate === todayKey ? ' (Hôm nay)' : ''}`
                  : 'Chọn ngày để xem thực đơn chi tiết'}
              </div>
            </div>

            <div className="p-6">
              {selectedDate && mealsForDate.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 text-sm">
                  <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/30">
                    <p className="text-xs text-gray-500">Calories</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{todaysNutrition.calories} kcal</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/30">
                    <p className="text-xs text-gray-500">Protein</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{todaysNutrition.protein} g</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/30">
                    <p className="text-xs text-gray-500">Carbs</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{todaysNutrition.carbs} g</p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/30">
                    <p className="text-xs text-gray-500">Chất béo</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">{todaysNutrition.fat} g</p>
                  </div>
                </div>
              )}
              {(!selectedDate || mealsForDate.length === 0) && (
                <div className="text-center text-gray-500">
                  <FaClock className="text-3xl mx-auto mb-3 text-gray-300" />
                  <p>Không có bữa ăn nào trong ngày đã chọn.</p>
                </div>
              )}

              <div className="space-y-4">
                {mealsForDate.map((meal) => (
                  <div key={meal._id} className="border border-gray-100 dark:border-gray-700 rounded-xl p-4 flex flex-col md:flex-row gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xl font-bold">
                        {meal.meal_type?.toUpperCase?.()?.[0] || 'M'}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{meal.custom_name || meal.meal_name || 'Bữa ăn'}</p>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <FaClock /> {meal.schedule_time || 'Không đặt giờ'}
                        </p>
                      </div>
                    </div>
                    <div className="flex-1 grid grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <p><span className="font-semibold">Món chính:</span> {meal.recipe_id?.title || meal.recipe_title || 'Chưa gán món'}</p>
                      <p><span className="font-semibold">Calories:</span> {meal.calories || meal.recipe_id?.calories || 0} kcal</p>
                      <p>
                        <span className="font-semibold">Trạng thái:</span>{' '}
                        {meal.status === 1 || meal.status === 'completed'
                          ? 'Hoàn thành'
                          : meal.status === 2 || meal.status === 'skipped'
                            ? 'Đã bỏ qua'
                            : 'Chưa ăn'}
                      </p>
                      {meal.notes && <p className="text-xs text-gray-500">Ghi chú: {meal.notes}</p>}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {meal.status === 1 || meal.status === 'completed' ? (
                        <span className="inline-flex items-center gap-1 text-sm text-emerald-600">
                          <FaCheckCircle /> Đã hoàn thành
                        </span>
                      ) : meal.status === 2 || meal.status === 'skipped' ? (
                        <span className="inline-flex items-center gap-1 text-sm text-amber-600">
                          <FaTimesCircle /> Đã bỏ qua
                        </span>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => handleCompleteMeal(meal._id)}
                            className="px-4 py-2 border border-emerald-600 text-emerald-600 rounded-lg text-sm hover:bg-emerald-50"
                          >
                            Đánh dấu hoàn thành
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSkipMeal(meal._id)}
                            className="px-4 py-2 border border-amber-500 text-amber-600 rounded-lg text-sm hover:bg-amber-50"
                          >
                            Bỏ qua bữa này
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          {overviewStats && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-5">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Hiệu suất & trạng thái</h3>
              <div className="grid grid-cols-2 gap-3 text-sm text-gray-600 dark:text-gray-300">
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/30">
                  <p className="text-xs text-gray-500">Tổng số bữa</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{overviewStats.total_meals}</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/30">
                  <p className="text-xs text-gray-500">Đã hoàn thành</p>
                  <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{overviewStats.completed_meals}</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/30">
                  <p className="text-xs text-gray-500">Bỏ qua</p>
                  <p className="text-xl font-bold text-amber-600">{overviewStats.skipped_meals}</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/30">
                  <p className="text-xs text-gray-500">Chưa thực hiện</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{overviewStats.pending_meals}</p>
                </div>
              </div>
            </div>
          )}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-5">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Thông tin thêm</h3>
            {linkedPlan ? (
              <>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Áp dụng từ thực đơn <span className="font-semibold">{linkedPlan.title}</span>.
                </p>
                <button
                  type="button"
                  className="mt-3 w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
                  onClick={() => navigate(`/meal-plan/${linkedPlan._id}`)}
                >
                  Xem chi tiết thực đơn
                </button>
              </>
            ) : (
              <p className="text-sm text-gray-500">Không tìm thấy thông tin thực đơn gốc.</p>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-5">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Gợi ý tiếp theo</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Nếu bạn muốn thay đổi thực đơn, hãy quay lại trang <strong>Thực đơn</strong> để khám phá những gợi ý mới phù hợp với mình.
            </p>
            <button
              type="button"
              onClick={() => navigate('/meal-plan')}
              className="mt-3 w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
            >
              Khám phá thực đơn khác
            </button>
          </div>
        </aside>
      </div>
    </div>
  )
}
