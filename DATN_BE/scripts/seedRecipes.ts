import mongoose from 'mongoose'
import RecipeModel from '../src/models/schemas/recipe.schema'
import * as fs from 'fs'
import * as path from 'path'

// Load recipes from JSON file
const recipesData = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../../data/recipes.seed.json'), 'utf-8')
)

const MONGODB_URI = 'mongodb+srv://yugi:yugi01@datn.zqrquqt.mongodb.net/test?retryWrites=true&w=majority'

async function seedRecipes() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI)
    console.log('✅ Connected to MongoDB')

    // Clear existing recipes (optional - remove if you want to keep existing data)
    const deleteResult = await RecipeModel.deleteMany({ 
      user_id: new mongoose.Types.ObjectId('691c0521752805e9ab312e03'),
      type: 0 // Only delete chef recipes from seed
    })
    console.log(`🗑️  Deleted ${deleteResult.deletedCount} existing seed recipes`)

    // Prepare recipes for insertion
    const recipesToInsert = recipesData.map((recipe: any) => ({
      ...recipe,
      user_id: new mongoose.Types.ObjectId(recipe.user_id.$oid),
      category_recipe_id: new mongoose.Types.ObjectId(recipe.category_recipe_id.$oid),
      // Auto-generate search_fields from title and description
      search_fields: `${recipe.title} ${recipe.description}`.toLowerCase()
    }))

    // Insert recipes
    const result = await RecipeModel.insertMany(recipesToInsert)
    console.log(`✅ Successfully inserted ${result.length} recipes:`)
    
    result.forEach((recipe, index) => {
      console.log(`   ${index + 1}. ${recipe.title} (${recipe._id})`)
    })

    console.log('\n📊 Summary:')
    console.log(`   Total recipes: ${result.length}`)
    console.log(`   Categories used: ${new Set(recipesData.map((r: any) => r.category_recipe_id.$oid)).size}`)
    console.log(`   Regions: ${recipesData.map((r: any) => r.region).join(', ')}`)

  } catch (error) {
    console.error('❌ Error seeding recipes:', error)
    throw error
  } finally {
    await mongoose.disconnect()
    console.log('\n👋 Disconnected from MongoDB')
  }
}

// Run the seed function
seedRecipes()
  .then(() => {
    console.log('\n✨ Recipe seeding completed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Recipe seeding failed:', error)
    process.exit(1)
  })
