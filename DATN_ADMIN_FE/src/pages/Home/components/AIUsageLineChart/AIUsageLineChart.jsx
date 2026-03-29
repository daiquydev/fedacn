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
import { getAIUsageAnalytics } from '../../../../apis/adminApi'
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

const FEATURE_META = {
  createPost: { label: 'Tạo nội dung sự kiện', color: 'rgba(168, 85, 247, 1)', bg: 'rgba(168, 85, 247, 0.1)', dotBg: 'bg-purple-500', cardBg: 'bg-purple-50 dark:bg-purple-900/20', textColor: 'text-purple-600' },
  analyzeFitness: { label: 'Phân tích sức khỏe', color: 'rgba(59, 130, 246, 1)', bg: 'rgba(59, 130, 246, 0.1)', dotBg: 'bg-blue-500', cardBg: 'bg-blue-50 dark:bg-blue-900/20', textColor: 'text-blue-600' },
  analyzeWorkout: { label: 'Gợi ý tập luyện', color: 'rgba(239, 68, 68, 1)', bg: 'rgba(239, 68, 68, 0.08)', dotBg: 'bg-red-500', cardBg: 'bg-red-50 dark:bg-red-900/20', textColor: 'text-red-500' }
}

function getInsight(data) {
  if (!data || data.total === 0) return null

  const features = [
    { key: 'createPost', count: data.createPost, label: FEATURE_META.createPost.label },
    { key: 'analyzeFitness', count: data.analyzeFitness, label: FEATURE_META.analyzeFitness.label },
    { key: 'analyzeWorkout', count: data.analyzeWorkout, label: FEATURE_META.analyzeWorkout.label }
  ].sort((a, b) => b.count - a.count)

  const top = features[0]
  const pct = ((top.count / data.total) * 100).toFixed(0)

  const recommendations = {
    createPost: 'Cân nhắc thêm template AI cho sự kiện để tăng hiệu quả cho người dùng.',
    analyzeFitness: 'Người dùng quan tâm sức khỏe nhiều — cân nhắc mở rộng các chỉ số phân tích AI.',
    analyzeWorkout: 'Tập luyện AI rất phổ biến — có thể thêm gợi ý bài tập theo mục tiêu.'
  }

  return {
    topFeature: top.label,
    percentage: pct,
    recommendation: recommendations[top.key],
    ranking: features
  }
}

