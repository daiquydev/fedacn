import mongoose from 'mongoose'
import * as fs from 'fs'
import * as path from 'path'
import UserModel from '../src/models/schemas/user.schema'
import PostModel from '../src/models/schemas/post.schema'
import ImagePostModel from '../src/models/schemas/imagePost.schema'
import { PostStatus, PostTypes } from '../src/constants/enums'
import { hashPassword } from '../src/utils/crypto'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://yugi:yugi01@datn.zqrquqt.mongodb.net/test?retryWrites=true&w=majority'

type Oid = { $oid: string }
interface SeedUser {
  _id: Oid
  password: string
  avatar_query?: string
  cover_avatar_query?: string
  [key: string]: any
}

interface SeedPost {
  user_id: Oid
  content: string
  image_url?: string
  [key: string]: any
}

async function seed() {
  const usersPath = path.join(__dirname, '../../data/users.seed.json')
  const postsPath = path.join(__dirname, '../../data/posts.seed.json')

  const usersData: SeedUser[] = JSON.parse(fs.readFileSync(usersPath, 'utf-8'))
  const postsData: SeedPost[] = JSON.parse(fs.readFileSync(postsPath, 'utf-8'))

  await mongoose.connect(MONGODB_URI)
  console.log('✅ Connected to MongoDB')

  const userObjectIds = usersData.map((u) => new mongoose.Types.ObjectId(u._id.$oid))

  // Clean old seed data for these users
  const existingPostIds = await PostModel.find({ user_id: { $in: userObjectIds } }).distinct('_id')
  await Promise.all([
    ImagePostModel.deleteMany({ post_id: { $in: existingPostIds } }),
    PostModel.deleteMany({ _id: { $in: existingPostIds } }),
    UserModel.deleteMany({ _id: { $in: userObjectIds } })
  ])

  // Insert users with hashed password
  const usersToInsert = []
  for (const user of usersData) {
    const hashedPassword = await hashPassword(user.password)
    const { avatar_query, cover_avatar_query, ...rest } = user
    usersToInsert.push({
      ...rest,
      _id: new mongoose.Types.ObjectId(user._id.$oid),
      password: hashedPassword
    })
  }

  const insertedUsers = await UserModel.insertMany(usersToInsert)
  console.log(`👤 Inserted users: ${insertedUsers.length}`)

  // Insert posts and image_posts
  const postsToInsert = [] as any[]
  const imagesToInsert = [] as any[]

  for (const post of postsData) {
    const postId = new mongoose.Types.ObjectId()
    const userId = new mongoose.Types.ObjectId(post.user_id.$oid)

    postsToInsert.push({
      _id: postId,
      content: post.content,
      user_id: userId,
      type: PostTypes.post,
      status: PostStatus.publish
    })

    if (post.image_url) {
      imagesToInsert.push({
        post_id: postId,
        url: post.image_url
      })
    }
  }

  const insertedPosts = await PostModel.insertMany(postsToInsert)
  console.log(`📝 Inserted posts: ${insertedPosts.length}`)

  if (imagesToInsert.length) {
    const insertedImages = await ImagePostModel.insertMany(imagesToInsert)
    console.log(`🖼️  Inserted post images: ${insertedImages.length}`)
  } else {
    console.log('🖼️  No post images to insert')
  }
}

seed()
  .then(async () => {
    await mongoose.disconnect()
    console.log('👋 Done seeding users and posts')
    process.exit(0)
  })
  .catch(async (error) => {
    console.error('💥 Seeding failed:', error)
    await mongoose.disconnect()
    process.exit(1)
  })
