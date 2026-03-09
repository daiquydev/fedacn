import { FaSearch, FaFlag, FaFilter, FaSync } from 'react-icons/fa'
import { MdReport } from 'react-icons/md'
import Pagination from '../../components/GlobalComponents/Pagination'
import { useNavigate, createSearchParams } from 'react-router-dom'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import Loading from '../../components/GlobalComponents/Loading'
import useQueryConfig from '../../hooks/useQueryConfig'
import { omit } from 'lodash'
import { useForm } from 'react-hook-form'
import { getReportPost } from '../../apis/inspectorApi'
import PostItem from './components/PostItem'

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

export default function ReportList() {
  const navigate = useNavigate()
  const queryConfig = omit(useQueryConfig(), 'sort')

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['report-list', queryConfig],
    queryFn: () => getReportPost(queryConfig),
    placeholderData: keepPreviousData,
    staleTime: 1000
  })

  const posts = data?.data?.result?.posts || []
  const totalPage = data?.data?.result?.totalPage || 1

  // Calculate report severity counts from current page
  const highRisk = posts.filter(p => (p.report_count ?? 0) >= 5).length
  const moderate = posts.filter(p => (p.report_count ?? 0) >= 2 && (p.report_count ?? 0) < 5).length

  const { register, handleSubmit } = useForm({
    defaultValues: { searchReport: queryConfig.search || '' }
  })

  const onSubmitSearch = handleSubmit((formData) => {
    if (!formData.searchReport) {
      navigate({
        pathname: '/reports',
        search: createSearchParams(omit({ ...queryConfig }, ['page', 'search'])).toString()
      })
      return
    }
    navigate({
      pathname: '/reports',
      search: createSearchParams(omit({ ...queryConfig, search: formData.searchReport }, ['page'])).toString()
    })
  })

  return (
    <div className='min-h-screen bg-gray-50 dark:bg-gray-900 py-4 px-4'>

      {/* ── Hero Banner ── */}
      <div className='relative overflow-hidden rounded-3xl bg-gradient-to-r from-rose-500 via-red-500 to-orange-500 px-8 py-8 mb-6 shadow-xl'>
        <div className='relative z-10 flex items-start justify-between'>
          <div>
            <p className='text-white/70 text-sm font-medium mb-1'>FitConnect Admin</p>
            <h1 className='text-3xl font-black text-white mb-2'>Kiểm duyệt Bài viết</h1>
            <p className='text-white/80 text-sm max-w-md'>
              Xem xét và xử lý các bài viết bị cộng đồng báo cáo vi phạm.
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
      <div className='grid grid-cols-2 xl:grid-cols-3 gap-3 mb-6'>
        <MiniStatCard icon={MdReport} label='Bài viết cần xét' value={posts.length} color='border-l-rose-400' iconBg='bg-gradient-to-br from-rose-400 to-red-600' />
        <MiniStatCard icon={FaFlag} label='Nguy cơ cao (≥5 báo cáo)' value={highRisk} color='border-l-red-500' iconBg='bg-gradient-to-br from-red-500 to-rose-700' />
        <MiniStatCard icon={FaFlag} label='Báo cáo vừa (2-4 lần)' value={moderate} color='border-l-orange-400' iconBg='bg-gradient-to-br from-orange-400 to-amber-600' />
      </div>

      {/* ── Search / Filter ── */}
      <div className='bg-white dark:bg-slate-800 rounded-xl shadow-sm p-4 mb-4 border border-gray-100 dark:border-slate-700'>
        <form onSubmit={onSubmitSearch} className='flex gap-2'>
          <div className='relative flex-1'>
            <FaSearch className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm' />
            <input
              autoComplete='off'
              type='search'
              {...register('searchReport')}
              placeholder='Tìm bài viết bị báo cáo...'
              className='w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-rose-500 transition-all'
            />
          </div>
          <button type='submit' className='px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-1.5'>
            <FaSearch size={12} /> Tìm
          </button>
        </form>
      </div>

      {/* ── Table ── */}
      {isLoading ? (
        <Loading />
      ) : (
        <>
          <div className='bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden border border-gray-100 dark:border-slate-700'>
            <div className='px-4 py-3 border-b border-gray-100 dark:border-slate-700'>
              <p className='text-sm text-gray-500 dark:text-gray-400'>
                Hiển thị <span className='font-semibold text-gray-800 dark:text-white'>{posts.length}</span> bài viết bị báo cáo
              </p>
            </div>
            <div className='overflow-x-auto'>
              <table className='w-full divide-y divide-gray-100 dark:divide-slate-700'>
                <thead className='bg-gray-50 dark:bg-slate-900'>
                  <tr>
                    {['Người viết', 'Nội dung', 'Số lần bị báo cáo', 'Ngày tạo', 'Hành động'].map(h => (
                      <th key={h} className='px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className='divide-y divide-gray-50 dark:divide-slate-700'>
                  {posts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className='text-center py-16'>
                        <FaFlag className='mx-auto text-4xl text-gray-300 mb-3' />
                        <p className='text-gray-400 text-sm'>Không có bài viết nào bị báo cáo</p>
                      </td>
                    </tr>
                  ) : (
                    posts.map(post => <PostItem key={post._id} post={post} />)
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {totalPage > 1 && (
            <div className='flex justify-center items-center mt-5'>
              <Pagination pageSize={totalPage} queryConfig={queryConfig} url='/reports' />
            </div>
          )}
        </>
      )}
    </div>
  )
}
