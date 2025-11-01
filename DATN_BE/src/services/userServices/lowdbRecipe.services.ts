import db, { Recipe } from '~/config/lowdb'
import { v4 as uuidv4 } from 'uuid'

interface CreateRecipeData {
  name: string;
  description: string;
  image?: string;
  servings: number;
  prepTime: number;
  cookTime: number;
  difficulty: string;
  cuisine: string;
  category: string;
  tags: string[];
  ingredients: Array<{
    ingredientId: string;
    quantity: number;
    unit: string;
  }>;
  instructions: Array<{
    step: number;
    instruction: string;
    time?: number;
  }>;
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sugar: number;
    sodium: number;
  };
  author: string;
}

interface GetRecipesQuery {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  cuisine?: string;
  difficulty?: string;
  maxPrepTime?: number;
  author?: string;
}

class LowdbRecipeService {
  async getAllRecipesService(query: GetRecipesQuery) {
    let recipes = db.get('recipes').value() as Recipe[]

    // Filtering
    if (query.search) {
      const searchLower = query.search.toLowerCase()
      recipes = recipes.filter((recipe: Recipe) =>
        recipe.name.toLowerCase().includes(searchLower) ||
        recipe.description.toLowerCase().includes(searchLower) ||
        recipe.tags.some(tag => tag.toLowerCase().includes(searchLower))
      )
    }

    if (query.category) {
      recipes = recipes.filter((recipe: Recipe) => recipe.category === query.category)
    }

    if (query.cuisine) {
      recipes = recipes.filter((recipe: Recipe) => recipe.cuisine === query.cuisine)
    }

    if (query.difficulty) {
      recipes = recipes.filter((recipe: Recipe) => recipe.difficulty === query.difficulty)
    }

    if (query.maxPrepTime) {
      recipes = recipes.filter((recipe: Recipe) => recipe.prepTime <= query.maxPrepTime!)
    }

    if (query.author) {
      recipes = recipes.filter((recipe: Recipe) => recipe.author === query.author)
    }

    // Sorting by creation date (newest first)
    recipes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    // Pagination
    const page = query.page || 1
    const limit = query.limit || 12
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedRecipes = recipes.slice(startIndex, endIndex)

    const totalPage = Math.ceil(recipes.length / limit)

    return {
      recipes: paginatedRecipes,
      totalPage,
      page,
      limit,
      total: recipes.length
    }
  }

  async getRecipeByIdService(id: string) {
    const recipe = db.get('recipes').find({ id }).value()
    return recipe
  }

  async createRecipeService(recipeData: CreateRecipeData) {
    const newRecipe: Recipe = {
      ...recipeData,
      image: recipeData.image || '/images/recipes/default.jpg',
      id: `recipe_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    db.get('recipes')
      .push(newRecipe)
      .write()

    return newRecipe
  }

  async updateRecipeService(id: string, updateData: Partial<Recipe>) {
    const recipe = db.get('recipes')
      .find({ id })
      .assign({ ...updateData, updatedAt: new Date() })
      .write()

    return recipe
  }

  async deleteRecipeService(id: string) {
    const removedRecipe = db.get('recipes')
      .remove({ id })
      .write()

    return removedRecipe.length > 0
  }

  async searchRecipesService(query: string) {
    const recipes = db.get('recipes').value() as Recipe[]
    const searchLower = query.toLowerCase()

    return recipes.filter((recipe: Recipe) =>
      recipe.name.toLowerCase().includes(searchLower) ||
      recipe.description.toLowerCase().includes(searchLower) ||
      recipe.tags.some(tag => tag.toLowerCase().includes(searchLower))
    )
  }

  async getRecipesByCategoryService(category: string) {
    const recipes = db.get('recipes').value() as Recipe[]
    return recipes.filter((recipe: Recipe) => recipe.category === category)
  }

  async getRecipesByAuthorService(author: string) {
    const recipes = db.get('recipes').value() as Recipe[]
    return recipes.filter((recipe: Recipe) => recipe.author === author)
  }

  async getAllCategoriesService() {
    const recipes = db.get('recipes').value() as Recipe[]
    const categories = [...new Set(recipes.map((recipe: Recipe) => recipe.category))]
    return categories.map(category => ({ name: category, _id: category }))
  }

  async getAllCuisinesService() {
    const recipes = db.get('recipes').value() as Recipe[]
    const cuisines = [...new Set(recipes.map((recipe: Recipe) => recipe.cuisine))]
    return cuisines.map(cuisine => ({ name: cuisine, _id: cuisine }))
  }

  async getFeaturedRecipesService(limit: number = 6) {
    const recipes = db.get('recipes').value() as Recipe[]
    
    // Sắp xếp theo ngày tạo mới nhất và lấy limit recipes
    const featuredRecipes = recipes
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit)

    return featuredRecipes
  }

  async calculateNutritionService(ingredients: Array<{ ingredientId: string; quantity: number; unit: string }>) {
    const ingredientsDb = db.get('ingredients').value()
    
    let totalNutrition = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
      sodium: 0
    }

    ingredients.forEach(ingredient => {
      const ingredientData = ingredientsDb.find((item: any) => item.id === ingredient.ingredientId)
      if (ingredientData) {
        // Tính toán dinh dưỡng dựa trên quantity (giả sử nutrition được tính cho 100g)
        const multiplier = ingredient.quantity / 100
        totalNutrition.calories += ingredientData.nutrition.calories * multiplier
        totalNutrition.protein += ingredientData.nutrition.protein * multiplier
        totalNutrition.carbs += ingredientData.nutrition.carbs * multiplier
        totalNutrition.fat += ingredientData.nutrition.fat * multiplier
        totalNutrition.fiber += ingredientData.nutrition.fiber * multiplier
        totalNutrition.sugar += ingredientData.nutrition.sugar * multiplier
        totalNutrition.sodium += ingredientData.nutrition.sodium * multiplier
      }
    })

    // Làm tròn các giá trị
    Object.keys(totalNutrition).forEach(key => {
      totalNutrition[key as keyof typeof totalNutrition] = Math.round(totalNutrition[key as keyof typeof totalNutrition] * 100) / 100
    })

    return totalNutrition
  }
}

const lowdbRecipeService = new LowdbRecipeService()
export default lowdbRecipeService
