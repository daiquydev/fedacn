import { Request, Response } from 'express'
import { DifficultLevel, ProcessingRecipe, RegionRecipe } from '~/constants/enums'
import HTTP_STATUS from '~/constants/httpStatus'
import { RECIPE_MESSAGE } from '~/constants/messages'
import { TokenPayload } from '~/models/requests/authUser.request'
import recipeService from '~/services/userServices/recipe.services'
import { ErrorWithStatus } from '~/utils/error'

const safeParseArrayPayload = (value: unknown): unknown[] => {
  if (!value) return []
  if (Array.isArray(value)) return value
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return []
    try {
      const parsed = JSON.parse(trimmed)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return []
}

const normalizeInstructionPayload = (value: unknown): string[] => {
  if (!value) return []

  let rawEntries: unknown[] = []

  if (Array.isArray(value)) {
    rawEntries = value
  } else if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return []

    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed)
        rawEntries = Array.isArray(parsed) ? parsed : []
      } catch {
        throw new ErrorWithStatus({
          message: RECIPE_MESSAGE.INSTRUCTIONS_INVALID,
          status: HTTP_STATUS.BAD_REQUEST
        })
      }
    } else {
      rawEntries = trimmed
        .split(/\r?\n+/)
        .map((segment) => segment.trim())
        .filter(Boolean)
    }
  }

  if (!Array.isArray(rawEntries)) {
    return []
  }

  const possibleKeys = ['instruction', 'description', 'content', 'step', 'value', 'text']

  return rawEntries
    .map((entry) => {
      if (typeof entry === 'string') {
        return entry.trim()
      }

      if (entry && typeof entry === 'object') {
        for (const key of possibleKeys) {
          const candidate = (entry as Record<string, unknown>)[key]
          if (typeof candidate === 'string' && candidate.trim()) {
            return candidate.trim()
          }
        }
      }

      return ''
    })
    .filter((value) => Boolean(value))
}

export const getAllRecipeCategoryController = async (req: Request, res: Response) => {
  const result = await recipeService.getAllRecipeCategoryService()
  return res.json({
    result,
    message: RECIPE_MESSAGE.GET_ALL_RECIPE_CATEGORY_SUCCESS
  })
}

export const createRecipeForChefController = async (req: Request, res: Response) => {
  const file = req.file
  const { title, description, content, video, time, region, difficult_level, category_recipe_id, processing_food } =
    req.body

  const user = req.decoded_authorization as TokenPayload
  if (!file) {
    throw new ErrorWithStatus({
      message: RECIPE_MESSAGE.IMAGE_REQUIRED,
      status: HTTP_STATUS.BAD_REQUEST
    })
  }
  const result = await recipeService.createRecipeService({
    user_id: user.user_id,
    title,
    description,
    content,
    image: file,
    video,
    time: Number(time),
    region: Number(region),
    difficult_level: Number(difficult_level),
    category_recipe_id,
    processing_food
  })

  return res.json({
    message: RECIPE_MESSAGE.CREATE_RECIPE_SUCCESS,
    result
  })
}

export const updateRecipeForChefController = async (req: Request, res: Response) => {
  const file = req.file
  const { title, description, content, video, time, region, difficult_level, category_recipe_id, processing_food } =
    req.body
  const { id } = req.params
  const user = req.decoded_authorization as TokenPayload
  const result = await recipeService.updateRecipeForChefService({
    user_id: user.user_id,
    recipe_id: id,
    title,
    description,
    content,
    image: file,
    video,
    time: Number(time),
    region: Number(region),
    difficult_level: Number(difficult_level),
    category_recipe_id,
    processing_food
  })
  return res.json({
    result,
    message: RECIPE_MESSAGE.UPDATE_RECIPE_SUCCESS
  })
}

