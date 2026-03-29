import { useSafeMutation } from '../../hooks/useSafeMutation'
import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { FaSearch, FaUserFriends, FaUserMinus, FaUserPlus, FaUser, FaHeart } from 'react-icons/fa'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { currentAccount, followUser, recommendUser, unfollowUser } from '../../apis/userApi'
import defaultAvatar from '../../assets/images/useravatar.jpg'
import { getImageUrl } from '../../utils/imageUrl'

// ─── Sub-components ────────────────────────────────────────────────────────────

const EmptyState = ({ message }) => (
  <div className='py-8 text-center text-gray-500 dark:text-gray-400 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl'>
    {message}
  </div>
)

const StatTile = ({ label, value, description, accent = 'emerald' }) => {
  const colors = {
    emerald: 'text-emerald-600 dark:text-emerald-400',
    blue: 'text-blue-600 dark:text-blue-400',
    rose: 'text-rose-600 dark:text-rose-400',
    amber: 'text-amber-600 dark:text-amber-400',
    violet: 'text-violet-600 dark:text-violet-400'
  }
  return (
    <div className='bg-white dark:bg-gray-800 shadow rounded-xl p-3 flex flex-col gap-0.5'>
      <p className='text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400'>{label}</p>
      <p className={`text-2xl font-bold ${colors[accent]}`}>{value}</p>
      <p className='text-[10px] text-gray-500 dark:text-gray-400'>{description}</p>
    </div>
  )
}

const ActionButton = ({ label, variant = 'primary', onClick, disabled, icon: Icon }) => (
  <button
    type='button'
    onClick={onClick}
    disabled={disabled}
    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${disabled
      ? 'bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-700'
      : variant === 'danger'
        ? 'bg-red-500 text-white hover:bg-red-600 active:scale-95'
        : variant === 'secondary'
          ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 active:scale-95'
          : 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95'
      }`}
  >
    {Icon && <Icon size={12} />}
    {label}
  </button>
)

// Generic card row used in sections
const PersonRow = ({ person, badge, actions, navigate }) => (
  <li className='flex items-center justify-between gap-2 border border-gray-100 dark:border-gray-700 rounded-lg p-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors'>
    <div
      className='flex items-center gap-3 cursor-pointer min-w-0 flex-1'
      role='button'
      tabIndex={0}
      onClick={() => navigate(`/user/${person._id}`)}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/user/${person._id}`)}
      aria-label={`Xem hồ sơ của ${person.name || 'người dùng'}`}
    >
      <img
        src={person.avatar ? getImageUrl(person.avatar) : defaultAvatar}
        alt={person.name}
        className='w-9 h-9 flex-shrink-0 rounded-full object-cover border border-gray-200 dark:border-gray-600 hover:ring-2 hover:ring-emerald-400 transition-all'
      />
      <div className='min-w-0'>
        <p className='font-medium text-gray-900 dark:text-white truncate hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors text-sm'>
          {person.name || 'User Ẩn danh'}
        </p>
        <p className='text-xs text-gray-500 dark:text-gray-400 truncate'>{person.email || 'Chưa có email'}</p>
        {badge && (
          <span className='inline-block mt-0.5 text-xs px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'>
            {badge}
          </span>
        )}
      </div>
    </div>
    <div className='flex items-center gap-1.5 flex-shrink-0'>
      <button
        type='button'
        onClick={() => navigate(`/user/${person._id}`)}
        className='inline-flex items-center justify-center w-8 h-8 rounded-full border border-gray-200 dark:border-gray-600 text-gray-500 hover:bg-emerald-50 dark:text-gray-300 dark:hover:bg-gray-700'
        title='Xem trang cá nhân'
      >
        <FaUser size={12} />
      </button>
      {actions}
    </div>
  </li>
)

