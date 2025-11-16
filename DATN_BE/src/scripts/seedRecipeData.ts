import connectDB from '~/services/database.services'
import RecipeModel from '~/models/schemas/recipe.schema'
import RecipeCategoryModel from '~/models/schemas/recipeCategory.schema'
import UserModel from '~/models/schemas/user.schema'
import { RecipeStatus, RecipeTime } from '~/constants/enums'
import { ObjectId } from 'mongodb'

const sampleRecipes = [
  {
    title: 'Phở Bò Truyền Thống',
    description: 'Món phở bò truyền thống Hà Nội với nước dùng thơm ngon, được nấu từ xương bò trong nhiều giờ',
    content: '<h2>Phở Bò Truyền Thống - Hương vị đậm đà của Hà Nội</h2><p>Phở bò là món ăn đặc trưng của Việt Nam, đặc biệt là của vùng đất Hà Nội. Với nước dùng trong vắt nhưng đậm đà, bánh phở mềm dai cùng thịt bò tươi ngon, phở bò luôn là lựa chọn hàng đầu cho bữa sáng hoặc bữa trưa của người Việt.</p>',
    image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500',
    video: '',
    ingredients: [
      { name: 'Xương bò', amount: '1', unit: 'kg' },
      { name: 'Thịt bò', amount: '500', unit: 'g' },
      { name: 'Bánh phở tươi', amount: '300', unit: 'g' },
      { name: 'Hành tây', amount: '1', unit: 'củ' },
      { name: 'Gừng', amount: '50', unit: 'g' },
      { name: 'Quế', amount: '2', unit: 'thanh' },
      { name: 'Hoa hồi', amount: '3', unit: 'bông' }
    ],
    instructions: [
      'Ngâm xương bò trong nước lạnh 2-3 giờ để loại bỏ máu',
      'Nướng hành tây và gừng trên bếp gas để thơm',
      'Rang các loại gia vị cho thơm',
      'Đun sôi nước, cho xương bò vào luộc 5 phút rồi vớt ra rửa sạch',
      'Cho xương vào nồi nước mới, đun sôi rồi hạ lửa nhỏ nấu 3-4 giờ',
      'Luộc thịt bò riêng rồi thái lát mỏng',
      'Trần bánh phở qua nước sôi',
      'Bày bánh phở vào tô, xếp thịt bò lên trên'
    ],
    tags: ['phở', 'bò', 'truyền thống', 'Hà Nội', 'món chính'],
    time: RecipeTime.moreThan120,
    difficult_level: 2,
    region: 0,
    processing_food: 'Hầm',
    energy: 250,
    protein: 18.5,
    fat: 8.2,
    carbohydrate: 25.3
  },
  {
    title: 'Bánh Mì Thịt Nướng',
    description: 'Bánh mì giòn rụm kết hợp với thịt nướng thơm ngon, rau sống tươi mát và nước sốt đặc biệt',
    content: '<h2>Bánh Mì Thịt Nướng - Hương vị đường phố Sài Gòn</h2><p>Bánh mì thịt nướng là món ăn đường phố được yêu thích nhất tại Việt Nam.</p>',
    image: 'https://images.unsplash.com/photo-1580013759032-c96505504618?w=500',
    video: '',
    ingredients: [
      { name: 'Bánh mì', amount: '4', unit: 'ổ' },
      { name: 'Thịt heo', amount: '300', unit: 'g' },
      { name: 'Pate', amount: '100', unit: 'g' },
      { name: 'Rau củ cải chua', amount: '100', unit: 'g' },
      { name: 'Dưa chuột', amount: '1', unit: 'trái' }
    ],
    instructions: [
      'Ướp thịt với gia vị và nướng đến chín vàng',
      'Cắt bánh mì, phết pate',
      'Cho thịt nướng và rau vào bánh mì',
      'Thêm nước sốt và ăn kèm'
    ],
    tags: ['bánh mì', 'thịt nướng', 'Sài Gòn', 'đường phố'],
    time: RecipeTime.from30To60,
    difficult_level: 1,
    region: 1,
    processing_food: 'Nướng',
    energy: 350,
    protein: 15.0,
    fat: 12.0,
    carbohydrate: 45.0
  },
  {
    title: 'Bún Bò Huế',
    description: 'Bún bò Huế cay nồng đặc trưng xứ Huế với nước lèo đỏ thơm',
    image: 'https://images.unsplash.com/photo-1569562211093-4ed0d0758f12?w=500',
    content: '<h2>Bún Bò Huế - Tinh hoa ẩm thực Cố Đô</h2><p>Bún bò Huế là món ăn đặc sản nổi tiếng của cố đô Huế.</p>',
    video: '',
    ingredients: [
      { name: 'Bún bò', amount: '400', unit: 'g' },
      { name: 'Thịt bò', amount: '300', unit: 'g' },
      { name: 'Chả cua', amount: '200', unit: 'g' },
      { name: 'Mắm ruốc', amount: '2', unit: 'tbsp' },
      { name: 'Ớt', amount: '3', unit: 'trái' }
    ],
    instructions: [
      'Nấu nước dùng từ xương heo và bò',
      'Phi thơm hành tỏi, cho mắm ruốc vào',
      'Luộc bún và thịt riêng',
      'Trình bày và chan nước dùng cay nồng'
    ],
    tags: ['bún', 'bò', 'Huế', 'cay', 'đặc sản'],
    time: RecipeTime.from60To120,
    difficult_level: 3,
    region: 2,
    processing_food: 'Nấu',
    energy: 280,
    protein: 20.0,
    fat: 10.0,
    carbohydrate: 30.0
  },
  {
    title: 'Gỏi Cuốn Tôm Thịt',
    description: 'Gỏi cuốn tươi mát với tôm và thịt, ăn kèm nước chấm đậm đà',
    image: 'https://images.unsplash.com/photo-1555126634-323283e090fa?w=500',
    content: '<h2>Gỏi Cuốn Tôm Thịt - Món ăn nhẹ thanh mát</h2><p>Gỏi cuốn là món ăn nhẹ rất được yêu thích trong ẩm thực Việt Nam.</p>',
    video: '',
    ingredients: [
      { name: 'Bánh tráng', amount: '10', unit: 'tờ' },
      { name: 'Tôm', amount: '200', unit: 'g' },
      { name: 'Thịt ba chỉ', amount: '150', unit: 'g' },
      { name: 'Bún tươi', amount: '100', unit: 'g' },
      { name: 'Rau sống', amount: '200', unit: 'g' }
    ],
    instructions: [
      'Luộc tôm và thịt cho chín',
      'Ngâm bánh tráng cho mềm',
      'Cuốn tôm thịt với rau và bún',
      'Ăn kèm với nước chấm'
    ],
    tags: ['gỏi cuốn', 'tôm', 'thịt', 'nhẹ nhàng', 'healthy'],
    time: RecipeTime.from30To60,
    difficult_level: 1,
    region: 1,
    processing_food: 'Luộc',
    energy: 180,
    protein: 12.0,
    fat: 6.0,
    carbohydrate: 20.0
  },
  {
    title: 'Cơm Tấm Sườn Nướng',
    description: 'Cơm tấm thơm ngon với sườn nướng, chả trứng và nước mắm chua ngọt',
    image: 'https://images.unsplash.com/photo-1559847844-5315695dadae?w=500',
    content: '<h2>Cơm Tấm Sườn Nướng - Hương vị Sài Gòn</h2><p>Cơm tấm là món ăn bình dân được yêu thích ở miền Nam.</p>',
    video: '',
    ingredients: [
      { name: 'Cơm tấm', amount: '2', unit: 'chén' },
      { name: 'Sườn heo', amount: '300', unit: 'g' },
      { name: 'Trứng', amount: '2', unit: 'quả' },
      { name: 'Chả lụa', amount: '100', unit: 'g' },
      { name: 'Dưa chua', amount: '50', unit: 'g' }
    ],
    instructions: [
      'Ướp sườn với gia vị và nướng',
      'Đập trứng và chiên thành chả',
      'Trình bày cơm tấm lên đĩa',
      'Xếp sườn, chả trứng lên trên'
    ],
    tags: ['cơm tấm', 'sườn nướng', 'Sài Gòn', 'bình dân'],
    time: RecipeTime.from60To120,
    difficult_level: 2,
    region: 1,
    processing_food: 'Nướng',
    energy: 420,
    protein: 25.0,
    fat: 15.0,
    carbohydrate: 45.0
  }
]

