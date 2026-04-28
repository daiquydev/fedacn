import { BsPeopleFill } from 'react-icons/bs'
import { MdSportsSoccer } from 'react-icons/md'
import { FaDumbbell, FaTrophy } from 'react-icons/fa'
import ChallengeAnalyticsSection from './components/ChallengeAnalyticsSection/ChallengeAnalyticsSection'
import CommunitySection from './components/CommunitySection/CommunitySection'
import SportEventCategoryCharts from './components/SportEventCategoryCharts/SportEventCategoryCharts'
import InfoTooltip from './components/InfoTooltip/InfoTooltip'
import UsersHealthSection from './components/UsersHealthSection/UsersHealthSection'
import { dashboard, getSystemOverviewAnalytics } from '../../apis/adminApi'
import { keepPreviousData, useQuery } from '@tanstack/react-query'

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon, iconBg, label, total, sub, subLabel, subText }) {
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
          <span className='text-3xl font-black text-gray-800 dark:text-white'>{(total ?? 0).toLocaleString('vi-VN')}</span>
          <span className='text-sm text-gray-400 mb-1'>{subLabel}</span>
        </div>
        {sub !== undefined && (
          <p className='text-xs text-gray-400 mt-2 flex items-center gap-1'>
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${subText ? 'bg-amber-400' : 'bg-green-400'}`} />
            {sub} {subText || 'đang hoạt động'}
          </p>
        )}
      </div>
      <div className={`absolute bottom-0 left-0 right-0 h-1 rounded-b-2xl ${iconBg} opacity-60`} />
    </div>
  )
}

// ─── Group Header ─────────────────────────────────────────────────────────────
function GroupHeader({ emoji, title, subtitle, infoText }) {
  return (
    <div className='flex items-center gap-3 mb-3 mt-10 px-2'>
      <span className='text-2xl'>{emoji}</span>
      <div className='flex-1'>
        <div className='flex items-center gap-2'>
          <h2 className='text-lg font-bold text-gray-800 dark:text-gray-100'>{title}</h2>
          {infoText && <InfoTooltip text={infoText} />}
        </div>
        {subtitle && <p className='text-xs text-gray-400'>{subtitle}</p>}
      </div>
    </div>
  )
}

// ─── Section Header (smaller) ─────────────────────────────────────────────────
function SectionHeader({ emoji, title, subtitle, infoText }) {
  return (
    <div className='flex items-center gap-2.5 mb-2 mt-6 px-2'>
      <span className='text-lg'>{emoji}</span>
      <div className='flex-1'>
        <div className='flex items-center gap-2'>
          <h3 className='text-sm font-bold text-gray-700 dark:text-gray-200'>{title}</h3>
          {infoText && <InfoTooltip text={infoText} />}
        </div>
        {subtitle && <p className='text-[11px] text-gray-400'>{subtitle}</p>}
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Home() {
  const { data } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => dashboard(),
    placeholderData: keepPreviousData
  })
  const { data: systemOverviewData } = useQuery({
    queryKey: ['system-overview'],
    queryFn: () => getSystemOverviewAnalytics(),
    placeholderData: keepPreviousData
  })

  const result = data?.data?.result
  const systemOverview = systemOverviewData?.data?.result || {}

  return (
    <div className='mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10 bg-gray-50 dark:bg-gray-900 min-h-screen'>

      {/* ── Hero Banner ────────────────────────────────────────────── */}
      <div className='relative overflow-hidden rounded-3xl bg-gradient-to-r from-orange-500 via-red-500 to-pink-600 px-8 py-8 mb-8 shadow-xl'>
        <div className='relative z-10'>
          <p className='text-white/70 text-sm font-medium mb-1'>FitConnect Admin</p>
          <h1 className='text-3xl font-black text-white mb-2'>Trang Tổng Quan</h1>
          <p className='text-white/80 text-sm max-w-md'>
            Theo dõi toàn bộ hoạt động: người dùng, cộng đồng, sự kiện thể thao và thử thách.
          </p>
        </div>
        <div className='absolute -right-10 -top-10 w-48 h-48 rounded-full bg-white/10' />
        <div className='absolute right-20 -bottom-8 w-32 h-32 rounded-full bg-white/10' />
      </div>

      {/* ══════════════════════════════════════════════════════════════
          📈 STAT CARDS — Nhìn nhanh sức khỏe hệ thống
          ══════════════════════════════════════════════════════════════ */}
      <GroupHeader
        emoji='📈'
        title='Tổng quan Hệ thống'
        subtitle='Theo dõi quy mô và tăng trưởng nền tảng'
        infoText='Bốn chỉ số cốt lõi (người dùng, sự kiện, thử thách, buổi tập) giúp nắm nhanh quy mô hệ thống. Nếu một chỉ số tăng bất thường → cần kiểm tra nguyên nhân. Nếu giảm → cần chiến lược thu hút.'
      />
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:gap-6'>
        <StatCard
          icon={<BsPeopleFill size={26} />}
          iconBg='bg-gradient-to-br from-orange-400 to-orange-600'
          label='Tài khoản người dùng'
          total={systemOverview?.users}
          subLabel='tài khoản'
        />
        <StatCard
          icon={<MdSportsSoccer size={26} />}
          iconBg='bg-gradient-to-br from-green-400 to-emerald-600'
          label='Sự kiện Thể thao'
          total={systemOverview?.sportEvents}
          subLabel='sự kiện'
        />
        <StatCard
          icon={<FaDumbbell size={24} />}
          iconBg='bg-gradient-to-br from-blue-400 to-cyan-600'
          label='Buổi tập luyện'
          total={systemOverview?.workouts}
          subLabel='buổi tập'
        />
        <StatCard
          icon={<FaTrophy size={24} />}
          iconBg='bg-gradient-to-br from-indigo-500 to-violet-700'
          label='Số lượng thử thách'
          total={systemOverview?.challenges}
          subLabel='thử thách'
        />
      </div>

      {/* ══════════════════════════════════════════════════════════════
          NHÓM 1: 👥 NGƯỜI DÙNG & SỨC KHỎE
          ══════════════════════════════════════════════════════════════ */}
      <GroupHeader
        emoji='👥'
        title='Người dùng & Sức khỏe'
        subtitle='Hiểu cộng đồng — ai đang dùng, thể trạng ra sao'
        infoText='KPI: cơ cấu giới tính, mức BMI, và người tham gia tập luyện theo thời gian. Ý nghĩa: phản ánh chân dung cộng đồng và xu hướng sức khỏe. Hành động: điều chỉnh nội dung, chiến dịch và chương trình can thiệp phù hợp từng nhóm.'
      />
      <UsersHealthSection />

      {/* ══════════════════════════════════════════════════════════════
          NHÓM 2: 🏅 CỘNG ĐỒNG & SỰ KIỆN
          ══════════════════════════════════════════════════════════════ */}

      {/* Community Section (self-contained with merged header + filter) */}
      <CommunitySection />

      {/* Top Sport Categories */}
      <SectionHeader
        emoji='🏆'
        title='Top Môn Thể thao'
        subtitle='Xếp hạng môn thể thao theo số sự kiện và lượng người tham gia'
        infoText='So sánh môn nào có nhiều sự kiện nhất và môn nào thu hút nhiều người tham gia nhất. Nếu 1 môn có nhiều sự kiện nhưng ít người → cần quảng bá hơn. Ngược lại nếu ít sự kiện nhưng nhiều người → cần tạo thêm sự kiện cho môn đó.'
      />
      <div className='px-2'>
        <SportEventCategoryCharts sportEvents={result?.sportEvents} />
      </div>

      {/* ══════════════════════════════════════════════════════════════
          NHÓM 3: 🏆 THỬ THÁCH
          ══════════════════════════════════════════════════════════════ */}
      <GroupHeader
        emoji='🏆'
        title='Thử thách'
        subtitle='Phân tích số lượng thử thách mới theo loại (dinh dưỡng, ngoài trời, thể lực)'
        infoText='KPI: thử thách tạo mới theo loại, theo phạm vi và tỷ lệ hoàn thành. Ý nghĩa: đánh giá mức hấp dẫn và khả năng hoàn thành của từng dòng thử thách. Hành động: ưu tiên loại có tỷ lệ hoàn thành cao và tối ưu loại có tỷ lệ bỏ dở.'
      />
      <div className='px-2'>
        <ChallengeAnalyticsSection />
      </div>

      <div className='h-10' />
    </div>
  )
}
