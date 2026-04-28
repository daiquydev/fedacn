import {
  AiOutlineHeart,
  AiOutlineComment,
  AiOutlineShareAlt,
  AiOutlineUserAdd,
  AiOutlineBook,
  AiOutlineStar,
  AiOutlineTrophy,
  AiOutlineWarning,
  AiOutlineFire,
  AiOutlineBell,
  AiOutlineCalendar,
  AiOutlineFlag,
  AiOutlineThunderbolt,
  AiOutlineGift
} from 'react-icons/ai'
import {
  MdOutlineFastfood,
  MdOutlinePersonAdd,
  MdOutlineMailOutline
} from 'react-icons/md'

// ─── Notification Types (synced with backend enums.ts) ───
export const NotificationTypes = {
  follow: 0,
  likePost: 1,
  commentPost: 2,
  commentChildPost: 3,
  sharePost: 4,
  likeRecipe: 5,
  commentRecipe: 6,
  bookmarkRecipe: 7,
  commentBlog: 8,
  bookmarkAlbum: 9,
  shareMealPlan: 10,
  mealPlanInvite: 11,
  system: 12,
  sportEventInvite: 13,
  reportPost: 14,
  trainingJoined: 15,
  trainingCompleted: 16,
  trainingMilestone: 17,
  challengeJoined: 18,
  challengeCompleted: 19,
  challengeMilestone: 20,
  challengeInvite: 21,
  reportSportEvent: 22,
  reportChallenge: 23
}

// ─── Categories for tab filtering ───
export const CATEGORIES = {
  all: 'all',
  social: 'social',
  system: 'system'
}

export const TAB_CONFIG = [
  { key: CATEGORIES.all, label: 'Tất cả', icon: AiOutlineBell },
  { key: CATEGORIES.social, label: 'Tương tác', icon: AiOutlineHeart },
  { key: CATEGORIES.system, label: 'Hệ thống', icon: AiOutlineWarning }
]

