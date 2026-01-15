import { useMemo, useRef, useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import moment from 'moment'
import 'moment/locale/vi'
import { FaUtensils, FaRegCalendarAlt, FaClock, FaFireAlt, FaArrowRight, FaChevronLeft, FaChevronRight } from 'react-icons/fa'
import { MdDashboard } from 'react-icons/md'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts'
import { getActiveMealSchedule } from '../../services/userMealScheduleService'
import { getPublicMealPlans } from '../../services/mealPlanService'
import Loading from '../GlobalComponents/Loading'
import { getImageUrl } from '../../utils/imageUrl'

const formatDate = (value, fallback = '—') => {
  if (!value) return fallback
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return fallback
  return new Intl.DateTimeFormat('vi-VN', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit'
  }).format(date)
}

const formatRelativeTime = (value) => {
  if (!value) return 'Chưa có lịch'
  return moment(value).locale('vi').fromNow()
}

const clampProgress = (value) => {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(100, Math.round(value)))
}

const DayPreview = ({ title, dateLabel, meals = [], nutrition }) => (
  <div className='rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-900/40 p-3 flex flex-col gap-3'>
    <div>
      <p className='text-[11px] uppercase tracking-wide text-emerald-600 dark:text-emerald-400'>{title}</p>
      <p className='text-base font-semibold text-gray-900 dark:text-white'>{dateLabel}</p>
      <p className='text-xs text-gray-500 dark:text-gray-400'>
        {meals.length ? `${meals.length} bữa · ${Math.round(nutrition?.calories || 0)} kcal` : 'Chưa có bữa ăn nào'}
      </p>
    </div>
    <div className='space-y-1.5'>
      {meals.slice(0, 2).map((meal) => (
        <div key={meal._id || meal.meal_item_id || meal.custom_name} className='flex items-center gap-3'>
          <div className='w-8 h-8 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center text-emerald-600 text-sm'>
            <FaUtensils />
          </div>
          <div>
            <p className='text-sm font-medium text-gray-800 dark:text-gray-100 leading-tight'>
              {meal.custom_name || meal.meal_name || meal.recipe_id?.title || 'Bữa ăn'}
            </p>
            <p className='text-xs text-gray-500 dark:text-gray-400'>{meal.schedule_time || 'Chưa đặt giờ'}</p>
          </div>
        </div>
      ))}
      {!meals.length && <p className='text-xs text-gray-500'>Hệ thống sẽ gợi ý khi có bữa ăn mới.</p>}
    </div>
  </div>
)

const mockCaloriesData = {
  week: [
    { label: 'T2', intake: 1850, burned: 1680 },
    { label: 'T3', intake: 1975, burned: 1750 },
    { label: 'T4', intake: 2100, burned: 1820 },
    { label: 'T5', intake: 2050, burned: 1900 },
    { label: 'T6', intake: 2150, burned: 2000 },
    { label: 'T7', intake: 2250, burned: 2100 },
    { label: 'CN', intake: 2000, burned: 1720 }
  ],
  month: [
    { label: 'Tuần 1', intake: 14200, burned: 13150 },
    { label: 'Tuần 2', intake: 14850, burned: 13600 },
    { label: 'Tuần 3', intake: 15000, burned: 13850 },
    { label: 'Tuần 4', intake: 14650, burned: 14050 }
  ]
}

