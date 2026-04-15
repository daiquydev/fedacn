const CATEGORIES = [
  { key: 'posts', emoji: '👑', label: 'Bài viết', unit: 'bài', color: 'from-orange-400 to-red-500' },
  { key: 'challenges', emoji: '🏆', label: 'Thử thách', unit: 'thử thách', prefix: 'tham gia', color: 'from-blue-400 to-cyan-500' },
  { key: 'events', emoji: '🏅', label: 'Sự kiện', unit: 'sự kiện', prefix: 'tham gia', color: 'from-green-400 to-emerald-500' },
  { key: 'workouts', emoji: '💪', label: 'Tập luyện', unit: 'lần', color: 'from-purple-400 to-violet-500' }
]

const MEDALS = ['🥇', '🥈', '🥉']

function UserRow({ rank, user, count, unit, prefix }) {
  const avatarUrl = user?.avatar || ''
  const name = user?.name || user?.user_name || 'Ẩn danh'

  return (
    <div className='flex items-center gap-2.5 py-1.5'>
      <span className='text-lg w-6 text-center shrink-0'>{MEDALS[rank] || `#${rank + 1}`}</span>
      {avatarUrl ? (
        <img src={avatarUrl} alt={name} className='w-7 h-7 rounded-full object-cover border-2 border-white shadow-sm shrink-0' />
      ) : (
        <div className='w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-xs font-bold text-gray-500 shrink-0'>
          {name.charAt(0).toUpperCase()}
        </div>
      )}
      <div className='flex-1 min-w-0'>
        <p className='text-sm font-semibold text-gray-700 dark:text-gray-200 truncate'>{name}</p>
      </div>
      <span className='text-xs text-gray-500 dark:text-gray-400 shrink-0 font-bold'>
        {prefix ? `${prefix} ${count} ${unit}` : `${count} ${unit}`}
      </span>
    </div>
  )
}

export default function TopUsersPodium({ topUsers = {} }) {
  return (
    <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3'>
      {CATEGORIES.map((cat) => {
        const users = topUsers[cat.key] || []
        return (
          <div key={cat.key} className='bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden'>
            {/* Category header */}
            <div className={`bg-gradient-to-r ${cat.color} px-4 py-2.5`}>
              <p className='text-white font-bold text-sm flex items-center gap-1.5'>
                <span>{cat.emoji}</span> {cat.label}
              </p>
            </div>
            {/* Users list */}
            <div className='px-4 py-3'>
              {users.length === 0 ? (
                <p className='text-xs text-gray-400 text-center py-4'>Chưa có dữ liệu</p>
              ) : (
                <div className='space-y-0.5'>
                  {users.map((item, idx) => (
                    <UserRow key={idx} rank={idx} user={item.user} count={item.count} unit={cat.unit} prefix={cat.prefix} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
