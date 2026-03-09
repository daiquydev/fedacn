import { createSearchParams, useNavigate } from 'react-router-dom'
import { getAllUserAdmin } from '../../apis/adminApi'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { omit } from 'lodash'
import { FaSearch, FaUsers, FaUserCheck, FaUserSlash, FaFilter, FaSync } from 'react-icons/fa'
import { MdChef } from 'react-icons/md'
import Loading from '../../components/GlobalComponents/Loading'
import Pagination from '../../components/GlobalComponents/Pagination/Pagination'
import useQueryConfig from '../../hooks/useQueryConfig'
import UserItem from './components/UserItem'

function MiniStatCard({ icon: Icon, label, value, color, iconBg }) {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl px-5 py-4 border-l-4 ${color} shadow-sm border border-gray-100 dark:border-gray-700`}>
      <div className='flex items-center justify-between'>
        <div>
          <p className='text-xs text-gray-400 dark:text-gray-500 mb-1'>{label}</p>
          <p className='text-2xl font-black text-gray-800 dark:text-white'>{(value ?? 0).toLocaleString('vi-VN')}</p>
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>
          <Icon className='text-white text-base' />
        </div>
      </div>
    </div>
  )
}

export default function UserList() {
  const navigate = useNavigate()
  const queryConfig = useQueryConfig()

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['user-list', queryConfig],
    queryFn: () => getAllUserAdmin(queryConfig),
    placeholderData: keepPreviousData,
    staleTime: 1000
  })

  const users = data?.data?.result?.users || []
  const totalPage = data?.data?.result?.totalPage || 1
  const totalUsers = data?.data?.result?.total || users.length

  const activeCount = users.filter(u => u.status === 1).length
  const bannedCount = users.filter(u => u.status === 0).length
  const chefCount = users.filter(u => u.role === 1).length

  const handleChangeSort = (e) => {
    navigate({
      pathname: '/user',
      search: createSearchParams({ ...queryConfig, sort: e.target.value }).toString()
    })
  }

  const handleChangeRole = (e) => {
    navigate({
      pathname: '/user',
      search: createSearchParams({ ...queryConfig, role: e.target.value }).toString()
    })
  }

  const handleChangeStatus = (e) => {
    navigate({
      pathname: '/user',
      search: createSearchParams({ ...queryConfig, status: e.target.value }).toString()
    })
  }

  const { register, handleSubmit } = useForm({
    defaultValues: { searchUsers: queryConfig.search || '' }
  })

  const onSubmitSearch = handleSubmit((formData) => {
    if (formData.searchUsers === '') {
      navigate({
        pathname: '/user',
        search: createSearchParams(omit({ ...queryConfig }, ['status', 'role', 'page', 'search'])).toString()
      })
      return
    }
    navigate({
      pathname: '/user',
      search: createSearchParams(omit({ ...queryConfig, search: formData.searchUsers }, ['status', 'page'])).toString()
    })
  })

  const selectCls = 'px-3 py-2 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all'

  return (
    <div className='min-h-screen bg-gray-50 dark:bg-gray-900 py-4 px-4'>

      {/* ── Hero Banner ── */}
      <div className='relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-600 px-8 py-8 mb-6 shadow-xl'>
        <div className='relative z-10 flex items-start justify-between'>
          <div>
            <p className='text-white/70 text-sm font-medium mb-1'>FitConnect Admin</p>
            <h1 className='text-3xl font-black text-white mb-2'>Quản lý Người dùng</h1>
            <p className='text-white/80 text-sm max-w-md'>
              Xem, tìm kiếm, khóa tài khoản và quản lý toàn bộ người dùng trong hệ thống.
            </p>
          </div>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className='flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all disabled:opacity-50 mt-1 shrink-0'
          >
            <FaSync size={13} className={isFetching ? 'animate-spin' : ''} />
            Làm mới
          </button>
        </div>
        <div className='absolute -right-10 -top-10 w-48 h-48 rounded-full bg-white/10' />
        <div className='absolute right-20 -bottom-8 w-32 h-32 rounded-full bg-white/10' />
      </div>

      {/* ── Stat Cards ── */}
      <div className='grid grid-cols-2 xl:grid-cols-4 gap-3 mb-6'>
        <MiniStatCard icon={FaUsers} label='Tổng người dùng' value={totalUsers} color='border-l-blue-400' iconBg='bg-gradient-to-br from-blue-400 to-blue-600' />
        <MiniStatCard icon={FaUserCheck} label='Đang hoạt động' value={activeCount} color='border-l-emerald-400' iconBg='bg-gradient-to-br from-emerald-400 to-green-600' />
        <MiniStatCard icon={FaUserSlash} label='Bị khóa' value={bannedCount} color='border-l-red-400' iconBg='bg-gradient-to-br from-red-400 to-rose-600' />
        <MiniStatCard icon={MdChef} label='Đầu bếp' value={chefCount} color='border-l-orange-400' iconBg='bg-gradient-to-br from-orange-400 to-amber-600' />
      </div>

      {/* ── Filters ── */}
      <div className='bg-white dark:bg-slate-800 rounded-xl shadow-sm p-4 mb-4 border border-gray-100 dark:border-slate-700'>
        <div className='flex flex-wrap gap-3 items-center'>
          {/* Search */}
          <form onSubmit={onSubmitSearch} className='flex flex-1 min-w-[200px] gap-2'>
            <div className='relative flex-1'>
              <FaSearch className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm' />
              <input
                autoComplete='off'
                type='search'
                id='search_input'
                {...register('searchUsers')}
                placeholder='Tìm kiếm người dùng...'
                className='w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all'
              />
            </div>
            <button type='submit' className='px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors'>
              Tìm
            </button>
          </form>

          {/* Filters */}
          <div className='flex items-center gap-2'>
            <FaFilter className='text-gray-400 text-sm' />
            <select onChange={handleChangeSort} defaultValue={queryConfig.sort} className={selectCls}>
              <option value='desc'>Mới nhất</option>
              <option value='asc'>Lâu nhất</option>
            </select>
            <select onChange={handleChangeRole} defaultValue={queryConfig.role} className={selectCls}>
              <option value='0'>Người dùng</option>
              <option value='1'>Đầu bếp</option>
            </select>
            <select defaultValue={queryConfig.status} onChange={handleChangeStatus} className={selectCls}>
              <option value='1'>Đang hoạt động</option>
              <option value='0'>Bị khóa</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Table ── */}
      {isLoading ? (
        <Loading />
      ) : (
        <>
          <div className='bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden border border-gray-100 dark:border-slate-700'>
            {/* Table header info */}
            <div className='px-4 py-3 border-b border-gray-100 dark:border-slate-700'>
              <p className='text-sm text-gray-500 dark:text-gray-400'>
                Hiển thị <span className='font-semibold text-gray-800 dark:text-white'>{users.length}</span> người dùng
              </p>
            </div>

            <div className='overflow-x-auto'>
              <table className='w-full divide-y divide-gray-100 dark:divide-slate-700'>
                <thead className='bg-gray-50 dark:bg-slate-900'>
                  <tr>
                    {['Người dùng', 'Trạng thái', 'Email', 'Lượt vi phạm', 'Vai trò', 'Hành động'].map(h => (
                      <th key={h} className='px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className='divide-y divide-gray-50 dark:divide-slate-700'>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={6} className='text-center py-16'>
                        <FaUsers className='mx-auto text-4xl text-gray-300 mb-3' />
                        <p className='text-gray-400 text-sm'>Không tìm thấy người dùng nào</p>
                      </td>
                    </tr>
                  ) : (
                    users.map(user => <UserItem key={user._id} user={user} />)
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPage > 1 && (
            <div className='flex justify-center items-center mt-5'>
              <Pagination pageSize={totalPage} queryConfig={queryConfig} url='/user' />
            </div>
          )}
        </>
      )}
    </div>
  )
}
