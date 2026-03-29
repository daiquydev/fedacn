import './config/moduleAlias'
import express, { Express, Request, Response } from 'express'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import morgan from 'morgan'
import { envConfig } from './constants/config'
import connectDB from './services/database.services'
import usersRouter from './routes/userRoutes/user.routes'
import blogsRouter from './routes/userRoutes/blog.routes'
import authUserRouter from './routes/userRoutes/authUser.routes'
import { defaultErrorHandler } from './middlewares/error.middleware'
import postsRouter from './routes/userRoutes/post.routes'
import authAdminRouter from './routes/adminRoutes/authAdmin.routes'
import activitiesRouter from './routes/userRoutes/activity.routes'
import calculatorsRouter from './routes/userRoutes/calculator.routes'
import workoutScheduleRouter from './routes/userRoutes/workoutSchedule.routes'
import recipesRouter from './routes/userRoutes/recipe.routes'
import albumsRouter from './routes/userRoutes/album.routes'
import ingredientsRouter from './routes/userRoutes/ingredient.routes'
import mealSchedulesRouter from './routes/userRoutes/mealSchedule.routes'
import seachRouter from './routes/userRoutes/search.routes'
import userAdminRouter from './routes/adminRoutes/userAdmin.routes'
import inspectorRouter from './routes/adminRoutes/inspector.routes'
import writterRouter from './routes/adminRoutes/writter.routes'
import { createServer } from 'http'
import initSocket from './utils/socket'
import notificationsRouter from './routes/userRoutes/notification.routes'
import mealPlansRouter from './routes/userRoutes/mealPlan.routes'
import userMealSchedulesRouter from './routes/userRoutes/userMealSchedule.routes'
import { trainRecipesRecommender } from './utils/recommend'
import { initializeDatabase } from './config/initDatabase'
import nutritionRouter from './routes/userRoutes/nutrition.routes'
import lowdbRecipesRouter from './routes/userRoutes/lowdbRecipes.routes'
import personalDashboardRouter from './routes/userRoutes/personalDashboard.routes'
import sportEventRouter from './routes/userRoutes/sportEvent.routes'
import sportCategoryRouter from './routes/userRoutes/sportCategory.routes'
import adminSportCategoryRouter from './routes/adminRoutes/sportCategory.routes'
import adminSportEventRouter from './routes/adminRoutes/sportEvent.routes'
import exerciseRouter from './routes/userRoutes/exercise.routes'
import workoutSessionRouter from './routes/userRoutes/workoutSession.routes'
import publicEquipmentRouter from './routes/userRoutes/equipment.routes'
import publicMuscleGroupRouter from './routes/userRoutes/muscleGroup.routes'
import adminEquipmentRouter from './routes/adminRoutes/equipment.routes'
import adminMuscleGroupRouter from './routes/adminRoutes/muscleGroup.routes'
import adminExerciseRouter from './routes/adminRoutes/exercise.routes'
import aiRouter from './routes/userRoutes/ai.routes'
import savedWorkoutTemplateRouter from './routes/userRoutes/savedWorkoutTemplate.routes'

import trainingRouter from './routes/userRoutes/training.routes'
import challengeRouter from './routes/userRoutes/challenge.routes'
import adminChallengeRouter from './routes/adminRoutes/challenge.routes'

const app: Express = express()
const port = envConfig.port

const httpServer = createServer(app)

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Skip rate limiting for public explore endpoints
  skip: (req) => {
    return req.path.includes('/public') || req.path.includes('/explore')
  }
  // store: ... , // Use an external store for more precise rate limiting
})

// Higher rate limit for public/explore endpoints
const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5000, // Allow more requests for public content
  standardHeaders: true,
  legacyHeaders: false
})

app.set('trust proxy', 1) // Trust first proxy

app.use(limiter)
app.use(morgan('combined'))
app.use(helmet())

// Cấu hình CORS để cho phép các URL từ Vercel và localhost
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:4000',
  'http://localhost:5173',
  envConfig.CLIENT_URL,
  envConfig.ADMIN_URL
].filter(Boolean)

app.use(
  cors({
    origin: function (origin, callback) {
      // Cho phép các request không có origin (ví dụ: mobile apps, curl)
      if (!origin) return callback(null, true)

      if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
        callback(null, true)
      } else {
        callback(new Error('Not allowed by CORS'))
      }
    },
    credentials: true
  })
)

app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: false, limit: '50mb' }))

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'))

app.get('/', (req: Request, res: Response) => {
  res.send('Hello World!')
})

app.use('/api/auth/users', authUserRouter)
app.use('/api/users', usersRouter)
app.use('/api/blogs', blogsRouter)
app.use('/api/posts/public', publicLimiter) // Apply higher limit to public posts
app.use('/api/posts', postsRouter)
app.use('/api/activities', activitiesRouter)
app.use('/api/calculators', calculatorsRouter)
app.use('/api/workout-schedules', workoutScheduleRouter)
app.use('/api/meal-schedules', mealSchedulesRouter)
app.use('/api/recipes', recipesRouter)
app.use('/api/albums', albumsRouter)
app.use('/api/ingredients', ingredientsRouter)
app.use('/api/search', seachRouter)
app.use('/api/notifications', notificationsRouter)
app.use('/api/meal-plans/public', publicLimiter) // Apply higher limit to public meal plans
app.use('/api/meal-plans', mealPlansRouter)
app.use('/api/user-meal-schedules', userMealSchedulesRouter)

// New lowdb-based APIs
app.use('/api/lowdb-recipes', lowdbRecipesRouter)
app.use('/api/nutrition', nutritionRouter)
app.use('/api/personal-dashboard', personalDashboardRouter)
app.use('/api/sport-events', sportEventRouter)
app.use('/api/sport-categories', sportCategoryRouter)
app.use('/api/exercises', exerciseRouter)
app.use('/api/workout-sessions', workoutSessionRouter)
app.use('/api/equipment', publicEquipmentRouter)
app.use('/api/muscle-groups', publicMuscleGroupRouter)
app.use('/api/ai', aiRouter)
app.use('/api/saved-workouts', savedWorkoutTemplateRouter)

app.use('/api/trainings', trainingRouter)
app.use('/api/challenges', challengeRouter)

app.use('/api/admin/auth/admins', authAdminRouter)
app.use('/api/admin/sport-categories', adminSportCategoryRouter)
app.use('/api/admin/sport-events', adminSportEventRouter)
app.use('/api/admin/equipment', adminEquipmentRouter)
app.use('/api/admin/muscle-groups', adminMuscleGroupRouter)
app.use('/api/admin/exercises', adminExerciseRouter)
app.use('/api/admin/challenges', adminChallengeRouter)
app.use('/api/admin', userAdminRouter)
app.use('/api/inspectors', inspectorRouter)
app.use('/api/writters', writterRouter)

app.use(defaultErrorHandler)

initSocket(httpServer)

// Start server only after database is connected
async function startServer() {
  try {
    await connectDB()

    // Initialize database and seed data after connection
    trainRecipesRecommender()
    await initializeDatabase()

    httpServer.listen(port, () => {
      console.log(`Example app listening on port ${port}`)
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

if (process.env.NODE_ENV !== 'test') {
  startServer()
}

export { app, httpServer, startServer }