export const getListRecipesForChefController = async (req: Request, res: Response) => {
  const user = req.decoded_authorization as TokenPayload
  const {
    page,
    limit,
    sort,
    status,
    search,
    category_recipe_id,
    difficult_level,
    processing_food,
    region,
    interval_time
  } = req.query

  const result = await recipeService.getListRecipesForChefService({
    user_id: user.user_id,
    page: Number(page),
    limit: Number(limit),
    sort: sort as string,
    status: status as string,
    search: search as string,
    category_recipe_id: category_recipe_id as string,
    difficult_level: Number(difficult_level),
    processing_food: processing_food as string,
    region: Number(region),
    interval_time: Number(interval_time)
  })
  return res.json({
    result,
    message: RECIPE_MESSAGE.GET_LIST_RECIPE_FOR_CHEF_SUCCESS
  })
}

export const getListRecipesForUserController = async (req: Request, res: Response) => {
  const user = req.decoded_authorization as TokenPayload
  const {
    page,
    limit,
    sort,
    search,
    category_recipe_id,
    difficult_level,
    processing_food,
    region,
    interval_time,
    type,
    include_all
  } = req.query

  const includeAllFlag = typeof include_all === 'string' ? include_all === 'true' || include_all === '1' : Boolean(include_all)

  const result = await recipeService.getListRecipesForUserService({
    user_id: user.user_id,
    page: Number(page),
    limit: Number(limit),
    sort: sort as string,
    search: search as string,
    category_recipe_id: category_recipe_id as string,
    difficult_level: Number(difficult_level),
    processing_food: processing_food as string,
    region: Number(region),
    interval_time: Number(interval_time),
    type: Number(type),
    include_all: includeAllFlag
  })
  return res.json({
    result,
    message: RECIPE_MESSAGE.GET_LIST_RECIPE_FOR_USER_SUCCESS
  })
}

export const getRecicpeForChefController = async (req: Request, res: Response) => {
  const { id } = req.params
  const user = req.decoded_authorization as TokenPayload
  const result = await recipeService.getRecipeForChefService({
    user_id: user.user_id,
    recipe_id: id
  })
  return res.json({
    result,
    message: RECIPE_MESSAGE.GET_RECIPE_FOR_CHEF_SUCCESS
  })
}

export const getRecipeForUserController = async (req: Request, res: Response) => {
  const { id } = req.params
  const user = req.decoded_authorization as TokenPayload
  const result = await recipeService.getRecipeForUserService({
    user_id: user.user_id,
    recipe_id: id
  })
  return res.json({
    result,
    message: RECIPE_MESSAGE.GET_RECIPE_FOR_USER_SUCCESS
  })
}

export const likeRecipeController = async (req: Request, res: Response) => {
  const { recipe_id } = req.body
  const user = req.decoded_authorization as TokenPayload
  const result = await recipeService.likeRecipeService({
    user_id: user.user_id,
    recipe_id
  })
  return res.json({
    result,
    message: RECIPE_MESSAGE.LIKE_RECIPE_SUCCESS
  })
}

export const unlikeRecipeController = async (req: Request, res: Response) => {
  const { recipe_id } = req.body
  const user = req.decoded_authorization as TokenPayload
  const result = await recipeService.unlikeRecipeService({
    user_id: user.user_id,
    recipe_id
  })
  return res.json({
    result,
    message: RECIPE_MESSAGE.LIKE_RECIPE_SUCCESS
  })
}

export const createCommentRecipeController = async (req: Request, res: Response) => {
  const { recipe_id, content } = req.body
  const user = req.decoded_authorization as TokenPayload
  const result = await recipeService.createCommentRecipeService({
    user_id: user.user_id,
    recipe_id,
    content
  })
  return res.json({
    result,
    message: RECIPE_MESSAGE.CREATE_COMMENT_RECIPE_SUCCESS
  })
}

export const deleteCommentRecipeController = async (req: Request, res: Response) => {
  const { comment_id } = req.body
  const user = req.decoded_authorization as TokenPayload
  const result = await recipeService.deleteCommentRecipeService({
    user_id: user.user_id,
    comment_id
  })
  return res.json({
    result,
    message: RECIPE_MESSAGE.DELETE_COMMENT_RECIPE_SUCCESS
  })
}

