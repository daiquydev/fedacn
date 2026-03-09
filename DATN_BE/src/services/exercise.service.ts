import ExerciseModel from '~/models/schemas/exercise.schema'

class ExerciseService {
    async getAllExercises() {
        return ExerciseModel.find({ is_active: true })
            .populate('equipment_ids', 'name name_en image_url')
            .populate('muscle_group_ids', 'name name_en')
            .populate('secondary_muscle_ids', 'name name_en')
            .sort({ name: 1 })
    }

    async filterExercises(equipment: string[], muscles: string[]) {
        const query: any = { is_active: true }

        if (equipment && equipment.length > 0) {
            query.equipment = { $in: equipment }
        }

        if (muscles && muscles.length > 0) {
            query.primary_muscles = { $in: muscles }
        }

        return ExerciseModel.find(query)
            .populate('equipment_ids', 'name name_en image_url')
            .populate('muscle_group_ids', 'name name_en')
            .populate('secondary_muscle_ids', 'name name_en')
            .sort({ name: 1 })
    }

    async getExerciseById(id: string) {
        return ExerciseModel.findById(id)
            .populate('equipment_ids', 'name name_en image_url')
            .populate('muscle_group_ids', 'name name_en')
            .populate('secondary_muscle_ids', 'name name_en')
    }

    /**
     * Suggest exercises whose combined estimated kcal >= kcalTarget.
     * Uses a greedy algorithm: sort by estimated kcal desc, pick until sum >= target.
     * Also returns the full filtered list so the user can swap/add.
     */
    async suggestExercisesByKcal(
        kcalTarget: number,
        equipment: string[],
        muscles: string[],
        durationMinutes: number = 45
    ) {
        const query: any = { is_active: true }
        if (equipment && equipment.length > 0) query.equipment = { $in: equipment }
        if (muscles && muscles.length > 0) query.primary_muscles = { $in: muscles }

        const allExercises = await ExerciseModel.find(query)
            .populate('equipment_ids', 'name name_en image_url')
            .populate('muscle_group_ids', 'name name_en')
            .sort({ name: 1 })

        // Compute estimated kcal per exercise
        const exercisesWithKcal = allExercises.map((ex: any) => {
            let estimated_kcal = 0
            const defaultSets = ex.default_sets || []

            if (defaultSets.length > 0) {
                // Sum kcal from all default sets: reps × weight × calories_per_unit
                estimated_kcal = defaultSets.reduce((acc: number, s: any) => {
                    const fromSets = (s.reps || 0) * (s.weight || 0) * (s.calories_per_unit ?? 10)
                    return acc + fromSets
                }, 0)
                // Fallback for bodyweight exercises (weight = 0): use calories_per_min × duration_default
                if (estimated_kcal === 0) {
                    estimated_kcal = (ex.calories_per_min || 5) * ((ex.duration_default || 45) / 60) * durationMinutes
                }
            } else {
                // No default sets: use MET-based estimate
                estimated_kcal = (ex.calories_per_min || 5) * (durationMinutes / 60) * 45
            }

            estimated_kcal = Math.round(estimated_kcal)
            return { exercise: ex.toObject(), estimated_kcal }
        })

        // Greedy selection: sort by kcal desc, pick until sum >= target, max 8 exercises
        const sorted = [...exercisesWithKcal].sort((a, b) => b.estimated_kcal - a.estimated_kcal)
        const suggested: typeof exercisesWithKcal = []
        let currentTotal = 0

        for (const item of sorted) {
            if (suggested.length >= 8) break
            suggested.push(item)
            currentTotal += item.estimated_kcal
            if (currentTotal >= kcalTarget) break
        }

        return {
            suggested: suggested.map(({ exercise, estimated_kcal }) => ({ ...exercise, estimated_kcal })),
            all_exercises: exercisesWithKcal.map(({ exercise, estimated_kcal }) => ({ ...exercise, estimated_kcal })),
            total_suggested_kcal: currentTotal,
            kcal_target: kcalTarget
        }
    }
}

const exerciseService = new ExerciseService()
export default exerciseService
