import { FaSearch, FaFlag } from 'react-icons/fa'
import { MdReport, MdDeleteSweep } from 'react-icons/md'
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query'
import Loading from '../../components/GlobalComponents/Loading'
import PostItem from './components/PostItem'
import DeletedPostItem from './components/DeletedPostItem'
import { useState, useRef, useEffect } from 'react'
import { getReportPost, getDeletedPosts } from '../../apis/inspectorApi'

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

const tabs = [
  { key: 'reported', label: 'Bài viết bị báo cáo', icon: MdReport },
  { key: 'deleted', label: 'Bài viết đã xóa', icon: MdDeleteSweep }
]

export default function ReportList() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('reported')
  const [reportedPage, setReportedPage] = useState(1)
  const [deletedPage, setDeletedPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const debounceRef = useRef(null)
  const LIMIT = 10

  // Debounce search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setSearch(searchInput)
      setReportedPage(1)
      setDeletedPage(1)
    }, 500)
    return () => clearTimeout(debounceRef.current)
  }, [searchInput])

  // Reported posts query
  const reportedParams = { page: reportedPage, limit: LIMIT, ...(search && { search }) }
  const { data, isLoading } = useQuery({
    queryKey: ['report-list', reportedParams],
    queryFn: () => getReportPost(reportedParams),
    placeholderData: keepPreviousData,
    enabled: activeTab === 'reported'
  })

  // Deleted posts query
  const deletedParams = { page: deletedPage, limit: LIMIT, ...(search && { search }) }
  const { data: deletedData, isLoading: isLoadingDeleted } = useQuery({
    queryKey: ['deleted-posts', deletedParams],
    queryFn: () => getDeletedPosts(deletedParams),
    placeholderData: keepPreviousData,
    enabled: activeTab === 'deleted'
  })

  const posts = data?.data?.result?.posts || []
  const reportedTotalPage = data?.data?.result?.totalPage || 1
  const reportedTotal = data?.data?.result?.totalPosts ?? posts.length

  const deletedPosts = deletedData?.data?.result?.posts || []
  const deletedTotalPage = deletedData?.data?.result?.totalPage || 1
  const deletedTotal = deletedData?.data?.result?.totalPosts ?? deletedPosts.length

  // Severity counts
  const highRisk = posts.filter(p => (p.report_count ?? 0) >= 5).length
  const moderate = posts.filter(p => (p.report_count ?? 0) >= 2 && (p.report_count ?? 0) < 5).length

  const handleTabChange = (key) => {
    setActiveTab(key)
  }

  // Inline pagination renderer
  const renderPagination = (currentPage, totalPage, setPage) => {
    if (totalPage <= 1) return null
    return (
      <div className='flex items-center justify-center gap-2 mt-5'>
        <button
          disabled={currentPage <= 1}
          onClick={() => setPage(p => Math.max(1, p - 1))}
          className='px-3 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors'
        >
          ← Trước
        </button>
        {Array.from({ length: totalPage }, (_, i) => i + 1)
          .filter(p => p === 1 || p === totalPage || Math.abs(p - currentPage) <= 2)
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
                className={`w-8 h-8 text-sm rounded-lg font-medium transition-colors ${p === currentPage ? 'bg-rose-600 text-white' : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
              >
                {p}
              </button>
            ) : (
              <span key={p} className='px-1 text-gray-400'>...</span>
            )
          )
        }
        <button
          disabled={currentPage >= totalPage}
          onClick={() => setPage(p => Math.min(totalPage, p + 1))}
          className='px-3 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors'
        >
          Sau →
        </button>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gray-50 dark:bg-gray-900 py-4 px-4'>

      {/* ── Hero Banner ── */}
      <div className='relative overflow-hidden rounded-3xl bg-gradient-to-r from-rose-500 via-red-500 to-orange-500 px-8 py-8 mb-6 shadow-xl'>
        <div className='relative z-10'>
          <p className='text-white/70 text-sm font-medium mb-1'>FitConnect Admin</p>
          <h1 className='text-3xl font-black text-white mb-2'>Kiểm duyệt Bài viết</h1>
          <p className='text-white/80 text-sm max-w-md'>
            Xem xét và xử lý các bài viết bị cộng đồng báo cáo vi phạm.
          </p>
        </div>

        {/* Tabs inside Hero Banner */}
        <div className='relative z-10 flex gap-2 mt-5'>
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all backdrop-blur-sm ${
                activeTab === tab.key
                  ? 'bg-white text-red-700 shadow-md'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              <tab.icon size={15} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className='absolute -right-10 -top-10 w-48 h-48 rounded-full bg-white/10' />
        <div className='absolute right-20 -bottom-8 w-32 h-32 rounded-full bg-white/10' />
      </div>

      {/* ── Tab: Bài viết bị báo cáo ── */}
      {activeTab === 'reported' && (
        <>
          {/* Stat Cards */}
          <div className='grid grid-cols-2 xl:grid-cols-3 gap-3 mb-6'>
            <MiniStatCard icon={MdReport} label='Bài viết cần xét' value={reportedTotal} color='border-l-rose-400' iconBg='bg-gradient-to-br from-rose-400 to-red-600' />
            <MiniStatCard icon={FaFlag} label='Nguy cơ cao (≥5 báo cáo)' value={highRisk} color='border-l-red-500' iconBg='bg-gradient-to-br from-red-500 to-rose-700' />
            <MiniStatCard icon={FaFlag} label='Báo cáo vừa (2-4 lần)' value={moderate} color='border-l-orange-400' iconBg='bg-gradient-to-br from-orange-400 to-amber-600' />
          </div>

          {/* Search */}
          <div className='bg-white dark:bg-slate-800 rounded-xl shadow-sm p-4 mb-4 border border-gray-100 dark:border-slate-700'>
            <div className='relative flex-1'>
              <FaSearch className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm' />
              <input
                autoComplete='off'
                type='search'
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder='Tìm bài viết bị báo cáo...'
                className='w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-rose-500 transition-all'
              />
            </div>
          </div>

          {/* Table */}
          {isLoading ? (
            <Loading />
          ) : (
            <>
              <div className='bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden border border-gray-100 dark:border-slate-700'>
                <div className='px-4 py-3 border-b border-gray-100 dark:border-slate-700'>
                  <p className='text-sm text-gray-500 dark:text-gray-400'>
                    <span className='font-semibold text-gray-800 dark:text-white'>{reportedTotal}</span> bài viết bị báo cáo
                    {reportedTotalPage > 1 && <span className='text-gray-400'> (trang {reportedPage}/{reportedTotalPage})</span>}
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

              {renderPagination(reportedPage, reportedTotalPage, setReportedPage)}
            </>
          )}
        </>
      )}

      {/* ── Tab: Bài viết đã xóa ── */}
      {activeTab === 'deleted' && (
        <>
          {/* Stat Cards */}
          <div className='grid grid-cols-2 xl:grid-cols-3 gap-3 mb-6'>
            <MiniStatCard icon={MdDeleteSweep} label='Tổng bài viết đã xóa' value={deletedTotal} color='border-l-gray-400' iconBg='bg-gradient-to-br from-gray-400 to-gray-600' />
          </div>

          {/* Search */}
          <div className='bg-white dark:bg-slate-800 rounded-xl shadow-sm p-4 mb-4 border border-gray-100 dark:border-slate-700'>
            <div className='relative flex-1'>
              <FaSearch className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm' />
              <input
                autoComplete='off'
                type='search'
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder='Tìm bài viết đã xóa...'
                className='w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-rose-500 transition-all'
              />
            </div>
          </div>

          {/* Table */}
          {isLoadingDeleted ? (
            <Loading />
          ) : (
            <>
              <div className='bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden border border-gray-100 dark:border-slate-700'>
                <div className='px-4 py-3 border-b border-gray-100 dark:border-slate-700'>
                  <p className='text-sm text-gray-500 dark:text-gray-400'>
                    <span className='font-semibold text-gray-800 dark:text-white'>{deletedTotal}</span> bài viết đã xóa
                    {deletedTotalPage > 1 && <span className='text-gray-400'> (trang {deletedPage}/{deletedTotalPage})</span>}
                  </p>
                </div>
                <div className='overflow-x-auto'>
                  <table className='w-full divide-y divide-gray-100 dark:divide-slate-700'>
                    <thead className='bg-gray-50 dark:bg-slate-900'>
                      <tr>
                        {['Người viết', 'Nội dung', 'Ngày tạo', 'Hành động'].map(h => (
                          <th key={h} className='px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className='divide-y divide-gray-50 dark:divide-slate-700'>
                      {deletedPosts.length === 0 ? (
                        <tr>
                          <td colSpan={4} className='text-center py-16'>
                            <MdDeleteSweep className='mx-auto text-4xl text-gray-300 mb-3' />
                            <p className='text-gray-400 text-sm'>Không có bài viết nào đã xóa</p>
                          </td>
                        </tr>
                      ) : (
                        deletedPosts.map(post => <DeletedPostItem key={post._id} post={post} />)
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {renderPagination(deletedPage, deletedTotalPage, setDeletedPage)}
            </>
          )}
        </>
      )}
    </div>
  )
}
