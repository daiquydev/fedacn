/** Nhãn loại thử thách ăn uống (không phải danh mục sport_categories). */
export const NUTRITION_CHALLENGE_LABEL = 'Ăn uống'

/**
 * Nhãn dòng "danh mục" trên thẻ / banner thử thách.
 * Thử thách nutrition dùng chủ đề tự do — không đối chiếu sport_categories (tránh "Danh mục đã xóa").
 */
export function getChallengeCategoryLabel(challenge, deletedCategoryNames = new Set()) {
  if (!challenge) return null
  const type = challenge.challenge_type
  const cat = String(challenge.category || '').trim()

  if (type === 'nutrition') {
    return cat || NUTRITION_CHALLENGE_LABEL
  }

  if (!cat) return null
  if (deletedCategoryNames.has(cat)) return 'Danh mục đã xóa'
  return cat
}

/** Chỉ outdoor/fitness mới coi category là sport category đã soft-delete. */
export function isChallengeCategoryMarkedDeleted(challenge, deletedCategoryNames = new Set()) {
  if (!challenge || challenge.challenge_type === 'nutrition') return false
  const cat = String(challenge.category || '').trim()
  return !!cat && deletedCategoryNames.has(cat)
}