export const bookmarkRecipeController = async (req: Request, res: Response) => {
  const { recipe_id } = req.body
  const user = req.decoded_authorization as TokenPayload
  const result = await recipeService.bookmarkRecipeService({
    user_id: user.user_id,
    recipe_id
  })
  return res.json({
    result,
    message: RECIPE_MESSAGE.BOOKMARK_RECIPE_SUCCESS
  })
}

export const unbookmarkRecipeController = async (req: Request, res: Response) => {
  const { recipe_id } = req.body
  const user = req.decoded_authorization as TokenPayload
  const result = await recipeService.unbookmarkRecipeService({
    user_id: user.user_id,
    recipe_id
  })
  return res.json({
    result,
    message: RECIPE_MESSAGE.UNBOOKMARK_RECIPE_SUCCESS
  })
}

export const getCommentRecipeController = async (req: Request, res: Response) => {
  const { recipe_id, page, limit } = req.query
  const result = await recipeService.getCommentRecipeService({
    recipe_id: recipe_id as string,
    page: Number(page),
    limit: Number(limit)
  })
  return res.json({
    result,
    message: RECIPE_MESSAGE.GET_COMMENT_RECIPE_SUCCESS
  })
}

export const deleteRecipeForChefController = async (req: Request, res: Response) => {
  const { id } = req.params
  const user = req.decoded_authorization as TokenPayload
  const result = await recipeService.deteleRecipeForChefService({
    user_id: user.user_id,
    recipe_id: id
  })
  return res.json({
    result,
    message: RECIPE_MESSAGE.DELETE_RECIPE_SUCCESS
  })
}

export const getThreeTopRecipesController = async (req: Request, res: Response) => {
  const result = await recipeService.getThreeTopRecipesService()
  return res.json({
    result,
    message: RECIPE_MESSAGE.GET_THREE_TOP_RECIPES_SUCCESS
  })
}

export const getListMeRecipesController = async (req: Request, res: Response) => {
  const user = req.decoded_authorization as TokenPayload
  const { page, limit } = req.query
  const result = await recipeService.getListMeRecipeService({
    user_id: user.user_id,
    page: Number(page),
    limit: Number(limit)
  })
  return res.json({
    result,
    message: RECIPE_MESSAGE.GET_LIST_RECIPE_FOR_CHEF_SUCCESS
  })
}

export const getListUserRecipesController = async (req: Request, res: Response) => {
  const { id } = req.params
  const { page, limit } = req.query
  const user = req.decoded_authorization as TokenPayload
  const result = await recipeService.getListUserRecipeService({
    id: id as string,
    user_id: user.user_id,
    page: Number(page),
    limit: Number(limit)
  })
  return res.json({
    result,
    message: RECIPE_MESSAGE.GET_LIST_RECIPE_FOR_USER_SUCCESS
  })
}

export const createRecipeController = async (req: Request, res: Response) => {
  try {
    const user = req.decoded_authorization as TokenPayload
    const files = req.files as any

    const {
      title,
      description,
      content,
      video,
      time,
      region,
      difficult_level,
      category_recipe_id,
      processing_food,
      ingredients,
      instructions,
      tags,
      energy,
      protein,
      fat,
      carbohydrate
    } = req.body

    // Parse JSON strings
    const parsedIngredients = safeParseArrayPayload(ingredients)
    const parsedTags = safeParseArrayPayload(tags)
    const normalizedInstructions = normalizeInstructionPayload(instructions)

    console.log('🔍 DEBUG - Instructions received:', instructions)
    console.log('🔍 DEBUG - Normalized instructions:', normalizedInstructions)

    if (normalizedInstructions.length === 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: RECIPE_MESSAGE.INSTRUCTIONS_REQUIRED
      })
    }

    const imageUrlFromBody = typeof req.body.imageUrl === 'string' ? req.body.imageUrl.trim() : ''

    // Handle image upload
    let imageUrl = ''
    if (files && files.image && files.image[0]) {
      imageUrl = await recipeService.uploadImageService(files.image[0])
    } else if (imageUrlFromBody) {
      imageUrl = imageUrlFromBody
    } else {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: RECIPE_MESSAGE.IMAGE_REQUIRED
      })
    }

    // Handle video upload - use URL instead of file upload
    let videoUrl = video || ''

    const recipeData = {
      user_id: user.user_id,
      title,
      description,
      content,
      image: imageUrl,
      video: videoUrl || video, // Use uploaded video or video URL
      time: Number(time),
      region: Number(region),
      difficult_level: Number(difficult_level),
      category_recipe_id,
      processing_food,
      ingredients: parsedIngredients,
      instructions: normalizedInstructions,
      tags: parsedTags,
      energy: Number(energy) || 0,
      protein: Number(protein) || 0,
      fat: Number(fat) || 0,
      carbohydrate: Number(carbohydrate) || 0
    }

    console.log('🔍 DEBUG - Recipe data being saved:', JSON.stringify(recipeData, null, 2))

    const result = await recipeService.createRecipeForUserService(recipeData)

    return res.json({
      message: RECIPE_MESSAGE.CREATE_RECIPE_SUCCESS,
      result
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : RECIPE_MESSAGE.CREATE_RECIPE_FAILED
    console.error('createRecipeController error:', error)
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: errorMessage
    })
  }
}