const CaloriesTrendCard = ({ data = mockCaloriesData }) => {
  const [range, setRange] = useState('month')
  const chartData = data?.[range] || []

  const totals = chartData.reduce(
    (acc, cur) => {
      acc.intake += cur.intake || 0
      acc.burned += cur.burned || 0
      return acc
    },
    { intake: 0, burned: 0 }
  )
  const net = totals.intake - totals.burned
  const netColor = net >= 0 ? 'text-amber-600 dark:text-amber-300' : 'text-emerald-600 dark:text-emerald-300'

  return (
    <div className='rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-color-primary p-4 flex flex-col gap-4 h-full'>
      <div className='flex items-center justify-between gap-2 flex-wrap'>
        <div>
          <p className='text-[11px] uppercase tracking-[0.35em] text-emerald-600 dark:text-emerald-400'>Năng lượng</p>
          <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>Cân bằng calories</h3>
        </div>
        <div className='flex items-center gap-1 rounded-full bg-gray-100 dark:bg-gray-800 p-1'>
          {['week', 'month'].map((key) => (
            <button
              key={key}
              type='button'
              onClick={() => setRange(key)}
              className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${
                range === key
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-emerald-600'
              }`}
            >
              {key === 'week' ? 'Tuần' : 'Tháng'}
            </button>
          ))}
        </div>
      </div>

      <div className='grid grid-cols-3 gap-2 text-xs md:text-sm'>
        <div className='rounded-xl border border-gray-100 dark:border-gray-700 bg-emerald-50/80 dark:bg-emerald-900/30 p-3'>
          <p className='text-gray-600 dark:text-gray-300 uppercase text-[11px]'>Nạp vào</p>
          <p className='text-lg font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1'>
            <FaUtensils /> {totals.intake.toLocaleString('vi-VN')} kcal
          </p>
        </div>
        <div className='rounded-xl border border-gray-100 dark:border-gray-700 bg-orange-50/70 dark:bg-orange-900/20 p-3'>
          <p className='text-gray-600 dark:text-gray-300 uppercase text-[11px]'>Tiêu thụ</p>
          <p className='text-lg font-semibold text-orange-600 dark:text-orange-300 flex items-center gap-1'>
            <FaFireAlt /> {totals.burned.toLocaleString('vi-VN')} kcal
          </p>
        </div>
        <div className='rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 p-3'>
          <p className='text-gray-600 dark:text-gray-300 uppercase text-[11px]'>Chênh lệch</p>
          <p className={`text-lg font-semibold flex items-center gap-1 ${netColor}`}>
            {net >= 0 ? '+' : ''}
            {net.toLocaleString('vi-VN')} kcal
          </p>
        </div>
      </div>

      <div className='h-60 -mx-2'>
        <ResponsiveContainer width='100%' height='100%'>
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray='3 3' stroke='#e5e7eb' vertical={false} />
            <XAxis dataKey='label' tickLine={false} axisLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
            <YAxis tickLine={false} axisLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} tickFormatter={(v) => `${v / 1000}k`} />
            <Tooltip
              formatter={(value) => `${value.toLocaleString('vi-VN')} kcal`}
              contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }}
            />
            <Legend verticalAlign='top' height={32} iconType='circle' wrapperStyle={{ paddingBottom: 10 }} />
            <Line
              type='monotone'
              dataKey='intake'
              name='Nạp vào'
              stroke='#10b981'
              strokeWidth={3}
              dot={{ r: 4, strokeWidth: 2, fill: '#ecfdf3', stroke: '#10b981' }}
              activeDot={{ r: 6, strokeWidth: 0, fill: '#10b981' }}
            />
            <Line
              type='monotone'
              dataKey='burned'
              name='Tiêu thụ'
              stroke='#f97316'
              strokeWidth={3}
              dot={{ r: 4, strokeWidth: 2, fill: '#fff7ed', stroke: '#f97316' }}
              activeDot={{ r: 6, strokeWidth: 0, fill: '#f97316' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

const PlanChip = ({ icon, label, value }) => (
  <div className='border border-gray-100 dark:border-gray-700 rounded-xl p-3 bg-white dark:bg-gray-900/40'>
    <p className='text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400 flex items-center gap-1'>
      {icon}
      {label}
    </p>
    <p className='text-base font-semibold text-gray-900 dark:text-white mt-1'>{value}</p>
  </div>
)

const ActivePlanCard = ({ loading, summary, onViewDetail }) => {
  if (loading) {
    return (
      <div className='rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-color-primary p-5 flex items-center justify-center min-h-[220px]'>
        <Loading />
      </div>
    )
  }

  if (!summary) {
    return (
      <div className='rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 bg-white dark:bg-color-primary p-6 text-center space-y-3'>
        <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>Bạn chưa áp dụng thực đơn nào</h3>
        <p className='text-sm text-gray-500 dark:text-gray-400 leading-relaxed'>
          Khám phá kho thực đơn để bắt đầu một hành trình ăn uống lành mạnh hơn.
        </p>
        <Link
          to='/meal-plan'
          className='inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg'
        >
          <FaUtensils /> Khám phá thực đơn
        </Link>
      </div>
    )
  }

  const { detail, linkedPlan, overview, meta, today, upcoming } = summary
  const completionRate = clampProgress((overview.completed_meals / Math.max(overview.total_meals || 1, 1)) * 100)
  const todayMeals = Array.isArray(today?.meals) ? today.meals : []
  const upcomingMeals = Array.isArray(upcoming?.meals) ? upcoming.meals : []
  const planImage = getImageUrl(
    detail.cover_image || detail.image || linkedPlan?.cover_image || linkedPlan?.banner || linkedPlan?.image
  )

  return (
    <div className='rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-color-primary overflow-hidden flex flex-col h-full relative'>
      {planImage && (
        <div
          className='absolute inset-0 opacity-20 pointer-events-none'
          style={{ backgroundImage: `url(${planImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        />
      )}
      <div className='p-4 md:p-5 space-y-3 flex-1 flex flex-col relative z-10 backdrop-blur-[1px] bg-white/80 dark:bg-color-primary/85'>
        <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2.5'>
          <div>
            <p className='text-[11px] uppercase tracking-[0.35em] text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5'>
              <MdDashboard /> Hoạt động dinh dưỡng
            </p>
            <h3 className='text-xl font-semibold text-gray-900 dark:text-white mt-1'>
              {detail.title || linkedPlan?.title || 'Thực đơn cá nhân'}
            </h3>
            <p className='text-xs text-gray-500 dark:text-gray-400'>
              Cập nhật lần cuối {formatRelativeTime(detail.updated_at || detail.created_at || Date.now())}
            </p>
          </div>
          <button
            type='button'
            onClick={onViewDetail}
            className='inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-200 text-emerald-600 hover:bg-emerald-50 text-sm dark:border-emerald-700 dark:text-emerald-300'
          >
            Xem chi tiết <FaArrowRight />
          </button>
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-3 gap-3'>
          <PlanChip label='Bắt đầu' value={formatDate(detail.start_date || detail.applied_start_date)} icon={<FaRegCalendarAlt />} />
          <PlanChip label='Kết thúc' value={formatDate(detail.end_date)} icon={<FaClock />} />
          <PlanChip label='Chuỗi kỷ luật' value={`${meta?.streak_days || 0} ngày`} icon={<FaFireAlt />} />
        </div>

        <div className='rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-900/40 p-3.5 space-y-2.5'>
          <div className='flex items-center justify-between text-[11px] text-gray-600 dark:text-gray-300'>
            <span>Tiến độ hoàn thành</span>
            <span className='font-semibold text-emerald-600 dark:text-emerald-400'>{completionRate}%</span>
          </div>
          <div className='h-3 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden'>
            <div
              className='h-full bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500 rounded-full'
              style={{ width: `${completionRate}%` }}
            />
          </div>
          <div className='grid grid-cols-3 gap-2 text-center'>
            <div>
              <p className='text-[11px] uppercase text-gray-500'>Hoàn thành</p>
              <p className='text-base font-semibold text-gray-900 dark:text-white'>{overview.completed_meals || 0}</p>
            </div>
            <div>
              <p className='text-[11px] uppercase text-gray-500'>Đang chờ</p>
              <p className='text-base font-semibold text-gray-900 dark:text-white'>{overview.pending_meals || 0}</p>
            </div>
            <div>
              <p className='text-[11px] uppercase text-gray-500'>Bỏ qua</p>
              <p className='text-base font-semibold text-gray-900 dark:text-white'>{overview.skipped_meals || 0}</p>
            </div>
          </div>
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1'>
          <DayPreview
            title='Ngày hôm nay'
            dateLabel={today?.date ? formatDate(today.date) : 'Chưa lên lịch'}
            meals={todayMeals}
            nutrition={today?.nutrition}
          />
          <DayPreview
            title='Ngày tiếp theo'
            dateLabel={upcoming?.date ? formatDate(upcoming.date) : 'Đang chờ cập nhật'}
            meals={upcomingMeals}
            nutrition={upcoming?.nutrition}
          />
        </div>
      </div>
    </div>
  )
}

const RecommendationCard = ({ loading, items }) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isHovering, setIsHovering] = useState(false)
  const autoPlayRef = useRef(null)
  const visibleItems = items.slice(0, 6)

  useEffect(() => {
    if (visibleItems.length <= 1 || isHovering) return
    autoPlayRef.current = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % visibleItems.length)
    }, 4000)
    return () => {
      if (autoPlayRef.current) clearTimeout(autoPlayRef.current)
    }
  }, [visibleItems.length, currentIndex, isHovering])

  if (loading) {
    return (
      <div className='rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-color-primary p-5 flex items-center justify-center min-h-[220px]'>
        <Loading />
      </div>
    )
  }

  if (!items.length) {
    return (
      <div className='rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 bg-white dark:bg-color-primary p-6 text-center space-y-3'>
        <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>Chúng tôi sẽ gợi ý thêm thực đơn phù hợp</h3>
        <p className='text-sm text-gray-500 dark:text-gray-400'>Theo dõi các chuyên gia để nhận nhiều đề xuất hơn.</p>
        <Link
          to='/meal-plan'
          className='inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'
        >
          Xem tất cả thực đơn
        </Link>
      </div>
    )
  }

  return (
    <div
      className='rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-color-primary p-4 flex flex-col gap-4 h-full'
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className='flex items-center justify-between flex-wrap gap-2'>
        <div>
          <p className='text-[11px] uppercase tracking-[0.35em] text-emerald-600 dark:text-emerald-400'>Gợi ý thay thế</p>
          <h3 className='text-xl font-semibold text-gray-900 dark:text-white'>Thực đơn bạn có thể thích</h3>
        </div>
        <Link to='/meal-plan' className='text-sm text-emerald-600 hover:text-emerald-500 flex items-center gap-1'>
          Xem thêm <FaArrowRight className='w-3 h-3' />
        </Link>
      </div>
      <div className='relative flex-1 flex flex-col'>
        {visibleItems.length > 1 && (
          <>
            <button
              type='button'
              aria-label='Trước'
              onClick={() => setCurrentIndex((prev) => (prev - 1 + visibleItems.length) % visibleItems.length)}
              className='absolute -left-3 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-gray-900/70 border border-gray-200 dark:border-gray-700 rounded-full p-1 text-gray-600 dark:text-gray-300 shadow'
            >
              <FaChevronLeft />
            </button>
            <button
              type='button'
              aria-label='Sau'
              onClick={() => setCurrentIndex((prev) => (prev + 1) % visibleItems.length)}
              className='absolute -right-3 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-gray-900/70 border border-gray-200 dark:border-gray-700 rounded-full p-1 text-gray-600 dark:text-gray-300 shadow'
            >
              <FaChevronRight />
            </button>
          </>
        )}
        <div className='overflow-hidden rounded-xl flex-1'>
          <div
            className='flex transition-transform duration-500'
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {visibleItems.map((plan) => {
              const image = getImageUrl(plan.cover_image || plan.image)
              return (
                <Link
                  to={`/meal-plan/${plan._id}`}
                  key={plan._id}
                  className='border border-gray-100 dark:border-gray-700 rounded-2xl overflow-hidden hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors group min-w-full'
                >
                  <div
                    className='h-28 bg-cover bg-center'
                    style={{ backgroundImage: image ? `url(${image})` : 'linear-gradient(120deg,#ecfccb,#d1fae5)' }}
                  />
                  <div className='p-3 space-y-2.5'>
                    <div className='flex items-center justify-between text-xs text-gray-500 dark:text-gray-400'>
                      <span>{plan.duration || plan.days?.length || 0} ngày</span>
                      <span>{plan.likes_count || 0} lượt thích</span>
                    </div>
                    <h4 className='text-base font-semibold text-gray-900 dark:text-white line-clamp-2 group-hover:text-emerald-600 leading-snug'>
                      {plan.title}
                    </h4>
                    {Array.isArray(plan.tags) && plan.tags.length > 0 && (
                      <div className='flex flex-wrap gap-2 text-xs'>
                        {plan.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className='px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200'>
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <p className='text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed'>
                      {plan.description || 'Thực đơn cân bằng giúp bạn duy trì năng lượng mỗi ngày.'}
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
        {visibleItems.length > 1 && (
          <div className='flex justify-center gap-1 mt-3'>
            {visibleItems.map((_, idx) => (
              <button
                type='button'
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`w-2 h-2 rounded-full transition-colors ${idx === currentIndex ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const UserDashboard = () => {
  const navigate = useNavigate()

  const {
    data: activeSchedule,
    isLoading: loadingActive
  } = useQuery({
    queryKey: ['dashboard-active-meal-plan'],
    queryFn: getActiveMealSchedule,
    staleTime: 1000 * 60
  })

  const {
    data: publicPlansResponse,
    isLoading: loadingRecommendations
  } = useQuery({
    queryKey: ['dashboard-public-meal-plans'],
    queryFn: () => getPublicMealPlans({ limit: 6, sort: 'popular' }),
    staleTime: 1000 * 60 * 5
  })

  const scheduleSummary = useMemo(() => {
    if (!activeSchedule?.schedule) return null
    const detail = activeSchedule.schedule
    return {
      detail,
      linkedPlan: detail.meal_plan_id || null,
      overview: activeSchedule.overview || {},
      meta: activeSchedule.meta || {},
      today: activeSchedule.today || {},
      upcoming: activeSchedule.upcoming || {}
    }
  }, [activeSchedule])

  const recommendedPlans = useMemo(() => {
    const list = publicPlansResponse?.data?.result?.meal_plans || []
    const activePlanId = scheduleSummary?.linkedPlan?._id
    return list.filter((plan) => plan._id !== activePlanId).slice(0, 4)
  }, [publicPlansResponse, scheduleSummary])

  return (
    <div className='w-full shadow bg-white rounded-3xl dark:bg-color-primary dark:border dark:border-gray-800 overflow-hidden'>
      <div className='bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-700 dark:via-indigo-700 dark:to-purple-700 py-4 px-5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between'>
        <div>
          <h3 className='text-base md:text-lg font-semibold text-white flex items-center gap-2'>
            <MdDashboard className='text-xl' /> Bảng điều khiển dinh dưỡng
          </h3>
          <p className='text-[11px] md:text-xs text-white/80'>Theo dõi thực đơn hiện tại và gợi ý thay thế phù hợp theo thời gian thực.</p>
        </div>
        {scheduleSummary?.detail && (
          <div className='text-xs text-white/80 md:text-sm'>
            Cập nhật {formatRelativeTime(scheduleSummary.detail.updated_at || scheduleSummary.detail.created_at)}
          </div>
        )}
      </div>
      <div className='p-4 lg:p-6 grid grid-cols-1 xl:grid-cols-3 gap-3 items-stretch'>
        <div className='flex w-full'>
          <ActivePlanCard loading={loadingActive} summary={scheduleSummary} onViewDetail={() => navigate('/meal-plan/active')} />
        </div>
        <div className='flex w-full'>
          <CaloriesTrendCard />
        </div>
        <div className='flex w-full'>
          <RecommendationCard loading={loadingRecommendations} items={recommendedPlans} />
        </div>
      </div>
    </div>
  )
}

export default UserDashboard
