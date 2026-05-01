import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { v2 as cloudinary } from 'cloudinary';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Setup Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const DB_URI = process.env.MONGODB_URL as string;

const SportEventVideoSessionModel = mongoose.connection.collection('sport_event_video_sessions');
const SportEventProgressModel = mongoose.connection.collection('sport_event_progress');

const updateImages = async () => {
    try {
        await mongoose.connect(DB_URI);
        console.log('Connected to MongoDB');

        const imagesDir = path.resolve(__dirname, '../assets/webcam_images');
        if (!fs.existsSync(imagesDir)) {
            throw new Error(`Directory not found: ${imagesDir}`);
        }

        const files = fs.readdirSync(imagesDir).filter(f => /\.(jpg|jpeg|png)$/i.test(f));
        
        if (files.length === 0) {
            throw new Error(`No images found in ${imagesDir}. Please place the 5 images there.`);
        }

        console.log(`Found ${files.length} images. Uploading to Cloudinary...`);
        const uploadedUrls: string[] = [];

        for (const file of files) {
            const filePath = path.join(imagesDir, file);
            console.log(`Uploading ${file}...`);
            const result = await cloudinary.uploader.upload(filePath, {
                folder: 'webcam_screenshots',
                resource_type: 'image'
            });
            uploadedUrls.push(result.secure_url);
            console.log(`Uploaded to: ${result.secure_url}`);
        }

        console.log('Successfully uploaded all images. Updating database...');

        const userEmail = 'user1@gmail.com';
        const user = await mongoose.connection.collection('users').findOne({ email: userEmail });
        if (!user) throw new Error('User not found');
        
        const eventId = new mongoose.Types.ObjectId('69f46280fbe1f95a1f8a0e22');

        // Get all video sessions for this user and event
        const sessions = await SportEventVideoSessionModel.find({ eventId, userId: user._id }).toArray();
        console.log(`Found ${sessions.length} video sessions to update.`);

        let updatedCount = 0;
        for (const session of sessions) {
            // Pick a random image from uploadedUrls
            const randomImg = uploadedUrls[Math.floor(Math.random() * uploadedUrls.length)];

            // Update session
            await SportEventVideoSessionModel.updateOne(
                { _id: session._id },
                { $set: { screenshots: [randomImg] } }
            );

            // Update progress
            if (session.progressId) {
                await SportEventProgressModel.updateOne(
                    { _id: session.progressId },
                    { $set: { proofImage: randomImg } }
                );
            }
            updatedCount++;
        }

        console.log(`Successfully updated ${updatedCount} activities with random new images!`);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

updateImages();
