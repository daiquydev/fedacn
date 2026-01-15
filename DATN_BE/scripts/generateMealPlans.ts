import fs from 'fs'
import path from 'path'
import mongoose, { Types } from 'mongoose'
import { EJSON } from 'bson'

// Keep in sync with existing scripts
const MONGODB_URI = process.env.MONGODB_URL || 'mongodb+srv://yugi:yugi01@datn.zqrquqt.mongodb.net/test?retryWrites=true&w=majority'

// Enums reused from src/constants/enums.ts (numeric values)
enum MealType {
  breakfast,
  lunch,
  dinner,
  snack,
  snack2
}

enum MealPlanCategory {
  loseWeight,
  gainWeight,
  gainMuscle,
  healthy,
  vegetarian,
  keto,
  lowCarb,
  highProtein,
  diabetes,
  heartHealthy
}

enum MealPlanStatus {
  draft,
  published,
  archived
}

enum DifficultLevel {
  easy,
  normal,
  hard
}

type RecipeDoc = {
  _id: Types.ObjectId
  title: string
  description?: string
  image?: string
  energy?: number
  protein?: number
  fat?: number
  carbohydrate?: number
  user_id?: Types.ObjectId
  category_recipe_id?: Types.ObjectId
}

type MealPlanDoc = {
  _id: Types.ObjectId
  title: string
  description: string
  author_id: Types.ObjectId
  duration: number
  category: MealPlanCategory
  target_calories: number
  total_calories: number
  target_protein: number
  target_carbs: number
  target_fat: number
  image: string
  images: string[]
  status: MealPlanStatus
  is_public: boolean
  difficulty_level: DifficultLevel
  price_range: string
  suitable_for: string[]
  restrictions: string[]
  tags: string[]
  likes_count: number
  comments_count: number
  bookmarks_count: number
  applied_count: number
  rating: number
  rating_count: number
  views_count: number
  shared_count: number
  featured: boolean
  search_fields: string
  createdAt: Date
  updatedAt: Date
}

type MealPlanDayDoc = {
  _id: Types.ObjectId
  meal_plan_id: Types.ObjectId
  day_number: number
  title: string
  description: string
  total_calories: number
  total_protein: number
  total_carbs: number
  total_fat: number
  notes: string
  createdAt: Date
  updatedAt: Date
}

type MealPlanMealDoc = {
  _id: Types.ObjectId
  meal_plan_day_id: Types.ObjectId
  meal_type: MealType
  recipe_id: Types.ObjectId
  servings: number
  name: string
  description: string
  ingredients: { name: string; quantity: number; unit: string; calories: number }[]
  instructions: string
  prep_time: number
  cook_time: number
  image: string
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
  sugar: number
  sodium: number
  meal_order: number
  is_optional: boolean
  alternatives: Types.ObjectId[]
  notes: string
  createdAt: Date
  updatedAt: Date
}

const OUTPUT_DIR = path.join(__dirname, '../data/generated-meal-plans')
const mealTypesPerDay: MealType[] = [MealType.breakfast, MealType.lunch, MealType.dinner, MealType.snack]

const mealPlanThemes: { title: string; category: MealPlanCategory; tags: string[]; difficulty: DifficultLevel }[] = [
  { title: 'Giảm cân nhẹ nhàng', category: MealPlanCategory.loseWeight, tags: ['giảm cân', 'low-fat'], difficulty: DifficultLevel.easy },
  { title: 'Tăng cơ khoa học', category: MealPlanCategory.gainMuscle, tags: ['tăng cơ', 'high-protein'], difficulty: DifficultLevel.normal },
  { title: 'Eat Clean cân bằng', category: MealPlanCategory.healthy, tags: ['eat-clean', 'balanced'], difficulty: DifficultLevel.easy },
  { title: 'Thực đơn chay', category: MealPlanCategory.vegetarian, tags: ['vegetarian', 'plant-based'], difficulty: DifficultLevel.normal },
  { title: 'Low Carb linh hoạt', category: MealPlanCategory.lowCarb, tags: ['low-carb', 'keto-friendly'], difficulty: DifficultLevel.normal },
  { title: 'Keto gọn nhẹ', category: MealPlanCategory.keto, tags: ['keto', 'fat-adapted'], difficulty: DifficultLevel.hard },
  { title: 'Kiểm soát đường huyết', category: MealPlanCategory.diabetes, tags: ['diabetes', 'low-glycemic'], difficulty: DifficultLevel.normal },
  { title: 'Tốt cho tim mạch', category: MealPlanCategory.heartHealthy, tags: ['heart-healthy', 'omega-3'], difficulty: DifficultLevel.easy },
  { title: 'Tăng cân an toàn', category: MealPlanCategory.gainWeight, tags: ['tăng cân', 'calorie-surplus'], difficulty: DifficultLevel.normal },
  { title: 'Protein cao', category: MealPlanCategory.highProtein, tags: ['high-protein', 'fitness'], difficulty: DifficultLevel.easy }
]

