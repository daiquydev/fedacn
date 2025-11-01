import { Request, Response } from 'express'
import lowdbRecipeService from '~/services/userServices/lowdbRecipe.services'

export const getAllRecipesController = async (req: Request, res: Response) => {
  const query = req.query
  const result = await lowdbRecipeService.getAllRecipesService(query)
  
  return res.json({
    success: true,
    result,
    message: 'Lấy danh sách công thức thành công'
  })
}

export const getRecipeDetailController = async (req: Request, res: Response) => {
  const { id } = req.params
  const result = await lowdbRecipeService.getRecipeByIdService(id)
  
  if (!result) {
    return res.status(404).json({
      success: false,
      message: 'Không tìm thấy công thức'
    })
  }

  return res.json({
    success: true,
    result,
    message: 'Lấy thông tin công thức thành công'
  })
}

export const createRecipeController = async (req: Request, res: Response) => {
  const recipeData = req.body
  
  // Nếu có upload ảnh
  if (req.uploadedFile) {
    recipeData.image = req.uploadedFile.path
  }

  // Tính toán nutrition nếu có ingredients
  if (recipeData.ingredients && recipeData.ingredients.length > 0) {
    const nutrition = await lowdbRecipeService.calculateNutritionService(recipeData.ingredients)
    recipeData.nutrition = nutrition
  }

  const result = await lowdbRecipeService.createRecipeService(recipeData)
  
  return res.status(201).json({
    success: true,
    result,
    message: 'Tạo công thức thành công'
  })
}

export const updateRecipeController = async (req: Request, res: Response) => {
  const { id } = req.params
  const updateData = req.body

  // Nếu có upload ảnh mới
  if (req.uploadedFile) {
    updateData.image = req.uploadedFile.path
  }

  // Tính toán lại nutrition nếu có thay đổi ingredients
  if (updateData.ingredients && updateData.ingredients.length > 0) {
    const nutrition = await lowdbRecipeService.calculateNutritionService(updateData.ingredients)
    updateData.nutrition = nutrition
  }

  const result = await lowdbRecipeService.updateRecipeService(id, updateData)
  
  return res.json({
    success: true,
    result,
    message: 'Cập nhật công thức thành công'
  })
}

export const deleteRecipeController = async (req: Request, res: Response) => {
  const { id } = req.params
  const success = await lowdbRecipeService.deleteRecipeService(id)
  
  if (!success) {
    return res.status(404).json({
      success: false,
      message: 'Không tìm thấy công thức để xóa'
    })
  }

  return res.json({
    success: true,
    message: 'Xóa công thức thành công'
  })
}

export const searchRecipesController = async (req: Request, res: Response) => {
  const { q } = req.query
  
  if (!q) {
    return res.status(400).json({
      success: false,
      message: 'Vui lòng nhập từ khóa tìm kiếm'
    })
  }

  const result = await lowdbRecipeService.searchRecipesService(q as string)
  
  return res.json({
    success: true,
    result,
    message: 'Tìm kiếm thành công'
  })
}

export const getRecipesByCategoryController = async (req: Request, res: Response) => {
  const { category } = req.params
  const result = await lowdbRecipeService.getRecipesByCategoryService(category)
  
  return res.json({
    success: true,
    result,
    message: 'Lấy công thức theo danh mục thành công'
  })
}

export const getRecipesByAuthorController = async (req: Request, res: Response) => {
  const { author } = req.params
  const result = await lowdbRecipeService.getRecipesByAuthorService(author)
  
  return res.json({
    success: true,
    result,
    message: 'Lấy công thức theo tác giả thành công'
  })
}

export const getAllCategoriesController = async (req: Request, res: Response) => {
  const result = await lowdbRecipeService.getAllCategoriesService()
  
  return res.json({
    success: true,
    result,
    message: 'Lấy danh sách danh mục thành công'
  })
}

export const getAllCuisinesController = async (req: Request, res: Response) => {
  const result = await lowdbRecipeService.getAllCuisinesService()
  
  return res.json({
    success: true,
    result,
    message: 'Lấy danh sách ẩm thực thành công'
  })
}

export const getFeaturedRecipesController = async (req: Request, res: Response) => {
  const { limit } = req.query
  const result = await lowdbRecipeService.getFeaturedRecipesService(Number(limit) || 6)
  
  return res.json({
    success: true,
    result,
    message: 'Lấy công thức nổi bật thành công'
  })
}

export const calculateNutritionController = async (req: Request, res: Response) => {
  const { ingredients } = req.body
  
  if (!ingredients || !Array.isArray(ingredients)) {
    return res.status(400).json({
      success: false,
      message: 'Vui lòng cung cấp danh sách nguyên liệu hợp lệ'
    })
  }

  const result = await lowdbRecipeService.calculateNutritionService(ingredients)
  
  return res.json({
    success: true,
    result,
    message: 'Tính toán dinh dưỡng thành công'
  })
}
