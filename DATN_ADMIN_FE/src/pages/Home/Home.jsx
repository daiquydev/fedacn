import { BsPeopleFill } from 'react-icons/bs'
import { MdSportsSoccer } from 'react-icons/md'
import { FaDumbbell, FaFire, FaSync } from 'react-icons/fa'
import PieChart from './components/PieChart/PieChart'
import AIUsageLineChart from './components/AIUsageLineChart/AIUsageLineChart'
import CommunityLineChart from './components/CommunityLineChart/CommunityLineChart'
import SportEventPieChart from './components/SportEventPieChart/SportEventPieChart'
import SportCategoryBarChart from './components/SportCategoryBarChart/SportCategoryBarChart'
import WorkoutLineChart from './components/WorkoutLineChart/WorkoutLineChart'
import { dashboard } from '../../apis/adminApi'
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query'

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon, iconBg, label, total, sub, subLabel }) {
  return (
    <div className='relative bg-white dark:bg-gray-800 rounded-2xl pt-10 pb-6 px-6 shadow-md border border-gray-100 dark:border-gray-700 my-4'>
      <div
        className={`text-white flex items-center justify-center absolute rounded-2xl p-4 shadow-lg -top-5 left-5 ${iconBg}`}
        style={{ minWidth: 56, minHeight: 56 }}
      >
        {icon}
      </div>
      <div className='mt-2'>
        <p className='text-base font-bold text-gray-700 dark:text-gray-200 mb-3'>{label}</p>
        <div className='flex items-end gap-2'>
          <span className='text-3xl font-black text-gray-800 dark:text-white'>{total ?? 0}</span>
          <span className='text-sm text-gray-400 mb-1'>{subLabel}</span>
        </div>
        {sub !== undefined && (
          <p className='text-xs text-gray-400 mt-2 flex items-center gap-1'>
            <span className='inline-block w-1.5 h-1.5 rounded-full bg-green-400' />
            {sub} đang hoạt động
          </p>
        )}
      </div>
      <div className={`absolute bottom-0 left-0 right-0 h-1 rounded-b-2xl ${iconBg} opacity-60`} />
    </div>
  )
}

