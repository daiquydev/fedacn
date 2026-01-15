import axios from 'axios'
import * as fs from 'fs'
import * as path from 'path'

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY || 'zS8dTa3CxlAN1_twdyOfWVH6h1Mx2PewqCNdDIpTThU'
const UNSPLASH_API_BASE = 'https://api.unsplash.com'

interface UnsplashPhoto {
  urls: {
    regular: string
    small: string
    full: string
  }
  user: {
    name: string
    username: string
  }
}

async function searchUnsplashPhoto(query: string, orientation: 'landscape' | 'portrait' = 'landscape'): Promise<string | null> {
  try {
    const response = await axios.get(`${UNSPLASH_API_BASE}/search/photos`, {
      params: {
        query,
        per_page: 1,
        orientation
      },
      headers: {
        Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`
      }
    })

    const photo: UnsplashPhoto | undefined = response.data.results?.[0]
    if (!photo) return null
    return photo.urls.regular
  } catch (error: any) {
    console.error(`   ❌ Unsplash error for "${query}":`, error.response?.data || error.message)
    return null
  }
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

type Oid = { $oid: string }
interface SeedUser {
  _id: Oid
  avatar?: string
  cover_avatar?: string
  avatar_query?: string
  cover_avatar_query?: string
  [key: string]: any
}

interface SeedPost {
  user_id: Oid
  content: string
  image_query?: string
  image_url?: string
  [key: string]: any
}

async function fetchImages() {
  const usersPath = path.join(__dirname, '../../data/users.seed.json')
  const postsPath = path.join(__dirname, '../../data/posts.seed.json')

  const usersData: SeedUser[] = JSON.parse(fs.readFileSync(usersPath, 'utf-8'))
  const postsData: SeedPost[] = JSON.parse(fs.readFileSync(postsPath, 'utf-8'))

  console.log('🚀 Fetching Unsplash images for users...')
  let userAvatarFetched = 0
  let userCoverFetched = 0

  for (let i = 0; i < usersData.length; i++) {
    const user = usersData[i]
    console.log(`
[User ${i + 1}/${usersData.length}] ${user.name}`)

    if (user.avatar_query) {
      const avatarUrl = await searchUnsplashPhoto(user.avatar_query, 'portrait')
      if (avatarUrl) {
        user.avatar = avatarUrl
        userAvatarFetched++
        console.log(`   ✅ Avatar set`)
      } else {
        console.log('   ⚠️  Avatar not found, keeping existing value')
      }
      await delay(800)
    }

    if (user.cover_avatar_query) {
      const coverUrl = await searchUnsplashPhoto(user.cover_avatar_query, 'landscape')
      if (coverUrl) {
        user.cover_avatar = coverUrl
        userCoverFetched++
        console.log(`   ✅ Cover set`)
      } else {
        console.log('   ⚠️  Cover not found, keeping existing value')
      }
      await delay(800)
    }
  }

  console.log('\n🚀 Fetching Unsplash images for posts...')
  let postFetched = 0

  for (let i = 0; i < postsData.length; i++) {
    const post = postsData[i]
    console.log(`
[Post ${i + 1}/${postsData.length}] ${post.content.slice(0, 40)}...`)

    if (post.image_query) {
      const imageUrl = await searchUnsplashPhoto(post.image_query, 'landscape')
      if (imageUrl) {
        post.image_url = imageUrl
        postFetched++
        console.log('   ✅ Image set')
      } else {
        console.log('   ⚠️  Image not found, keeping existing value')
      }
      await delay(800)
    }
  }

  fs.writeFileSync(usersPath, JSON.stringify(usersData, null, 2), 'utf-8')
  fs.writeFileSync(postsPath, JSON.stringify(postsData, null, 2), 'utf-8')

  console.log('\n📊 Summary')
  console.log(`   User avatars fetched: ${userAvatarFetched}`)
  console.log(`   User covers fetched: ${userCoverFetched}`)
  console.log(`   Post images fetched: ${postFetched}`)
  console.log('\n💡 Next: run "npm run seed:users-posts" to insert data into MongoDB')
}

fetchImages()
  .then(() => {
    console.log('\n✨ Image fetching completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Image fetching failed:', error)
    process.exit(1)
  })
