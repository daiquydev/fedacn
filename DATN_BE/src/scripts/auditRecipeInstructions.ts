import 'dotenv/config'
import { Types } from 'mongoose'
import connectDB from '~/services/database.services'
import RecipeModel from '~/models/schemas/recipe.schema'
import MealPlanMealModel from '~/models/schemas/mealPlanMeal.schema'

type RecipeRecord = {
  _id: Types.ObjectId
  title: string
  description?: string
  content?: string
  instructions?: any
  processing_food?: string
}

type ScriptOptions = {
  applyFallbacks: boolean
  includeAllRecipes: boolean
  specificRecipeId?: string
  limit?: number
  verbose: boolean
}

const parseArgs = (): ScriptOptions => {
  const args = process.argv.slice(2)
  const hasFlag = (flag: string) => args.includes(flag)
  const getValue = (flag: string) => {
    const prefix = `${flag}=`
    const match = args.find((arg) => arg.startsWith(prefix))
    return match ? match.substring(prefix.length) : undefined
  }

  return {
    applyFallbacks: hasFlag('--apply'),
    includeAllRecipes: hasFlag('--all-recipes'),
    specificRecipeId: getValue('--recipe'),
    limit: getValue('--limit') ? Number(getValue('--limit')) : undefined,
    verbose: hasFlag('--verbose')
  }
}

const normalizeInstructionInput = (source: any): string[] => {
  if (!source) return []

  const extractFromEntry = (entry: any): string => {
    if (typeof entry === 'string') return entry.trim()
    if (entry && typeof entry === 'object') {
      if (typeof entry.instruction === 'string') return entry.instruction.trim()
      if (typeof entry.description === 'string') return entry.description.trim()
      if (typeof entry.step === 'string') return entry.step.trim()
      if (typeof entry.note === 'string') return entry.note.trim()
    }
    return ''
  }

  if (Array.isArray(source)) {
    return source.map(extractFromEntry).filter(Boolean)
  }

  if (typeof source === 'string') {
    const trimmed = source.trim()
    if (!trimmed) return []

    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed)
        if (Array.isArray(parsed)) {
          return parsed.map(extractFromEntry).filter(Boolean)
        }
      } catch (error) {
        // ignore malformed JSON strings
      }
    }

    return trimmed
      .split(/\r?\n+/)
      .map((line) => line.replace(/^[0-9]+[\.\)\-]\s*/, '').trim())
      .filter(Boolean)
  }

  return []
}

const stripHtml = (value = '') => value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()

const buildFallbackSteps = (recipe: RecipeRecord): string[] => {
  const candidates = [recipe.processing_food, stripHtml(recipe.content || ''), recipe.description]
    .filter((value): value is string => typeof value === 'string' && Boolean(value.trim()))

  if (!candidates.length) return []

  const [primary] = candidates
  const segments = primary
    .split(/\r?\n+/)
    .map((segment) => segment.replace(/^[\d+\-\.\)\s]+/, '').trim())
    .filter((segment) => segment.length >= 10)

  if (segments.length) {
    return segments
  }

  const sentences = primary
    .split(/(?<=[\.\!\?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length >= 10)

  if (sentences.length) {
    return sentences
  }

  return [primary.trim()]
}

const logRecipe = (recipe: RecipeRecord, message: string, verbose: boolean) => {
  if (!verbose) return
  console.log(`- ${recipe.title} (${recipe._id.toString()}): ${message}`)
}

const resolveRecipeIdFilter = (value?: string) => {
  if (!value) return undefined
  if (!Types.ObjectId.isValid(value)) {
    console.error(`Invalid recipe id provided: ${value}`)
    process.exit(1)
  }
  return new Types.ObjectId(value)
}

const run = async () => {
  const options = parseArgs()
  await connectDB()

  const recipeIdFilter = resolveRecipeIdFilter(options.specificRecipeId)
  let recipeIdsFromMealPlans: Types.ObjectId[] = []

  if (!options.includeAllRecipes && !recipeIdFilter) {
    const ids = await MealPlanMealModel.distinct('recipe_id', { recipe_id: { $ne: null } })
    recipeIdsFromMealPlans = ids as Types.ObjectId[]
  }

  const query: Record<string, unknown> = {}
  if (recipeIdFilter) {
    query._id = recipeIdFilter
  } else if (!options.includeAllRecipes) {
    query._id = { $in: recipeIdsFromMealPlans }
  }

  const documents = (await RecipeModel.find(query)
    .select('title description content instructions processing_food updated_at')
    .limit(options.limit ?? 0)
    .lean()) as RecipeRecord[]

  const affected = documents.filter((recipe) => normalizeInstructionInput(recipe.instructions).length === 0)

  console.log(`Found ${affected.length} recipe(s) without usable instructions out of ${documents.length} scanned.`)

  if (!affected.length) {
    process.exit(0)
  }

  if (!options.applyFallbacks) {
    affected.forEach((recipe) => logRecipe(recipe, 'missing instructions', true))
    console.log('Run with --apply to write fallback steps (best-effort).')
    process.exit(0)
  }

  let updatedCount = 0
  let skippedCount = 0

  for (const recipe of affected) {
    const fallbackSteps = buildFallbackSteps(recipe)
    if (!fallbackSteps.length) {
      skippedCount += 1
      logRecipe(recipe, 'no fallback source available', options.verbose)
      continue
    }

    await RecipeModel.updateOne(
      { _id: recipe._id },
      {
        $set: {
          instructions: fallbackSteps,
          updated_at: new Date()
        }
      }
    )

    updatedCount += 1
    logRecipe(recipe, `applied ${fallbackSteps.length} fallback step(s)`, options.verbose)
  }

  console.log(`Applied fallback instructions to ${updatedCount} recipe(s). Skipped ${skippedCount}.`)
  process.exit(0)
}

run().catch((error) => {
  console.error('auditRecipeInstructions failed:', error)
  process.exit(1)
})
