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

// Merge 3 daily arrays into a unified set of dates
function mergeDates(arr1 = [], arr2 = [], arr3 = []) {
    const dateSet = new Set([
        ...arr1.map((i) => i._id),
        ...arr2.map((i) => i._id),
        ...arr3.map((i) => i._id)
    ])
    return [...dateSet].sort()
}

function buildDataset(data = [], dates = []) {
    const map = Object.fromEntries(data.map((d) => [d._id, d.count]))
    return dates.map((d) => map[d] ?? 0)
}

export default function CommunityLineChart({ dailyPosts = [], dailyComments = [], dailyLikes = [] }) {
    const allDates = mergeDates(dailyPosts, dailyComments, dailyLikes)
    const labels = allDates.map((d) => moment(d).format('DD/MM'))

    const data = {
        labels,
        datasets: [
            {
                label: 'Bài viết',
                data: buildDataset(dailyPosts, allDates),
                borderColor: 'rgba(239, 68, 68, 1)',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                pointBackgroundColor: 'rgba(239, 68, 68, 1)',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7,
                fill: true,
                tension: 0.4
            },
            {
                label: 'Bình luận',
                data: buildDataset(dailyComments, allDates),
                borderColor: 'rgba(59, 130, 246, 1)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                pointBackgroundColor: 'rgba(59, 130, 246, 1)',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7,
                fill: true,
                tension: 0.4
            },
            {
                label: 'Lượt thích',
                data: buildDataset(dailyLikes, allDates),
                borderColor: 'rgba(249, 115, 22, 1)',
                backgroundColor: 'rgba(249, 115, 22, 0.08)',
                pointBackgroundColor: 'rgba(249, 115, 22, 1)',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7,
                fill: true,
                tension: 0.4
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
                    usePointStyle: true,
                    padding: 16
                }
            },
            title: {
                display: true,
                text: 'Hoạt động Cộng đồng trong 10 ngày gần nhất',
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
                beginAtZero: true,
                grid: { color: 'rgba(0,0,0,0.06)' },
                ticks: { stepSize: 1, font: { size: 11 } }
            }
        }
    }

    const isEmpty = dailyPosts.length === 0 && dailyComments.length === 0 && dailyLikes.length === 0

    return (
        <div className='bg-white mx-2 rounded-2xl border border-gray-200 shadow-sm px-6 py-5 my-4 dark:bg-gray-800 dark:border-gray-700'>
            <div className='h-[280px]'>
                {isEmpty ? (
                    <div className='flex flex-col items-center justify-center h-full text-gray-400'>
                        <span className='text-4xl mb-2'>🗣️</span>
                        <p className='text-sm'>Chưa có hoạt động cộng đồng trong 10 ngày qua</p>
                    </div>
                ) : (
                    <Line options={options} data={data} />
                )}
            </div>
        </div>
    )
}
