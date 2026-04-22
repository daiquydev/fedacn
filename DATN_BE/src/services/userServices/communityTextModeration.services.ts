import AIUsageLogModel from '~/models/schemas/aiUsageLog.schema'
import { moderateByRules } from '~/services/userServices/communityTextRuleModeration'

export type CommunityTextModerationKind = 'post' | 'post_share' | 'comment'

const MAX_CHARS = 3500

function getGroqKey(): string {
  const k = (process.env.GROQ_API_KEY || '').trim()
  if (!k || k === 'your_groq_key_here') return ''
  return k
}

/** Bật gọi Groq sau khi qua lớp rule (mặc định: có). Đặt COMMUNITY_MODERATION_USE_GROQ=0 để chỉ dùng rule — phù hợp báo cáo / demo không phụ thuộc LLM. */
function useGroqSecondary(): boolean {
  const v = (process.env.COMMUNITY_MODERATION_USE_GROQ || '1').trim().toLowerCase()
  return v !== '0' && v !== 'false' && v !== 'off'
}

/**
 * Kiểm tra nội dung chữ (bài viết / bình luận).
 *
 * Kiến trúc 2 lớp (mô tả cho luận văn):
 * 1) Rule-based: danh sách từ/cụm + chuẩn hóa tiếng Việt — không API, có thể giải thích/giản đồ.
 * 2) Tùy chọn: Groq (LLM) chỉ khi (1) cho qua và có GROQ_API_KEY và COMMUNITY_MODERATION_USE_GROQ bật.
 *
 * Lỗi Groq / parse JSON → coi như cho qua (fail-open).
 */
export async function moderateCommunityText(
  rawText: string,
  kind: CommunityTextModerationKind
): Promise<{ allowed: true } | { allowed: false; reason: string }> {
  const text = (rawText || '').trim()
  if (!text.length) return { allowed: true }

  const rule = moderateByRules(text)
  if (!rule.allowed) return { allowed: false, reason: rule.reason }

  const apiKey = getGroqKey()
  if (!apiKey || !useGroqSecondary()) return { allowed: true }

  const snippet = text.slice(0, MAX_CHARS)
  const kindLabel =
    kind === 'comment'
      ? 'bình luận trên bảng tin cộng đồng'
      : kind === 'post_share'
        ? 'lời chia sẻ kèm bài đăng'
        : 'bài đăng trên bảng tin cộng đồng'

  const system = `Bạn là bộ lọc nội dung phụ (bước 2) cho ứng dụng thể thao/sức khỏe tại Việt Nam.
Nội dung đã qua lọc từ khóa cơ bản. Nhiệm vụ: chỉ đánh dấu vi phạm khi có ngữ cảnh rõ (mỉa mai độc hại, quấy rối, khiêu dâm tinh vi, thù hận, lừa đảo, v.v.).
Chỉ trả về một JSON object thuần (không markdown), đúng schema:
{"appropriate":boolean,"reason":string}

appropriate=true: nội dung phù hợp.
appropriate=false: vi phạm ngữ cảnh rõ ràng dù không khớp từ khóa đơn giản.

Lưu ý: thảo luận fitness, cơ thể, dinh dưỡng hợp pháp → appropriate=true.`

  const user = `Loại nội dung: ${kindLabel}
---
${snippet}
---
Trả về JSON duy nhất. reason: một câu tiếng Việt ngắn (khi appropriate=false; khi true có thể "").`

  try {
    const controller = new AbortController()
    const t = setTimeout(() => controller.abort(), 22_000)
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user }
        ],
        temperature: 0.1,
        max_tokens: 120
      })
    })
    clearTimeout(t)

    if (!response.ok) {
      console.error('[moderateCommunityText] Groq HTTP', response.status)
      return { allowed: true }
    }

    const data = (await response.json()) as { choices?: { message?: { content?: string } }[] }
    const raw = (data?.choices?.[0]?.message?.content || '').trim()
    const cleaned = raw.replace(/```(?:json)?\n?/gi, '').replace(/```/g, '').trim()

    let parsed: { appropriate?: unknown; reason?: unknown }
    try {
      parsed = JSON.parse(cleaned) as { appropriate?: unknown; reason?: unknown }
    } catch {
      console.warn('[moderateCommunityText] JSON parse failed')
      return { allowed: true }
    }

    const appropriate = parsed.appropriate === true
    AIUsageLogModel.create({ feature: 'moderate_community_text' }).catch(() => {})

    if (appropriate) return { allowed: true }

    const reason =
      typeof parsed.reason === 'string' && parsed.reason.trim().length > 0
        ? parsed.reason.trim()
        : 'Nội dung không phù hợp với cộng đồng.'
    return { allowed: false, reason }
  } catch (e: any) {
    console.error('[moderateCommunityText]', e?.message || e)
    return { allowed: true }
  }
}
