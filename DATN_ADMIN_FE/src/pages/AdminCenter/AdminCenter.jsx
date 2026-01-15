import { useMemo, useState } from 'react'
import { FaUserShield, FaBookOpen, FaUtensils, FaWarning, FaTrashAlt, FaCheckCircle } from 'react-icons/fa'
import toast from 'react-hot-toast'

const makeId = () => Math.random().toString(36).slice(2, 9)

const initialUsers = [
  { id: makeId(), name: 'Nguyễn An', role: 'Người dùng', status: 'active', strikes: 0 },
  { id: makeId(), name: 'Trần Bình', role: 'Đầu bếp', status: 'active', strikes: 1 },
  { id: makeId(), name: 'Lê Chi', role: 'Người viết', status: 'suspended', strikes: 3 }
]

const initialRecipes = [
  { id: makeId(), title: 'Salad giảm cân', author: 'Trần Bình', status: 'public' },
  { id: makeId(), title: 'Ức gà áp chảo', author: 'Lê Chi', status: 'public' },
  { id: makeId(), title: 'Phở bò', author: 'Nguyễn An', status: 'hidden' }
]

const initialMealPlans = [
  { id: makeId(), title: 'Keto 7 ngày', owner: 'Mai Hoa', status: 'public' },
  { id: makeId(), title: 'Eat clean 5 ngày', owner: 'Đức Thịnh', status: 'public' }
]

const initialReports = [
  { id: makeId(), targetType: 'recipe', targetTitle: 'Ức gà áp chảo', reason: 'Ảnh nhạy cảm', reporter: 'User 123' },
  { id: makeId(), targetType: 'mealplan', targetTitle: 'Keto 7 ngày', reason: 'Thông tin sai lệch', reporter: 'User 456' },
  { id: makeId(), targetType: 'user', targetTitle: 'Lê Chi', reason: 'Spam bình luận', reporter: 'User 789' }
]

