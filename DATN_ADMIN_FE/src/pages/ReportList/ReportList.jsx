import { FaSearch, FaFlag } from 'react-icons/fa'
import { MdReport, MdDeleteSweep } from 'react-icons/md'
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query'
import Loading from '../../components/GlobalComponents/Loading'
import PostItem from './components/PostItem'
import DeletedPostItem from './components/DeletedPostItem'
import { useState, useRef, useEffect } from 'react'
import { getReportPost, getDeletedPosts } from '../../apis/inspectorApi'


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
    <div className='min-h-screen bg-gray-50 dark:bg-gray-900 pt-0 pb-4 px-4'>

      {/* ── Hero Banner ── */}
      <div className='relative overflow-hidden rounded-2xl bg-gradient-to-r from-rose-500 via-red-500 to-orange-500 px-6 py-4 mb-2 shadow-xl'>
        <div className='relative z-10'>
          <h1 className='text-2xl font-bold text-white'>Kiểm duyệt Bài viết</h1>
        </div>

        {/* Tabs + contextual stat chips */}
        <div className='relative z-10 flex items-center justify-between mt-3 flex-wrap gap-2'>
          <div className='flex gap-2 flex-wrap'>
            <button
              onClick={() => handleTabChange('reported')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-sm font-semibold transition-all backdrop-blur-sm ${
                activeTab === 'reported' ? 'bg-white text-red-700 shadow-md' : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              <MdReport size={15} />
              Bị báo cáo <span className='font-black'>({reportedTotal})</span>
            </button>
            <button
              onClick={() => handleTabChange('deleted')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-sm font-semibold transition-all backdrop-blur-sm ${
                activeTab === 'deleted' ? 'bg-white text-red-700 shadow-md' : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              <MdDeleteSweep size={15} />
              Đã xóa <span className='font-black'>({deletedTotal})</span>
            </button>
          </div>
          {activeTab === 'reported' && (
            <div className='flex gap-2 flex-wrap'>
              <div className='flex items-center gap-1 bg-white/15 backdrop-blur-sm px-3 py-1 rounded-xl'>
                <span className='text-sm font-black text-red-200'>{highRisk}</span>
                <span className='text-white/70 text-xs'>Nguy cơ cao</span>
              </div>
              <div className='flex items-center gap-1 bg-white/15 backdrop-blur-sm px-3 py-1 rounded-xl'>
                <span className='text-sm font-black text-orange-200'>{moderate}</span>
                <span className='text-white/70 text-xs'>Báo cáo vừa</span>
              </div>
            </div>
          )}
        </div>

        <div className='absolute -right-10 -top-10 w-48 h-48 rounded-full bg-white/10' />
        <div className='absolute right-20 -bottom-8 w-32 h-32 rounded-full bg-white/10' />
      </div>

      {/* ── Tab: Bài viết bị báo cáo ── */}
      {activeTab === 'reported' && (
        <>
          {/* Search */}
          <div className='bg-white dark:bg-slate-800 rounded-xl shadow-sm p-4 mb-2 border border-gray-100 dark:border-slate-700'>
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
          {/* Search */}
          <div className='bg-white dark:bg-slate-800 rounded-xl shadow-sm p-4 mb-2 border border-gray-100 dark:border-slate-700'>
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
