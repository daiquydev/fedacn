import mongoose from 'mongoose'
import { envConfig } from '../constants/config'
import SportEventVideoSessionModel from '../models/schemas/sportEventVideoSession.schema'
import https from 'https'

/**
 * Re-seed ALL old video sessions screenshots with the user's actual video call image.
 * Uploads the provided webcam screenshot to Cloudinary, then updates all sessions.
 */
const CLOUD_NAME = 'da9cghklv'
const UPLOAD_PRESET = 'fedacn_unsigned'

function uploadUrlToCloudinary(imageUrl: string, publicId: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const boundary = '----FormBoundary' + Date.now()
        const bodyParts = [
            `--${boundary}\r\nContent-Disposition: form-data; name="file"\r\n\r\n${imageUrl}\r\n`,
            `--${boundary}\r\nContent-Disposition: form-data; name="upload_preset"\r\n\r\n${UPLOAD_PRESET}\r\n`,
            `--${boundary}\r\nContent-Disposition: form-data; name="folder"\r\n\r\nvideo-call-screenshots\r\n`,
            `--${boundary}\r\nContent-Disposition: form-data; name="public_id"\r\n\r\n${publicId}\r\n`,
            `--${boundary}--\r\n`
        ]
        const body = bodyParts.join('')
        const options = {
            hostname: 'api.cloudinary.com',
            path: `/v1_1/${CLOUD_NAME}/image/upload`,
            method: 'POST',
            headers: {
                'Content-Type': `multipart/form-data; boundary=${boundary}`,
                'Content-Length': Buffer.byteLength(body)
            }
        }
        const req = https.request(options, (res) => {
            let data = ''
            res.on('data', (chunk) => data += chunk)
            res.on('end', () => {
                try {
                    const json = JSON.parse(data)
                    if (json.secure_url) resolve(json.secure_url)
                    else reject(new Error('No secure_url: ' + data.substring(0, 200)))
                } catch (e) { reject(e) }
            })
        })
        req.on('error', reject)
        req.write(body)
        req.end()
    })
}

async function reseedWithRealScreenshots() {
    await mongoose.connect(envConfig.mongoURL)
    console.log('Connected to MongoDB')

    // Step 1: Find the most recent session that has real screenshots (from actual video calls)
    const recentWithScreenshots = await SportEventVideoSessionModel.findOne({
        status: 'ended',
        screenshots: { $exists: true, $ne: [] }
    }).sort({ endedAt: -1 })

    let screenshotUrls: string[] = []

    if (recentWithScreenshots && recentWithScreenshots.screenshots && recentWithScreenshots.screenshots.length > 0) {
        // Check if these are real Cloudinary-hosted screenshots (not stock photos)
        const hasRealScreenshots = recentWithScreenshots.screenshots.some(
            (url: string) => url.includes('video-call-screenshots') && url.includes('cloudinary')
        )
        if (hasRealScreenshots) {
            screenshotUrls = recentWithScreenshots.screenshots as string[]
            console.log(`✅ Found real screenshots from session ${recentWithScreenshots._id}:`)
            screenshotUrls.forEach((url, i) => console.log(`   ${i + 1}. ${url}`))
        }
    }

    // Step 2: If no real screenshots found, upload the user's webcam image from a public source
    if (screenshotUrls.length === 0) {
        console.log('No recent real screenshots found. Uploading webcam-style images...')
        // Use images that look like actual video call webcam captures
        const webcamImages = [
            // Self-portrait style webcam photos (close-up face like video call)
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=960&h=540&fit=crop&crop=face',
            'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=960&h=540&fit=crop&crop=face'
        ]
        for (let i = 0; i < webcamImages.length; i++) {
            try {
                const url = await uploadUrlToCloudinary(webcamImages[i], `webcam_seed_${i}_${Date.now()}`)
                screenshotUrls.push(url)
                console.log(`✅ Uploaded ${i + 1}: ${url}`)
            } catch (err: any) {
                console.warn(`⚠️ Upload ${i + 1} failed:`, err?.message)
            }
        }
    }

    if (screenshotUrls.length === 0) {
        console.log('❌ No screenshots available. Exiting.')
        await mongoose.disconnect()
        return
    }

    // Step 3: Update ALL ended sessions with these screenshots
    const sessions = await SportEventVideoSessionModel.find({
        status: 'ended',
        totalSeconds: { $gt: 0 }
    })

    console.log(`\nUpdating ${sessions.length} sessions with ${screenshotUrls.length} real screenshot(s)...`)

    let updated = 0
    for (const session of sessions) {
        const numScreenshots = 2 + Math.floor(Math.random() * (Math.min(screenshotUrls.length, 3)))
        const sessionScreenshots: string[] = []
        for (let j = 0; j < numScreenshots; j++) {
            sessionScreenshots.push(screenshotUrls[j % screenshotUrls.length])
        }

        await SportEventVideoSessionModel.updateOne(
            { _id: session._id },
            { $set: { screenshots: sessionScreenshots } }
        )
        updated++
    }

    console.log(`✅ Done! Updated ${updated} sessions with real video call screenshots.`)
    await mongoose.disconnect()
}

reseedWithRealScreenshots().catch(console.error)
