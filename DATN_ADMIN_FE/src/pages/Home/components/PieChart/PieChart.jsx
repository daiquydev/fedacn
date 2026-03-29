import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  Title
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import InfoTooltip from '../InfoTooltip/InfoTooltip'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend, Title)

export default function BMIBarChart({ usersBMI = {} }) {
  const categories = ['Thiếu cân (< 18.5)', 'Bình thường', 'Thừa cân', 'Béo phì (≥ 30)']
  const values = [usersBMI?.underWeight ?? 0, usersBMI?.normal ?? 0, usersBMI?.overWeight ?? 0, usersBMI?.obesity ?? 0]
  const colors = ['rgba(96,165,250,0.85)', 'rgba(34,197,94,0.85)', 'rgba(251,191,36,0.85)', 'rgba(239,68,68,0.85)']
  const borders = ['rgba(96,165,250,1)', 'rgba(34,197,94,1)', 'rgba(251,191,36,1)', 'rgba(239,68,68,1)']

  const data = {
    labels: categories,
    datasets: [
      {
        label: 'Số người',
        data: values,
        backgroundColor: colors,
        borderColor: borders,
        borderWidth: 2,
        borderRadius: 6,
        barThickness: 28
      }
    ]
  }

  const options = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const total = usersBMI?.total || 1
            const pct = ((ctx.raw / total) * 100).toFixed(1)
            return ` ${ctx.raw} người (${pct}%)`
          }
        }
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          font: { size: 11 }
        },
        grid: { color: 'rgba(0,0,0,0.05)' }
      },
      y: {
        ticks: {
          font: { size: 12, weight: '600' }
        },
        grid: { display: false }
      }
    }
  }

  return (
    <div className='bg-white rounded-2xl border border-gray-200 shadow-sm px-6 py-5 my-4 dark:bg-gray-800 dark:border-gray-700 h-full'>
      <div className='flex items-center justify-between mb-3'>
        <div className='flex items-center gap-2'>
          <p className='text-sm font-bold text-gray-600 dark:text-gray-300'>📊 Phân phối BMI</p>
          <span className='text-[10px] bg-blue-50 dark:bg-blue-900/30 text-blue-500 font-semibold px-2 py-0.5 rounded-full'>{usersBMI?.total ?? 0} người</span>
        </div>
        <InfoTooltip text='Biểu đồ cho thấy phân bố thể trạng cộng đồng. Nếu "Béo phì" tăng → cần thêm chương trình giảm cân. Nếu "Bình thường" chiếm đa số → nền tảng đang phục vụ đúng đối tượng yêu thể thao.' />
      </div>
      <div className='h-[260px]'>
        <Bar options={options} data={data} />
      </div>
    </div>
  )
}
