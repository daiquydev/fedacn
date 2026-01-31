import { seedIngredientsData } from './seedIngredients'
import { seedRecipesData } from './seedRecipes'
import { seedSportEventsData } from './seedSportEvents'

export const initializeDatabase = async () => {
  console.log('Initializing lowdb database...')
  
  // Seed ingredients data
  seedIngredientsData()
  
  // Seed recipes data
  seedRecipesData()
  
  // Seed sport events data
  await seedSportEventsData()
  
  console.log('Database initialization completed!')
}

export default initializeDatabase
