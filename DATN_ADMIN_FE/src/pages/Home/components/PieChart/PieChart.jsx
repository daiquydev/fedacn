import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title
} from 'chart.js'
import { Pie } from 'react-chartjs-2'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title)

export default function PieChart({ usersBMI = {} }) {
  const data = {
    labels: ['Thiếu cân (< 18.5)', 'Bình thường', 'Thừa cân', 'Béo phì (≥ 30)'],
    datasets: [
      {
        label: 'Số người',
        data: [usersBMI?.underWeight, usersBMI?.normal, usersBMI?.overWeight, usersBMI?.obesity],
        backgroundColor: ['rgba(96,165,250,0.85)', 'rgba(34,197,94,0.85)', 'rgba(251,191,36,0.85)', 'rgba(239,68,68,0.85)'],
        borderColor: ['rgba(96,165,250,1)', 'rgba(34,197,94,1)', 'rgba(251,191,36,1)', 'rgba(239,68,68,1)'],
        borderWidth: 2,
        hoverOffset: 6
      }
    ]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 14,
          font: { size: 11, weight: '600' },
          usePointStyle: true
        }
      },
      title: {
        display: true,
        text: `Phân phối BMI (${usersBMI?.total ?? 0} người dùng)`,
        font: { size: 14, weight: '700' },
        padding: { bottom: 12 }
      }
    }
  }

  return (
    <div className='bg-white mx-2 rounded-2xl border border-gray-200 shadow-sm px-6 py-5 my-4 dark:bg-gray-800 dark:border-gray-700'>
      <div className='h-[280px]'>
        <Pie options={options} data={data} />
      </div>
    </div>
  )
}
