import { capVideoSessionSeconds, VIDEO_SESSION_END_SKEW_SECONDS } from '../sportEventVideoSession.helpers'

describe('capVideoSessionSeconds', () => {
    const joined = new Date('2026-01-01T12:00:00.000Z')

    it('caps inflated client values to wall clock + skew', () => {
        const ended = new Date('2026-01-01T12:05:00.000Z') // 300s
        const { safeTotalSeconds, safeActiveSeconds, maxElapsed } = capVideoSessionSeconds(
            joined,
            ended,
            9999,
            9999,
            VIDEO_SESSION_END_SKEW_SECONDS
        )
        expect(maxElapsed).toBe(300 + VIDEO_SESSION_END_SKEW_SECONDS)
        expect(safeTotalSeconds).toBe(maxElapsed)
        expect(safeActiveSeconds).toBe(maxElapsed)
    })

    it('keeps honest values under cap', () => {
        const ended = new Date('2026-01-01T12:10:00.000Z')
        const { safeTotalSeconds, safeActiveSeconds } = capVideoSessionSeconds(joined, ended, 120, 600, 15)
        expect(safeTotalSeconds).toBe(600)
        expect(safeActiveSeconds).toBe(120)
    })

    it('never returns negative maxElapsed', () => {
        const ended = new Date('2026-01-01T11:59:00.000Z')
        const { maxElapsed, safeTotalSeconds, safeActiveSeconds } = capVideoSessionSeconds(joined, ended, 10, 60, 0)
        expect(maxElapsed).toBe(0)
        expect(safeTotalSeconds).toBe(0)
        expect(safeActiveSeconds).toBe(0)
    })
})
