import { useSafeMutation } from '../../../../hooks/useSafeMutation'
import { AnimatePresence, motion } from 'framer-motion'
import { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { IoMdNotifications } from 'react-icons/io'
import { AiOutlineDelete, AiOutlineCheckCircle, AiOutlineInbox } from 'react-icons/ai'
import { SocketContext } from '../../../../contexts/socket.context'
import { omit } from 'lodash'
import useQueryConfig from '../../../../hooks/useQueryConfig'
import {
  checkReadNotification,
  deleteNotification,
  getListNotifications,
  readAllNotifications,
  readNotification
} from '../../../../apis/notificationApi'
import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { cutString } from '../../../../utils/helper'
import { formatRelativeTimeVi } from '../../../../utils/formatRelativeTimeVi'
import useravatar from '../../../../assets/images/useravatar.jpg'
import { getAvatarSrc } from '../../../../utils/imageUrl'
import logo from '../../../../assets/images/logo.png'
import { queryClient } from '../../../../main'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import {
  NotificationTypes,
  NOTIFICATION_ROUTES,
  CATEGORIES,
  TAB_CONFIG,
  getNotificationConfig,
  getCategoryForType,
  isSystemNotification
} from './notificationConstants'

// ─── Styles ───
const styles = {
  panel: {
    width: '30rem',
    maxHeight: '75vh',
    borderRadius: '1rem',
    overflow: 'hidden',
    boxShadow: '0 20px 60px rgba(0,0,0,0.15), 0 1px 3px rgba(0,0,0,0.08)',
    border: '1px solid rgba(0,0,0,0.06)'
  },
  header: {
    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
    padding: '1.25rem 1.25rem 0.75rem',
    color: '#fff'
  },
  tabBar: {
    display: 'flex',
    gap: '0.25rem',
    padding: '0 1rem',
    background: '#fff',
    borderBottom: '1px solid #f1f5f9'
  },
  tab: (isActive) => ({
    flex: 1,
    padding: '0.65rem 0.5rem',
    fontSize: '0.75rem',
    fontWeight: isActive ? 600 : 500,
    color: isActive ? '#4f46e5' : '#64748b',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.35rem',
    position: 'relative',
    transition: 'color 0.2s'
  }),
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: '10%',
    right: '10%',
    height: '2.5px',
    background: 'linear-gradient(90deg, #4f46e5, #7c3aed)',
    borderRadius: '2px 2px 0 0'
  },
  listContainer: {
    maxHeight: 'calc(75vh - 10.5rem)',
    overflowY: 'auto',
    padding: '0.5rem',
    background: '#fafbfc'
  },
  itemCard: (isRead, borderColor) => ({
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.75rem',
    padding: '0.75rem',
    borderRadius: '0.75rem',
    background: isRead ? '#fff' : '#f0f4ff',
    border: isRead ? '1px solid #f1f5f9' : '1px solid #dbeafe',
    borderLeft: `3.5px solid ${isRead ? '#e2e8f0' : borderColor}`,
    cursor: 'pointer',
    position: 'relative',
    transition: 'all 0.2s ease',
    marginBottom: '0.375rem'
  }),
  iconBubble: (bgColor, color) => ({
    width: '2.5rem',
    height: '2.5rem',
    borderRadius: '0.75rem',
    background: bgColor,
    color: color,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    fontSize: '1.15rem'
  }),
  unreadDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#4f46e5',
    position: 'absolute',
    top: '0.75rem',
    right: '0.75rem',
    boxShadow: '0 0 0 2px #f0f4ff'
  },
  deleteBtn: {
    position: 'absolute',
    top: '0.5rem',
    right: '0.5rem',
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    padding: '0.25rem',
    borderRadius: '0.375rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.95rem',
    transition: 'all 0.2s'
  },
  loadMoreBtn: {
    width: '100%',
    padding: '0.65rem',
    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '0.625rem',
    fontSize: '0.8rem',
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: '0.25rem',
    transition: 'opacity 0.2s'
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2.5rem 1rem',
    color: '#94a3b8',
    gap: '0.75rem'
  },
  badge: (count) => ({
    display: count > 0 ? 'inline-flex' : 'none',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '1rem',
    height: '1rem',
    padding: '0 0.3rem',
    borderRadius: '9999px',
    background: '#ef4444',
    color: '#fff',
    fontSize: '0.6rem',
    fontWeight: 700,
    lineHeight: 1
  }),
  skeleton: {
    display: 'flex',
    gap: '0.75rem',
    padding: '0.75rem',
    marginBottom: '0.375rem'
  },
  skeletonCircle: {
    width: '2.5rem',
    height: '2.5rem',
    borderRadius: '0.75rem',
    background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite',
    flexShrink: 0
  },
  skeletonLine: (width) => ({
    height: '0.65rem',
    width,
    borderRadius: '0.25rem',
    background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite'
  })
}