// ─── Mini Community Stat Card ─────────────────────────────────────────────────
function MiniStatCard({ emoji, label, value, color }) {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl px-5 py-4 border-l-4 ${color} shadow-sm border border-gray-100 dark:border-gray-700`}>
      <p className='text-xs text-gray-400 dark:text-gray-500 mb-1'>{emoji} {label}</p>
      <p className='text-2xl font-black text-gray-800 dark:text-white'>{(value ?? 0).toLocaleString('vi-VN')}</p>
    </div>
  )
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({ emoji, title, subtitle }) {
  return (
    <div className='flex items-center gap-3 mb-2 mt-8 px-2'>
      <span className='text-2xl'>{emoji}</span>
      <div>
        <h2 className='text-lg font-bold text-gray-800 dark:text-gray-100'>{title}</h2>
        {subtitle && <p className='text-xs text-gray-400'>{subtitle}</p>}
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Home() {
  const queryClient = useQueryClient()

  const { data, isFetching } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => dashboard(),
    placeholderData: keepPreviousData,
    staleTime: 1000,
    refetchOnWindowFocus: true
  })

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['dashboard'] })
  }

  const result = data?.data?.result
  const community = result?.communityStats

  return (
    <div className='mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10 bg-gray-50 dark:bg-gray-900 min-h-screen'>

      {/* ── Hero Banner ────────────────────────────────────────────── */}
      <div className='relative overflow-hidden rounded-3xl bg-gradient-to-r from-orange-500 via-red-500 to-pink-600 px-8 py-8 mb-8 shadow-xl'>
        <div className='relative z-10 flex items-start justify-between'>
          <div>
            <p className='text-white/70 text-sm font-medium mb-1'>FitConnect Admin</p>
            <h1 className='text-3xl font-black text-white mb-2'>Trang Tổng Quan</h1>
            <p className='text-white/80 text-sm max-w-md'>
              Theo dõi toàn bộ hoạt động: người dùng, cộng đồng, sự kiện thể thao, tập luyện và AI.
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isFetching}
            className='flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all disabled:opacity-50 mt-1 shrink-0'
          >
            <FaSync size={13} className={isFetching ? 'animate-spin' : ''} />
            Làm mới
          </button>
        </div>
        <div className='absolute -right-10 -top-10 w-48 h-48 rounded-full bg-white/10' />
        <div className='absolute right-20 -bottom-8 w-32 h-32 rounded-full bg-white/10' />
      </div>

      {/* ── Section 1: Stat Cards ──────────────────────────────────── */}
      <SectionHeader emoji='📈' title='Tổng quan Hệ thống' />
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:gap-6'>
        <StatCard
          icon={<BsPeopleFill size={26} />}
          iconBg='bg-gradient-to-br from-orange-400 to-orange-600'
          label='Tài khoản người dùng'
          total={result?.account?.users?.total}
          sub={result?.account?.users?.active}
          subLabel='tài khoản'
        />
        <StatCard
          icon={<MdSportsSoccer size={26} />}
          iconBg='bg-gradient-to-br from-green-400 to-emerald-600'
          label='Sự kiện Thể thao'
          total={result?.sportEvents?.total}
          subLabel='sự kiện'
        />
        <StatCard
          icon={<FaDumbbell size={24} />}
          iconBg='bg-gradient-to-br from-violet-500 to-purple-700'
          label='Buổi tập người dùng hoàn thành'
          total={result?.workoutStats?.totalSessions}
          subLabel='buổi tập'
        />
        <StatCard
          icon={<FaFire size={24} />}
          iconBg='bg-gradient-to-br from-rose-400 to-red-600'
          label='Tổng Kcal người dùng đã đốt'
          total={result?.workoutStats?.totalKcal?.toLocaleString('vi-VN')}
          subLabel='kcal'
        />
      </div>

      {/* ── Section 2: BMI ────────────────────────────────────────── */}
      <SectionHeader emoji='🏥' title='Phân phối BMI' subtitle='Dựa trên thông tin hồ sơ sức khỏe người dùng' />
      <div className='grid w-full grid-cols-1 xl:grid-cols-2 gap-2'>
        <div className='xl:col-span-1'>
          <PieChart usersBMI={result?.usersBMI} />
        </div>
      </div>

      {/* ── Section 2b: AI Usage Line Chart ──────────────────────── */}
      <SectionHeader emoji='🤖' title='Lượt sử dụng AI' subtitle='Số lần sử dụng AI theo từng tính năng trong 10 ngày gần nhất' />
      <div className='grid w-full grid-cols-1'>
        <AIUsageLineChart aiUsage={result?.aiUsage} />
      </div>

      {/* ── Section 3: Cộng đồng ──────────────────────────────────── */}
      <SectionHeader emoji='🗣️' title='Hoạt động Cộng đồng' subtitle='Số liệu bài viết, bình luận, tương tác và báo cáo' />
      {/* 4 mini stat cards */}
      <div className='grid grid-cols-2 xl:grid-cols-4 gap-3 px-2 my-3'>
        <MiniStatCard emoji='📝' label='Tổng bài viết' value={community?.totalPosts} color='border-l-red-400' />
        <MiniStatCard emoji='💬' label='Tổng bình luận' value={community?.totalComments} color='border-l-blue-400' />
        <MiniStatCard emoji='❤️' label='Tổng lượt thích' value={community?.totalLikes} color='border-l-orange-400' />
        <MiniStatCard emoji='🚨' label='Bài viết bị báo cáo' value={community?.reportedPosts} color='border-l-rose-500' />
      </div>
      {/* 10-day community line chart */}
      <div className='grid w-full grid-cols-1'>
        <CommunityLineChart
          dailyPosts={community?.dailyPosts}
          dailyComments={community?.dailyComments}
          dailyLikes={community?.dailyLikes}
        />
      </div>

      {/* ── Section 4: Sự kiện Thể thao ──────────────────────────── */}
      <SectionHeader emoji='🏅' title='Sự kiện Thể thao' subtitle='Phân loại sự kiện và mức độ tham gia theo thể loại' />
      <div className='grid w-full grid-cols-1 xl:grid-cols-5 gap-2'>
        <div className='xl:col-span-2'>
          <SportEventPieChart sportEvents={result?.sportEvents} />
        </div>
        <div className='xl:col-span-3'>
          <SportCategoryBarChart topCategories={result?.sportEvents?.topCategories} />
        </div>
      </div>

      {/* ── Section 5: Tập luyện ──────────────────────────────────── */}
      <SectionHeader emoji='💪' title='Tập luyện' subtitle='Buổi tập hoàn thành & kcal đốt trong 10 ngày gần nhất' />
      <div className='grid w-full grid-cols-1'>
        <WorkoutLineChart dailySessions={result?.workoutStats?.dailySessions} />
      </div>

      <div className='h-10' />
    </div>
  )
}
