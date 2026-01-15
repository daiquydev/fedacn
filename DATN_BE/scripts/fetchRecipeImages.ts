import axios from 'axios'
import * as fs from 'fs'
import * as path from 'path'

const UNSPLASH_ACCESS_KEY = 'zS8dTa3CxlAN1_twdyOfWVH6h1Mx2PewqCNdDIpTThU'
const UNSPLASH_API_BASE = 'https://api.unsplash.com'

// Mapping recipe titles to Unsplash search queries
const recipeSearchTerms: Record<string, string> = {
  'Phở Bò Hà Nội': 'vietnamese pho beef',
  'Bún Chả Hà Nội': 'vietnamese bun cha grilled pork',
  'Cơm Tấm Sườn Bì Chả': 'vietnamese broken rice com tam',
  'Gỏi Cuốn Tôm Thịt': 'vietnamese fresh spring rolls',
  'Canh Chua Cá': 'vietnamese sour soup fish',
  'Bánh Xèo Miền Tây': 'vietnamese banh xeo pancake',
  'Chè Đậu Xanh': 'vietnamese mung bean dessert',
  'Gà Xào Sả Ớt': 'vietnamese lemongrass chicken',
  'Cá Kho Tộ': 'vietnamese caramelized fish kho',
  'Rau Muống Xào Tỏi': 'vietnamese water spinach stir fry'
}

interface UnsplashPhoto {
  id: string
  urls: {
    raw: string
    full: string
    regular: string
    small: string
    thumb: string
  }
  user: {
    name: string
    username: string
  }
  links: {
    html: string
  }
}

async function searchUnsplashPhoto(query: string): Promise<string | null> {
  try {
    console.log(`   🔍 Searching: "${query}"`)
    
    const response = await axios.get(`${UNSPLASH_API_BASE}/search/photos`, {
      params: {
        query,
        per_page: 1,
        orientation: 'landscape'
      },
      headers: {
        Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`
      }
    })

    if (response.data.results && response.data.results.length > 0) {
      const photo: UnsplashPhoto = response.data.results[0]
      const imageUrl = photo.urls.regular // 1080px width, good quality
      console.log(`   ✅ Found: ${imageUrl}`)
      console.log(`   📸 By: ${photo.user.name} (@${photo.user.username})`)
      return imageUrl
    } else {
      console.log(`   ⚠️  No results found`)
      return null
    }
  } catch (error: any) {
    console.error(`   ❌ Error searching "${query}":`, error.response?.data || error.message)
    return null
  }
}

async function fetchRecipeImages() {
  try {
    // Read recipes JSON
    const recipesPath = path.join(__dirname, '../../data/recipes.seed.json')
    const recipesData = JSON.parse(fs.readFileSync(recipesPath, 'utf-8'))

    console.log('🚀 Starting to fetch recipe images from Unsplash...\n')

    let successCount = 0
    let failCount = 0

    // Fetch images for each recipe
    for (let i = 0; i < recipesData.length; i++) {
      const recipe = recipesData[i]
      console.log(`\n[${i + 1}/${recipesData.length}] ${recipe.title}`)

      const searchTerm = recipeSearchTerms[recipe.title]
      if (!searchTerm) {
        console.log(`   ⚠️  No search term defined, skipping...`)
        failCount++
        continue
      }

      const imageUrl = await searchUnsplashPhoto(searchTerm)
      
      if (imageUrl) {
        recipe.image = imageUrl
        successCount++
      } else {
        // Keep placeholder if not found
        failCount++
      }

      // Rate limiting: wait 1 second between requests
      if (i < recipesData.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    // Save updated recipes
    fs.writeFileSync(recipesPath, JSON.stringify(recipesData, null, 2), 'utf-8')

    console.log('\n' + '='.repeat(60))
    console.log('📊 SUMMARY')
    console.log('='.repeat(60))
    console.log(`✅ Successfully fetched: ${successCount} images`)
    console.log(`❌ Failed/Skipped: ${failCount} images`)
    console.log(`📁 Updated file: ${recipesPath}`)
    console.log('\n💡 Next step: Run "npm run seed:recipes" to import into database')

  } catch (error) {
    console.error('❌ Error fetching recipe images:', error)
    throw error
  }
}

// Run the fetch function
fetchRecipeImages()
  .then(() => {
    console.log('\n✨ Image fetching completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Image fetching failed:', error)
    process.exit(1)
  })
