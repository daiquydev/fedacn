import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FaSearch, FaUserFriends, FaUserMinus, FaUserPlus, FaUser } from 'react-icons/fa'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { currentAccount, followUser, recommendUser, unfollowUser } from '../../apis/userApi'
import defaultAvatar from '../../assets/images/useravatar.jpg'

const EmptyState = ({ message }) => (
  <div className='py-8 text-center text-gray-500 dark:text-gray-400 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl'>
    {message}
  </div>
)

const StatTile = ({ label, value, description }) => (
  <div className='bg-white dark:bg-gray-800 shadow rounded-xl p-4 flex flex-col gap-1'>
    <p className='text-sm uppercase tracking-wide text-gray-500 dark:text-gray-400'>{label}</p>
    <p className='text-3xl font-semibold text-gray-900 dark:text-white'>{value}</p>
    <p className='text-sm text-gray-500 dark:text-gray-400'>{description}</p>
  </div>
)

const ActionButton = ({ label, variant = 'primary', onClick, disabled, icon: Icon }) => (
  <button
    type='button'
    onClick={onClick}
    disabled={disabled}
    className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
      disabled
        ? 'bg-gray-200 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400'
        : variant === 'danger'
        ? 'bg-red-500 text-white hover:bg-red-600'
        : 'bg-emerald-600 text-white hover:bg-emerald-700'
    }`}
  >
    {Icon && <Icon />}
    {label}
  </button>
)

const PeopleSection = ({
  title,
  subtitle,
  filterValue,
  onFilterChange,
  people,
  renderAction,
  badgeBuilder,
  emptyMessage,
  loadingAction
}) => {
  const navigate = useNavigate()
  const filtered = useMemo(() => {
    if (!filterValue.trim()) return people
    const keyword = filterValue.toLowerCase().trim()
    return people.filter((person) => {
      const name = person.name || ''
      const email = person.email || ''
      return name.toLowerCase().includes(keyword) || email.toLowerCase().includes(keyword)
    })
  }, [filterValue, people])

  return (
    <section className='bg-white dark:bg-gray-800 shadow rounded-2xl p-5 flex flex-col gap-4'>
      <div>
        <h2 className='text-xl font-semibold text-gray-900 dark:text-white'>{title}</h2>
        <p className='text-sm text-gray-500 dark:text-gray-400'>{subtitle}</p>
      </div>
      <div className='relative'>
        <FaSearch className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400' />
        <input
          type='text'
          value={filterValue}
          onChange={(event) => onFilterChange(event.target.value)}
          placeholder='Tìm theo tên hoặc email'
          className='w-full pl-10 pr-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-400'
        />
      </div>
      {!filtered.length ? (
        <EmptyState message={emptyMessage} />
      ) : (
        <ul className='space-y-3'>
          {filtered.map((person) => (
            <li
              key={person._id}
              className='flex items-center justify-between gap-3 border border-gray-100 dark:border-gray-700 rounded-xl p-3'
            >
              <div
                className='flex items-center gap-3 cursor-pointer'
                role='button'
                tabIndex={0}
                onClick={() => navigate(`/user/${person._id}`)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') navigate(`/user/${person._id}`)
                }}
                aria-label={`Xem hồ sơ của ${person.name || 'người dùng'}`}
              >
                <img
                  src={person.avatar || defaultAvatar}
                  alt={person.name}
                  className='w-12 h-12 rounded-full object-cover border border-gray-100 dark:border-gray-700'
                />
                <div>
                  <p className='font-medium text-gray-900 dark:text-white'>{person.name || 'User Ẩn danh'}</p>
                  <p className='text-sm text-gray-500 dark:text-gray-400'>{person.email || 'Chưa có email'}</p>
                  {badgeBuilder(person) && (
                    <span className='inline-block mt-1 text-xs px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'>
                      {badgeBuilder(person)}
                    </span>
                  )}
                </div>
              </div>
              <div className='flex items-center gap-2'>
                <button
                  type='button'
                  onClick={() => navigate(`/user/${person._id}`)}
                  className='inline-flex items-center justify-center w-10 h-10 rounded-full border border-gray-200 dark:border-gray-600 text-gray-600 hover:bg-emerald-50 dark:text-gray-200 dark:hover:bg-gray-700'
                >
                  <FaUser />
                </button>
                {renderAction(person, loadingAction)}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default function FriendManagement() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [followerFilter, setFollowerFilter] = useState('')
  const [followingFilter, setFollowingFilter] = useState('')
  const [exploreFilter, setExploreFilter] = useState('')

  const {
    data: meData,
    isLoading: loadingMe,
    isError
  } = useQuery({
    queryKey: ['me'],
    queryFn: currentAccount,
    staleTime: 1000 * 60 * 5
  })

  const me = meData?.data?.result?.[0]
  const followers = useMemo(() => me?.followers || [], [me])
  const followings = useMemo(() => me?.followings || [], [me])

  const followerIds = useMemo(() => new Set(followers.map((person) => person._id)), [followers])
  const followingIds = useMemo(() => new Set(followings.map((person) => person._id)), [followings])
  const mutualCount = useMemo(
    () => followers.filter((follower) => followingIds.has(follower._id)).length,
    [followers, followingIds]
  )

  const followMutation = useMutation({
    mutationFn: followUser,
    onSuccess: () => {
      toast.success('Đã theo dõi người dùng')
      queryClient.invalidateQueries({ queryKey: ['me'] })
    }
  })

  const unfollowMutation = useMutation({
    mutationFn: unfollowUser,
    onSuccess: () => {
      toast.success('Đã hủy theo dõi')
      queryClient.invalidateQueries({ queryKey: ['me'] })
    }
  })

  const handleFollow = (userId) => {
    followMutation.mutate({ follow_id: userId })
  }

  const handleUnfollow = (userId) => {
    unfollowMutation.mutate({ follow_id: userId })
  }

  const { data: recommendedData, isLoading: loadingRecommendations } = useQuery({
    queryKey: ['friend-recommendations'],
    queryFn: recommendUser,
    staleTime: 1000 * 60 * 5
  })

  const recommendedPeople = useMemo(() => recommendedData?.data?.result || [], [recommendedData])
  const filteredRecommendations = useMemo(() => {
    if (!exploreFilter.trim()) return recommendedPeople
    const keyword = exploreFilter.trim().toLowerCase()
    return recommendedPeople.filter((person) => {
      const name = person.name || ''
      const username = person.user_name || ''
      return name.toLowerCase().includes(keyword) || username.toLowerCase().includes(keyword)
    })
  }, [exploreFilter, recommendedPeople])

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
        Không thể tải thông tin bạn bè. Vui lòng thử lại sau.
      </div>
    )
  }

  const actionDisabled = followMutation.isLoading || unfollowMutation.isLoading

  return (
    <div className='min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 md:px-8 space-y-8'>
      <header className='space-y-2'>
        <p className='text-sm uppercase tracking-[0.3em] text-emerald-600 dark:text-emerald-400'>Friend Center</p>
        <h1 className='text-3xl md:text-4xl font-bold text-gray-900 dark:text-white'>Quản lý kết nối của bạn</h1>
        <p className='text-gray-600 dark:text-gray-300 max-w-2xl'>
          Bạn có thể xem nhanh những ai đang theo dõi mình và danh sách người bạn
          đã theo dõi.
        </p>
      </header>

      <section className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <StatTile label='Bạn bè song phương' value={mutualCount} description='Đang theo dõi lẫn nhau' />
        <StatTile label='Đang theo dõi' value={followings.length} description='Tổng số người bạn đang theo dõi' />
        <StatTile label='Người theo dõi bạn' value={followers.length} description='Cộng đồng đang theo dõi bạn' />
      </section>

      <section className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <PeopleSection
          title='Đang theo dõi'
          subtitle='Danh sách những người bạn đã theo dõi'
          filterValue={followingFilter}
          onFilterChange={setFollowingFilter}
          people={followings}
          emptyMessage='Bạn chưa theo dõi người dùng nào.'
          loadingAction={actionDisabled}
          badgeBuilder={(person) => (followerIds.has(person._id) ? 'Theo dõi lại bạn' : '')}
          renderAction={(person) => (
            <ActionButton
              label='Bỏ theo dõi'
              variant='danger'
              disabled={actionDisabled}
              icon={FaUserMinus}
              onClick={() => handleUnfollow(person._id)}
            />
          )}
        />

        <PeopleSection
          title='Người theo dõi bạn'
          subtitle='Danh sách những người đang theo dõi bạn'
          filterValue={followerFilter}
          onFilterChange={setFollowerFilter}
          people={followers}
          emptyMessage='Chưa có người theo dõi nào.'
          loadingAction={actionDisabled}
          badgeBuilder={(person) => (followingIds.has(person._id) ? 'Theo dõi lẫn nhau' : 'Chỉ theo dõi bạn')}
          renderAction={(person) => (
            <ActionButton
              label={followingIds.has(person._id) ? 'Bỏ theo dõi' : 'Theo dõi lại'}
              variant={followingIds.has(person._id) ? 'danger' : 'primary'}
              disabled={actionDisabled}
              icon={followingIds.has(person._id) ? FaUserMinus : FaUserPlus}
              onClick={() => (followingIds.has(person._id) ? handleUnfollow(person._id) : handleFollow(person._id))}
            />
          )}
        />
      </section>

      <section className='bg-white dark:bg-gray-800 rounded-2xl shadow p-5 space-y-4'>
        <div className='flex items-center justify-between flex-wrap gap-3'>
          <div>
            <h2 className='text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2'>
              <FaUserFriends className='text-emerald-500' />
              Khám phá bạn bè
            </h2>
            <p className='text-sm text-gray-500 dark:text-gray-400'>Những gợi ý dựa trên cộng đồng bạn bè của bạn.</p>
          </div>
          <div className='relative w-full md:w-72'>
            <FaSearch className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400' />
            <input
              type='text'
              value={exploreFilter}
              onChange={(event) => setExploreFilter(event.target.value)}
              placeholder='Tìm kiếm gợi ý'
              className='w-full pl-10 pr-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-400'
            />
          </div>
        </div>

        {loadingRecommendations ? (
          <div className='py-10 text-center text-gray-500 dark:text-gray-400'>Đang tải gợi ý kết nối...</div>
        ) : !filteredRecommendations.length ? (
          <EmptyState message='Hiện chưa có gợi ý mới. Hãy mở rộng mạng lưới bằng cách theo dõi thêm bạn bè.' />
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
            {filteredRecommendations.map((person) => (
              <div
                key={person._id}
                className='border border-gray-100 dark:border-gray-700 rounded-2xl p-4 flex flex-col gap-3 hover:border-emerald-300 dark:hover:border-emerald-600 transition-colors cursor-pointer'
                role='button'
                tabIndex={0}
                onClick={() => navigate(`/user/${person._id}`)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') navigate(`/user/${person._id}`)
                }}
                aria-label={`Xem hồ sơ đề xuất của ${person.name}`}
              >
                <div className='flex items-center gap-3'>
                  <img
                    src={person.avatar || defaultAvatar}
                    alt={person.name}
                    className='w-12 h-12 rounded-full object-cover border border-gray-100 dark:border-gray-700'
                  />
                  <div className='min-w-0'>
                    <p className='font-semibold text-gray-900 dark:text-white truncate'>{person.name}</p>
                    <p className='text-sm text-gray-500 dark:text-gray-400 truncate'>@{person.user_name}</p>
                  </div>
                  <button
                    type='button'
                    onClick={(event) => {
                      event.stopPropagation()
                      navigate(`/user/${person._id}`)
                    }}
                    className='ml-auto inline-flex items-center justify-center w-9 h-9 rounded-full border border-gray-200 dark:border-gray-600 text-gray-600 hover:bg-emerald-50 dark:text-gray-200 dark:hover:bg-gray-700'
                    title='Xem hồ sơ'
                  >
                    <FaUser />
                  </button>
                </div>
                <p className='text-sm text-gray-600 dark:text-gray-300 line-clamp-2'>
                  {person.bio || 'Kết nối để chia sẻ hành trình dinh dưỡng và luyện tập cùng nhau.'}
                </p>
                <ActionButton
                  label='Theo dõi'
                  onClick={(event) => {
                    event.stopPropagation()
                    handleFollow(person._id)
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
  )
}