export const getMyRecipesController = async (req: Request, res: Response) => {
  try {
    const user = req.decoded_authorization as TokenPayload
    const { page = 1, limit = 10, status, search } = req.query

    const result = await recipeService.getMyRecipesService({
      user_id: user.user_id,
      page: Number(page),
      limit: Number(limit),
      status: status as string,
      search: search as string
    })

    return res.json({
      message: RECIPE_MESSAGE.GET_MY_RECIPES_SUCCESS,
      result
    })
  } catch (error) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: error instanceof Error ? error.message : RECIPE_MESSAGE.GET_RECIPES_FAILED
    })
  }
}

export const updateMyRecipeController = async (req: Request, res: Response) => {
  try {
    const user = req.decoded_authorization as TokenPayload
    const { recipe_id } = req.params
    const files = req.files as any

    const {
      title,
      description,
      content,
      video,
      time,
      region,
      difficult_level,
      category_recipe_id,
      processing_food,
      ingredients,
      instructions,
      tags,
      energy,
      protein,
      fat,
      carbohydrate
    } = req.body

    const updateData: any = {
      title,
      description,
      content,
      video,
      time: Number(time),
      region: Number(region),
      difficult_level: Number(difficult_level),
      category_recipe_id,
      processing_food,
      energy: Number(energy) || 0,
      protein: Number(protein) || 0,
      fat: Number(fat) || 0,
      carbohydrate: Number(carbohydrate) || 0
    }

    if (ingredients) updateData.ingredients = JSON.parse(ingredients)
    if (instructions) updateData.instructions = JSON.parse(instructions)
    if (tags) updateData.tags = JSON.parse(tags)

    // Handle image upload
    if (files && files.image && files.image[0]) {
      updateData.image = await recipeService.uploadImageService(files.image[0])
    }

    // Handle video upload
    if (files && files.video && files.video[0]) {
      updateData.video = await recipeService.uploadVideoService(files.video[0])
    }

    const result = await recipeService.updateMyRecipeService({
      user_id: user.user_id,
      recipe_id,
      updateData
    })

    return res.json({
      message: RECIPE_MESSAGE.UPDATE_RECIPE_SUCCESS,
      result
    })
  } catch (error) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: error instanceof Error ? error.message : RECIPE_MESSAGE.UPDATE_RECIPE_FAILED
    })
  }
}

export const deleteMyRecipeController = async (req: Request, res: Response) => {
  try {
    const user = req.decoded_authorization as TokenPayload
    const { recipe_id } = req.params

    await recipeService.deleteMyRecipeService({
      user_id: user.user_id,
      recipe_id
    })

    return res.json({
      message: RECIPE_MESSAGE.DELETE_RECIPE_SUCCESS
    })
  } catch (error) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: error instanceof Error ? error.message : RECIPE_MESSAGE.DELETE_RECIPE_FAILED
    })
  }
}