export default function AdminCenter() {
  const [users, setUsers] = useState(initialUsers)
  const [recipes, setRecipes] = useState(initialRecipes)
  const [mealPlans, setMealPlans] = useState(initialMealPlans)
  const [reports, setReports] = useState(initialReports)

  const stats = useMemo(() => {
    const totalUsers = users.length
    const suspendedUsers = users.filter((u) => u.status === 'suspended').length
    const totalRecipes = recipes.length
    const hiddenRecipes = recipes.filter((r) => r.status !== 'public').length
    const totalMealPlans = mealPlans.length
    const pendingReports = reports.length
    return { totalUsers, suspendedUsers, totalRecipes, hiddenRecipes, totalMealPlans, pendingReports }
  }, [users, recipes, mealPlans, reports])

  const handleSuspendUser = (id) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status: 'suspended', strikes: u.strikes + 1 } : u)))
    toast.success('Đã khóa tài khoản tạm thời')
  }

  const handleRestoreUser = (id) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status: 'active' } : u)))
    toast.success('Đã mở khóa tài khoản')
  }

  const handleDeleteRecipe = (id) => {
    setRecipes((prev) => prev.filter((r) => r.id !== id))
    toast.success('Đã xóa bài nấu ăn')
  }

  const handleDeleteMealPlan = (id) => {
    setMealPlans((prev) => prev.filter((m) => m.id !== id))
    toast.success('Đã xóa thực đơn')
  }

  const handleResolveReport = (id) => {
    setReports((prev) => prev.filter((r) => r.id !== id))
    toast.success('Đã đánh dấu báo cáo đã xử lý')
  }

  const handleDeleteReportedTarget = (report) => {
    if (report.targetType === 'recipe') {
      setRecipes((prev) => prev.filter((r) => r.title !== report.targetTitle))
    } else if (report.targetType === 'mealplan') {
      setMealPlans((prev) => prev.filter((m) => m.title !== report.targetTitle))
    } else if (report.targetType === 'user') {
      setUsers((prev) => prev.map((u) => (u.name === report.targetTitle ? { ...u, status: 'suspended' } : u)))
    }
    setReports((prev) => prev.filter((r) => r.id !== report.id))
    toast.success('Đã xóa/khóa nội dung liên quan')
  }

  return (
    <div className='min-h-screen px-4 py-6 bg-gray-100 dark:bg-color-primary-dark text-gray-900 dark:text-gray-50'>
      <div className='max-w-6xl mx-auto space-y-6'>
        <div>
          <h1 className='text-2xl font-semibold'>Trung tâm quản trị nhanh</h1>
          <p className='text-sm text-gray-500 dark:text-gray-400'>Tổng hợp thao tác cho admin: quản lý người dùng, món ăn, thực đơn và xử lý báo cáo.</p>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4'>
          <StatCard icon={<FaUserShield />} label='Người dùng' primary={stats.totalUsers} secondary={`${stats.suspendedUsers} bị khóa`} color='bg-blue-100 dark:bg-blue-900/40' />
          <StatCard icon={<FaUtensils />} label='Món ăn' primary={stats.totalRecipes} secondary={`${stats.hiddenRecipes} ẩn/vi phạm`} color='bg-emerald-100 dark:bg-emerald-900/40' />
          <StatCard icon={<FaBookOpen />} label='Thực đơn' primary={stats.totalMealPlans} secondary='Đang theo dõi' color='bg-amber-100 dark:bg-amber-900/40' />
          <StatCard icon={<FaWarning />} label='Báo cáo' primary={stats.pendingReports} secondary='Chờ xử lý' color='bg-red-100 dark:bg-red-900/40' />
        </div>

        <section className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
          <Panel title='Người dùng gần đây'>
            <ul className='space-y-3'>
              {users.map((user) => (
                <li key={user.id} className='flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-color-primary px-3 py-2'>
                  <div>
                    <p className='font-semibold'>{user.name}</p>
                    <p className='text-xs text-gray-500 dark:text-gray-400'>Vai trò: {user.role} • Vi phạm: {user.strikes}</p>
                  </div>
                  <div className='flex gap-2'>
                    {user.status === 'active' ? (
                      <ActionButton label='Khóa' onClick={() => handleSuspendUser(user.id)} variant='warn' />
                    ) : (
                      <ActionButton label='Mở khóa' onClick={() => handleRestoreUser(user.id)} variant='primary' />
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title='Món ăn & Thực đơn'>
            <div className='space-y-4'>
              <div>
                <p className='text-sm font-semibold mb-2'>Món ăn</p>
                <ul className='space-y-2'>
                  {recipes.map((recipe) => (
                    <li key={recipe.id} className='flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-color-primary px-3 py-2'>
                      <div>
                        <p className='font-semibold'>{recipe.title}</p>
                        <p className='text-xs text-gray-500 dark:text-gray-400'>Tác giả: {recipe.author}</p>
                      </div>
                      <ActionButton label='Xóa' onClick={() => handleDeleteRecipe(recipe.id)} variant='danger' />
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className='text-sm font-semibold mb-2'>Thực đơn</p>
                <ul className='space-y-2'>
                  {mealPlans.map((plan) => (
                    <li key={plan.id} className='flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-color-primary px-3 py-2'>
                      <div>
                        <p className='font-semibold'>{plan.title}</p>
                        <p className='text-xs text-gray-500 dark:text-gray-400'>Chủ sở hữu: {plan.owner}</p>
                      </div>
                      <ActionButton label='Xóa' onClick={() => handleDeleteMealPlan(plan.id)} variant='danger' />
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Panel>
        </section>

        <section>
          <Panel title='Hàng chờ báo cáo'>
            <div className='overflow-x-auto'>
              <table className='min-w-full text-sm'>
                <thead>
                  <tr className='text-left bg-gray-50 dark:bg-slate-800'>
                    <th className='py-2 px-3'>Mục tiêu</th>
                    <th className='py-2 px-3'>Lý do</th>
                    <th className='py-2 px-3'>Người báo cáo</th>
                    <th className='py-2 px-3'>Hành động</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-gray-200 dark:divide-gray-700'>
                  {reports.length === 0 && (
                    <tr>
                      <td className='py-3 px-3 text-gray-500 dark:text-gray-400' colSpan={4}>
                        Không còn báo cáo nào chờ xử lý.
                      </td>
                    </tr>
                  )}
                  {reports.map((report) => (
                    <tr key={report.id} className='bg-white dark:bg-color-primary'>
                      <td className='py-2 px-3 font-semibold'>
                        {report.targetTitle}
                        <span className='ml-2 text-xs text-gray-500 dark:text-gray-400'>[{report.targetType}]</span>
                      </td>
                      <td className='py-2 px-3'>{report.reason}</td>
                      <td className='py-2 px-3'>{report.reporter}</td>
                      <td className='py-2 px-3'>
                        <div className='flex gap-2'>
                          <ActionButton label='Bỏ qua' onClick={() => handleResolveReport(report.id)} variant='primary' icon={<FaCheckCircle />} />
                          <ActionButton label='Xóa/Khóa' onClick={() => handleDeleteReportedTarget(report)} variant='danger' icon={<FaTrashAlt />} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </section>
      </div>
    </div>
  )
}

function StatCard({ icon, label, primary, secondary, color }) {
  return (
    <div className={`flex items-center gap-3 rounded-xl ${color} border border-gray-200 dark:border-gray-700 p-4`}>
      <div className='text-2xl'>{icon}</div>
      <div>
        <p className='text-sm text-gray-600 dark:text-gray-300'>{label}</p>
        <p className='text-xl font-semibold'>{primary}</p>
        <p className='text-xs text-gray-500 dark:text-gray-400'>{secondary}</p>
      </div>
    </div>
  )
}

function Panel({ title, children }) {
  return (
    <div className='rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-color-primary p-4 shadow-sm'>
      <div className='flex items-center justify-between mb-3'>
        <h2 className='text-lg font-semibold'>{title}</h2>
      </div>
      {children}
    </div>
  )
}

function ActionButton({ label, onClick, variant = 'primary', icon }) {
  const base = 'px-3 py-1 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors'
  const styles = {
    primary: 'bg-blue-500 text-white hover:bg-blue-600',
    danger: 'bg-red-500 text-white hover:bg-red-600',
    warn: 'bg-amber-500 text-white hover:bg-amber-600'
  }
  return (
    <button type='button' onClick={onClick} className={`${base} ${styles[variant] || styles.primary}`}>
      {icon}
      {label}
    </button>
  )
}
