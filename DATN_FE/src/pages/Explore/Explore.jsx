import { useState, useEffect, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useInView } from 'react-intersection-observer'
import { FaUtensils, FaUsers, FaHeart, FaComment, FaShare, FaBookmark, FaCalendarAlt, FaClock, FaFire, FaLeaf, FaSearch, FaArrowRight, FaUserPlus } from 'react-icons/fa'
import { IoMdTime } from 'react-icons/io'
import { MdRestaurantMenu, MdTrendingUp, MdExplore } from 'react-icons/md'
import { getPublicPosts } from '../../apis/postApi'
import mealPlanApi from '../../apis/mealPlanApi'
import { getImageUrl } from '../../utils/imageUrl'
import Loading from '../../components/GlobalComponents/Loading'

// Placeholder images
const PLACEHOLDER_POST = 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=800&q=80'
const PLACEHOLDER_MEAL = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80'
const PLACEHOLDER_AVATAR = 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&w=200&q=80'

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  const now = new Date()
  const diff = now - date
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 60) return `${minutes} phút trước`
  if (hours < 24) return `${hours} giờ trước`
  if (days < 7) return `${days} ngày trước`
  return date.toLocaleDateString('vi-VN')
}

// Login Prompt Modal Component
const LoginPromptModal = ({ isOpen, onClose, action }) => {
  const navigate = useNavigate()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-md w-full p-8 text-center transform animate-fadeIn">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
          <FaUserPlus className="text-3xl text-white" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          Tham gia cộng đồng
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Đăng nhập để {action || 'tương tác với nội dung'} và kết nối với cộng đồng yêu thích ẩm thực lành mạnh.
        </p>
        <div className="space-y-3">
          <button
            onClick={() => navigate('/login')}
            className="w-full py-3 px-6 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-[1.02]"
          >
            Đăng nhập ngay
          </button>
          <button
            onClick={() => navigate('/register')}
            className="w-full py-3 px-6 border-2 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-semibold rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all duration-300"
          >
            Tạo tài khoản mới
          </button>
          <button
            onClick={onClose}
            className="w-full py-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            Để sau
          </button>
        </div>
      </div>
    </div>
  )
}

