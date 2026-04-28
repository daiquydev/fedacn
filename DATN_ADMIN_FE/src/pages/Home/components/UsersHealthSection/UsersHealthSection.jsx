import { useState } from 'react'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { Bar, Doughnut, Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend
} from 'chart.js'
import moment from 'moment'
import { getUsersHealthAnalytics } from '../../../../apis/adminApi'
import TimeRangeFilter from '../TimeRangeFilter/TimeRangeFilter'
import { CHART_BG, CHART_COLORS } from '../chartTheme'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Tooltip, Legend)

function genderData(gender = {}) {
  return [gender.male ?? 0, gender.female ?? 0, gender.other ?? 0, gender.unknown ?? 0]
}

const GENDER_LABELS = ['Nam', 'Nữ', 'Khác', 'Chưa cập nhật']
const GENDER_COLORS = [CHART_COLORS.primary, '#ec4899', CHART_COLORS.purple, CHART_COLORS.gray]

export default function UsersHealthSection() {
  const [filterParams, setFilterParams] = useState({ period: '7d' })
  const { data: res } = useQuery({
    queryKey: ['users-health-analytics', filterParams],
    queryFn: () => getUsersHealthAnalytics(filterParams),
    placeholderData: keepPreviousData
  })

  const result = res?.data?.result || {}
  const userGender = result.userGender || {}
  const eventGender = result.eventParticipantGender || {}
  const challengeGender = result.challengeParticipantGender || {}
  const bmi = result.bmiAsiaDistribution || {}
  const workoutSeries = result?.participantsOverTime?.workouts || []

  const workoutLabels = workoutSeries.map((i) => moment(i._id).format('DD/MM'))
  const workoutValues = workoutSeries.map((i) => i.count || 0)

  return (
    <div className='px-2 my-3'>
      <div className='flex items-center justify-between mb-3 mt-2 flex-wrap gap-2'>
        <p className='text-sm font-bold text-gray-600 dark:text-gray-300'>📊 Phân tích Người dùng & Sức khỏe</p>
        <TimeRangeFilter value={filterParams.period || 'custom'} onChange={setFilterParams} />
      </div>

      <div className='grid grid-cols-1 xl:grid-cols-3 gap-3'>
        <div className='bg-white rounded-2xl border border-gray-200 shadow-sm p-4 dark:bg-gray-800 dark:border-gray-700'>
          <p className='text-xs text-gray-500 mb-2'>Giới tính người dùng</p>
          <div className='h-[220px]'>
            <Doughnut
              data={{
                labels: GENDER_LABELS,
                datasets: [{ data: genderData(userGender), backgroundColor: GENDER_COLORS }]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                cutout: '62%',
                plugins: { legend: { position: 'bottom' } }
              }}
            />
          </div>
        </div>

        <div className='bg-white rounded-2xl border border-gray-200 shadow-sm p-4 dark:bg-gray-800 dark:border-gray-700'>
          <p className='text-xs text-gray-500 mb-2'>Tỷ lệ giới tính tham gia sự kiện / thử thách</p>
          <div className='h-[220px]'>
            <Bar
              data={{
                labels: GENDER_LABELS,
                datasets: [
                  { label: 'Tham gia sự kiện', data: genderData(eventGender), backgroundColor: CHART_COLORS.success },
                  { label: 'Tham gia thử thách', data: genderData(challengeGender), backgroundColor: CHART_COLORS.orange }
                ]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom' } },
                scales: { y: { beginAtZero: true } }
              }}
            />
          </div>
        </div>

        <div className='bg-white rounded-2xl border border-gray-200 shadow-sm p-4 dark:bg-gray-800 dark:border-gray-700'>
          <p className='text-xs text-gray-500 mb-2'>Phân bố BMI (WHO châu Á)</p>
          <div className='h-[220px]'>
            <Bar
              data={{
                labels: ['Gầy (<18.5)', 'Bình thường (18.5-22.9)', 'Nguy cơ thừa cân (23-24.9)', 'Béo phì độ I (25-29.9)', 'Béo phì độ II (>=30)'],
                datasets: [
                  {
                    label: 'Số người',
                    data: [
                      bmi.underweight ?? 0,
                      bmi.normal ?? 0,
                      bmi.overweight_risk ?? 0,
                      bmi.obese_level_1 ?? 0,
                      bmi.obese_level_2 ?? 0
                    ],
                    backgroundColor: ['#60a5fa', '#34d399', '#fbbf24', '#fb923c', '#ef4444']
                  }
                ]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
              }}
            />
          </div>
        </div>
      </div>

      <div className='bg-white rounded-2xl border border-gray-200 shadow-sm p-4 dark:bg-gray-800 dark:border-gray-700 mt-3'>
        <p className='text-xs text-gray-500 mb-2'>Số người tham gia tập luyện theo thời gian</p>
        <div className='h-[220px]'>
          <Line
            data={{
              labels: workoutLabels,
              datasets: [
                {
                  label: 'Người tham gia tập luyện',
                  data: workoutValues,
                  borderColor: CHART_COLORS.purple,
                  backgroundColor: CHART_BG.purple,
                  pointBackgroundColor: CHART_COLORS.purple,
                  pointBorderColor: '#fff',
                  pointBorderWidth: 2,
                  pointRadius: 4,
                  fill: true,
                  tension: 0.35
                }
              ]
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { position: 'top' } },
              scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
            }}
          />
        </div>
      </div>
    </div>
  )
}
