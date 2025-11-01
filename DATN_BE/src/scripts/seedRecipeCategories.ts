import connectDB from '~/services/database.services'
import RecipeCategoryModel from '~/models/schemas/recipeCategory.schema'

const defaultCategories = [
  'Món chính',
  'Món phụ',
  'Món chay',
  'Món ăn vặt',
  'Món nướng',
  'Món xào',
  'Món luộc/hấp',
  'Canh/Súp',
  'Món tráng miệng',
  'Đồ uống',
  'Bánh kẹo',
  'Món ăn sáng',
  'Món ăn nhanh',
  'Món truyền thống',
  'Món hiện đại'
]

async function seedRecipeCategories() {
  try {
    console.log('🌱 Starting recipe category seeding...')
    await connectDB()

    let inserted = 0
    for (const name of defaultCategories) {
      const existing = await RecipeCategoryModel.findOne({ name }).exec()
      if (existing) {
        console.log(`ℹ️  Category already exists, skipping: ${name}`)
        continue
      }

      await RecipeCategoryModel.create({ name })
      inserted += 1
      console.log(`✅ Added category: ${name}`)
    }

    if (inserted === 0) {
      console.log('📋 All default categories already exist. Nothing to insert.')
    } else {
      console.log(`🎉 Inserted ${inserted} new categories!`)
    }
  } catch (error) {
    console.error('❌ Failed to seed recipe categories:', error)
  } finally {
    process.exit(0)
  }
}

if (require.main === module) {
  seedRecipeCategories()
}

export default seedRecipeCategories
