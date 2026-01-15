import { useState, useEffect, useContext } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import {
  FaUtensils, FaFire, FaHeart, FaComment, FaCalendarAlt,
  FaChartLine, FaHistory, FaCheckCircle, FaClock, FaLeaf,
  FaArrowRight, FaPlus, FaEye, FaBookmark, FaUsers
} from 'react-icons/fa'
import { IoMdTrendingUp, IoMdTrendingDown } from 'react-icons/io'
import { MdDashboard, MdRestaurantMenu, MdArticle, MdToday } from 'react-icons/md'
import { BsFillLightningChargeFill } from 'react-icons/bs'
import { AppContext } from '../../contexts/app.context'
import {
  getPersonalDashboardStats,
  getCaloriesHistory,
  getTodayMeals,
  getMealPlanHistory,
  getPersonalPostsStats,
  getNutritionTrend
} from '../../apis/personalDashboardApi'
import { getUserPosts } from '../../apis/postApi'
import { getImageUrl } from '../../utils/imageUrl'
import Loading from '../../components/GlobalComponents/Loading'

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6']

// Stat Card Component
const StatCard = ({ icon: Icon, title, value, subtitle, trend, color = 'emerald' }) => {
  const colorClasses = {
    emerald: 'from-emerald-500 to-teal-500 shadow-emerald-500/25',
    blue: 'from-blue-500 to-indigo-500 shadow-blue-500/25',
    orange: 'from-orange-500 to-amber-500 shadow-orange-500/25',
    rose: 'from-rose-500 to-pink-500 shadow-rose-500/25',
    purple: 'from-purple-500 to-violet-500 shadow-purple-500/25'
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses[color]} shadow-lg flex items-center justify-center`}>
          <Icon className="text-xl text-white" />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-sm font-medium ${trend >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
            {trend >= 0 ? <IoMdTrendingUp /> : <IoMdTrendingDown />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{value}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </div>
  )
}

// Today's Meal Card
const TodayMealCard = ({ meal, onNavigate }) => {
  const recipe = meal.recipe
  const image = getImageUrl(recipe?.image || recipe?.thumbnail)
  const isCompleted = meal.status === 'completed'
  const isSkipped = meal.status === 'skipped'

  const mealTypeLabels = {
    breakfast: 'Bữa sáng',
    lunch: 'Bữa trưa',
    dinner: 'Bữa tối',
    snack: 'Bữa phụ'
  }

  return (
    <div className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
      isCompleted 
        ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' 
        : isSkipped
        ? 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-60'
        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-emerald-300'
    }`}>
      {image ? (
        <img src={image} alt={meal.name} className="w-16 h-16 rounded-xl object-cover" />
      ) : (
        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 flex items-center justify-center">
          <FaUtensils className="text-emerald-500 text-xl" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/40 px-2 py-0.5 rounded-full">
            {mealTypeLabels[meal.type] || meal.type}
          </span>
          {meal.scheduled_time && (
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <FaClock className="text-[10px]" />
              {meal.scheduled_time}
            </span>
          )}
        </div>
        <h4 className="font-semibold text-gray-900 dark:text-white truncate">{meal.name}</h4>
        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <FaFire className="text-orange-500" />
            {meal.nutrition?.calories || 0} kcal
          </span>
          <span>{meal.nutrition?.protein || 0}g protein</span>
        </div>
      </div>
      {isCompleted ? (
        <div className="flex items-center gap-1 text-emerald-500">
          <FaCheckCircle />
          <span className="text-sm font-medium">Đã hoàn thành</span>
        </div>
      ) : isSkipped ? (
        <span className="text-sm text-gray-400">Đã bỏ qua</span>
      ) : (
        <button
          onClick={() => onNavigate?.()}
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Hoàn thành
        </button>
      )}
    </div>
  )
}

