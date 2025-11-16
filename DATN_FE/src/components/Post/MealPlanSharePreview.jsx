import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FaCalendarAlt, FaFireAlt, FaUtensils } from 'react-icons/fa'
import { getMealPlanDetail } from '../../services/mealPlanService'
import { getImageUrl } from '../../utils/imageUrl'

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c'

function normalizeId(candidate) {
  if (!candidate) return ''
  if (typeof candidate === 'string') return candidate
  if (typeof candidate === 'object') {
    return candidate?._id || candidate?.$oid || candidate?.toString?.() || ''
  }
  return ''
}

export default function MealPlanSharePreview({ mealPlanId, prefetchedMealPlan, onNavigate }) {
  const normalizedId = useMemo(() => {
    if (prefetchedMealPlan?._id) return prefetchedMealPlan._id
    return normalizeId(mealPlanId)
  }, [mealPlanId, prefetchedMealPlan?._id])

  const shouldFetch = Boolean(normalizedId) && !prefetchedMealPlan
  const { data, isLoading, isError } = useQuery({
    queryKey: ['shared-meal-plan', normalizedId],
    queryFn: () => getMealPlanDetail(normalizedId),
    enabled: shouldFetch,
    staleTime: 1000 * 60 * 5
  })

  if (!normalizedId) {
    return (
      <div className='mt-4 p-4 rounded-xl bg-red-50 text-red-600 text-sm'>
        Không thể hiển thị thông tin thực đơn. Bài chia sẻ có thể đã bị xóa.
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className='mt-4 p-4 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 animate-pulse'>
        <div className='flex gap-4'>
          <div className='w-32 h-24 bg-gray-200 dark:bg-gray-700 rounded-lg' />
          <div className='flex-1 space-y-3'>
            <div className='h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4' />
            <div className='h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2' />
            <div className='h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3' />
            <div className='h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3' />
          </div>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className='mt-4 p-4 rounded-xl bg-red-50 text-red-600 text-sm'>
        Không thể tải thông tin thực đơn được chia sẻ. Vui lòng thử lại sau.
      </div>
    )
  }

  const mealPlan = prefetchedMealPlan ?? data?.data?.result

  if (!mealPlan) {
    return (
      <div className='mt-4 p-4 rounded-xl bg-yellow-50 text-yellow-700 text-sm'>
        Thực đơn đã bị xóa hoặc không còn khả dụng.
      </div>
    )
  }

  const nutrition = {
    calories: mealPlan.target_calories || mealPlan.total_calories || mealPlan.averageNutrition?.calories || 0,
    protein: mealPlan.target_protein || mealPlan.averageNutrition?.protein || 0,
    carbs: mealPlan.target_carbs || mealPlan.averageNutrition?.carbs || 0,
    fat: mealPlan.target_fat || mealPlan.averageNutrition?.fat || 0
  }

  const handleNavigate = () => {
    if (typeof onNavigate === 'function') {
      onNavigate(mealPlan._id || normalizedId)
    } else {
      window.open(`/meal-plan/${mealPlan._id || normalizedId}`, '_blank')
    }
  }

  return (
    <div className='mt-4 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 bg-gray-50 dark:bg-gray-900/40'>
      <div className='flex flex-col md:flex-row gap-4'>
        <div className='w-full md:w-40 h-32 md:h-32 rounded-xl overflow-hidden shadow-sm'>
          <img
            src={getImageUrl(mealPlan.image) || FALLBACK_IMAGE}
            alt={mealPlan.title}
            className='w-full h-full object-cover'
          />
        </div>
        <div className='flex-1 space-y-2'>
          <div className='flex items-center gap-2 text-xs uppercase tracking-wide text-emerald-600 font-semibold'>
            <FaUtensils /> Thực đơn được chia sẻ
          </div>
          <h4 className='text-lg font-bold text-gray-900 dark:text-white'>{mealPlan.title}</h4>
          <p className='text-sm text-gray-600 dark:text-gray-300 line-clamp-2'>{mealPlan.description}</p>
          <div className='flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400'>
            {mealPlan.duration && (
              <span className='inline-flex items-center gap-1'>
                <FaCalendarAlt /> {mealPlan.duration} ngày
              </span>
            )}
            {nutrition.calories > 0 && (
              <span className='inline-flex items-center gap-1'>
                <FaFireAlt /> ~{nutrition.calories} kcal/ngày
              </span>
            )}
          </div>
          <button
            type='button'
            onClick={handleNavigate}
            className='mt-2 inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg'
          >
            Xem chi tiết thực đơn
          </button>
        </div>
      </div>
    </div>
  )
}
