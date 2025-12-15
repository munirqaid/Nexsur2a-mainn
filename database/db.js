import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGO_URI;
        if (!mongoUri) {
            throw new Error('MONGO_URI is not defined in environment variables');
        }

        await mongoose.connect(mongoUri, {
            // استخدام findOneAndUpdate() و findOneAndRemove() بدلاً من findAndModify()
            
            
        });

        console.log('MongoDB Connected Successfully!');
    } catch (err) {
        console.error('MongoDB Connection Failed:', err.message);
        // إنهاء العملية في حالة فشل الاتصال
        process.exit(1);
    }
};

export default connectDB;