// ─── Per-type visual configuration ───
export const NOTIFICATION_CONFIG = {
  [NotificationTypes.follow]: {
    icon: AiOutlineUserAdd,
    color: '#6366f1',
    bgColor: '#eef2ff',
    borderColor: '#6366f1',
    label: 'Theo dõi',
    category: CATEGORIES.social
  },
  [NotificationTypes.likePost]: {
    icon: AiOutlineHeart,
    color: '#f43f5e',
    bgColor: '#fff1f2',
    borderColor: '#f43f5e',
    label: 'Thích bài viết',
    category: CATEGORIES.social
  },
  [NotificationTypes.commentPost]: {
    icon: AiOutlineComment,
    color: '#3b82f6',
    bgColor: '#eff6ff',
    borderColor: '#3b82f6',
    label: 'Bình luận',
    category: CATEGORIES.social
  },
  [NotificationTypes.commentChildPost]: {
    icon: AiOutlineComment,
    color: '#3b82f6',
    bgColor: '#eff6ff',
    borderColor: '#3b82f6',
    label: 'Trả lời bình luận',
    category: CATEGORIES.social
  },
  [NotificationTypes.sharePost]: {
    icon: AiOutlineShareAlt,
    color: '#8b5cf6',
    bgColor: '#f5f3ff',
    borderColor: '#8b5cf6',
    label: 'Chia sẻ',
    category: CATEGORIES.social
  },
  [NotificationTypes.likeRecipe]: {
    icon: AiOutlineHeart,
    color: '#f43f5e',
    bgColor: '#fff1f2',
    borderColor: '#f43f5e',
    label: 'Thích công thức',
    category: CATEGORIES.social
  },
  [NotificationTypes.commentRecipe]: {
    icon: AiOutlineComment,
    color: '#3b82f6',
    bgColor: '#eff6ff',
    borderColor: '#3b82f6',
    label: 'Bình luận công thức',
    category: CATEGORIES.social
  },
  [NotificationTypes.bookmarkRecipe]: {
    icon: AiOutlineStar,
    color: '#f59e0b',
    bgColor: '#fffbeb',
    borderColor: '#f59e0b',
    label: 'Lưu công thức',
    category: CATEGORIES.social
  },
  [NotificationTypes.commentBlog]: {
    icon: AiOutlineComment,
    color: '#3b82f6',
    bgColor: '#eff6ff',
    borderColor: '#3b82f6',
    label: 'Bình luận blog',
    category: CATEGORIES.social
  },
  [NotificationTypes.bookmarkAlbum]: {
    icon: AiOutlineBook,
    color: '#0ea5e9',
    bgColor: '#f0f9ff',
    borderColor: '#0ea5e9',
    label: 'Lưu album',
    category: CATEGORIES.social
  },
  [NotificationTypes.shareMealPlan]: {
    icon: MdOutlineFastfood,
    color: '#10b981',
    bgColor: '#ecfdf5',
    borderColor: '#10b981',
    label: 'Chia sẻ thực đơn',
    category: CATEGORIES.social
  },
  [NotificationTypes.mealPlanInvite]: {
    icon: MdOutlineMailOutline,
    color: '#10b981',
    bgColor: '#ecfdf5',
    borderColor: '#10b981',
    label: 'Mời xem thực đơn',
    category: CATEGORIES.social
  },
  [NotificationTypes.system]: {
    icon: AiOutlineWarning,
    color: '#f59e0b',
    bgColor: '#fffbeb',
    borderColor: '#f59e0b',
    label: 'Hệ thống',
    category: CATEGORIES.system
  },
  [NotificationTypes.sportEventInvite]: {
    icon: AiOutlineCalendar,
    color: '#06b6d4',
    bgColor: '#ecfeff',
    borderColor: '#06b6d4',
    label: 'Sự kiện thể thao',
    category: CATEGORIES.social
  },
  [NotificationTypes.reportPost]: {
    icon: AiOutlineFlag,
    color: '#ef4444',
    bgColor: '#fef2f2',
    borderColor: '#ef4444',
    label: 'Báo cáo bài viết',
    category: CATEGORIES.system
  },
  [NotificationTypes.trainingJoined]: {
    icon: AiOutlineTrophy,
    color: '#10b981',
    bgColor: '#ecfdf5',
    borderColor: '#10b981',
    label: 'Tham gia tập luyện',
    category: CATEGORIES.social
  },
  [NotificationTypes.trainingCompleted]: {
    icon: AiOutlineGift,
    color: '#f59e0b',
    bgColor: '#fffbeb',
    borderColor: '#f59e0b',
    label: 'Hoàn thành tập luyện',
    category: CATEGORIES.social
  },
  [NotificationTypes.trainingMilestone]: {
    icon: AiOutlineThunderbolt,
    color: '#8b5cf6',
    bgColor: '#f5f3ff',
    borderColor: '#8b5cf6',
    label: 'Cột mốc tập luyện',
    category: CATEGORIES.social
  },
  [NotificationTypes.challengeJoined]: {
    icon: AiOutlineTrophy,
    color: '#f97316',
    bgColor: '#fff7ed',
    borderColor: '#f97316',
    label: 'Tham gia thử thách',
    category: CATEGORIES.social
  },
  [NotificationTypes.challengeCompleted]: {
    icon: AiOutlineTrophy,
    color: '#22c55e',
    bgColor: '#f0fdf4',
    borderColor: '#22c55e',
    label: 'Hoàn thành thử thách',
    category: CATEGORIES.social
  },
  [NotificationTypes.challengeMilestone]: {
    icon: AiOutlineThunderbolt,
    color: '#a855f7',
    bgColor: '#faf5ff',
    borderColor: '#a855f7',
    label: 'Cột mốc thử thách',
    category: CATEGORIES.social
  },
  [NotificationTypes.challengeInvite]: {
    icon: MdOutlinePersonAdd,
    color: '#f97316',
    bgColor: '#fff7ed',
    borderColor: '#f97316',
    label: 'Mời thử thách',
    category: CATEGORIES.social
  },
  [NotificationTypes.reportSportEvent]: {
    icon: AiOutlineFlag,
    color: '#ef4444',
    bgColor: '#fef2f2',
    borderColor: '#ef4444',
    label: 'Báo cáo sự kiện',
    category: CATEGORIES.system
  },
  [NotificationTypes.reportChallenge]: {
    icon: AiOutlineFlag,
    color: '#ef4444',
    bgColor: '#fef2f2',
    borderColor: '#ef4444',
    label: 'Báo cáo thử thách',
    category: CATEGORIES.system
  }
}

