import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  FaCalculator, FaHistory, FaArrowRight, FaFire, FaTint, FaWeight,
  FaHeartbeat, FaRunning, FaDumbbell, FaChartLine, FaArrowUp
} from 'react-icons/fa'
import { GiBodyHeight, GiMuscleUp, GiBrain } from 'react-icons/gi'
import { MdFitnessCenter } from 'react-icons/md'
import { currentAccount } from '../../apis/userApi'
import Counup from '../../components/GlobalComponents/Countup'
import Loading from '../../components/GlobalComponents/Loading'
import LineChart from '../FitnessCalculatorHistory/components/LineChart/LineChart'
import BMI from '../../assets/images/BMI.png'
import calo from '../../assets/images/calo.png'
import bodyFat from '../../assets/images/bodyFat.png'
import BMRImg from '../../assets/images/BMR.png'
import IBW from '../../assets/images/IBW.png'
import LBM from '../../assets/images/LBM.png'
import caloBurned from '../../assets/images/caloBurned.png'
import waterNeed from '../../assets/images/waterNeed.png'

const calculatorItems = [
  {
    id: 1, name: 'BMI', fullName: 'Body Mass Index',
    desc: 'Chỉ số khối cơ thể – đánh giá tình trạng cân nặng so với chiều cao',
    image: BMI, link: '/fitness/fitness-calculator/BMI',
    gradient: 'from-orange-500 to-amber-400', iconBg: 'bg-orange-100 dark:bg-orange-900/30',
    icon: <FaWeight className="text-orange-500 text-xl" />
  },
  {
    id: 2, name: 'TDEE', fullName: 'Total Daily Energy Expenditure',
    desc: 'Tổng năng lượng tiêu thụ mỗi ngày – cơ sở để lập kế hoạch ăn uống',
    image: calo, link: '/fitness/fitness-calculator/calories',
    gradient: 'from-green-500 to-emerald-400', iconBg: 'bg-green-100 dark:bg-green-900/30',
    icon: <FaFire className="text-green-500 text-xl" />
  },
  {
    id: 3, name: 'Body Fat', fullName: 'Body Fat Percentage',
    desc: 'Phần trăm mỡ cơ thể – chỉ số quan trọng về sức khỏe và thể hình',
    image: bodyFat, link: '/fitness/fitness-calculator/body-fat',
    gradient: 'from-blue-500 to-cyan-400', iconBg: 'bg-blue-100 dark:bg-blue-900/30',
    icon: <GiMuscleUp className="text-blue-500 text-xl" />
  },
  {
    id: 4, name: 'BMR', fullName: 'Basal Metabolic Rate',
    desc: 'Tỷ lệ trao đổi chất cơ bản – năng lượng cơ thể cần khi nghỉ ngơi',
    image: BMRImg, link: '/fitness/fitness-calculator/BMR',
    gradient: 'from-teal-500 to-cyan-400', iconBg: 'bg-teal-100 dark:bg-teal-900/30',
    icon: <FaHeartbeat className="text-teal-500 text-xl" />
  },
  {
    id: 5, name: 'IBW', fullName: 'Ideal Body Weight',
    desc: 'Cân nặng lý tưởng – mức cân nặng phù hợp nhất với chiều cao của bạn',
    image: IBW, link: '/fitness/fitness-calculator/IBW',
    gradient: 'from-red-600 to-rose-400', iconBg: 'bg-red-100 dark:bg-red-900/30',
    icon: <GiBodyHeight className="text-red-600 text-xl" />
  },
  {
    id: 6, name: 'LBM', fullName: 'Lean Body Mass',
    desc: 'Khối lượng cơ nạc – tổng trọng lượng không kể mỡ cơ thể',
    image: LBM, link: '/fitness/fitness-calculator/LBM',
    gradient: 'from-violet-500 to-purple-400', iconBg: 'bg-violet-100 dark:bg-violet-900/30',
    icon: <FaDumbbell className="text-violet-500 text-xl" />
  },
  {
    id: 7, name: 'Calo Burned', fullName: 'Calories Burned Calculator',
    desc: 'Lượng calo đốt cháy – ước tính năng lượng tiêu hao qua hoạt động',
    image: caloBurned, link: '/fitness/fitness-calculator/calo-burned',
    gradient: 'from-pink-500 to-rose-400', iconBg: 'bg-pink-100 dark:bg-pink-900/30',
    icon: <FaRunning className="text-pink-500 text-xl" />
  },
  {
    id: 8, name: 'Nước uống', fullName: 'Water Per Day',
    desc: 'Lượng nước cần uống mỗi ngày – đảm bảo cơ thể luôn đủ nước',
    image: waterNeed, link: '/fitness/fitness-calculator/water-need',
    gradient: 'from-sky-500 to-blue-400', iconBg: 'bg-sky-100 dark:bg-sky-900/30',
    icon: <FaTint className="text-sky-500 text-xl" />
  }
]

