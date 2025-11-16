import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { FaCalendarAlt, FaEdit, FaPlus, FaTrash, FaUtensils, FaEye } from 'react-icons/fa'
import { toast } from 'react-toastify'
import CreateMealPlanModal from '../components/CreateMealPlanModal/CreateMealPlanModal'
import {
  applyMealPlan,
  createMealPlan,
  deleteMealPlan,
  getMealPlanDetail,
  getMyMealPlans,
  updateMealPlan
} from '../../../services/mealPlanService'
import { getImageUrl } from '../../../utils/imageUrl'
import { getActiveMealSchedule } from '../../../services/userMealScheduleService'

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c'

const extractSourceMeta = (tags = []) => {
  const marker = tags.find((tag) => typeof tag === 'string' && tag.startsWith('source:'))
  if (!marker) return null
  const payload = marker.replace('source:', '')
  const [planId, ownerName] = payload.split('|')
  return {
    planId,
    ownerName
  }
}

const getToday = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function MyMealPlans() {
  const navigate = useNavigate()
  const location = useLocation()
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditorModal, setShowEditorModal] = useState(false)
  const [editingPlan, setEditingPlan] = useState(null)
  const [editorLoading, setEditorLoading] = useState(false)
  const [startDate, setStartDate] = useState(getToday())
  const [applyModalOpen, setApplyModalOpen] = useState(false)
  const [planToApply, setPlanToApply] = useState(null)
  const [applyLoading, setApplyLoading] = useState(false)
  const [activeSchedule, setActiveSchedule] = useState(null)
  const createModalRef = useRef(null)
  const editModalRef = useRef(null)

  const fetchPlans = async () => {
    try {
      setLoading(true)
      const response = await getMyMealPlans({ page: 1, limit: 50 })
      const list = response.data?.result?.meal_plans || []
      setPlans(list)
    } catch (error) {
      console.error('Error fetching my meal plans:', error)
      toast.error('Không thể tải danh sách thực đơn của bạn')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPlans()
  }, [])

  useEffect(() => {
    if (!showCreateModal) return

    const handleOutsideClick = (event) => {
      if (createModalRef.current && !createModalRef.current.contains(event.target)) {
        setShowCreateModal(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [showCreateModal])

  const filteredPlans = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase()
    if (!keyword) return plans
    return plans.filter((plan) =>
      [plan.title, plan.description, plan.category]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(keyword))
    )
  }, [plans, searchTerm])

  const handleCreatePlan = async (payload) => {
    try {
      await createMealPlan(payload)
      toast.success('Đã tạo thực đơn mới')
      await fetchPlans()
    } catch (error) {
      toast.error('Không thể tạo thực đơn mới')
      throw error
    }
  }

  const handleOpenEditor = useCallback(async (planId) => {
    try {
      setEditorLoading(true)
      const response = await getMealPlanDetail(planId)
      setEditingPlan(response.data?.result)
      setShowEditorModal(true)
    } catch (error) {
      console.error('Error loading meal plan detail:', error)
      toast.error('Không thể tải chi tiết thực đơn để chỉnh sửa')
    } finally {
      setEditorLoading(false)
    }
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const planId = params.get('planId')
    if (!planId) return

    handleOpenEditor(planId)
    navigate('/meal-plan/my', { replace: true })
  }, [location.search, handleOpenEditor, navigate])

  const handleUpdatePlan = async (payload) => {
    if (!editingPlan?._id) return
    try {
      await updateMealPlan(editingPlan._id, payload)
      toast.success('Đã cập nhật thực đơn')
      await fetchPlans()
    } catch (error) {
      console.error('Error updating meal plan:', error)
      toast.error('Không thể cập nhật thực đơn')
      throw error
    }
  }

  const handleDeletePlan = async (planId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa thực đơn này?')) return
    try {
      await deleteMealPlan(planId)
      setPlans((prev) => prev.filter((plan) => plan._id !== planId))
      toast.success('Đã xóa thực đơn')
    } catch (error) {
      console.error('Error deleting meal plan:', error)
      toast.error('Không thể xóa thực đơn')
    }
  }

  const openApplyModal = async (plan) => {
    try {
      setPlanToApply(plan)
      setStartDate(getToday())
      setApplyModalOpen(true)
      const schedule = await getActiveMealSchedule()
      setActiveSchedule(schedule)
    } catch (error) {
      console.error('Error fetching active schedule:', error)
      setActiveSchedule(null)
    }
  }

  const handleApplyPlan = async () => {
    if (!planToApply?._id) return
    try {
      setApplyLoading(true)
      await applyMealPlan(planToApply._id, planToApply.title, startDate)
      toast.success('Đã áp dụng thực đơn vào lịch cá nhân')
      setApplyModalOpen(false)
    } catch (error) {
      console.error('Error applying meal plan:', error)
      toast.error('Không thể áp dụng thực đơn')
    } finally {
      setApplyLoading(false)
    }
  }

  const closeEditorModal = () => {
    setShowEditorModal(false)
    setEditingPlan(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Đang tải thực đơn của bạn...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-6 px-4 md:px-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <FaUtensils className="mr-2 text-green-600" /> Thực đơn của tôi
          </h1>
          <p className="text-gray-600 dark:text-gray-400">Quản lý, chỉnh sửa và áp dụng các thực đơn bạn sở hữu.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow"
        >
          <FaPlus /> Tạo thực đơn mới
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg py-2.5 px-3 pr-10 bg-transparent text-gray-900 dark:text-white"
              placeholder="Tìm theo tên, mô tả, danh mục"
            />
            <FaUtensils className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
        </div>
      </div>

      {filteredPlans.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center shadow">
          <p className="text-gray-600 dark:text-gray-400">Bạn chưa có thực đơn nào. Hãy tạo mới để bắt đầu.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredPlans.map((plan) => {
            const image = plan.image ? getImageUrl(plan.image) : FALLBACK_IMAGE
            const sourceMeta = extractSourceMeta(plan.tags)
            return (
              <div key={plan._id} className="bg-white dark:bg-gray-800 rounded-xl shadow hover:shadow-lg transition overflow-hidden flex flex-col">
                <div className="h-44 w-full overflow-hidden">
                  <img src={image} alt={plan.title} className="w-full h-full object-cover" onError={(e) => { e.target.src = FALLBACK_IMAGE }} />
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2">{plan.title}</h3>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{plan.duration} ngày</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-3">{plan.description}</p>
                  {sourceMeta && (
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 italic">
                      Nguồn: {sourceMeta.ownerName || 'Không xác định'}
                    </p>
                  )}
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                      <FaCalendarAlt className="text-green-600" />
                      <span>{plan.target_calories ? `${plan.target_calories} kcal/ngày` : 'Tùy chỉnh'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FaUtensils className="text-green-600" />
                      <span>{Array.isArray(plan.tags) ? plan.tags.length : 0} thẻ</span>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs">
                    <span className="px-2 py-1 rounded-full bg-green-50 text-green-700 dark:bg-green-900/40 dark:text-green-300">
                      {plan.is_public ? 'Công khai' : 'Riêng tư'}
                    </span>
                    <span className="px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                      Độ khó {plan.difficulty_level ?? 1}
                    </span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEditor(plan._id)}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                    >
                      <FaEdit /> Tùy chỉnh
                    </button>
                    <button
                      type="button"
                      onClick={() => openApplyModal(plan)}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
                    >
                      <FaCalendarAlt /> Áp dụng
                    </button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-sm">
                    <button
                      type="button"
                      onClick={() => navigate(`/meal-plan/${plan._id}`)}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200"
                    >
                      <FaEye /> Xem chi tiết
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeletePlan(plan._id)}
                      className="inline-flex items-center justify-center gap-2 px-3 py-2 border border-red-300 text-red-600 rounded-lg"
                    >
                      <FaTrash /> Xóa
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div ref={createModalRef} className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] overflow-y-auto">
            <CreateMealPlanModal
              onClose={() => setShowCreateModal(false)}
              onCreate={handleCreatePlan}
              mode="create"
            />
          </div>
        </div>
      )}

      {showEditorModal && editingPlan && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div ref={editModalRef} className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] overflow-y-auto">
            {editorLoading ? (
              <div className="p-8 text-center text-gray-600 dark:text-gray-300">Đang tải dữ liệu...</div>
            ) : (
              <CreateMealPlanModal
                onClose={closeEditorModal}
                onCreate={handleUpdatePlan}
                initialData={editingPlan}
                mode="edit"
                defaultStep={3}
              />
            )}
          </div>
        </div>
      )}

      {applyModalOpen && planToApply && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="mb-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Áp dụng "{planToApply.title}"</h3>
              {activeSchedule && (
                <p className="mt-2 text-sm text-orange-600 dark:text-orange-300">
                  Bạn đang áp dụng "{activeSchedule.title}". Áp dụng mới sẽ tạo thêm lịch song song.
                </p>
              )}
            </div>
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300" htmlFor="startDate">
                Chọn ngày bắt đầu
              </label>
              <input
                id="startDate"
                type="date"
                value={startDate}
                min={getToday()}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-transparent text-gray-900 dark:text-white"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Thực đơn kéo dài {planToApply.duration} ngày.
              </p>
            </div>
            <div className="mt-6 flex flex-col gap-3">
              <button
                type="button"
                onClick={handleApplyPlan}
                disabled={applyLoading}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg disabled:opacity-50"
              >
                {applyLoading ? 'Đang áp dụng...' : 'Áp dụng thực đơn này'}
              </button>
              <button
                type="button"
                onClick={() => setApplyModalOpen(false)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200"
              >
                Để sau
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