const ensureDir = () => {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true })
  }
}

const shuffle = <T>(arr: T[]): T[] => arr.slice().sort(() => Math.random() - 0.5)

const pickNumber = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min

const pickMealsForDay = (recipes: RecipeDoc[], startIndex: number) => {
  const meals: RecipeDoc[] = []
  for (let i = 0; i < mealTypesPerDay.length; i++) {
    meals.push(recipes[(startIndex + i) % recipes.length])
  }
  return meals
}

const createMealPlanDocs = (recipes: RecipeDoc[]) => {
  const shuffledRecipes = shuffle(recipes)
  let recipeCursor = 0
  const mealPlans: MealPlanDoc[] = []
  const mealPlanDays: MealPlanDayDoc[] = []
  const mealPlanMeals: MealPlanMealDoc[] = []

  const now = new Date()
  const authorId = recipes[0]?.user_id || new Types.ObjectId()

  mealPlanThemes.forEach((theme, index) => {
    const duration = pickNumber(3, 7)
    const mealPlanId = new Types.ObjectId()

    const plan: MealPlanDoc = {
      _id: mealPlanId,
      title: `${theme.title} #${index + 1}`,
      description: `Thực đơn ${theme.title.toLowerCase()} với công thức đa dạng, cân bằng dưỡng chất.`,
      author_id: authorId,
      duration,
      category: theme.category,
      target_calories: pickNumber(1600, 2300),
      total_calories: 0,
      target_protein: pickNumber(80, 140),
      target_carbs: pickNumber(150, 260),
      target_fat: pickNumber(40, 90),
      image: recipes[index % recipes.length]?.image || '',
      images: [],
      status: MealPlanStatus.published,
      is_public: true,
      difficulty_level: theme.difficulty,
      price_range: 'medium',
      suitable_for: [],
      restrictions: [],
      tags: theme.tags,
      likes_count: 0,
      comments_count: 0,
      bookmarks_count: 0,
      applied_count: 0,
      rating: 0,
      rating_count: 0,
      views_count: 0,
      shared_count: 0,
      featured: false,
      search_fields: `${theme.title.toLowerCase()} ${theme.tags.join(' ')}`,
      createdAt: now,
      updatedAt: now
    }

    mealPlans.push(plan)

    for (let day = 1; day <= duration; day++) {
      const dayId = new Types.ObjectId()
      const dayMeals = pickMealsForDay(shuffledRecipes, recipeCursor)
      recipeCursor = (recipeCursor + mealTypesPerDay.length) % shuffledRecipes.length

      let totalCalories = 0
      let totalProtein = 0
      let totalCarbs = 0
      let totalFat = 0

      dayMeals.forEach((recipe, mealIdx) => {
        const recipeEnergy = recipe.energy || 0
        const recipeProtein = recipe.protein || 0
        const recipeCarbs = recipe.carbohydrate || 0
        const recipeFat = recipe.fat || 0

        totalCalories += recipeEnergy
        totalProtein += recipeProtein
        totalCarbs += recipeCarbs
        totalFat += recipeFat

        const meal: MealPlanMealDoc = {
          _id: new Types.ObjectId(),
          meal_plan_day_id: dayId,
          meal_type: mealTypesPerDay[mealIdx],
          recipe_id: recipe._id,
          servings: 1,
          name: recipe.title,
          description: recipe.description || '',
          ingredients: [],
          instructions: '',
          prep_time: 0,
          cook_time: 0,
          image: recipe.image || '',
          calories: recipeEnergy,
          protein: recipeProtein,
          carbs: recipeCarbs,
          fat: recipeFat,
          fiber: 0,
          sugar: 0,
          sodium: 0,
          meal_order: mealIdx + 1,
          is_optional: mealIdx >= 3, // snack is optional
          alternatives: [],
          notes: '',
          createdAt: now,
          updatedAt: now
        }

        mealPlanMeals.push(meal)
      })

      const dayDoc: MealPlanDayDoc = {
        _id: dayId,
        meal_plan_id: mealPlanId,
        day_number: day,
        title: `Ngày ${day}`,
        description: 'Kết hợp đủ 3 bữa chính và snack nhẹ.',
        total_calories: Math.round(totalCalories),
        total_protein: Math.round(totalProtein),
        total_carbs: Math.round(totalCarbs),
        total_fat: Math.round(totalFat),
        notes: '',
        createdAt: now,
        updatedAt: now
      }

      mealPlanDays.push(dayDoc)
      plan.total_calories += totalCalories
      plan.target_protein += 0 // keep as set above
      plan.target_carbs += 0
      plan.target_fat += 0
    }
  })

  return { mealPlans, mealPlanDays, mealPlanMeals }
}

