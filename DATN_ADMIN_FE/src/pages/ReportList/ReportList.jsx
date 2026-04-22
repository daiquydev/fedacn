import { FaSearch, FaFlag, FaTrophy } from 'react-icons/fa'
import { MdReport, MdDeleteSweep, MdEvent } from 'react-icons/md'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import Loading from '../../components/GlobalComponents/Loading'
import PostItem from './components/PostItem'
import DeletedPostItem from './components/DeletedPostItem'
import SportEventReportItem from './components/SportEventReportItem/SportEventReportItem'
import ChallengeReportItem from './components/ChallengeReportItem/ChallengeReportItem'
import { useState, useRef, useEffect } from 'react'
import { useSearchParams, useLocation } from 'react-router-dom'
import {
  getReportPost,
  getDeletedPosts,
  getSportEventReports,
  getDeletedSportEvents,
  getChallengeReports,
  getDeletedChallenges
} from '../../apis/inspectorApi'
import DeletedSportEventItem from './components/DeletedSportEventItem/DeletedSportEventItem'
import DeletedChallengeItem from './components/DeletedChallengeItem/DeletedChallengeItem'

export default function ReportList() {
  const location = useLocation()
  const mode = location.pathname.startsWith('/reports/challenges')
    ? 'challenges'
    : location.pathname.startsWith('/reports/events')
      ? 'events'
      : 'posts'
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = searchParams.get('tab')
  const postTab = tab === 'deleted' ? 'deleted' : 'reported'
  const eventTab = tab === 'deleted' ? 'deleted' : 'reported'
  const challengeTab = tab === 'deleted' ? 'deleted' : 'reported'

  const [reportedPage, setReportedPage] = useState(1)
  const [eventsPage, setEventsPage] = useState(1)
  const [deletedEventsPage, setDeletedEventsPage] = useState(1)
  const [challengesPage, setChallengesPage] = useState(1)
  const [deletedChallengesPage, setDeletedChallengesPage] = useState(1)
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
      setEventsPage(1)
      setDeletedEventsPage(1)
      setChallengesPage(1)
      setDeletedChallengesPage(1)
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
    enabled: mode === 'posts' && postTab === 'reported'
  })

  const eventsParams = { page: eventsPage, limit: LIMIT, ...(search && { search }) }
  const { data: eventsData, isLoading: isLoadingEvents } = useQuery({
    queryKey: ['sport-event-reports', eventsParams],
    queryFn: () => getSportEventReports(eventsParams),
    placeholderData: keepPreviousData,
    enabled: mode === 'events' && eventTab === 'reported'
  })

  const deletedEventsParams = { page: deletedEventsPage, limit: LIMIT, ...(search && { search }) }
  const { data: deletedEventsData, isLoading: isLoadingDeletedEvents } = useQuery({
    queryKey: ['deleted-sport-events', deletedEventsParams],
    queryFn: () => getDeletedSportEvents(deletedEventsParams),
    placeholderData: keepPreviousData,
    enabled: mode === 'events' && eventTab === 'deleted'
  })

  const { data: eventsReportedMeta } = useQuery({
    queryKey: ['sport-event-reports-meta'],
    queryFn: () => getSportEventReports({ page: 1, limit: 1 }),
    select: (d) => d?.data?.result?.pagination?.total ?? 0,
    staleTime: 30_000,
    enabled: mode === 'events'
  })

  const { data: eventsDeletedMeta } = useQuery({
    queryKey: ['deleted-sport-events-meta'],
    queryFn: () => getDeletedSportEvents({ page: 1, limit: 1 }),
    select: (d) => d?.data?.result?.pagination?.total ?? 0,
    staleTime: 30_000,
    enabled: mode === 'events'
  })

  const challengesParams = { page: challengesPage, limit: LIMIT, ...(search && { search }) }
  const { data: challengesData, isLoading: isLoadingChallenges } = useQuery({
    queryKey: ['challenge-reports', challengesParams],
    queryFn: () => getChallengeReports(challengesParams),
    placeholderData: keepPreviousData,
    enabled: mode === 'challenges' && challengeTab === 'reported'
  })

  const deletedChallengesParams = { page: deletedChallengesPage, limit: LIMIT, ...(search && { search }) }
  const { data: deletedChallengesData, isLoading: isLoadingDeletedChallenges } = useQuery({
    queryKey: ['deleted-challenges', deletedChallengesParams],
    queryFn: () => getDeletedChallenges(deletedChallengesParams),
    placeholderData: keepPreviousData,
    enabled: mode === 'challenges' && challengeTab === 'deleted'
  })

  const { data: challengesReportedMeta } = useQuery({
    queryKey: ['challenge-reports-meta'],
    queryFn: () => getChallengeReports({ page: 1, limit: 1 }),
    select: (d) => d?.data?.result?.pagination?.total ?? 0,
    staleTime: 30_000,
    enabled: mode === 'challenges'
  })

  const { data: challengesDeletedMeta } = useQuery({
    queryKey: ['deleted-challenges-meta'],
    queryFn: () => getDeletedChallenges({ page: 1, limit: 1 }),
    select: (d) => d?.data?.result?.pagination?.total ?? 0,
    staleTime: 30_000,
    enabled: mode === 'challenges'
  })

  // Deleted posts query
  const deletedParams = { page: deletedPage, limit: LIMIT, ...(search && { search }) }
  const { data: deletedData, isLoading: isLoadingDeleted } = useQuery({
    queryKey: ['deleted-posts', deletedParams],
    queryFn: () => getDeletedPosts(deletedParams),
    placeholderData: keepPreviousData,
    enabled: mode === 'posts' && postTab === 'deleted'
  })

  const posts = data?.data?.result?.posts || []
  const reportedTotalPage = data?.data?.result?.totalPage || 1
  const reportedTotal = data?.data?.result?.totalPosts ?? posts.length

  const deletedPosts = deletedData?.data?.result?.posts || []
  const deletedTotalPage = deletedData?.data?.result?.totalPage || 1
  const deletedTotal = deletedData?.data?.result?.totalPosts ?? deletedPosts.length

  const sportEvents = eventsData?.data?.result?.sport_events || []
  const eventsPagination = eventsData?.data?.result?.pagination
  const eventsTotalPage = eventsPagination?.total_page || 1
  const eventsReportedTotal = eventsReportedMeta ?? eventsPagination?.total ?? sportEvents.length

  const deletedSportEvents = deletedEventsData?.data?.result?.sport_events || []
  const deletedEventsPagination = deletedEventsData?.data?.result?.pagination
  const deletedEventsTotalPage = deletedEventsPagination?.total_page || 1
  const eventsDeletedTotal = eventsDeletedMeta ?? deletedEventsPagination?.total ?? deletedSportEvents.length

  const reportedChallenges = challengesData?.data?.result?.challenges || []
  const challengesPagination = challengesData?.data?.result?.pagination
  const challengesTotalPage = challengesPagination?.total_page || 1
  const challengesReportedTotal = challengesReportedMeta ?? challengesPagination?.total ?? reportedChallenges.length

  const deletedChallengesList = deletedChallengesData?.data?.result?.challenges || []
  const deletedChallengesPagination = deletedChallengesData?.data?.result?.pagination
  const deletedChallengesTotalPage = deletedChallengesPagination?.total_page || 1
  const challengesDeletedTotal = challengesDeletedMeta ?? deletedChallengesPagination?.total ?? deletedChallengesList.length

  // Severity counts
  const highRisk = posts.filter(p => (p.report_count ?? 0) >= 5).length
  const moderate = posts.filter(p => (p.report_count ?? 0) >= 2 && (p.report_count ?? 0) < 5).length
  const eventsHighRisk = sportEvents.filter(e => (e.report_count ?? 0) >= 5).length
  const eventsModerate = sportEvents.filter(e => (e.report_count ?? 0) >= 2 && (e.report_count ?? 0) < 5).length
  const challengesHighRisk = reportedChallenges.filter(c => (c.report_count ?? 0) >= 5).length
  const challengesModerate = reportedChallenges.filter(c => (c.report_count ?? 0) >= 2 && (c.report_count ?? 0) < 5).length

  const goPostsReported = () => setSearchParams({}, { replace: true })
  const goPostsDeleted = () => setSearchParams({ tab: 'deleted' }, { replace: true })
  const goEventsReported = () => setSearchParams({}, { replace: true })
  const goEventsDeleted = () => setSearchParams({ tab: 'deleted' }, { replace: true })
  const goChallengesReported = () => setSearchParams({}, { replace: true })
  const goChallengesDeleted = () => setSearchParams({ tab: 'deleted' }, { replace: true })

  // Inline pagination renderer
  const renderPagination = (currentPage, totalPage, setPage) => {
    if (totalPage <= 1) return null
    return (
      <div className='mt-5 flex flex-wrap items-center justify-center gap-2'>
        <button
          type='button'
          disabled={currentPage <= 1}
          onClick={() => setPage(p => Math.max(1, p - 1))}
          className='admin-page-btn border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'
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
                type='button'
                key={p}
                onClick={() => setPage(p)}
                className={`inline-flex h-10 w-10 items-center justify-center rounded-xl text-sm font-medium transition-colors ${p === currentPage ? 'bg-rose-600 text-white shadow-sm' : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'}`}
              >
                {p}
              </button>
            ) : (
              <span key={p} className='px-1 text-gray-400'>...</span>
            )
          )
        }
        <button
          type='button'
          disabled={currentPage >= totalPage}
          onClick={() => setPage(p => Math.min(totalPage, p + 1))}
          className='admin-page-btn border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'
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
          <h1 className='text-2xl font-bold text-white'>
            {mode === 'posts'
              ? 'Kiểm duyệt bài viết'
              : mode === 'events'
                ? 'Kiểm duyệt sự kiện thể thao'
                : 'Kiểm duyệt thử thách'}
          </h1>
          <p className='text-white/80 text-sm mt-1'>
            {mode === 'posts'
              ? 'Bài viết bị người dùng báo cáo và bài viết đã gỡ'
              : mode === 'events'
                ? 'Sự kiện bị người dùng báo cáo và sự kiện đã gỡ'
                : 'Thử thách bị người dùng báo cáo và thử thách đã gỡ'}
          </p>
        </div>

        {/* Tabs + contextual stat chips */}
        <div className='relative z-10 flex items-center justify-between mt-3 flex-wrap gap-2'>
          <div className='flex gap-2 flex-wrap'>
            {mode === 'posts' ? (
              <>
                <button
                  type='button'
                  onClick={goPostsReported}
                  className={`admin-hero-tab shrink-0 ${
                    postTab === 'reported' ? 'bg-white text-red-700 shadow-md' : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  <MdReport size={15} />
                  Bài viết bị báo cáo <span className='font-black'>({reportedTotal})</span>
                </button>
                <button
                  type='button'
                  onClick={goPostsDeleted}
                  className={`admin-hero-tab shrink-0 ${
                    postTab === 'deleted' ? 'bg-white text-red-700 shadow-md' : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  <MdDeleteSweep size={15} />
                  Bài viết đã xóa <span className='font-black'>({deletedTotal})</span>
                </button>
              </>
            ) : mode === 'events' ? (
              <>
                <button
                  type='button'
                  onClick={goEventsReported}
                  className={`admin-hero-tab shrink-0 ${
                    eventTab === 'reported' ? 'bg-white text-red-700 shadow-md' : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  <MdEvent size={15} />
                  Sự kiện bị báo cáo <span className='font-black'>({eventsReportedTotal})</span>
                </button>
                <button
                  type='button'
                  onClick={goEventsDeleted}
                  className={`admin-hero-tab shrink-0 ${
                    eventTab === 'deleted' ? 'bg-white text-red-700 shadow-md' : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  <MdDeleteSweep size={15} />
                  Sự kiện đã xóa <span className='font-black'>({eventsDeletedTotal})</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type='button'
                  onClick={goChallengesReported}
                  className={`admin-hero-tab shrink-0 ${
                    challengeTab === 'reported' ? 'bg-white text-red-700 shadow-md' : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  <FaTrophy size={15} />
                  Thử thách bị báo cáo <span className='font-black'>({challengesReportedTotal})</span>
                </button>
                <button
                  type='button'
                  onClick={goChallengesDeleted}
                  className={`admin-hero-tab shrink-0 ${
                    challengeTab === 'deleted' ? 'bg-white text-red-700 shadow-md' : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  <MdDeleteSweep size={15} />
                  Thử thách đã xóa <span className='font-black'>({challengesDeletedTotal})</span>
                </button>
              </>
            )}
          </div>
          {mode === 'posts' && postTab === 'reported' && (
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
          {mode === 'events' && eventTab === 'reported' && (
            <div className='flex gap-2 flex-wrap'>
              <div className='flex items-center gap-1 bg-white/15 backdrop-blur-sm px-3 py-1 rounded-xl'>
                <span className='text-sm font-black text-red-200'>{eventsHighRisk}</span>
                <span className='text-white/70 text-xs'>Nguy cơ cao</span>
              </div>
              <div className='flex items-center gap-1 bg-white/15 backdrop-blur-sm px-3 py-1 rounded-xl'>
                <span className='text-sm font-black text-orange-200'>{eventsModerate}</span>
                <span className='text-white/70 text-xs'>Báo cáo vừa</span>
              </div>
            </div>
          )}
          {mode === 'challenges' && challengeTab === 'reported' && (
            <div className='flex gap-2 flex-wrap'>
              <div className='flex items-center gap-1 bg-white/15 backdrop-blur-sm px-3 py-1 rounded-xl'>
                <span className='text-sm font-black text-red-200'>{challengesHighRisk}</span>
                <span className='text-white/70 text-xs'>Nguy cơ cao</span>
              </div>
              <div className='flex items-center gap-1 bg-white/15 backdrop-blur-sm px-3 py-1 rounded-xl'>
                <span className='text-sm font-black text-orange-200'>{challengesModerate}</span>
                <span className='text-white/70 text-xs'>Báo cáo vừa</span>
              </div>
            </div>
          )}
        </div>

        <div className='absolute -right-10 -top-10 w-48 h-48 rounded-full bg-white/10' />
        <div className='absolute right-20 -bottom-8 w-32 h-32 rounded-full bg-white/10' />
      </div>

      {/* ── Bài viết bị báo cáo ── */}
      {mode === 'posts' && postTab === 'reported' && (
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
                className='min-h-10 w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm outline-none transition-all focus:ring-2 focus:ring-rose-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white'
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
                        {['Người viết', 'Bài viết'].map(h => (
                          <th key={h} className='px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                            {h}
                          </th>
                        ))}
                        <th className='px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                          Số báo cáo
                        </th>
                        <th className='px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                          Người báo cáo
                        </th>
                        <th className='px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                          Nội dung báo cáo
                        </th>
                        <th className='px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                          Hành động
                        </th>
                      </tr>
                    </thead>
                    <tbody className='divide-y divide-gray-50 dark:divide-slate-700'>
                      {posts.length === 0 ? (
                        <tr>
                          <td colSpan={6} className='text-center py-16'>
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

      {/* ── Sự kiện bị báo cáo ── */}
      {mode === 'events' && eventTab === 'reported' && (
        <>
          <div className='bg-white dark:bg-slate-800 rounded-xl shadow-sm p-4 mb-2 border border-gray-100 dark:border-slate-700'>
            <div className='relative flex-1'>
              <FaSearch className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm' />
              <input
                autoComplete='off'
                type='search'
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder='Tìm sự kiện bị báo cáo...'
                className='min-h-10 w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm outline-none transition-all focus:ring-2 focus:ring-rose-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white'
              />
            </div>
          </div>

          {isLoadingEvents ? (
            <Loading />
          ) : (
            <>
              <div className='bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden border border-gray-100 dark:border-slate-700'>
                <div className='overflow-x-auto'>
                  <table className='w-full divide-y divide-gray-100 dark:divide-slate-700'>
                    <thead className='bg-gray-50 dark:bg-slate-900'>
                      <tr>
                        {['Người tạo sự kiện', 'Sự kiện'].map(h => (
                          <th key={h} className='px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                            {h}
                          </th>
                        ))}
                        <th className='px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                          Số báo cáo
                        </th>
                        <th className='px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                          Người báo cáo
                        </th>
                        <th className='px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                          Nội dung báo cáo
                        </th>
                        <th className='px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                          Hành động
                        </th>
                      </tr>
                    </thead>
                    <tbody className='divide-y divide-gray-50 dark:divide-slate-700'>
                      {sportEvents.length === 0 ? (
                        <tr>
                          <td colSpan={6} className='text-center py-16'>
                            <MdEvent className='mx-auto text-4xl text-gray-300 mb-3' />
                            <p className='text-gray-400 text-sm'>Không có sự kiện nào bị báo cáo</p>
                          </td>
                        </tr>
                      ) : (
                        sportEvents.map((ev) => <SportEventReportItem key={ev._id} event={ev} />)
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {renderPagination(eventsPage, eventsTotalPage, setEventsPage)}
            </>
          )}
        </>
      )}

      {/* ── Sự kiện đã xóa (soft delete) ── */}
      {mode === 'events' && eventTab === 'deleted' && (
        <>
          <div className='bg-white dark:bg-slate-800 rounded-xl shadow-sm p-4 mb-2 border border-gray-100 dark:border-slate-700'>
            <div className='relative flex-1'>
              <FaSearch className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm' />
              <input
                autoComplete='off'
                type='search'
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder='Tìm sự kiện đã gỡ...'
                className='min-h-10 w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm outline-none transition-all focus:ring-2 focus:ring-rose-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white'
              />
            </div>
          </div>

          {isLoadingDeletedEvents ? (
            <Loading />
          ) : (
            <>
              <div className='bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden border border-gray-100 dark:border-slate-700'>
                <div className='overflow-x-auto'>
                  <table className='w-full divide-y divide-gray-100 dark:divide-slate-700'>
                    <thead className='bg-gray-50 dark:bg-slate-900'>
                      <tr>
                        {['Người tạo sự kiện', 'Sự kiện', 'Thời điểm xóa', 'Nội dung bị báo cáo', 'Hành động'].map(h => (
                          <th key={h} className='px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className='divide-y divide-gray-50 dark:divide-slate-700'>
                      {deletedSportEvents.length === 0 ? (
                        <tr>
                          <td colSpan={5} className='text-center py-16'>
                            <MdDeleteSweep className='mx-auto text-4xl text-gray-300 mb-3' />
                            <p className='text-gray-400 text-sm'>Không có sự kiện nào đã gỡ</p>
                          </td>
                        </tr>
                      ) : (
                        deletedSportEvents.map((ev) => <DeletedSportEventItem key={ev._id} event={ev} />)
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {renderPagination(deletedEventsPage, deletedEventsTotalPage, setDeletedEventsPage)}
            </>
          )}
        </>
      )}

      {/* ── Thử thách bị báo cáo ── */}
      {mode === 'challenges' && challengeTab === 'reported' && (
        <>
          <div className='bg-white dark:bg-slate-800 rounded-xl shadow-sm p-4 mb-2 border border-gray-100 dark:border-slate-700'>
            <div className='relative flex-1'>
              <FaSearch className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm' />
              <input
                autoComplete='off'
                type='search'
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder='Tìm thử thách bị báo cáo...'
                className='min-h-10 w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm outline-none transition-all focus:ring-2 focus:ring-rose-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white'
              />
            </div>
          </div>

          {isLoadingChallenges ? (
            <Loading />
          ) : (
            <>
              <div className='bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden border border-gray-100 dark:border-slate-700'>
                <div className='overflow-x-auto'>
                  <table className='w-full divide-y divide-gray-100 dark:divide-slate-700'>
                    <thead className='bg-gray-50 dark:bg-slate-900'>
                      <tr>
                        {['Người tạo thử thách', 'Thử thách'].map(h => (
                          <th key={h} className='px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                            {h}
                          </th>
                        ))}
                        <th className='px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                          Số báo cáo
                        </th>
                        <th className='px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                          Người báo cáo
                        </th>
                        <th className='px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                          Nội dung báo cáo
                        </th>
                        <th className='px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                          Hành động
                        </th>
                      </tr>
                    </thead>
                    <tbody className='divide-y divide-gray-50 dark:divide-slate-700'>
                      {reportedChallenges.length === 0 ? (
                        <tr>
                          <td colSpan={6} className='text-center py-16'>
                            <FaTrophy className='mx-auto text-4xl text-gray-300 mb-3' />
                            <p className='text-gray-400 text-sm'>Không có thử thách nào bị báo cáo</p>
                          </td>
                        </tr>
                      ) : (
                        reportedChallenges.map((c) => <ChallengeReportItem key={c._id} challenge={c} />)
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {renderPagination(challengesPage, challengesTotalPage, setChallengesPage)}
            </>
          )}
        </>
      )}

      {/* ── Thử thách đã xóa ── */}
      {mode === 'challenges' && challengeTab === 'deleted' && (
        <>
          <div className='bg-white dark:bg-slate-800 rounded-xl shadow-sm p-4 mb-2 border border-gray-100 dark:border-slate-700'>
            <div className='relative flex-1'>
              <FaSearch className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm' />
              <input
                autoComplete='off'
                type='search'
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder='Tìm thử thách đã gỡ...'
                className='min-h-10 w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm outline-none transition-all focus:ring-2 focus:ring-rose-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white'
              />
            </div>
          </div>

          {isLoadingDeletedChallenges ? (
            <Loading />
          ) : (
            <>
              <div className='bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden border border-gray-100 dark:border-slate-700'>
                <div className='overflow-x-auto'>
                  <table className='w-full divide-y divide-gray-100 dark:divide-slate-700'>
                    <thead className='bg-gray-50 dark:bg-slate-900'>
                      <tr>
                        {['Người tạo thử thách', 'Thử thách', 'Thời điểm xóa', 'Nội dung bị báo cáo', 'Hành động'].map(h => (
                          <th key={h} className='px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className='divide-y divide-gray-50 dark:divide-slate-700'>
                      {deletedChallengesList.length === 0 ? (
                        <tr>
                          <td colSpan={5} className='text-center py-16'>
                            <MdDeleteSweep className='mx-auto text-4xl text-gray-300 mb-3' />
                            <p className='text-gray-400 text-sm'>Không có thử thách nào đã gỡ</p>
                          </td>
                        </tr>
                      ) : (
                        deletedChallengesList.map((c) => <DeletedChallengeItem key={c._id} challenge={c} />)
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {renderPagination(deletedChallengesPage, deletedChallengesTotalPage, setDeletedChallengesPage)}
            </>
          )}
        </>
      )}

      {/* ── Bài viết đã xóa ── */}
      {mode === 'posts' && postTab === 'deleted' && (
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
                className='min-h-10 w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm outline-none transition-all focus:ring-2 focus:ring-rose-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white'
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