// Section with search box + list
const PeopleSection = ({ title, subtitle, people, badge, renderActions, emptyMessage, disabled }) => {
  const navigate = useNavigate()
  const [filter, setFilter] = useState('')

  const filtered = useMemo(() => {
    if (!filter.trim()) return people
    const kw = filter.toLowerCase().trim()
    return people.filter((p) => {
      const name = (p.name || '').toLowerCase()
      const email = (p.email || '').toLowerCase()
      return name.includes(kw) || email.includes(kw)
    })
  }, [filter, people])

  return (
    <section className='bg-white dark:bg-gray-800 shadow rounded-2xl p-4 flex flex-col gap-3'>
      <div>
        <h2 className='text-base font-semibold text-gray-900 dark:text-white'>
          {title}{' '}
          <span className='ml-1 text-xs font-normal bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full'>
            {people.length}
          </span>
        </h2>
        <p className='text-xs text-gray-500 dark:text-gray-400 mt-0.5'>{subtitle}</p>
      </div>
      <div className='relative'>
        <FaSearch className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400' size={12} />
        <input
          type='text'
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder='Tìm theo tên hoặc email'
          className='w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-400 outline-none'
        />
      </div>
      {!filtered.length ? (
        <EmptyState message={emptyMessage} />
      ) : (
        <ul className='space-y-1.5 max-h-[280px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent'>
          {filtered.map((person) => (
            <PersonRow
              key={person._id}
              person={person}
              badge={typeof badge === 'function' ? badge(person) : badge}
              actions={renderActions(person)}
              navigate={navigate}
              disabled={disabled}
            />
          ))}
        </ul>
      )}
    </section>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────────

export default function FriendManagement() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  // Track IDs locally: declined requests or unfriended people (so they don't re-appear in "Lời mời")
  // This is per-session state — does NOT affect the follow data in DB.
  const [hiddenFromRequests, setHiddenFromRequests] = useState(new Set())

  const {
    data: meData,
    isLoading: loadingMe,
    isError
  } = useQuery({
    queryKey: ['me'],
    queryFn: currentAccount
  })

  const me = meData?.data?.result?.[0]

  // followers: people who follow ME
  const followers = useMemo(() => me?.followers || [], [me])
  // followings: people I follow
  const followings = useMemo(() => me?.followings || [], [me])

  const followerIds = useMemo(() => new Set(followers.map((p) => String(p._id))), [followers])
  const followingIds = useMemo(() => new Set(followings.map((p) => String(p._id))), [followings])

  // ── Friend-request categories ──────────────────────────────────────────────

  // Bạn bè = người follow mình VÀ mình follow lại (mutual)
  const friends = useMemo(
    () => followers.filter((p) => followingIds.has(String(p._id))),
    [followers, followingIds]
  )

  // Lời mời kết bạn = người follow mình, mình CHƯA follow lại, chưa bị từ chối/hủy
  const incomingRequests = useMemo(
    () =>
      followers.filter(
        (p) => !followingIds.has(String(p._id)) && !hiddenFromRequests.has(String(p._id))
      ),
    [followers, followingIds, hiddenFromRequests]
  )

  // Người theo dõi bạn = TẤT CẢ người follow mình (bao gồm bạn bè, đã từ chối, v.v.)
  // Đây là "field theo dõi" - khác với "field bạn bè"
  const allFollowers = useMemo(() => followers, [followers])

  // Đã gửi lời mời = mình follow họ, họ chưa follow lại
  const sentRequests = useMemo(
    () => followings.filter((p) => !followerIds.has(String(p._id))),
    [followings, followerIds]
  )

  // ── Mutations ──────────────────────────────────────────────────────────────

  const followMutation = useSafeMutation({
    mutationFn: followUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] })
      queryClient.invalidateQueries({ queryKey: ['friend-recommendations'] })
    },
    onError: () => toast.error('Có lỗi xảy ra, vui lòng thử lại')
  })

  const unfollowMutation = useSafeMutation({
    mutationFn: unfollowUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] })
      queryClient.invalidateQueries({ queryKey: ['friend-recommendations'] })
    },
    onError: () => toast.error('Có lỗi xảy ra, vui lòng thử lại')
  })

  // Chấp nhận lời mời = follow lại họ
  const handleAccept = (userId) => {
    followMutation.mutate(
      { follow_id: userId },
      { onSuccess: () => toast.success('Đã chấp nhận lời mời kết bạn') }
    )
  }

  // Từ chối lời mời = KHÔNG gọi API (họ vẫn follow mình, chỉ ẩn khỏi "Lời mời kết bạn")
  // Họ sẽ vẫn xuất hiện trong "Người theo dõi bạn"
  const handleDecline = (userId) => {
    setHiddenFromRequests((prev) => new Set([...prev, String(userId)]))
    toast('Đã từ chối lời mời kết bạn', { icon: '🚫' })
  }

  // Hủy kết bạn = bỏ follow họ (họ vẫn follow mình) + ẩn khỏi "Lời mời kết bạn"
  const handleUnfriend = (userId) => {
    unfollowMutation.mutate(
      { follow_id: userId },
      {
        onSuccess: () => {
          // Ẩn họ khỏi "Lời mời kết bạn" - họ vẫn xuất hiện trong "Người theo dõi"
          setHiddenFromRequests((prev) => new Set([...prev, String(userId)]))
          toast.success('Đã hủy kết bạn')
        }
      }
    )
  }

  // Hủy lời mời đã gửi = bỏ follow họ
  const handleCancelRequest = (userId) => {
    unfollowMutation.mutate(
      { follow_id: userId },
      { onSuccess: () => toast.success('Đã hủy lời mời kết bạn') }
    )
  }

  // Gửi lời mời kết bạn = follow họ
  const handleSendRequest = (userId) => {
    followMutation.mutate(
      { follow_id: userId },
      { onSuccess: () => toast.success('Đã gửi lời mời kết bạn') }
    )
  }

  // ── Recommendations ────────────────────────────────────────────────────────

  const { data: recommendedData, isLoading: loadingRecommendations } = useQuery({
    queryKey: ['friend-recommendations'],
    queryFn: recommendUser
  })

  const [exploreFilter, setExploreFilter] = useState('')

  const recommendedPeople = useMemo(() => {
    const all = recommendedData?.data?.result || []
    // Loại những ai đã là bạn bè, đã gửi/nhận lời mời
    const filtered = all.filter(
      (p) => !followerIds.has(String(p._id)) && !followingIds.has(String(p._id))
    )
    if (!exploreFilter.trim()) return filtered
    const kw = exploreFilter.trim().toLowerCase()
    return filtered.filter((p) => {
      const name = (p.name || '').toLowerCase()
      const username = (p.user_name || '').toLowerCase()
      return name.includes(kw) || username.includes(kw)
    })
  }, [recommendedData, followerIds, followingIds, exploreFilter])

  // ── Loading/Error states ───────────────────────────────────────────────────

  if (loadingMe) {
    return (
      <div className='min-h-screen flex items-center justify-center text-gray-500 dark:text-gray-300'>
        Đang tải dữ liệu bạn bè...
      </div>
    )
  }

  if (isError || !me) {
    return (
      <div className='min-h-screen flex items-center justify-center text-red-500'>
        Không thể tải thông tin. Vui lòng thử lại sau.
      </div>
    )
  }

  const actionDisabled = followMutation.isPending || unfollowMutation.isPending

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Page Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-4">
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center flex-shrink-0">
            <FaUserFriends className="text-white text-xl" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Bạn bè</h1>
            <p className="text-white/75 text-xs mt-0.5">Gửi lời mời kết bạn, chấp nhận lời mời và khám phá những người bạn mới.</p>
          </div>
        </div>
      </div>

      <div className="py-4 px-6 space-y-4">

        {/* Thống kê */}
        <section className='grid grid-cols-2 md:grid-cols-5 gap-3'>
          <StatTile accent='emerald' label='Bạn bè' value={friends.length} description='Đang kết nối' />
          <StatTile accent='rose' label='Lời mời đến' value={incomingRequests.length} description='Chờ chấp nhận' />
          <StatTile accent='blue' label='Đã gửi' value={sentRequests.length} description='Chờ xác nhận' />
          <StatTile accent='violet' label='Đang theo dõi' value={followings.length} description='Bạn đang follow' />
          <StatTile accent='amber' label='Người theo dõi' value={allFollowers.length} description='Đang follow bạn' />
        </section>

        {/* Hàng 1: Bạn bè + Lời mời kết bạn */}
        <section className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
          {/* Bạn bè (mutual follow) */}
          <PeopleSection
            title='Bạn bè'
            subtitle='Đang theo dõi lẫn nhau — field bạn bè'
            people={friends}
            badge='Bạn bè'
            emptyMessage='Bạn chưa có người bạn nào. Hãy chấp nhận lời mời!'
            disabled={actionDisabled}
            renderActions={(person) => (
              <ActionButton
                label='Hủy kết bạn'
                variant='danger'
                disabled={actionDisabled}
                icon={FaUserMinus}
                onClick={() => handleUnfriend(person._id)}
              />
            )}
          />

          {/* Lời mời kết bạn đến (họ follow mình, chưa từ chối/hủy) */}
          <PeopleSection
            title='Lời mời kết bạn'
            subtitle='Người gửi lời mời, chưa được xử lý'
            people={incomingRequests}
            badge='Chờ chấp nhận'
            emptyMessage='Không có lời mời kết bạn mới.'
            disabled={actionDisabled}
            renderActions={(person) => (
              <>
                <ActionButton
                  label='Chấp nhận'
                  variant='primary'
                  disabled={actionDisabled}
                  icon={FaUserPlus}
                  onClick={() => handleAccept(person._id)}
                />
                {/* Từ chối: chỉ ẩn khỏi section này, họ vẫn follow bạn */}
                <ActionButton
                  label='Từ chối'
                  variant='secondary'
                  disabled={actionDisabled}
                  icon={FaUserMinus}
                  onClick={() => handleDecline(person._id)}
                />
              </>
            )}
          />
        </section>

        {/* Hàng 2: Người bạn theo dõi + Người theo dõi bạn */}
        <section className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
          {/* Người bạn theo dõi (tất cả người mình đang follow) */}
          <PeopleSection
            title='Người bạn theo dõi'
            subtitle='Tất cả người bạn đang follow'
            people={followings}
            badge={(person) => {
              if (followerIds.has(String(person._id))) return 'Bạn bè'
              return 'Đang chờ xác nhận'
            }}
            emptyMessage='Bạn chưa theo dõi ai.'
            disabled={actionDisabled}
            renderActions={(person) => {
              const isFriend = followerIds.has(String(person._id))
              return isFriend ? (
                <ActionButton
                  label='Hủy kết bạn'
                  variant='danger'
                  disabled={actionDisabled}
                  icon={FaUserMinus}
                  onClick={() => handleUnfriend(person._id)}
                />
              ) : (
                <ActionButton
                  label='Hủy lời mời'
                  variant='danger'
                  disabled={actionDisabled}
                  icon={FaUserMinus}
                  onClick={() => handleCancelRequest(person._id)}
                />
              )
            }}
          />

          {/* Người theo dõi bạn — tất cả người follow mình */}
          <PeopleSection
            title='Người theo dõi bạn'
            subtitle='Tất cả người đang follow bạn'
            people={allFollowers}
            badge={(person) => {
              if (followingIds.has(String(person._id))) return 'Bạn bè'
              return 'Đang theo dõi bạn'
            }}
            emptyMessage='Chưa có người theo dõi nào.'
            disabled={actionDisabled}
            renderActions={(person) => {
              const isFriend = followingIds.has(String(person._id))
              return isFriend ? (
                <ActionButton
                  label='Bạn bè'
                  variant='secondary'
                  disabled
                  icon={FaHeart}
                />
              ) : (
                <ActionButton
                  label='Kết bạn'
                  variant='primary'
                  disabled={actionDisabled}
                  icon={FaUserPlus}
                  onClick={() => handleAccept(person._id)}
                />
              )
            }}
          />
        </section>

        {/* Khám phá bạn bè */}
        <section className='bg-white dark:bg-gray-800 rounded-2xl shadow p-5 space-y-4'>
          <div className='flex items-center justify-between flex-wrap gap-3'>
            <div>
              <h2 className='text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2'>
                <FaUserFriends className='text-emerald-500' />
                Khám phá bạn bè
              </h2>
              <p className='text-xs text-gray-500 dark:text-gray-400'>Gợi ý người dùng bạn có thể quen.</p>
            </div>
            <div className='relative w-full md:w-64'>
              <FaSearch className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400' size={12} />
              <input
                type='text'
                value={exploreFilter}
                onChange={(e) => setExploreFilter(e.target.value)}
                placeholder='Tìm kiếm người dùng'
                className='w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-400 outline-none'
              />
            </div>
          </div>

          {loadingRecommendations ? (
            <div className='py-10 text-center text-gray-500 dark:text-gray-400 text-sm'>Đang tải gợi ý...</div>
          ) : !recommendedPeople.length ? (
            <EmptyState message='Hiện chưa có gợi ý mới. Hãy mở rộng mạng lưới bằng cách kết bạn thêm.' />
          ) : (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
              {recommendedPeople.map((person) => (
                <div
                  key={person._id}
                  className='border border-gray-100 dark:border-gray-700 rounded-2xl p-4 flex flex-col gap-3 hover:border-emerald-300 dark:hover:border-emerald-600 transition-colors'
                >
                  <div
                    className='flex items-center gap-3 cursor-pointer'
                    role='button'
                    tabIndex={0}
                    onClick={() => navigate(`/user/${person._id}`)}
                    onKeyDown={(e) => e.key === 'Enter' && navigate(`/user/${person._id}`)}
                    aria-label={`Xem hồ sơ của ${person.name}`}
                  >
                    <img
                      src={person.avatar ? getImageUrl(person.avatar) : defaultAvatar}
                      alt={person.name}
                      className='w-11 h-11 rounded-full object-cover border border-gray-200 dark:border-gray-600 hover:ring-2 hover:ring-emerald-400 transition-all flex-shrink-0'
                    />
                    <div className='min-w-0 flex-1'>
                      <p className='font-semibold text-sm text-gray-900 dark:text-white truncate hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors'>
                        {person.name}
                      </p>
                      <p className='text-xs text-gray-500 dark:text-gray-400 truncate'>@{person.user_name}</p>
                    </div>
                    <button
                      type='button'
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/user/${person._id}`)
                      }}
                      className='ml-auto inline-flex items-center justify-center w-8 h-8 rounded-full border border-gray-200 dark:border-gray-600 text-gray-500 hover:bg-emerald-50 dark:text-gray-300 dark:hover:bg-gray-700 flex-shrink-0'
                      title='Xem trang cá nhân'
                    >
                      <FaUser size={12} />
                    </button>
                  </div>
                  <p className='text-xs text-gray-600 dark:text-gray-300 line-clamp-2'>
                    {person.bio || 'Kết nối để chia sẻ hành trình dinh dưỡng và luyện tập cùng nhau.'}
                  </p>
                  <ActionButton
                    label='Kết bạn'
                    onClick={(e) => {
                      e.stopPropagation()
                      handleSendRequest(person._id)
                    }}
                    disabled={actionDisabled}
                    icon={FaUserPlus}
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