// ─── Skeleton Component ───
function NotificationSkeleton() {
  return (
    <>
      {[1, 2, 3].map((i) => (
        <div key={i} style={styles.skeleton}>
          <div style={styles.skeletonCircle} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingTop: '0.25rem' }}>
            <div style={styles.skeletonLine('60%')} />
            <div style={styles.skeletonLine('90%')} />
            <div style={styles.skeletonLine('35%')} />
          </div>
        </div>
      ))}
    </>
  )
}

// ─── Empty State ───
function EmptyState({ tabLabel }) {
  return (
    <div style={styles.emptyState}>
      <AiOutlineInbox style={{ fontSize: '3rem', opacity: 0.4 }} />
      <p style={{ fontSize: '0.85rem', fontWeight: 500 }}>Không có thông báo nào</p>
      <p style={{ fontSize: '0.75rem', opacity: 0.7 }}>
        {tabLabel === 'Tất cả'
          ? 'Bạn đã xem hết thông báo rồi!'
          : `Chưa có thông báo ${tabLabel.toLowerCase()} nào`}
      </p>
    </div>
  )
}

// ─── Main Component ───
export default function NotificationPopUp() {
  const [isMenu, setIsMenu] = useState(false)
  const [activeTab, setActiveTab] = useState(CATEGORIES.all)
  const [invitePreview, setInvitePreview] = useState(null)
  const { notification, setNotification } = useContext(SocketContext)
  const ref = useRef()

  const handleClickOutside = (event) => {
    if (ref.current && !ref.current.contains(event.target)) {
      setIsMenu(false)
    }
  }

  const { data: dataCheck } = useQuery({
    queryKey: ['check-notification'],
    queryFn: () => checkReadNotification(),
    placeholderData: keepPreviousData
  })

  const unreadCount = dataCheck?.data?.result ?? 0

  useEffect(() => {
    setNotification(unreadCount > 0)
  }, [unreadCount, setNotification])

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const queryConfig = omit(useQueryConfig(), ['page', 'sort'])

  const fetchNotification = async ({ pageParam }) => {
    return await getListNotifications({ page: pageParam, ...queryConfig })
  }

  const { data, fetchNextPage, isFetchingNextPage, hasNextPage, isLoading } = useInfiniteQuery({
    queryKey: ['notification', queryConfig],
    queryFn: fetchNotification,
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const nextPage = lastPage.data.result.page + 1
      if (nextPage > lastPage.data.result.totalPage) return undefined
      return nextPage
    },
    enabled: isMenu
  })

  const readAllMutation = useSafeMutation({
    mutationFn: () => readAllNotifications()
  })

  const handleReadAll = () => {
    readAllMutation.mutate(null, {
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['notification'] }),
          queryClient.invalidateQueries({ queryKey: ['check-notification'] })
        ])
        toast.success('Đã đánh dấu tất cả đã đọc', { id: 'read-all-noti' })
      }
    })
  }

  // All notifications flattened
  const allNotifications = useMemo(() => {
    if (!data?.pages) return []
    return data.pages.flatMap((page) => page.data.result.notifications)
  }, [data])

  // Filtered by active tab
  const filteredNotifications = useMemo(() => {
    if (activeTab === CATEGORIES.all) return allNotifications
    return allNotifications.filter((n) => getCategoryForType(n.type) === activeTab)
  }, [allNotifications, activeTab])

  // Count unread per category (for tab badges)
  const unreadByCategory = useMemo(() => {
    const counts = { [CATEGORIES.all]: 0, [CATEGORIES.social]: 0, [CATEGORIES.system]: 0 }
    allNotifications.forEach((n) => {
      if (!n.is_read) {
        counts[CATEGORIES.all]++
        const cat = getCategoryForType(n.type)
        if (counts[cat] !== undefined) counts[cat]++
      }
    })
    return counts
  }, [allNotifications])

  const handleOpenInvite = (payload) => setInvitePreview(payload)
  const handleCloseInvite = () => setInvitePreview(null)

  const badgeText = unreadCount > 99 ? '99+' : unreadCount

  return (
    <div ref={ref}>
      {/* Shimmer animation keyframes */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .noti-item-hover:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        }
        .noti-delete-hover:hover {
          color: #ef4444 !important;
          background: #fef2f2 !important;
        }
        .noti-tab-hover:hover {
          color: #4f46e5 !important;
          background: #f8fafc;
        }
        .noti-loadmore-hover:hover {
          opacity: 0.9;
        }
        .noti-scroll::-webkit-scrollbar { width: 5px; }
        .noti-scroll::-webkit-scrollbar-track { background: transparent; }
        .noti-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
        .noti-scroll::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>

      {/* Bell Button */}
      <div
        onClick={() => setIsMenu(!isMenu)}
        className='dark:bg-slate-600 relative dark:hover:bg-slate-500 dark:border-none text-2xl hover:bg-yellow-200 transition-all duration-300 cursor-pointer border text-red-600 dark:text-white shadow-md font-normal h-8 w-8 md:h-10 md:w-10 flex items-center justify-center align-center rounded-full outline-none focus:outline-none mr-1'
      >
        <IoMdNotifications />
        {notification && unreadCount > 0 && (
          <div className='absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1 leading-none'>
            {badgeText}
          </div>
        )}
      </div>

      {/* Notification Panel */}
      <AnimatePresence>
        {isMenu && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98, transition: { duration: 0.15 } }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            style={styles.panel}
            className='z-50 absolute top-[4rem] right-1 bg-white dark:bg-gray-900'
          >
            {/* Header */}
            <div style={styles.header}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, letterSpacing: '-0.01em' }}>
                    Thông báo
                  </h3>
                  {unreadCount > 0 && (
                    <p style={{ fontSize: '0.72rem', opacity: 0.85, margin: '0.2rem 0 0' }}>
                      Bạn có {unreadCount} thông báo chưa đọc
                    </p>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  {unreadCount > 0 && (
                    <button
                      type='button'
                      onClick={handleReadAll}
                      disabled={readAllMutation.isPending}
                      style={{
                        background: 'rgba(255,255,255,0.18)',
                        border: '1px solid rgba(255,255,255,0.3)',
                        color: '#fff',
                        padding: '0.35rem 0.65rem',
                        borderRadius: '0.5rem',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        transition: 'background 0.2s',
                        opacity: readAllMutation.isPending ? 0.6 : 1
                      }}
                    >
                      <AiOutlineCheckCircle />
                      Đọc tất cả
                    </button>
                  )}
                  <button
                    type='button'
                    onClick={() => setIsMenu(false)}
                    style={{
                      background: 'rgba(255,255,255,0.15)',
                      border: 'none',
                      color: '#fff',
                      width: '1.75rem',
                      height: '1.75rem',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.1rem'
                    }}
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>

            {/* Filter Tabs */}
            <div style={styles.tabBar} className='dark:bg-gray-800 dark:border-gray-700'>
              {TAB_CONFIG.map((tab) => {
                const isActive = activeTab === tab.key
                const Icon = tab.icon
                return (
                  <button
                    key={tab.key}
                    type='button'
                    onClick={() => setActiveTab(tab.key)}
                    style={styles.tab(isActive)}
                    className='noti-tab-hover dark:text-gray-300'
                  >
                    <Icon style={{ fontSize: '0.9rem' }} />
                    {tab.label}
                    {unreadByCategory[tab.key] > 0 && (
                      <span style={styles.badge(unreadByCategory[tab.key])}>
                        {unreadByCategory[tab.key]}
                      </span>
                    )}
                    {isActive && (
                      <motion.div
                        layoutId='noti-tab-indicator'
                        style={styles.tabIndicator}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                  </button>
                )
              })}
            </div>

            {/* Notification List */}
            <div style={styles.listContainer} className='noti-scroll dark:bg-gray-900'>
              {isLoading ? (
                <NotificationSkeleton />
              ) : filteredNotifications.length === 0 ? (
                <EmptyState tabLabel={TAB_CONFIG.find((t) => t.key === activeTab)?.label || 'Tất cả'} />
              ) : (
                <>
                  <AnimatePresence mode='popLayout'>
                    {filteredNotifications.map((notification) => (
                      <NotificationItem
                        key={notification._id}
                        notification={notification}
                        onOpenInvite={handleOpenInvite}
                      />
                    ))}
                  </AnimatePresence>

                  {/* Load More */}
                  {activeTab === CATEGORIES.all && (
                    <button
                      type='button'
                      style={{
                        ...styles.loadMoreBtn,
                        opacity: !hasNextPage || isFetchingNextPage ? 0.6 : 1,
                        cursor: !hasNextPage ? 'default' : 'pointer'
                      }}
                      className='noti-loadmore-hover'
                      disabled={!hasNextPage || isFetchingNextPage}
                      onClick={() => fetchNextPage()}
                    >
                      {isFetchingNextPage
                        ? 'Đang tải...'
                        : hasNextPage
                          ? 'Xem thêm thông báo'
                          : 'Đã xem hết thông báo ✓'}
                    </button>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <InvitePreviewModal invite={invitePreview} onClose={handleCloseInvite} />
    </div>
  )
}

// ─── Notification Item ───
const NotificationItem = ({ notification, onOpenInvite }) => {
  const navigate = useNavigate()
  const config = getNotificationConfig(notification.type)
  const IconComponent = config.icon
  const isSystem = isSystemNotification(notification.type)

  const openInviteModal = () => {
    if (!notification.metadata?.meal_plan_id && !notification.link_id) return
    onOpenInvite?.({
      senderName: notification.sender?.name || 'Người dùng',
      avatar: notification.sender?.avatar,
      mealPlanId: notification.metadata?.meal_plan_id || notification.link_id,
      mealPlanTitle: notification.name_notification
    })
  }

  const checkNavigate = () => {
    if (notification.type === NotificationTypes.mealPlanInvite) {
      return openInviteModal()
    }

    const routeBuilder = NOTIFICATION_ROUTES[notification.type]
    if (!routeBuilder) return

    if (typeof routeBuilder === 'function') {
      const path = routeBuilder(notification)
      if (path) {
        navigate(path)
      } else {
        toast('Nội dung không còn tồn tại', { icon: 'ℹ️', id: 'noti-nav' })
      }
    }
  }

  const readMutation = useSafeMutation({
    mutationFn: () => readNotification(notification._id)
  })

  const deleteMutation = useSafeMutation({
    mutationFn: () => deleteNotification(notification._id)
  })

  const handleDelete = (e) => {
    e.stopPropagation()
    deleteMutation.mutate(null, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['notification'] })
        queryClient.invalidateQueries({ queryKey: ['check-notification'] })
        toast.success('Đã xóa thông báo', { id: 'delete-noti' })
      }
    })
  }

  const handleRead = () => {
    if (notification.is_read) {
      return checkNavigate()
    }
    readMutation.mutate(null, {
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['notification'] }),
          queryClient.invalidateQueries({ queryKey: ['check-notification'] })
        ])
        checkNavigate()
      }
    })
  }

  const hasNoSender = isSystem || !notification.sender_id || !notification.sender
  const senderName = hasNoSender ? 'FitConnect' : (notification.sender?.name || 'Người dùng')
  const avatarSrc = hasNoSender ? logo : getAvatarSrc(notification.sender?.avatar, useravatar)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -80, transition: { duration: 0.25 } }}
      onClick={handleRead}
      className='noti-item-hover'
      style={styles.itemCard(notification.is_read, config.borderColor)}
    >
      {/* Unread dot */}
      {!notification.is_read && <div style={styles.unreadDot} />}

      {/* Type Icon */}
      <div style={styles.iconBubble(config.bgColor, config.color)}>
        <IconComponent />
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0, paddingRight: '1.25rem' }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.15rem' }}>
          <img
            src={avatarSrc}
            alt=''
            onError={(e) => {
              e.currentTarget.onerror = null
              e.currentTarget.src = useravatar
            }}
            style={{ width: '1.25rem', height: '1.25rem', borderRadius: '50%', objectFit: 'cover' }}
          />
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1e293b' }} className='dark:text-white'>
            {senderName}
          </span>
          <span
            style={{
              fontSize: '0.6rem',
              fontWeight: 500,
              color: config.color,
              background: config.bgColor,
              padding: '0.1rem 0.4rem',
              borderRadius: '0.3rem'
            }}
          >
            {config.label}
          </span>
        </div>

        {/* Content text */}
        <p style={{ fontSize: '0.78rem', color: '#475569', margin: '0.15rem 0', lineHeight: 1.4 }} className='dark:text-gray-300'>
          {notification.content}
          {notification.type !== NotificationTypes.follow && notification.name_notification ? (
            <>
              {': '}
              <span style={{ fontWeight: 600 }}>{cutString(notification.name_notification, 40)}</span>
            </>
          ) : null}
        </p>

        {/* Timestamp */}
        <span style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 500 }}>
          {formatRelativeTimeVi(notification.createdAt)}
        </span>
      </div>

      {/* Delete button */}
      <button
        type='button'
        onClick={handleDelete}
        disabled={deleteMutation.isPending}
        style={{
          ...styles.deleteBtn,
          opacity: deleteMutation.isPending ? 0.4 : 1
        }}
        className='noti-delete-hover'
        title='Xóa thông báo'
      >
        <AiOutlineDelete />
      </button>
    </motion.div>
  )
}