const toExtendedJSON = (docs: any[]) =>
  JSON.stringify(JSON.parse(EJSON.stringify(docs, { relaxed: false })), null, 2)

const writeSeedFiles = (data: { mealPlans: MealPlanDoc[]; mealPlanDays: MealPlanDayDoc[]; mealPlanMeals: MealPlanMealDoc[] }) => {
  ensureDir()
  fs.writeFileSync(path.join(OUTPUT_DIR, 'meal_plans.json'), toExtendedJSON(data.mealPlans))
  fs.writeFileSync(path.join(OUTPUT_DIR, 'meal_plan_days.json'), toExtendedJSON(data.mealPlanDays))
  fs.writeFileSync(path.join(OUTPUT_DIR, 'meal_plan_meals.json'), toExtendedJSON(data.mealPlanMeals))
}

const insertToDatabase = async (data: { mealPlans: MealPlanDoc[]; mealPlanDays: MealPlanDayDoc[]; mealPlanMeals: MealPlanMealDoc[] }) => {
  await mongoose.connect(MONGODB_URI)
  console.log('✅ Connected to MongoDB')

  const session = await mongoose.startSession()
  session.startTransaction()
  try {
    // Cast to any to satisfy insertMany typings when using Types.ObjectId
    await mongoose.connection.collection('meal_plans').insertMany(data.mealPlans as any[], { session })
    await mongoose.connection.collection('meal_plan_days').insertMany(data.mealPlanDays as any[], { session })
    await mongoose.connection.collection('meal_plan_meals').insertMany(data.mealPlanMeals as any[], { session })
    await session.commitTransaction()
    console.log('✅ Inserted meal plan data')
  } catch (error) {
    await session.abortTransaction()
    throw error
  } finally {
    session.endSession()
    await mongoose.disconnect()
    console.log('👋 Disconnected from MongoDB')
  }
}

const main = async () => {
  const shouldInsert = process.argv.includes('--insert')

  await mongoose.connect(MONGODB_URI)
  const recipes = (await mongoose.connection.collection('recipes').find().project({
    title: 1,
    description: 1,
    image: 1,
    energy: 1,
    protein: 1,
    fat: 1,
    carbohydrate: 1,
    user_id: 1,
    category_recipe_id: 1
  }).toArray()) as unknown as RecipeDoc[]

  if (!recipes.length) {
    console.error('❌ Không tìm thấy công thức nào trong collection recipes. Hãy seed recipes trước.')
    await mongoose.disconnect()
    process.exit(1)
  }

  await mongoose.disconnect()

  const seedData = createMealPlanDocs(recipes)
  writeSeedFiles(seedData)
  console.log('✅ Đã ghi file seed vào scripts/data/generated-meal-plans')

  if (shouldInsert) {
    await insertToDatabase(seedData)
  }
}

main().catch((error) => {
  console.error('❌ Lỗi khi tạo seed meal plan:', error)
  process.exit(1)
})