/**
 * Lớp kiểm duyệt nội dung theo quy tắc (rule-based), không gọi mạng.
 * Dùng cho luận văn: có thể mô tả là "bộ lọc từ khóa + chuẩn hóa chữ viết",
 * Groq chỉ là bước phụ (ngữ cảnh) nếu bật trong communityTextModeration.services.
 */

/** Chuẩn hóa: bỏ dấu + lowercase để bắt biến thể viết tắt / lệch dấu */
export function normalizeForRuleMatch(input: string): string {
  let s = (input || '').toLowerCase().trim()
  s = s.replace(/\s+/g, ' ')
  const from =
    'àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ'
  const to =
    'aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuuuyyyyyd'
  const map: Record<string, string> = {}
  for (let i = 0; i < from.length; i++) map[from[i]] = to[i]
  s = s
    .split('')
    .map((ch) => map[ch] ?? ch)
    .join('')
  // Một số ký tự leet đơn giản
  return s.replace(/[@4]/g, 'a').replace(/[03]/g, 'o').replace(/[1!|]/g, 'i').replace(/[$5]/g, 's')
}

/**
 * Danh sách chuỗi con (đã normalize) — mở rộng theo nhu cầu sản phẩm.
 * Giữ ngắn để tránh false positive; mục tiêu là chặn lời tục / khiêu dâm rõ ràng.
 */
const BLOCKED_SUBSTRINGS_NORM: string[] = [
  'dit me',
  'dit con',
  'du ma',
  'du me',
  'lon me',
  'thang cho',
  'con cho',
  'cac ',
  ' buoi ',
  'lon ',
  ' du ',
  'chich ',
  'sex ',
  ' clip sex',
  'phim sex',
  'ban dam',
  'gai goi',
  ' cave ',
  'thu dam',
  'khieu dam',
  'hiep dam',
  'cuong dam',
  'lo luan',
  'bu lon',
  'bop vu',
  'so huong',
  'ngu si',
  'cac cut',
  'vcl ',
  ' clgt',
  'dm ',
  'dmm ',
  'cc ',
  'clm ',
  'dcm ',
  'fuck',
  'shit',
  'bitch',
  'asshole',
  'porn',
  'xxx ',
  'hentai',
  'ban gai ngon',
  'trai dep ngon',
  'em ngon',
  'anh ngon',
  'chi ngon',
  'du em',
  'du chi',
  'du anh',
  'dit ba',
  'dit cha',
  'me may',
  'con me no',
  'thang ngu',
  'con di ',
  'di me',
  'chet me',
  'chet cha',
  'lao dai',
  'thang mat',
  'con mat',
  'ccmn',
  'ncc ',
  'ngu vcl',
  'lon to'
]

export function moderateByRules(rawText: string): { allowed: true } | { allowed: false; reason: string } {
  const text = (rawText || '').trim()
  if (!text.length) return { allowed: true }

  const norm = ` ${normalizeForRuleMatch(text)} `

  for (const frag of BLOCKED_SUBSTRINGS_NORM) {
    const f = frag.trim()
    if (!f) continue
    const needle = ` ${normalizeForRuleMatch(f)} `
    if (norm.includes(needle)) {
      return {
        allowed: false,
        reason: 'Nội dung chứa từ ngữ hoặc cụm từ không phù hợp cộng đồng (lọc theo quy tắc).'
      }
    }
  }

  return { allowed: true }
}