// ─── Invite Preview Modal ───
const InvitePreviewModal = ({ invite, onClose }) => {
  const navigate = useNavigate()

  if (!invite) return null

  const handleView = () => {
    if (!invite.mealPlanId) return
    onClose?.()
    navigate(`/meal-plan/${invite.mealPlanId}`)
  }

  return (
    <AnimatePresence>
      <motion.div
        className='fixed inset-0 z-[1000] flex items-center justify-center px-4'
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className='absolute inset-0 bg-black/50 backdrop-blur-sm' onClick={onClose} />
        <motion.div
          className='relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900'
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
        >
          <div className='flex items-start justify-between gap-4'>
            <div>
              <p className='text-xs font-semibold uppercase tracking-[0.45em] text-emerald-500'>Meal plan</p>
              <h3 className='mt-2 text-lg font-semibold text-gray-900 dark:text-white'>
                {invite.senderName} đã mời bạn tham khảo thực đơn
              </h3>
            </div>
            <button
              type='button'
              onClick={onClose}
              className='text-gray-400 transition hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-200'
            >
              ×
            </button>
          </div>
          <div className='mt-4 rounded-2xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200'>
            <p className='text-xs font-semibold text-gray-500 uppercase tracking-wide'>Tên thực đơn</p>
            <p className='mt-1 text-base font-medium text-gray-900 dark:text-white'>
              {invite.mealPlanTitle || 'Thực đơn đặc biệt'}
            </p>
          </div>
          <div className='mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end'>
            <button
              type='button'
              onClick={onClose}
              className='rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800'
            >
              Để sau
            </button>
            <button
              type='button'
              onClick={handleView}
              className='rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500'
            >
              Xem thực đơn
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