export default function AIUsageSection() {
  const [filterParams, setFilterParams] = useState({ period: '7d' })

  const { data: res } = useQuery({
    queryKey: ['ai-usage-analytics', filterParams],
    queryFn: () => getAIUsageAnalytics(filterParams),
    placeholderData: keepPreviousData,
    staleTime: 1000
  })

  const aiData = res?.data?.result || {}
  const {
    dailyCreatePost = [], dailyAnalyzeFitness = [], dailyAnalyzeWorkout = [],
    createPost = 0, analyzeFitness = 0, analyzeWorkout = 0, total = 0
  } = aiData

  const allDates = mergeDates(dailyCreatePost, dailyAnalyzeFitness, dailyAnalyzeWorkout)
  const labels = allDates.map((d) => moment(d).format('DD/MM'))
  const insight = getInsight(aiData)

  const lineData = {
    labels,
    datasets: [
      {
        label: FEATURE_META.createPost.label,
        data: buildDataset(dailyCreatePost, allDates),
        borderColor: FEATURE_META.createPost.color,
        backgroundColor: FEATURE_META.createPost.bg,
        pointBackgroundColor: FEATURE_META.createPost.color,
        pointBorderColor: '#fff', pointBorderWidth: 2, pointRadius: 4, pointHoverRadius: 6,
        fill: true, tension: 0.4
      },
      {
        label: FEATURE_META.analyzeFitness.label,
        data: buildDataset(dailyAnalyzeFitness, allDates),
        borderColor: FEATURE_META.analyzeFitness.color,
        backgroundColor: FEATURE_META.analyzeFitness.bg,
        pointBackgroundColor: FEATURE_META.analyzeFitness.color,
        pointBorderColor: '#fff', pointBorderWidth: 2, pointRadius: 4, pointHoverRadius: 6,
        fill: true, tension: 0.4
      },
      {
        label: FEATURE_META.analyzeWorkout.label,
        data: buildDataset(dailyAnalyzeWorkout, allDates),
        borderColor: FEATURE_META.analyzeWorkout.color,
        backgroundColor: FEATURE_META.analyzeWorkout.bg,
        pointBackgroundColor: FEATURE_META.analyzeWorkout.color,
        pointBorderColor: '#fff', pointBorderWidth: 2, pointRadius: 4, pointHoverRadius: 6,
        fill: true, tension: 0.4
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
    labels: [FEATURE_META.createPost.label, FEATURE_META.analyzeFitness.label, FEATURE_META.analyzeWorkout.label],
    datasets: [{
      data: [createPost, analyzeFitness, analyzeWorkout],
      backgroundColor: [FEATURE_META.createPost.color, FEATURE_META.analyzeFitness.color, FEATURE_META.analyzeWorkout.color],
      borderWidth: 2, hoverOffset: 6
    }]
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
            return ` ${ctx.raw} lượt (${pct}%)`
          }
        }
      }
    }
  }

  return (
    <div className='bg-white mx-2 rounded-2xl border border-gray-200 shadow-sm px-6 py-5 my-4 dark:bg-gray-800 dark:border-gray-700'>
      {/* Header + Filter */}
      <div className='flex items-center justify-between mb-4 flex-wrap gap-2'>
        <div className='flex items-center gap-3'>
          <span className='text-2xl'>🤖</span>
          <div>
            <h3 className='text-lg font-bold text-gray-800 dark:text-gray-100'>Lượt sử dụng AI</h3>
            <p className='text-xs text-gray-400'>Số lần sử dụng AI theo từng tính năng</p>
          </div>
        </div>
        <TimeRangeFilter value={filterParams.period || 'custom'} onChange={setFilterParams} />
      </div>

      {/* Stat summary row */}
      <div className='flex gap-3 mb-4 flex-wrap'>
        {Object.entries(FEATURE_META).map(([key, meta]) => (
          <div key={key} className={`flex items-center gap-2 ${meta.cardBg} rounded-xl px-4 py-2`}>
            <span className={`w-3 h-3 rounded-full ${meta.dotBg} shrink-0`} />
            <div>
              <p className='text-xs text-gray-500'>{meta.label}</p>
              <p className={`text-lg font-black ${meta.textColor}`}>{aiData[key] ?? 0} lần</p>
            </div>
          </div>
        ))}
        <div className='ml-auto flex items-center gap-1 text-gray-400 text-sm self-center'>
          🤖 Tổng: <span className='font-black text-gray-700 dark:text-white text-base ml-1'>{total}</span> lần
        </div>
      </div>

      {/* Charts: Line (60%) + Doughnut+Insight (40%) */}
      <div className='grid grid-cols-1 xl:grid-cols-5 gap-4'>
        {/* Line chart */}
        <div className='xl:col-span-3 h-[260px]'>
          {total === 0 ? (
            <div className='flex flex-col items-center justify-center h-full text-gray-400'>
              <span className='text-4xl mb-2'>🤖</span>
              <p className='text-sm'>Chưa có lượt sử dụng AI nào</p>
            </div>
          ) : (
            <Line options={lineOptions} data={lineData} />
          )}
        </div>

        {/* Doughnut + Insight */}
        <div className='xl:col-span-2 flex flex-col gap-3'>
          <div className='relative h-[160px]'>
            {total > 0 ? (
              <>
                <Doughnut options={doughnutOptions} data={doughnutData} />
                <div className='absolute inset-0 flex flex-col items-center justify-center pointer-events-none'>
                  <span className='text-xl font-black text-gray-800 dark:text-white'>{total}</span>
                  <span className='text-[10px] text-gray-500'>tổng lượt</span>
                </div>
              </>
            ) : (
              <div className='flex items-center justify-center h-full text-gray-300 text-sm'>Chưa có dữ liệu</div>
            )}
          </div>

          {/* Insight card */}
          {insight && (
            <div className='bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-3 border border-indigo-100 dark:border-indigo-800'>
              <p className='text-xs font-bold text-indigo-700 dark:text-indigo-300 mb-1'>💡 Insight</p>
              <p className='text-xs text-gray-600 dark:text-gray-300'>
                <span className='font-semibold'>"{insight.topFeature}"</span> là tính năng phổ biến nhất
                ({insight.percentage}% tổng lượt).
              </p>
              <p className='text-[11px] text-gray-500 dark:text-gray-400 mt-1'>→ {insight.recommendation}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
