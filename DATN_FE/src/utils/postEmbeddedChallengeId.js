/**
 * Lấy challengeId từ marker nhúng trong nội dung bài viết (preview feed).
 */
export function extractEmbeddedChallengeIdFromPostContent(content) {
  if (!content) return null
  let m = content.match(/\[challenge:([a-f0-9]{24})\]/i)
  if (m) return m[1]
  m = content.match(/\[challenge-progress:([a-f0-9]{24}):([a-f0-9]{24})\]/i)
  if (m) return m[2]
  m = content.match(/\[challenge-activity:([a-f0-9]{24}):([a-f0-9]{24})\]/i)
  if (m) return m[2]
  return null
}
