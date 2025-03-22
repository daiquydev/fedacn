import mongoose, { ConnectOptions } from 'mongoose';
import { envConfig } from '../constants/config';

// console.log(`MongoDB URL: ${envConfig.mongoURL}`);

const connectDB = async () => {
  try {
    const options: ConnectOptions = {

    };
    await mongoose.connect(envConfig.mongoURL, options);
    console.log('Connected to MongoDB successfully!');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
};

export default connectDB;
