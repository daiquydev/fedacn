import { useState, useRef, useEffect, useCallback } from 'react'
import { getAllUserAdmin, getUserStats } from '../../apis/adminApi'
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query'
import { FaSearch, FaUsers, FaUserCheck, FaUserSlash, FaTimes } from 'react-icons/fa'
import Loading from '../../components/GlobalComponents/Loading'
import UserItem from './components/UserItem'
import UserDetailDrawer from './components/UserDetailDrawer'


export default function UserList() {
  const queryClient = useQueryClient()
  const [selectedUserId, setSelectedUserId] = useState(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [sort, setSort] = useState('desc')
  const [tab, setTab] = useState('active') // 'active' | 'inactive' (bị khóa + đã xóa)
  const debounceRef = useRef(null)
  const LIMIT = 10

  // Debounce search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => { setSearch(searchInput); setPage(1) }, 500)
    return () => clearTimeout(debounceRef.current)
  }, [searchInput])

  // Build query params from tab
  const queryParams = (() => {
    const params = { page, limit: LIMIT, sort, role: 0 }
    if (search) params.search = search
    if (tab === 'active') { params.status = 1 }
    else if (tab === 'inactive') { params.inactive = 'true' }
    return params
  })()

  // Stats query (backend-level counts)
  const { data: statsData } = useQuery({
    queryKey: ['user-stats'],
    queryFn: () => getUserStats()
  })
  const stats = statsData?.data?.result || {}

  // User list query
  const { data, isLoading } = useQuery({
    queryKey: ['user-list', queryParams],
    queryFn: () => getAllUserAdmin(queryParams),
    placeholderData: keepPreviousData
  })

  const users = data?.data?.result?.users || []
  const totalPage = data?.data?.result?.totalPage || 1
  const total = data?.data?.result?.total || 0

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['user-list'] })
    queryClient.invalidateQueries({ queryKey: ['user-stats'] })
  }, [queryClient])

  const handleTabChange = (newTab) => {
    setTab(newTab)
    setPage(1)
  }

  const selectCls = 'px-3 py-2 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all'

  return (
    <div className='min-h-screen bg-gray-50 dark:bg-gray-900 pt-0 pb-4 px-4'>

      {/* ── Hero Banner ── */}
      <div className='relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-600 px-6 py-4 mb-2 shadow-xl'>
        <div className='relative z-10'>
          <h1 className='text-2xl font-bold text-white mb-0.5'>Quản lý Người dùng</h1>
        </div>

        {/* Tabs inside Hero Banner */}
        <div className='relative z-10 flex gap-2 mt-3'>
          <button
            onClick={() => handleTabChange('active')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all backdrop-blur-sm ${
              tab === 'active' ? 'bg-white text-blue-700 shadow-md' : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            <FaUserCheck size={14} />
            Đang hoạt động ({stats.active ?? 0})
          </button>
          <button
            onClick={() => handleTabChange('inactive')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all backdrop-blur-sm ${
              tab === 'inactive' ? 'bg-white text-blue-700 shadow-md' : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            <FaUserSlash size={13} />
            Bị khóa / đã xóa ({stats.inactive ?? (stats.banned ?? 0) + (stats.deleted ?? 0)})
          </button>
        </div>

        <div className='absolute -right-10 -top-10 w-48 h-48 rounded-full bg-white/10' />
        <div className='absolute right-20 -bottom-8 w-32 h-32 rounded-full bg-white/10' />
      </div>

      {/* ── Search & Sort ── */}
      <div className='bg-white dark:bg-slate-800 rounded-xl shadow-sm p-4 mb-2 border border-gray-100 dark:border-slate-700'>
        <div className='flex flex-wrap gap-3 items-center'>
          <div className='relative flex-1 min-w-[200px]'>
            <FaSearch className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm' />
            {searchInput && (
              <button
                onClick={() => setSearchInput('')}
                className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors'
              >
                <FaTimes size={12} />
              </button>
            )}
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder='Tìm kiếm người dùng...'
              className='w-full pl-9 pr-8 py-2.5 text-sm border border-gray-200 dark:border-slate-600 rounded-xl bg-gray-50 dark:bg-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-600 transition-all'
            />
          </div>
          <select value={sort} onChange={e => { setSort(e.target.value); setPage(1) }} className={selectCls}>
            <option value='desc'>Mới nhất</option>
            <option value='asc'>Lâu nhất</option>
          </select>
        </div>
      </div>

      {/* ── Table ── */}
      {isLoading ? (
        <Loading />
      ) : (
        <>
          <div className='bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden border border-gray-100 dark:border-slate-700'>
            <div className='overflow-x-auto'>
              <table className='w-full divide-y divide-gray-100 dark:divide-slate-700'>
                <thead className='bg-gray-50 dark:bg-slate-900'>
                  <tr>
                    {['Người dùng', 'Email', 'Lượt vi phạm', 'Hành động'].map(h => (
                      <th key={h} className='px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className='divide-y divide-gray-50 dark:divide-slate-700'>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={4} className='text-center py-16'>
                        <FaUsers className='mx-auto text-4xl text-gray-300 mb-3' />
                        <p className='text-gray-400 text-sm'>
                          {tab === 'inactive'
                            ? 'Không có người dùng bị khóa hoặc đã xóa'
                            : 'Không tìm thấy người dùng nào'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    users.map(user => (
                      <UserItem
                        key={user._id}
                        user={user}
                        tab={tab}
                        onViewDetail={setSelectedUserId}
                        onMutationSuccess={invalidate}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Pagination (inline style matching AdminSportCategory) ── */}
          {totalPage > 1 && (
            <div className='flex items-center justify-center gap-2 mt-5'>
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className='px-3 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors'
              >
                ← Trước
              </button>
              {Array.from({ length: totalPage }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPage || Math.abs(p - page) <= 2)
                .reduce((acc, p, i, arr) => {
                  if (i > 0 && p - arr[i - 1] > 1) acc.push('ellipsis-' + p)
                  acc.push(p)
                  return acc
                }, [])
                .map(p =>
                  typeof p === 'number' ? (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-8 h-8 text-sm rounded-lg font-medium transition-colors ${p === page ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                    >
                      {p}
                    </button>
                  ) : (
                    <span key={p} className='px-1 text-gray-400'>...</span>
                  )
                )
              }
              <button
                disabled={page >= totalPage}
                onClick={() => setPage(p => Math.min(totalPage, p + 1))}
                className='px-3 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors'
              >
                Sau →
              </button>
            </div>
          )}
        </>
      )}

      {/* User Detail Drawer */}
      {selectedUserId && (
        <UserDetailDrawer
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
        />
      )}
    </div>
  )
}
