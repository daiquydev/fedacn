import { GetListIngredientQuery } from '~/models/requests/ingredient.request'
import db, { Ingredient } from '~/config/lowdb'

class IngredientServices {
  async getAllCategoryIngredientsService() {
    // Lấy tất cả categories từ ingredients
    const ingredients = db.get('ingredients').value() as Ingredient[]
    const categories = [...new Set(ingredients.map((ingredient: Ingredient) => ingredient.category))]
    return categories.map(category => ({ name: category, _id: category }))
  }

  async getListIngerdientService({ page, limit, search, ingredient_category_ID }: GetListIngredientQuery) {
    let ingredients = db.get('ingredients').value() as Ingredient[]

    // Filtering
    if (search) {
      const searchLower = search.toLowerCase()
      ingredients = ingredients.filter((ingredient: Ingredient) => 
        ingredient.name.toLowerCase().includes(searchLower)
      )
    }

    if (ingredient_category_ID) {
      ingredients = ingredients.filter((ingredient: Ingredient) => ingredient.category === ingredient_category_ID)
    }

    // Pagination
    if (!page) page = 1
    if (!limit) limit = 10

    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedIngredients = ingredients.slice(startIndex, endIndex)

    const totalPage = Math.ceil(ingredients.length / limit)

    return { 
      ingredients: paginatedIngredients, 
      totalPage, 
      page, 
      limit 
    }
  }

  async getIngredientByIdService(id: string) {
    const ingredient = db.get('ingredients').find({ id }).value()
    return ingredient
  }

  async createIngredientService(ingredientData: Omit<Ingredient, 'id' | 'createdAt' | 'updatedAt'>) {
    const newIngredient: Ingredient = {
      ...ingredientData,
      id: `ingredient_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    db.get('ingredients')
      .push(newIngredient)
      .write()

    return newIngredient
  }

  async updateIngredientService(id: string, updateData: Partial<Ingredient>) {
    const ingredient = db.get('ingredients')
      .find({ id })
      .assign({ ...updateData, updatedAt: new Date() })
      .write()

    return ingredient
  }

  async deleteIngredientService(id: string) {
    const removedIngredient = db.get('ingredients')
      .remove({ id })
      .write()

    return removedIngredient.length > 0
  }

  async searchIngredientsService(query: string) {
    const ingredients = db.get('ingredients').value() as Ingredient[]
    const searchLower = query.toLowerCase()
    
    return ingredients.filter((ingredient: Ingredient) => 
      ingredient.name.toLowerCase().includes(searchLower) ||
      ingredient.description.toLowerCase().includes(searchLower)
    )
  }
}

const ingredientServices = new IngredientServices()
export default ingredientServices
