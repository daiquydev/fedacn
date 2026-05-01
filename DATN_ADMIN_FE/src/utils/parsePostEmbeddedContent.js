/**
 * Parses post content to extract all embedded marker types.
 * Returns an array of marker objects describing what's embedded.
 *
 * Supported markers:
 *   [sport-event:ID]                        → Share a sport event
 *   [activity:ACT_ID:EVENT_ID]              → Share a sport event activity (GPS)
 *   [challenge:ID]                          → Share a challenge
 *   [challenge-activity:ACT_ID:CHALL_ID]    → Share a challenge activity (outdoor GPS)
 *   [challenge-progress:PROG_ID:CHALL_ID]   → Share challenge progress (nutrition/fitness)
 */
export function parsePostEmbeddedContent(content) {
  if (!content) return []

  const markers = []
  const s = String(content)

  // 1. [sport-event:ID]
  const seMatch = s.match(/\[sport-event:([a-f0-9]{24})\]/i)
  if (seMatch) {
    markers.push({ type: 'sport-event', eventId: seMatch[1] })
  }

  // 2. [activity:ACT_ID:EVENT_ID]
  const actMatch = s.match(/\[activity:([a-f0-9]{24}):([a-f0-9]{24})\]/i)
  if (actMatch) {
    markers.push({ type: 'event-activity', activityId: actMatch[1], eventId: actMatch[2] })
  }

  // 3. [challenge:ID]
  const chMatch = s.match(/\[challenge:([a-f0-9]{24})\]/i)
  if (chMatch) {
    markers.push({ type: 'challenge', challengeId: chMatch[1] })
  }

  // 4. [challenge-activity:ACT_ID:CHALL_ID]
  const caMatch = s.match(/\[challenge-activity:([a-f0-9]{24}):([a-f0-9]{24})\]/i)
  if (caMatch) {
    markers.push({ type: 'challenge-activity', activityId: caMatch[1], challengeId: caMatch[2] })
  }

  // 5. [challenge-progress:PROG_ID:CHALL_ID]
  const cpMatch = s.match(/\[challenge-progress:([a-f0-9]{24}):([a-f0-9]{24})\]/i)
  if (cpMatch) {
    markers.push({ type: 'challenge-progress', progressId: cpMatch[1], challengeId: cpMatch[2] })
  }

  return markers
}

/**
 * Cleans ALL marker strings from content for display purposes.
 */
export function cleanAllMarkers(content) {
  if (!content) return ''
  return String(content)
    .replace(/\n?\[sport-event:[a-f0-9]{24}\]/gi, '')
    .replace(/\n?\[activity:[a-f0-9]{24}:[a-f0-9]{24}\]/gi, '')
    .replace(/\n?\[challenge:[a-f0-9]{24}\]/gi, '')
    .replace(/\n?\[challenge-activity:[a-f0-9]{24}:[a-f0-9]{24}\]/gi, '')
    .replace(/\n?\[challenge-progress:[a-f0-9]{24}:[a-f0-9]{24}\]/gi, '')
    .trim()
}