// Post Card for Explore
const ExplorePostCard = ({ post, onInteraction }) => {
  const navigate = useNavigate()
  const userAvatar = getImageUrl(post?.user?.avatar) || PLACEHOLDER_AVATAR
  const postImages = post?.images || []
  const mainImage = postImages[0] ? getImageUrl(postImages[0]) : null

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all duration-300">
      {/* Header */}
      <div className="p-4 flex items-center gap-3">
        <img
          src={userAvatar}
          alt={post?.user?.name}
          className="w-10 h-10 rounded-full object-cover border-2 border-emerald-100"
          onError={(e) => { e.target.src = PLACEHOLDER_AVATAR }}
        />
        <div className="flex-1">
          <p className="font-semibold text-gray-900 dark:text-white text-sm">{post?.user?.name || 'Người dùng'}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(post?.createdAt)}</p>
        </div>
      </div>

      {/* Content */}
      {post?.content && (
        <div className="px-4 pb-3">
          <p className="text-gray-700 dark:text-gray-300 text-sm line-clamp-3">{post.content}</p>
        </div>
      )}

      {/* Image */}
      {mainImage && (
        <div 
          className="relative aspect-[4/3] cursor-pointer"
          onClick={() => onInteraction('xem chi tiết bài viết')}
        >
          <img
            src={mainImage}
            alt="Post"
            className="w-full h-full object-cover"
            onError={(e) => { e.target.src = PLACEHOLDER_POST }}
          />
          {postImages.length > 1 && (
            <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
              +{postImages.length - 1}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="p-4 flex items-center justify-between border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-4">
          <button
            onClick={() => onInteraction('thích bài viết')}
            className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 hover:text-rose-500 transition-colors"
          >
            <FaHeart className="text-lg" />
            <span className="text-sm font-medium">{post?.like_count || 0}</span>
          </button>
          <button
            onClick={() => onInteraction('bình luận')}
            className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 hover:text-emerald-500 transition-colors"
          >
            <FaComment className="text-lg" />
            <span className="text-sm font-medium">{post?.comment_count || 0}</span>
          </button>
          <button
            onClick={() => onInteraction('chia sẻ bài viết')}
            className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 hover:text-blue-500 transition-colors"
          >
            <FaShare className="text-lg" />
            <span className="text-sm font-medium">{post?.share_count || 0}</span>
          </button>
        </div>
        <button
          onClick={() => onInteraction('lưu bài viết')}
          className="text-gray-500 dark:text-gray-400 hover:text-amber-500 transition-colors"
        >
          <FaBookmark className="text-lg" />
        </button>
      </div>
    </div>
  )
}

// Meal Plan Card for Explore
const ExploreMealPlanCard = ({ plan, onInteraction, compact = false }) => {
  const navigate = useNavigate()
  const coverImage = getImageUrl(plan?.image || plan?.cover_image) || PLACEHOLDER_MEAL
  const authorAvatar = getImageUrl(plan?.author?.avatar) || PLACEHOLDER_AVATAR

  const getCategoryLabel = (category) => {
    const labels = {
      0: 'Giảm cân',
      1: 'Tăng cơ',
      2: 'Ăn chay',
      3: 'Low-carb',
      4: 'Cân bằng',
      5: 'Khác'
    }
    return labels[category] || 'Thực đơn'
  }

  // Compact version for sidebar
  if (compact) {
    return (
      <div 
        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer flex gap-3 p-3"
        onClick={() => navigate(`/explore/meal-plan/${plan._id}`)}
      >
        <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
          <img
            src={coverImage}
            alt={plan?.title}
            className="w-full h-full object-cover"
            onError={(e) => { e.target.src = PLACEHOLDER_MEAL }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold rounded-full">
            {getCategoryLabel(plan?.category)}
          </span>
          <h4 className="font-semibold text-gray-900 dark:text-white text-sm mt-1 line-clamp-2">{plan?.title}</h4>
          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <FaCalendarAlt className="text-[10px]" />
              {plan?.duration || 7} ngày
            </span>
            <span className="flex items-center gap-1">
              <FaHeart className="text-rose-400 text-[10px]" />
              {plan?.likes_count || 0}
            </span>
          </div>
        </div>
      </div>
    )
  }

  // Full card version
  return (
    <div 
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all duration-300 group cursor-pointer"
      onClick={() => navigate(`/explore/meal-plan/${plan._id}`)}
    >
      {/* Cover Image */}
      <div className="relative aspect-[16/10] overflow-hidden">
        <img
          src={coverImage}
          alt={plan?.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => { e.target.src = PLACEHOLDER_MEAL }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        
        {/* Category Badge */}
        <div className="absolute top-3 left-3">
          <span className="px-3 py-1 bg-white/90 dark:bg-gray-900/90 text-emerald-600 dark:text-emerald-400 text-xs font-semibold rounded-full">
            {getCategoryLabel(plan?.category)}
          </span>
        </div>

        {/* Duration */}
        <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
          <FaCalendarAlt />
          <span>{plan?.duration || 7} ngày</span>
        </div>

        {/* Title overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-white font-bold text-lg line-clamp-2 mb-1">{plan?.title}</h3>
          <div className="flex items-center gap-2">
            <img
              src={authorAvatar}
              alt={plan?.author?.name}
              className="w-6 h-6 rounded-full border border-white/50"
              onError={(e) => { e.target.src = PLACEHOLDER_AVATAR }}
            />
            <span className="text-white/90 text-sm">{plan?.author?.name || 'Tác giả'}</span>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        {/* Nutrition Summary */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {[
            { label: 'Calories', value: plan?.averageNutrition?.calories || plan?.total_calories || 0, unit: 'kcal', color: 'text-orange-500' },
            { label: 'Protein', value: plan?.averageNutrition?.protein || 0, unit: 'g', color: 'text-red-500' },
            { label: 'Carbs', value: plan?.averageNutrition?.carbs || 0, unit: 'g', color: 'text-amber-500' },
            { label: 'Fat', value: plan?.averageNutrition?.fat || 0, unit: 'g', color: 'text-yellow-500' }
          ].map(({ label, value, unit, color }) => (
            <div key={label} className="text-center">
              <p className={`text-sm font-bold ${color}`}>{Math.round(value)}</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400">{label}</p>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <FaHeart className="text-rose-400" />
              {plan?.likes_count || 0}
            </span>
            <span className="flex items-center gap-1">
              <FaUsers className="text-blue-400" />
              {plan?.applied_count || 0}
            </span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onInteraction('lưu thực đơn')
            }}
            className="flex items-center gap-1 hover:text-emerald-500 transition-colors"
          >
            <FaBookmark />
            <span>Lưu</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Explore() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('all')
  const [posts, setPosts] = useState([])
  const [mealPlans, setMealPlans] = useState([])
  const [featuredPlans, setFeaturedPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loginModal, setLoginModal] = useState({ open: false, action: '' })
  const { ref, inView } = useInView()

  const handleInteraction = useCallback((action) => {
    setLoginModal({ open: true, action })
  }, [])

  // Initial data fetch
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true)
      try {
        const [postsRes, mealPlansRes] = await Promise.all([
          getPublicPosts({ page: 1, limit: 10 }),
          mealPlanApi.getMealPlans({ page: 1, limit: 8, sort: 'popular' })
        ])

        setPosts(postsRes?.data?.result?.posts || [])
        setMealPlans(mealPlansRes?.data?.result?.meal_plans || [])
        setFeaturedPlans((mealPlansRes?.data?.result?.meal_plans || []).slice(0, 3))
        setHasMore((postsRes?.data?.result?.posts || []).length >= 10)
      } catch (error) {
        console.error('Error fetching explore data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchInitialData()
  }, [])

  // Load more posts with debounce to prevent rapid API calls
  useEffect(() => {
    if (!inView || !hasMore || loading || loadingMore || activeTab === 'mealplans') {
      return
    }

    // Debounce to prevent multiple rapid calls
    const timeoutId = setTimeout(() => {
      setLoadingMore(true)
      const nextPage = page + 1
      
      getPublicPosts({ page: nextPage, limit: 10 })
        .then((res) => {
          const newPosts = res?.data?.result?.posts || []
          if (newPosts.length > 0) {
            setPosts((prev) => {
              // Prevent duplicates
              const existingIds = new Set(prev.map(p => p._id))
              const uniqueNewPosts = newPosts.filter(p => !existingIds.has(p._id))
              return [...prev, ...uniqueNewPosts]
            })
            setPage(nextPage)
          }
          setHasMore(newPosts.length >= 10)
        })
        .catch((error) => {
          console.error('Error loading more posts:', error)
          setHasMore(false) // Stop trying on error
        })
        .finally(() => {
          setLoadingMore(false)
        })
    }, 300) // 300ms debounce

    return () => clearTimeout(timeoutId)
  }, [inView, hasMore, loading, loadingMore, page, activeTab])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-500 to-cyan-500">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1490818387583-1baba5e638af?auto=format&fit=crop&w=1920&q=80')] bg-cover bg-center opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/50 to-transparent" />
        
        <div className="relative max-w-7xl mx-auto px-4 py-16 md:py-24">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-emerald-100 mb-4">
              <MdExplore className="text-2xl" />
              <span className="text-sm font-medium uppercase tracking-wider">Khám phá</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Cộng đồng yêu thích
              <span className="block text-emerald-200">ẩm thực lành mạnh</span>
            </h1>
            <p className="text-lg text-white/80 mb-8">
              Khám phá hàng ngàn công thức, thực đơn và chia sẻ từ cộng đồng. 
              Tham gia ngay để bắt đầu hành trình sống khỏe!
            </p>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => navigate('/register')}
                className="px-6 py-3 bg-white text-emerald-600 font-semibold rounded-xl hover:bg-emerald-50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Tạo tài khoản miễn phí
              </button>
              <button
                onClick={() => navigate('/login')}
                className="px-6 py-3 bg-white/20 text-white font-semibold rounded-xl hover:bg-white/30 transition-all duration-300 backdrop-blur-sm"
              >
                Đã có tài khoản? Đăng nhập
              </button>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="relative bg-white/10 backdrop-blur-sm border-t border-white/20">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-white">{posts.length}+</p>
                <p className="text-sm text-white/70">Bài chia sẻ</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{mealPlans.length}+</p>
                <p className="text-sm text-white/70">Thực đơn</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">1000+</p>
                <p className="text-sm text-white/70">Thành viên</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Meal Plans */}
      {featuredPlans.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-1">
                <MdTrendingUp className="text-xl" />
                <span className="text-sm font-semibold uppercase tracking-wide">Nổi bật</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Thực đơn được yêu thích</h2>
            </div>
            <Link
              to="/explore/meal-plans"
              className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 font-medium"
            >
              Xem tất cả <FaArrowRight className="text-sm" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredPlans.map((plan) => (
              <ExploreMealPlanCard
                key={plan._id}
                plan={plan}
                onInteraction={handleInteraction}
              />
            ))}
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="sticky top-0 z-20 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-1 overflow-x-auto py-2">
            {[
              { id: 'all', label: 'Tất cả', icon: MdExplore },
              { id: 'posts', label: 'Bài viết', icon: FaUsers },
              { id: 'mealplans', label: 'Thực đơn', icon: MdRestaurantMenu }
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
        {/* Full width Meal Plans Grid - shown when mealplans tab is active */}
        {activeTab === 'mealplans' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Tất cả thực đơn</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{mealPlans.length} thực đơn</p>
            </div>

            {mealPlans.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {mealPlans.map((plan) => (
                  <ExploreMealPlanCard
                    key={plan._id}
                    plan={plan}
                    onInteraction={handleInteraction}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <MdRestaurantMenu className="text-4xl text-gray-400" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-lg">Chưa có thực đơn nào</p>
                <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Hãy quay lại sau nhé!</p>
              </div>
            )}

            {/* CTA Card for mealplans tab */}
            <div className="mt-8 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-2xl p-8 text-white">
              <div className="max-w-2xl mx-auto text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/20 flex items-center justify-center">
                  <FaLeaf className="text-3xl" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Tạo thực đơn của riêng bạn</h3>
                <p className="text-white/80 mb-6">
                  Đăng ký để tạo thực đơn cá nhân hóa, theo dõi dinh dưỡng hàng ngày và chia sẻ với cộng đồng.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    onClick={() => navigate('/register')}
                    className="px-8 py-3 bg-white text-emerald-600 font-semibold rounded-xl hover:bg-emerald-50 transition-colors"
                  >
                    Đăng ký miễn phí
                  </button>
                  <button
                    onClick={() => navigate('/login')}
                    className="px-8 py-3 border-2 border-white/50 text-white font-semibold rounded-xl hover:bg-white/10 transition-colors"
                  >
                    Đăng nhập
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Two column layout for posts and sidebar */}
        {activeTab !== 'mealplans' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Posts Feed */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Bài viết mới nhất</h2>
              </div>

              {posts.length > 0 ? (
                <div className="space-y-6">
                  {posts.map((post) => (
                    <ExplorePostCard
                      key={post._id}
                      post={post}
                      onInteraction={handleInteraction}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  Chưa có bài viết nào
                </div>
              )}

              {/* Load more trigger */}
              <div ref={ref} className="h-10 flex items-center justify-center">
                {loadingMore && <Loading />}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Thực đơn nổi bật</h2>
              </div>

              {mealPlans.slice(0, 4).map((plan) => (
                <ExploreMealPlanCard
                  key={plan._id}
                  plan={plan}
                  onInteraction={handleInteraction}
                  compact
                />
              ))}

              {mealPlans.length > 4 && (
                <button
                  onClick={() => setActiveTab('mealplans')}
                  className="w-full py-2.5 text-emerald-600 dark:text-emerald-400 font-medium text-sm hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-colors"
                >
                  Xem thêm {mealPlans.length - 4} thực đơn khác
                </button>
              )}

              {/* CTA Card */}
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white">
                <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mb-4">
                  <FaLeaf className="text-2xl" />
                </div>
                <h3 className="text-xl font-bold mb-2">Bắt đầu hành trình</h3>
                <p className="text-white/80 text-sm mb-4">
                  Tham gia ngay để tạo thực đơn riêng, theo dõi dinh dưỡng và kết nối với cộng đồng.
                </p>
                <button
                  onClick={() => navigate('/register')}
                  className="w-full py-2.5 bg-white text-emerald-600 font-semibold rounded-xl hover:bg-emerald-50 transition-colors"
                >
                  Đăng ký miễn phí
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Login Prompt Modal */}
      <LoginPromptModal
        isOpen={loginModal.open}
        onClose={() => setLoginModal({ open: false, action: '' })}
        action={loginModal.action}
      />
    </div>
  )
}
