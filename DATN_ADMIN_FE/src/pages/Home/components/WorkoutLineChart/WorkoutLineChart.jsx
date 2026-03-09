import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import moment from 'moment'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

export default function WorkoutLineChart({ dailySessions = [] }) {
    const labels = dailySessions.map((item) => moment(item._id).format('DD/MM'))
    const sessionCounts = dailySessions.map((item) => item.count)
    const kcalData = dailySessions.map((item) => item.totalKcal || 0)

    const data = {
        labels,
        datasets: [
            {
                label: 'Buổi tập',
                data: sessionCounts,
                borderColor: 'rgba(239, 68, 68, 1)',
                backgroundColor: 'rgba(239, 68, 68, 0.12)',
                pointBackgroundColor: 'rgba(239, 68, 68, 1)',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7,
                fill: true,
                tension: 0.4,
                yAxisID: 'y'
            },
            {
                label: 'Kcal đốt (tổng)',
                data: kcalData,
                borderColor: 'rgba(249, 115, 22, 1)',
                backgroundColor: 'rgba(249, 115, 22, 0.08)',
                pointBackgroundColor: 'rgba(249, 115, 22, 1)',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7,
                fill: true,
                tension: 0.4,
                yAxisID: 'y1'
            }
        ]
    }

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    font: { size: 12, weight: '600' },
                    usePointStyle: true
                }
            },
            title: {
                display: true,
                text: 'Buổi tập & Kcal đốt trong 10 ngày gần nhất',
                font: { size: 14, weight: '700' },
                padding: { bottom: 12 }
            }
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: { font: { size: 11 } }
            },
            y: {
                type: 'linear',
                display: true,
                position: 'left',
                beginAtZero: true,
                grid: { color: 'rgba(0,0,0,0.06)' },
                ticks: { stepSize: 1, font: { size: 11 } },
                title: { display: true, text: 'Buổi tập', font: { size: 11 } }
            },
            y1: {
                type: 'linear',
                display: true,
                position: 'right',
                beginAtZero: true,
                grid: { drawOnChartArea: false },
                ticks: { font: { size: 11 } },
                title: { display: true, text: 'Kcal', font: { size: 11 } }
            }
        }
    }

    return (
        <div className='bg-white mx-2 rounded-2xl border border-gray-200 shadow-sm px-6 py-5 my-4 dark:bg-gray-800 dark:border-gray-700'>
            <div className='h-[260px]'>
                {dailySessions.length === 0 ? (
                    <div className='flex flex-col items-center justify-center h-full text-gray-400'>
                        <span className='text-4xl mb-2'>💪</span>
                        <p className='text-sm'>Chưa có buổi tập nào trong 10 ngày qua</p>
                    </div>
                ) : (
                    <Line options={options} data={data} />
                )}
            </div>
        </div>
    )
}