// Meal Plan History Card
const MealPlanHistoryCard = ({ schedule }) => {
  const navigate = useNavigate()
  const mealPlan = schedule.mealPlan
  const image = getImageUrl(mealPlan?.image)

  const statusColors = {
    active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    completed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    cancelled: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
  }

  const statusLabels = {
    active: 'Đang áp dụng',
    completed: 'Đã hoàn thành',
    cancelled: 'Đã hủy'
  }

  return (
    <div 
      className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-all cursor-pointer"
      onClick={() => navigate(`/meal-plan/${mealPlan?._id}`)}
    >
      <div className="flex">
        {image ? (
          <img src={image} alt={mealPlan?.title} className="w-24 h-24 object-cover" />
        ) : (
          <div className="w-24 h-24 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 flex items-center justify-center">
            <MdRestaurantMenu className="text-3xl text-emerald-500" />
          </div>
        )}
        <div className="flex-1 p-3">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[schedule.status]}`}>
              {statusLabels[schedule.status]}
            </span>
          </div>
          <h4 className="font-semibold text-gray-900 dark:text-white line-clamp-1">{mealPlan?.title || 'Thực đơn'}</h4>
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
            <span>{schedule.stats?.completedMeals}/{schedule.stats?.totalMeals} bữa</span>
            <span>{schedule.stats?.totalCaloriesConsumed} kcal</span>
          </div>
          {/* Progress bar */}
          <div className="mt-2 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all"
              style={{ width: `${schedule.progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PersonalDashboard() {
  const navigate = useNavigate()
  const { profile } = useContext(AppContext)
  const [activeTab, setActiveTab] = useState('overview')
  const [caloriesDays, setCaloriesDays] = useState(7)
  const [postsPage, setPostsPage] = useState(1)

  // Fetch data
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['personalDashboardStats'],
    queryFn: getPersonalDashboardStats
  })

  const { data: caloriesData, isLoading: caloriesLoading } = useQuery({
    queryKey: ['caloriesHistory', caloriesDays],
    queryFn: () => getCaloriesHistory(caloriesDays)
  })

  const { data: todayData, isLoading: todayLoading } = useQuery({
    queryKey: ['todayMeals'],
    queryFn: getTodayMeals
  })

  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['mealPlanHistory'],
    queryFn: () => getMealPlanHistory(1, 5)
  })

  const { data: nutritionData, isLoading: nutritionLoading } = useQuery({
    queryKey: ['nutritionTrend', 7],
    queryFn: () => getNutritionTrend(7)
  })

  const { data: postsData, isLoading: postsLoading } = useQuery({
    queryKey: ['personalPostsStats'],
    queryFn: getPersonalPostsStats
  })

  // Fetch personal posts list
  const { data: myPostsData, isLoading: myPostsLoading, refetch: refetchMyPosts } = useQuery({
    queryKey: ['myPosts', profile?._id, postsPage],
    queryFn: () => getUserPosts(profile?._id, { page: postsPage, limit: 10 }),
    enabled: !!profile?._id
  })

  const stats = statsData?.result
  const calories = caloriesData?.result || []
  const today = todayData?.result
  const history = historyData?.result
  const nutrition = nutritionData?.result
  const posts = postsData?.result
  const myPosts = myPostsData?.data?.result?.posts || []
  const postsPagination = myPostsData?.data?.result?.pagination

  const countValue = (value) => {
    if (Array.isArray(value)) return value.length
    if (typeof value === 'number') return value
    return 0
  }

  if (statsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
              <MdDashboard className="text-3xl" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Trang Cá Nhân</h1>
              <p className="text-white/80">Xin chào, {profile?.name || 'Bạn'}! Theo dõi hoạt động và hành trình dinh dưỡng của bạn.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="sticky top-0 z-20 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-1 overflow-x-auto py-2">
            {[
              { id: 'overview', label: 'Tổng quan', icon: MdDashboard },
              { id: 'today', label: 'Hôm nay', icon: MdToday },
              { id: 'nutrition', label: 'Dinh dưỡng', icon: FaChartLine },
              { id: 'mealplans', label: 'Thực đơn', icon: MdRestaurantMenu },
              { id: 'posts', label: 'Bài viết', icon: MdArticle }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all whitespace-nowrap ${
                  activeTab === id
                    ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <Icon className="text-lg" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon={FaFire}
                title="Calories hôm nay"
                value={`${today?.todayNutrition?.calories || 0} kcal`}
                subtitle={`Mục tiêu: ${stats?.nutrition?.dailyCalorieGoal || 2000} kcal`}
                color="orange"
              />
              <StatCard
                icon={FaUtensils}
                title="Bữa ăn hoàn thành"
                value={stats?.nutrition?.totalCompletedMeals || 0}
                subtitle="Tổng số bữa đã ăn"
                color="emerald"
              />
              <StatCard
                icon={MdArticle}
                title="Bài viết"
                value={stats?.posts?.total || 0}
                subtitle={`${stats?.posts?.totalLikes || 0} lượt thích`}
                color="blue"
              />
              <StatCard
                icon={MdRestaurantMenu}
                title="Thực đơn đã áp dụng"
                value={stats?.mealPlans?.applied || 0}
                subtitle={`${stats?.mealPlans?.created || 0} thực đơn đã tạo`}
                color="purple"
              />
            </div>

            {/* Active Meal Plan */}
            {stats?.mealPlans?.activePlan && (
              <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold">Thực đơn đang áp dụng</h3>
                    <p className="text-white/80">{stats.mealPlans.activePlan.title}</p>
                  </div>
                  <Link
                    to="/meal-plan/active"
                    className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-medium transition-colors"
                  >
                    Xem chi tiết
                  </Link>
                </div>
                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span>Tiến độ</span>
                    <span>{stats.mealPlans.activePlan.progress}%</span>
                  </div>
                  <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-white rounded-full transition-all"
                      style={{ width: `${stats.mealPlans.activePlan.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Calories Chart */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-gray-900 dark:text-white">Calories tiêu thụ</h3>
                  <select
                    value={caloriesDays}
                    onChange={(e) => setCaloriesDays(Number(e.target.value))}
                    className="text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value={7}>7 ngày</option>
                    <option value={14}>14 ngày</option>
                    <option value={30}>30 ngày</option>
                  </select>
                </div>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={calories}>
                    <defs>
                      <linearGradient id="colorCalories" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => new Date(value).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                      stroke="#9CA3AF"
                      fontSize={12}
                    />
                    <YAxis stroke="#9CA3AF" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1F2937', 
                        border: 'none', 
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                      labelFormatter={(value) => new Date(value).toLocaleDateString('vi-VN')}
                    />
                    <Area type="monotone" dataKey="calories" stroke="#10B981" fill="url(#colorCalories)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Today's Meals */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-gray-900 dark:text-white">Bữa ăn hôm nay</h3>
                  <div className="flex items-center gap-3">
                    <Link to="/meal-plan/active" className="text-blue-500 hover:text-blue-600 text-sm font-medium">
                      Thực đơn của tôi <FaArrowRight className="inline ml-1" />
                    </Link>
                    <Link to="/user-calendar" className="text-emerald-500 hover:text-emerald-600 text-sm font-medium">
                      Xem lịch <FaArrowRight className="inline ml-1" />
                    </Link>
                  </div>
                </div>
                {today?.hasActiveSchedule ? (
                  <div className="space-y-3 max-h-[280px] overflow-y-auto">
                    {today.meals?.length > 0 ? (
                      today.meals.map((meal) => (
                        <TodayMealCard key={meal._id} meal={meal} onNavigate={() => navigate('/meal-plan/active')} />
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        Không có bữa ăn nào cho hôm nay
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MdRestaurantMenu className="text-5xl text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500 mb-4">Bạn chưa có thực đơn đang áp dụng</p>
                    <Link
                      to="/meal-plan"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors"
                    >
                      <FaPlus /> Chọn thực đơn
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Meal Plan History */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-gray-900 dark:text-white">Lịch sử thực đơn</h3>
                <button 
                  onClick={() => setActiveTab('mealplans')}
                  className="text-emerald-500 hover:text-emerald-600 text-sm font-medium"
                >
                  Xem tất cả <FaArrowRight className="inline ml-1" />
                </button>
              </div>
              {history?.history?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {history.history.slice(0, 3).map((schedule) => (
                    <MealPlanHistoryCard key={schedule._id} schedule={schedule} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Chưa có lịch sử thực đơn
                </div>
              )}
            </div>
          </div>
        )}

        {/* Today Tab */}
        {activeTab === 'today' && (
          <div className="space-y-6">
            {/* Today's Nutrition Summary */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                    <FaFire className="text-orange-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{today?.todayNutrition?.calories || 0}</p>
                    <p className="text-xs text-gray-500">Calories</p>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                    <BsFillLightningChargeFill className="text-red-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{today?.todayNutrition?.protein || 0}g</p>
                    <p className="text-xs text-gray-500">Protein</p>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <FaLeaf className="text-amber-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{today?.todayNutrition?.carbs || 0}g</p>
                    <p className="text-xs text-gray-500">Carbs</p>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                    <span className="text-yellow-500 font-bold">F</span>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{today?.todayNutrition?.fat || 0}g</p>
                    <p className="text-xs text-gray-500">Fat</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4">Tiến độ hôm nay</h3>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Bữa ăn hoàn thành</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {today?.todayNutrition?.completed || 0}/{today?.todayNutrition?.total || 0}
                    </span>
                  </div>
                  <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all"
                      style={{ width: `${today?.todayNutrition?.total ? (today.todayNutrition.completed / today.todayNutrition.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Today's Meals List */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4">Danh sách bữa ăn</h3>
              {today?.hasActiveSchedule && today?.meals?.length > 0 ? (
                <div className="space-y-3">
                  {today.meals.map((meal) => (
                    <TodayMealCard key={meal._id} meal={meal} onNavigate={() => navigate('/meal-plan/active')} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <MdRestaurantMenu className="text-6xl text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">
                    {today?.hasActiveSchedule ? 'Không có bữa ăn nào cho hôm nay' : 'Bạn chưa áp dụng thực đơn nào'}
                  </p>
                  <Link
                    to="/meal-plan"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium transition-colors"
                  >
                    <FaPlus /> Chọn thực đơn
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Nutrition Tab */}
        {activeTab === 'nutrition' && (
          <div className="space-y-6">
            {/* Nutrition Trend Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              <h3 className="font-bold text-gray-900 dark:text-white mb-6">Xu hướng dinh dưỡng 7 ngày qua</h3>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={nutrition?.trend || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString('vi-VN', { weekday: 'short' })}
                    stroke="#9CA3AF"
                    fontSize={12}
                  />
                  <YAxis stroke="#9CA3AF" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: 'none', 
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                    labelFormatter={(value) => new Date(value).toLocaleDateString('vi-VN')}
                  />
                  <Legend />
                  <Bar dataKey="actual.calories" name="Calories" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Macro Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                <h3 className="font-bold text-gray-900 dark:text-white mb-6">Phân bố Macro trung bình</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Protein', value: nutrition?.averages?.protein || 0 },
                        { name: 'Carbs', value: nutrition?.averages?.carbs || 0 },
                        { name: 'Fat', value: nutrition?.averages?.fat || 0 }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      <Cell fill="#EF4444" />
                      <Cell fill="#F59E0B" />
                      <Cell fill="#FBBF24" />
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                <h3 className="font-bold text-gray-900 dark:text-white mb-6">Mục tiêu vs Thực tế</h3>
                <div className="space-y-4">
                  {[
                    { name: 'Calories', actual: nutrition?.averages?.calories || 0, goal: nutrition?.dailyGoal?.calories || 2000, color: 'orange' },
                    { name: 'Protein', actual: nutrition?.averages?.protein || 0, goal: nutrition?.dailyGoal?.protein || 50, color: 'red', unit: 'g' },
                    { name: 'Carbs', actual: nutrition?.averages?.carbs || 0, goal: nutrition?.dailyGoal?.carbs || 200, color: 'amber', unit: 'g' },
                    { name: 'Fat', actual: nutrition?.averages?.fat || 0, goal: nutrition?.dailyGoal?.fat || 65, color: 'yellow', unit: 'g' }
                  ].map(({ name, actual, goal, color, unit = 'kcal' }) => (
                    <div key={name}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-600 dark:text-gray-400">{name}</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {actual} / {goal} {unit}
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className={`h-full bg-${color}-500 rounded-full transition-all`}
                          style={{ width: `${Math.min((actual / goal) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Meal Plans Tab */}
        {activeTab === 'mealplans' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Lịch sử thực đơn</h2>
              <Link
                to="/meal-plan"
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors"
              >
                <FaPlus /> Áp dụng thực đơn mới
              </Link>
            </div>

            {history?.history?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {history.history.map((schedule) => (
                  <MealPlanHistoryCard key={schedule._id} schedule={schedule} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl">
                <FaHistory className="text-6xl text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">Chưa có lịch sử thực đơn</p>
                <Link
                  to="/meal-plan"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium transition-colors"
                >
                  <FaPlus /> Chọn thực đơn đầu tiên
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Posts Tab */}
        {activeTab === 'posts' && (
          <div className="space-y-6">
            {/* Posts Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={MdArticle} title="Tổng bài viết" value={posts?.summary?.totalPosts || 0} color="blue" />
              <StatCard icon={FaHeart} title="Tổng lượt thích" value={posts?.summary?.totalLikes || 0} color="rose" />
              <StatCard icon={FaComment} title="Tổng bình luận" value={posts?.summary?.totalComments || 0} color="purple" />
              <StatCard icon={IoMdTrendingUp} title="TB likes/bài" value={posts?.summary?.averageLikesPerPost || 0} color="emerald" />
            </div>

            {/* My Posts List */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-gray-900 dark:text-white">Bài viết của tôi</h3>
                <Link to="/home" className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors">
                  <FaPlus /> Tạo bài viết mới
                </Link>
              </div>
              
              {myPostsLoading ? (
                <div className="flex justify-center py-8">
                  <Loading />
                </div>
              ) : myPosts?.length > 0 ? (
                <div className="space-y-4">
                  {myPosts.map((post) => (
                    <div 
                      key={post._id} 
                      className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:shadow-md transition-all cursor-pointer"
                      onClick={() => navigate(`/post/${post._id}`)}
                    >
                      <div className="flex gap-4">
                        {/* Post Images */}
                        {post.image && post.image.length > 0 && (
                          <div className="flex-shrink-0">
                            <div className={`grid gap-1 ${post.image.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} w-32`}>
                              {post.image.slice(0, 4).map((img, idx) => (
                                <div key={idx} className="relative aspect-square">
                                  <img 
                                    src={getImageUrl(img.url)} 
                                    alt="" 
                                    className="w-full h-full rounded-lg object-cover"
                                  />
                                  {idx === 3 && post.image.length > 4 && (
                                    <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center text-white font-bold">
                                      +{post.image.length - 4}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Post Content */}
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-900 dark:text-white line-clamp-3 mb-2">{post.content || 'Không có nội dung'}</p>
                          
                          {/* Post Meta */}
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <FaHeart className="text-rose-500" /> {countValue(post.likes)}
                            </span>
                            <span className="flex items-center gap-1">
                              <FaComment className="text-blue-500" /> {countValue(post.comments)}
                            </span>
                            <span className="flex items-center gap-1">
                              <FaBookmark className="text-amber-500" /> {countValue(post.bookmark)}
                            </span>
                            <span className="text-xs text-gray-400">
                              {new Date(post.createdAt).toLocaleDateString('vi-VN')}
                            </span>
                          </div>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex items-start gap-2">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation()
                              navigate(`/post/${post._id}`)
                            }}
                            className="p-2 text-gray-500 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                            title="Xem chi tiết"
                          >
                            <FaEye />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Pagination */}
                  {postsPagination && postsPagination.total_pages > 1 && (
                    <div className="flex justify-center gap-2 mt-6">
                      <button
                        onClick={() => setPostsPage(prev => Math.max(1, prev - 1))}
                        disabled={postsPage === 1}
                        className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        Trước
                      </button>
                      <span className="px-4 py-2 text-gray-600 dark:text-gray-400">
                        {postsPage} / {postsPagination.total_pages}
                      </span>
                      <button
                        onClick={() => setPostsPage(prev => Math.min(postsPagination.total_pages, prev + 1))}
                        disabled={postsPage >= postsPagination.total_pages}
                        className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        Sau
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <MdArticle className="text-6xl text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">Bạn chưa có bài viết nào</p>
                  <Link
                    to="/home"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium transition-colors"
                  >
                    <FaPlus /> Tạo bài viết đầu tiên
                  </Link>
                </div>
              )}
            </div>

            {/* Top Posts Section */}
            {posts?.topPosts?.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                <h3 className="font-bold text-gray-900 dark:text-white mb-4">Bài viết nổi bật nhất</h3>
                <div className="space-y-3">
                  {posts.topPosts.slice(0, 3).map((post, index) => (
                    <div 
                      key={post._id} 
                      className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      onClick={() => navigate(`/post/${post._id}`)}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                        index === 0 ? 'bg-amber-500' : index === 1 ? 'bg-gray-400' : 'bg-amber-700'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-900 dark:text-white line-clamp-1">{post.content}</p>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <FaHeart className="text-rose-500" /> {post.likes || 0}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
