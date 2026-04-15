import { useState } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Line, Doughnut } from 'react-chartjs-2'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import moment from 'moment'
import { getChallengeAnalytics } from '../../../../apis/adminApi'
import TimeRangeFilter from '../TimeRangeFilter/TimeRangeFilter'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Title, Tooltip, Legend, Filler)

function mergeDates(arr1 = [], arr2 = [], arr3 = []) {
  const dateSet = new Set([...arr1.map((i) => i._id), ...arr2.map((i) => i._id), ...arr3.map((i) => i._id)])
  return [...dateSet].sort()
}

function buildDataset(data = [], dates = []) {
  const map = Object.fromEntries(data.map((d) => [d._id, d.count]))
  return dates.map((d) => map[d] ?? 0)
}

const TYPE_META = {
  nutrition: {
    label: 'Ăn uống',
    color: 'rgba(245, 158, 11, 1)',
    bg: 'rgba(245, 158, 11, 0.12)',
    dotBg: 'bg-amber-500',
    cardBg: 'bg-amber-50 dark:bg-amber-900/20',
    textColor: 'text-amber-600 dark:text-amber-400'
  },
  outdoorActivity: {
    label: 'Ngoài trời',
    color: 'rgba(34, 197, 94, 1)',
    bg: 'rgba(34, 197, 94, 0.1)',
    dotBg: 'bg-emerald-500',
    cardBg: 'bg-emerald-50 dark:bg-emerald-900/20',
    textColor: 'text-emerald-600 dark:text-emerald-400'
  },
  fitness: {
    label: 'Thể dục',
    color: 'rgba(168, 85, 247, 1)',
    bg: 'rgba(168, 85, 247, 0.1)',
    dotBg: 'bg-violet-500',
    cardBg: 'bg-violet-50 dark:bg-violet-900/20',
    textColor: 'text-violet-600 dark:text-violet-400'
  }
}

function getInsight(data) {
  if (!data || data.total === 0) return null

  const types = [
    { key: 'nutrition', count: data.nutrition, label: TYPE_META.nutrition.label },
    { key: 'outdoorActivity', count: data.outdoorActivity, label: TYPE_META.outdoorActivity.label },
    { key: 'fitness', count: data.fitness, label: TYPE_META.fitness.label }
  ].sort((a, b) => b.count - a.count)

  const top = types[0]
  const pct = ((top.count / data.total) * 100).toFixed(0)

  const recommendations = {
    nutrition:
      'Người dùng tạo nhiều thử thách ăn uống — có thể bổ sung gợi ý mục tiêu calo hoặc mẫu thực đơn.',
    outdoorActivity:
      'Ngoài trời nổi bật — cân nhắc nội dung gợi ý địa điểm hoặc thử thách nhóm.',
    fitness: 'Thể dục được quan tâm — có thể thêm thư viện bài tập mẫu theo mục tiêu.'
  }

  return {
    topType: top.label,
    percentage: pct,
    recommendation: recommendations[top.key],
    ranking: types
  }
}

