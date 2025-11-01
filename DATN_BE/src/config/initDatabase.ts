import { seedIngredientsData } from './seedIngredients'
import { seedRecipesData } from './seedRecipes'

export const initializeDatabase = () => {
  console.log('Initializing lowdb database...')
  
  // Seed ingredients data
  seedIngredientsData()
  
  // Seed recipes data
  seedRecipesData()
  
  console.log('Database initialization completed!')
}

export default initializeDatabase
