/**
 * Thay marker đính kèm trong content bài viết bằng nhãn đọc được (ẩn ObjectId).
 */
export function formatPostContentForAdmin(text) {
  if (text == null || text === '') return ''
  let s = String(text)
  s = s.replace(/\[challenge:([a-f0-9]{24})\]/gi, '[Thử thách]')
  s = s.replace(/\[sport-event:([a-f0-9]{24})\]/gi, '[Sự kiện thể thao]')
  s = s.replace(/\[activity:([a-f0-9]{24}):([a-f0-9]{24})\]/gi, '[Hoạt động sự kiện]')
  s = s.replace(/\[challenge-activity:([a-f0-9]{24}):([a-f0-9]{24})\]/gi, '[Hoạt động thử thách]')
  s = s.replace(/\[challenge-progress:([a-f0-9]{24}):([a-f0-9]{24})\]/gi, '[Tiến độ thử thách]')
  return s
}
