import { Request, Response } from 'express'
import { INGREDIENT_MESSAGE } from '~/constants/messages'
import ingredientServices from '~/services/userServices/ingredient.services'

export const getAllCategoryIngredientsController = async (req: Request, res: Response) => {
  const result = await ingredientServices.getAllCategoryIngredientsService()
  return res.json({
    result,
    message: INGREDIENT_MESSAGE.GET_ALL_CATEGORY_INGREDIENTS_SUCCESS
  })
}

export const getListIngredientController = async (req: Request, res: Response) => {
  const { page, limit, search, ingredient_category_ID } = req.query
  const result = await ingredientServices.getListIngerdientService({
    page: Number(page),
    limit: Number(limit),
    search: search as string,
    ingredient_category_ID: ingredient_category_ID as string
  })

  return res.json({
    result,
    message: INGREDIENT_MESSAGE.GET_LIST_INGREDIENTS_SUCCESS
  })
}

export const getIngredientDetailController = async (req: Request, res: Response) => {
  const { id } = req.params
  const result = await ingredientServices.getIngredientByIdService(id)
  
  if (!result) {
    return res.status(404).json({
      message: 'Không tìm thấy nguyên liệu'
    })
  }

  return res.json({
    result,
    message: 'Lấy thông tin nguyên liệu thành công'
  })
}

export const createIngredientController = async (req: Request, res: Response) => {
  const ingredientData = req.body
  
  // Nếu có upload ảnh
  if (req.uploadedFile) {
    ingredientData.image = req.uploadedFile.path
  }

  const result = await ingredientServices.createIngredientService(ingredientData)
  
  return res.status(201).json({
    result,
    message: 'Tạo nguyên liệu thành công'
  })
}

export const updateIngredientController = async (req: Request, res: Response) => {
  const { id } = req.params
  const updateData = req.body

  // Nếu có upload ảnh mới
  if (req.uploadedFile) {
    updateData.image = req.uploadedFile.path
  }

  const result = await ingredientServices.updateIngredientService(id, updateData)
  
  return res.json({
    result,
    message: 'Cập nhật nguyên liệu thành công'
  })
}

export const deleteIngredientController = async (req: Request, res: Response) => {
  const { id } = req.params
  const success = await ingredientServices.deleteIngredientService(id)
  
  if (!success) {
    return res.status(404).json({
      message: 'Không tìm thấy nguyên liệu để xóa'
    })
  }

  return res.json({
    message: 'Xóa nguyên liệu thành công'
  })
}

export const searchIngredientsController = async (req: Request, res: Response) => {
  const { q } = req.query
  
  if (!q) {
    return res.status(400).json({
      message: 'Vui lòng nhập từ khóa tìm kiếm'
    })
  }

  const result = await ingredientServices.searchIngredientsService(q as string)
  
  return res.json({
    result,
    message: 'Tìm kiếm thành công'
  })
}