// ── Tool Card ──
function CalcCard({ item }) {
  return (
    <Link to={item.link}
      className="group relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:border-transparent hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
    >
      {/* gradient top bar */}
      <div className={`h-1.5 w-full bg-gradient-to-r ${item.gradient}`} />
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-xl ${item.iconBg} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
            {item.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-gradient-to-r ${item.gradient} text-white`}>{item.name}</span>
            </div>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 leading-tight mb-2">{item.fullName}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{item.desc}</p>
          </div>
        </div>
        <div className={`mt-4 flex items-center gap-1 text-xs font-semibold bg-gradient-to-r ${item.gradient} bg-clip-text text-transparent group-hover:gap-2 transition-all`}>
          Tính ngay <FaArrowRight className="text-[10px] opacity-60" />
        </div>
      </div>
    </Link>
  )
}

// ── History stat card ──
const STAT_CONFIGS = [
  { key: 'BMI', label: 'BMI', unit: 'kg/m²', icon: <FaWeight />, gradient: 'from-orange-500 to-amber-400', link: '/fitness/fitness-calculator/BMI' },
  { key: 'BMR', label: 'BMR', unit: 'kcal', icon: <FaHeartbeat />, gradient: 'from-teal-500 to-cyan-400', link: '/fitness/fitness-calculator/BMR' },
  { key: 'TDEE', label: 'TDEE', unit: 'kcal/ngày', icon: <FaFire />, gradient: 'from-green-500 to-emerald-400', link: '/fitness/fitness-calculator/calories' },
  { key: 'body_fat', label: 'Body Fat', unit: '%', icon: <GiMuscleUp />, gradient: 'from-blue-500 to-cyan-400', link: '/fitness/fitness-calculator/body-fat' },
  { key: 'LBM', label: 'LBM', unit: 'kg', icon: <FaDumbbell />, gradient: 'from-violet-500 to-purple-400', link: '/fitness/fitness-calculator/LBM' },
  { key: 'IBW', label: 'IBW', unit: 'kg', icon: <GiBodyHeight />, gradient: 'from-red-600 to-rose-400', link: '/fitness/fitness-calculator/IBW' },
]

function HistoryStatCard({ config, value }) {
  return (
    <div className="relative bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      <div className={`h-1.5 bg-gradient-to-r ${config.gradient}`} />
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${config.gradient} flex items-center justify-center text-white text-base`}>
            {config.icon}
          </div>
          <Link to={config.link}
            className="text-xs font-semibold text-blue-500 hover:text-blue-600 flex items-center gap-1 transition-colors"
          >
            Cập nhật <FaArrowRight className="text-[9px]" />
          </Link>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">{config.label}</p>
        <div className="flex items-end gap-2">
          <span className={`text-2xl font-bold bg-gradient-to-r ${config.gradient} bg-clip-text text-transparent`}>
            <Counup number={value} title='' />
          </span>
          <span className="text-xs text-gray-400 mb-1">{config.unit}</span>
        </div>
      </div>
    </div>
  )
}

