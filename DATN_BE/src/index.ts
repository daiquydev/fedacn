import './config/moduleAlias'
import express, { Express, Request, Response } from 'express'
import bodyParser from 'body-parser'
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
app.use(cors())
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ limit: '50mb' }))
app.use(bodyParser.urlencoded({ extended: false, limit: '50mb', parameterLimit: 50000 }))
app.use(
  bodyParser.json({
    limit: '50mb'
  })
)

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

app.use('/api/admin/auth/admins', authAdminRouter)
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