async function seedRecipeData() {
  try {
    console.log('🌱 Starting recipe data seeding...')
    
    // Connect to database
    await connectDB()
    console.log('✅ Connected to database')

    // Find admin user or create one
    let adminUser = await UserModel.findOne({ role: 1 }).exec()
    if (!adminUser) {
      console.log('⚠️  No admin user found, creating one...')
      adminUser = await UserModel.create({
        username: 'admin',
        email: 'admin@cookhealthy.com',
        password: 'hashedpassword',
        role: 1,
        name: 'Administrator',
        created_at: new Date(),
        updated_at: new Date()
      })
    }

    // Get or create recipe categories
    let category = await RecipeCategoryModel.findOne().exec()
    if (!category) {
      console.log('⚠️  No recipe category found, creating default category...')
      category = await RecipeCategoryModel.create({
        name: 'Món Chính',
        description: 'Các món ăn chính trong bữa cơm',
        created_at: new Date(),
        updated_at: new Date()
      })
    }

    // Check if recipes already exist
    const existingRecipeCount = await RecipeModel.countDocuments().exec()
    if (existingRecipeCount > 0) {
      console.log(`⚠️  Found ${existingRecipeCount} existing recipes. Skipping seed...`)
      console.log('🔍 Use the clearRecipes script first if you want to reseed')
      return
    }

    console.log('📝 Creating sample recipes...')
    const createdRecipes = []

    for (const recipeData of sampleRecipes) {
      const recipe = await RecipeModel.create({
        user_id: new ObjectId(adminUser._id),
        category_recipe_id: new ObjectId(category._id),
        ...recipeData,
        status: RecipeStatus.accepted,
        created_at: new Date(),
        updated_at: new Date()
      })
      createdRecipes.push(recipe)
      console.log(`✅ Created recipe: ${recipe.title}`)
    }

    console.log(`🎉 Successfully seeded ${createdRecipes.length} recipes!`)
    console.log('📋 Sample recipes are now available in the database')
    
  } catch (error) {
    console.error('❌ Error seeding recipe data:', error)
  } finally {
    process.exit(0)
  }
}

// Also export function to clear existing recipes
export async function clearRecipes() {
  try {
    console.log('🗑️  Clearing existing recipes...')
    await connectDB()
    
    const result = await RecipeModel.deleteMany({}).exec()
    console.log(`✅ Deleted ${result.deletedCount} recipes`)
    
  } catch (error) {
    console.error('❌ Error clearing recipes:', error)
  }
}

// Run if called directly
if (require.main === module) {
  seedRecipeData()
}

export default seedRecipeData
