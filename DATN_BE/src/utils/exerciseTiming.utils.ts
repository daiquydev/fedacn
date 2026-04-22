/** Bài tập cũ có thể thiếu field — đồng bộ với exercise.schema defaults */
export function withExerciseTimingDefaults(doc: unknown): Record<string, unknown> {
    const d = doc as { toObject?: () => Record<string, unknown> }
    const o =
        doc != null && typeof d.toObject === 'function'
            ? d.toObject()
            : { ...(doc as Record<string, unknown>) }
    const numD = Number(o.duration_default)
    const numR = Number(o.rest_time_default)
    return {
        ...o,
        /** Mặc định 3s/rep khi thiếu/sai; cho phép 1–120 (đồng bộ Admin / User) */
        duration_default: Number.isFinite(numD) && numD >= 1 && numD <= 120 ? Math.round(numD) : 3,
        rest_time_default: Number.isFinite(numR) && numR >= 0 && numR <= 600 ? Math.round(numR) : 0
    }
}

export function mapExercisesTimingDefaults(list: unknown[]): Record<string, unknown>[] {
    return list.map((x) => withExerciseTimingDefaults(x))
}
