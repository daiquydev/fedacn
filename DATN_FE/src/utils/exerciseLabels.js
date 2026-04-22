/**
 * Nhãn hiển thị tiếng Việt cho category / độ khó bài tập.
 * API & DB vẫn dùng key tiếng Anh; chỉ đổi phần UI.
 */

export const EXERCISE_CATEGORY_LABEL_VI = {
    strength: 'Sức mạnh',
    cardio: 'Tim mạch',
    stretching: 'Giãn cơ',
    plyometrics: 'Bật nhảy'
}

export const EXERCISE_DIFFICULTY_LABEL_VI = {
    beginner: 'Dễ',
    intermediate: 'Trung bình',
    advanced: 'Khó',
    expert: 'Khó'
}

export function formatExerciseCategoryVi(category) {
    if (category == null || category === '') return ''
    const k = String(category).toLowerCase()
    return EXERCISE_CATEGORY_LABEL_VI[k] || String(category)
}

export function formatExerciseDifficultyVi(difficulty) {
    if (difficulty == null || difficulty === '') return ''
    const k = String(difficulty).toLowerCase()
    return EXERCISE_DIFFICULTY_LABEL_VI[k] || String(difficulty)
}