// ─── Route map ───
export const NOTIFICATION_ROUTES = {
  // follow notification represents an incoming friend request action
  [NotificationTypes.follow]: () => '/friends',
  [NotificationTypes.likePost]: (n) => `/post/${n.link_id}`,
  [NotificationTypes.commentPost]: (n) => `/post/${n.link_id}`,
  [NotificationTypes.commentChildPost]: (n) => `/post/${n.link_id}`,
  [NotificationTypes.sharePost]: (n) => `/post/${n.link_id}`,
  [NotificationTypes.likeRecipe]: (n) => `/cooking/recipe/${n.link_id}`,
  [NotificationTypes.commentRecipe]: (n) => `/cooking/recipe/${n.link_id}`,
  [NotificationTypes.bookmarkRecipe]: (n) => `/cooking/recipe/${n.link_id}`,
  [NotificationTypes.commentBlog]: (n) => `/blog/${n.link_id}`,
  [NotificationTypes.bookmarkAlbum]: (n) => `/album/${n.link_id}`,
  [NotificationTypes.shareMealPlan]: null,
  [NotificationTypes.mealPlanInvite]: null,
  [NotificationTypes.system]: null, // system notifications (post bị xóa, etc.) → không navigate
  [NotificationTypes.sportEventInvite]: (n) => `/sport-event/${n.link_id}`,
  [NotificationTypes.reportPost]: (n) => `/post/${n.link_id}`,
  [NotificationTypes.trainingJoined]: (n) => `/training/${n.link_id}`,
  [NotificationTypes.trainingCompleted]: (n) => `/training/${n.link_id}`,
  [NotificationTypes.trainingMilestone]: (n) => `/training/${n.link_id}`,
  [NotificationTypes.challengeJoined]: (n) => `/challenge/${n.link_id}`,
  [NotificationTypes.challengeCompleted]: (n) => `/challenge/${n.link_id}`,
  [NotificationTypes.challengeMilestone]: (n) => `/challenge/${n.link_id}`,
  [NotificationTypes.challengeInvite]: (n) => `/challenge/${n.link_id}`,
  [NotificationTypes.reportSportEvent]: (n) => `/sport-event/${n.link_id}`,
  [NotificationTypes.reportChallenge]: (n) => `/challenge/${n.link_id}`
}

// ─── Helpers ───
const DEFAULT_CONFIG = {
  icon: AiOutlineBell,
  color: '#6b7280',
  bgColor: '#f9fafb',
  borderColor: '#6b7280',
  label: 'Thông báo',
  category: CATEGORIES.social
}

export function getNotificationConfig(type) {
  return NOTIFICATION_CONFIG[type] || DEFAULT_CONFIG
}

export function getCategoryForType(type) {
  const config = NOTIFICATION_CONFIG[type]
  return config ? config.category : CATEGORIES.social
}

export function isSystemNotification(type) {
  return [
    NotificationTypes.system,
    NotificationTypes.reportPost,
    NotificationTypes.reportSportEvent,
    NotificationTypes.reportChallenge
  ].includes(type)
}