function HistoryTab() {
  const { data: userData, isFetching } = useQuery({
    queryKey: ['me'],
    queryFn: currentAccount,
    staleTime: 1000
  })
  const user = userData?.data.result[0]

  if (isFetching) return <div className="flex justify-center py-20"><Loading /></div>

  const hasAnyData = user && STAT_CONFIGS.some(c => user[c.key] !== null && user[c.key] !== undefined)

  if (!hasAnyData) {
    return (
      <div className="text-center py-20">
        <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
          <FaChartLine className="text-3xl text-gray-300 dark:text-gray-600" />
        </div>
        <p className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">Chưa có dữ liệu</p>
        <p className="text-sm text-gray-400">Hãy thực hiện tính toán để xem lịch sử chỉ số của bạn</p>
        <Link to="#tools"
          className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 shadow-lg transition-all"
        >
          Bắt đầu tính toán <FaArrowRight />
        </Link>
      </div>
    )
  }

  const available = STAT_CONFIGS.filter(c => user[c.key] !== null && user[c.key] !== undefined)

  return (
    <div>
      {/* Weight trend chart */}
      <div className='mb-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden'>
        <div className='px-5 pt-4 pb-1'>
          <p className='text-sm font-bold text-gray-700 dark:text-gray-300'>📊 Biểu đồ cân nặng</p>
        </div>
        <LineChart profile={user} />
      </div>

      {/* Summary strip */}
      <div className="flex items-center gap-3 mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl border border-blue-100 dark:border-blue-800">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white">
          <FaChartLine className="text-base" />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-800 dark:text-gray-200">Chỉ số hiện tại của bạn</p>
          <p className="text-xs text-gray-500">{available.length} / {STAT_CONFIGS.length} chỉ số đã được tính</p>
        </div>
        <div className="ml-auto">
          <div className="text-right">
            <div className="flex gap-0.5 justify-end mb-1">
              {STAT_CONFIGS.map((c, i) => (
                <div key={i} className={`w-3 h-3 rounded-sm ${user[c.key] !== null && user[c.key] !== undefined ? `bg-gradient-to-r ${c.gradient}` : 'bg-gray-200 dark:bg-gray-700'}`} />
              ))}
            </div>
            <p className="text-xs text-gray-400">{Math.round((available.length / STAT_CONFIGS.length) * 100)}% hoàn thành</p>
          </div>
        </div>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {available.map(config => (
          <HistoryStatCard key={config.key} config={config} value={user[config.key]} />
        ))}
      </div>

      {/* Missing metrics prompt */}
      {available.length < STAT_CONFIGS.length && (
        <div className="mt-6 p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-2">Chỉ số chưa có:</p>
          <div className="flex flex-wrap gap-2">
            {STAT_CONFIGS.filter(c => user[c.key] === null || user[c.key] === undefined).map(c => (
              <Link key={c.key} to={c.link}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r ${c.gradient} text-white text-xs font-semibold hover:shadow-md transition-all`}
              >
                {c.icon} Tính {c.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function FitnessCalculator() {
  const [activeTab, setActiveTab] = useState('tools')

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* ── Page Header ── */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 px-6 py-6">
        <div className="relative flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center flex-shrink-0">
            <MdFitnessCenter className="text-white text-2xl" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Công cụ tính toán</h1>
            <p className="text-white/75 text-sm mt-0.5">
              Phân tích và theo dõi các chỉ số sức khỏe — BMI, TDEE, Body Fat, BMR và nhiều hơn nữa.
            </p>
          </div>
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div className="px-6 mt-4 relative z-10">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-1.5 flex gap-1 border border-gray-100 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('tools')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${activeTab === 'tools'
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
              : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
          >
            <FaCalculator className="text-xs" /> Công cụ tính
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${activeTab === 'history'
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
              : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
          >
            <FaHistory className="text-xs" /> Lịch sử chỉ số
          </button>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="px-6 py-6">
        {activeTab === 'tools' && (
          <div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-5 text-center">
              Chọn công cụ bạn muốn sử dụng — kết quả sẽ được lưu tự động vào hồ sơ
            </p>
            <div id="tools" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {calculatorItems.map(item => <CalcCard key={item.id} item={item} />)}
            </div>
          </div>
        )}
        {activeTab === 'history' && <HistoryTab />}
      </div>
    </div>
  )
}
