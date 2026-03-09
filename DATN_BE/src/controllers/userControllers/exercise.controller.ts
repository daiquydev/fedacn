import { Request, Response } from 'express'
import exerciseService from '~/services/exercise.service'

export const getAllExercisesController = async (req: Request, res: Response) => {
    try {
        const exercises = await exerciseService.getAllExercises()
        return res.json({
            result: exercises,
            message: 'Get all exercises successfully'
        })
    } catch (error) {
        return res.status(500).json({
            message: (error as Error).message
        })
    }
}

export const filterExercisesController = async (req: Request, res: Response) => {
    try {
        const { equipment, muscles } = req.query

        const equipmentArr = equipment ? (equipment as string).split(',').map(s => s.trim()) : []
        const musclesArr = muscles ? (muscles as string).split(',').map(s => s.trim()) : []

        const exercises = await exerciseService.filterExercises(equipmentArr, musclesArr)
        return res.json({
            result: exercises,
            message: 'Filter exercises successfully'
        })
    } catch (error) {
        return res.status(500).json({
            message: (error as Error).message
        })
    }
}

export const getExerciseByIdController = async (req: Request, res: Response) => {
    try {
        const { id } = req.params
        const exercise = await exerciseService.getExerciseById(id)
        if (!exercise) {
            return res.status(404).json({ message: 'Exercise not found' })
        }
        return res.json({
            result: exercise,
            message: 'Get exercise successfully'
        })
    } catch (error) {
        return res.status(500).json({
            message: (error as Error).message
        })
    }
}

export const suggestExercisesByKcalController = async (req: Request, res: Response) => {
    try {
        const { kcal_target, equipment, muscles, duration_minutes } = req.body

        if (!kcal_target || kcal_target <= 0) {
            return res.status(400).json({ message: 'kcal_target must be a positive number' })
        }

        const equipmentArr = Array.isArray(equipment) ? equipment : []
        const musclesArr = Array.isArray(muscles) ? muscles : []
        const duration = Number(duration_minutes) || 45

        const result = await exerciseService.suggestExercisesByKcal(
            Number(kcal_target),
            equipmentArr,
            musclesArr,
            duration
        )

        return res.json({
            result,
            message: 'Suggest exercises by kcal successfully'
        })
    } catch (error) {
        return res.status(500).json({
            message: (error as Error).message
        })
    }
}