export default function ChallengeAnalyticsSection() {
  const [filterParams, setFilterParams] = useState({ period: '7d' })

  const { data: res } = useQuery({
    queryKey: ['challenge-analytics', filterParams],
    queryFn: () => getChallengeAnalytics(filterParams),
    placeholderData: keepPreviousData,
    staleTime: 1000
  })

  const chData = res?.data?.result || {}
  const {
    dailyNutrition = [],
    dailyOutdoorActivity = [],
    dailyFitness = [],
    nutrition = 0,
    outdoorActivity = 0,
    fitness = 0,
    total = 0
  } = chData

  const allDates = mergeDates(dailyNutrition, dailyOutdoorActivity, dailyFitness)
  const labels = allDates.map((d) => moment(d).format('DD/MM'))
  const insight = getInsight(chData)

  const lineData = {
    labels,
    datasets: [
      {
        label: TYPE_META.nutrition.label,
        data: buildDataset(dailyNutrition, allDates),
        borderColor: TYPE_META.nutrition.color,
        backgroundColor: TYPE_META.nutrition.bg,
        pointBackgroundColor: TYPE_META.nutrition.color,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: true,
        tension: 0.4
      },
      {
        label: TYPE_META.outdoorActivity.label,
        data: buildDataset(dailyOutdoorActivity, allDates),
        borderColor: TYPE_META.outdoorActivity.color,
        backgroundColor: TYPE_META.outdoorActivity.bg,
        pointBackgroundColor: TYPE_META.outdoorActivity.color,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: true,
        tension: 0.4
      },
      {
        label: TYPE_META.fitness.label,
        data: buildDataset(dailyFitness, allDates),
        borderColor: TYPE_META.fitness.color,
        backgroundColor: TYPE_META.fitness.bg,
        pointBackgroundColor: TYPE_META.fitness.color,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: true,
        tension: 0.4
      }
    ]
  }

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { position: 'top', labels: { font: { size: 11, weight: '600' }, usePointStyle: true, padding: 12 } },
      title: { display: false }
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 10 } } },
      y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.06)' }, ticks: { stepSize: 1, font: { size: 10 } } }
    }
  }

  const doughnutData = {
    labels: [TYPE_META.nutrition.label, TYPE_META.outdoorActivity.label, TYPE_META.fitness.label],
    datasets: [
      {
        data: [nutrition, outdoorActivity, fitness],
        backgroundColor: [TYPE_META.nutrition.color, TYPE_META.outdoorActivity.color, TYPE_META.fitness.color],
        borderWidth: 2,
        hoverOffset: 6
      }
    ]
  }

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const pct = total > 0 ? ((ctx.raw / total) * 100).toFixed(1) : 0
            return ` ${ctx.raw} thử thách (${pct}%)`
          }
        }
      }
    }
  }

  return (
    <div className='bg-white mx-2 rounded-2xl border border-gray-200 shadow-sm px-6 py-5 my-4 dark:bg-gray-800 dark:border-gray-700'>
      <div className='flex items-center justify-between mb-4 flex-wrap gap-2'>
        <div className='flex items-center gap-3'>
          <span className='text-2xl'>🏆</span>
          <div>
            <h3 className='text-lg font-bold text-gray-800 dark:text-gray-100'>Số lượng thử thách theo loại</h3>
            <p className='text-xs text-gray-400'>Thử thách mới được tạo trong khoảng thời gian đã chọn</p>
          </div>
        </div>
        <TimeRangeFilter value={filterParams.period || 'custom'} onChange={setFilterParams} />
      </div>

      <div className='flex gap-3 mb-4 flex-wrap'>
        {Object.entries(TYPE_META).map(([key, meta]) => (
          <div key={key} className={`flex items-center gap-2 ${meta.cardBg} rounded-xl px-4 py-2`}>
            <span className={`w-3 h-3 rounded-full ${meta.dotBg} shrink-0`} />
            <div>
              <p className='text-xs text-gray-500'>{meta.label}</p>
              <p className={`text-lg font-black ${meta.textColor}`}>{chData[key] ?? 0} thử thách</p>
            </div>
          </div>
        ))}
        <div className='ml-auto flex items-center gap-1 text-gray-400 text-sm self-center'>
          Tổng:{' '}
          <span className='font-black text-gray-700 dark:text-white text-base ml-1'>{total}</span> thử thách
        </div>
      </div>

      <div className='grid grid-cols-1 xl:grid-cols-5 gap-4'>
        <div className='xl:col-span-3 h-[260px]'>
          {total === 0 ? (
            <div className='flex flex-col items-center justify-center h-full text-gray-400'>
              <span className='text-4xl mb-2'>🏆</span>
              <p className='text-sm'>Chưa có thử thách nào trong khoảng thời gian này</p>
            </div>
          ) : (
            <Line options={lineOptions} data={lineData} />
          )}
        </div>

        <div className='xl:col-span-2 flex flex-col gap-3'>
          <div className='relative h-[160px]'>
            {total > 0 ? (
              <>
                <Doughnut options={doughnutOptions} data={doughnutData} />
                <div className='absolute inset-0 flex flex-col items-center justify-center pointer-events-none'>
                  <span className='text-xl font-black text-gray-800 dark:text-white'>{total}</span>
                  <span className='text-[10px] text-gray-500'>tổng thử thách</span>
                </div>
              </>
            ) : (
              <div className='flex items-center justify-center h-full text-gray-300 text-sm'>Chưa có dữ liệu</div>
            )}
          </div>

          {insight && (
            <div className='bg-gradient-to-r from-amber-50 to-violet-50 dark:from-amber-900/15 dark:to-violet-900/20 rounded-xl p-3 border border-amber-100 dark:border-violet-800'>
              <p className='text-xs font-bold text-violet-700 dark:text-violet-300 mb-1'>💡 Insight</p>
              <p className='text-xs text-gray-600 dark:text-gray-300'>
                <span className='font-semibold'>“{insight.topType}”</span> chiếm tỷ trọng lớn nhất ({insight.percentage}%
                tổng số thử thách tạo mới).
              </p>
              <p className='text-[11px] text-gray-500 dark:text-gray-400 mt-1'>→ {insight.recommendation}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
