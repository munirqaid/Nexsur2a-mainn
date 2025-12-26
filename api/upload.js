import express from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { authenticateToken } from './auth.js';
import { User } from '../database/models.js';

const router = express.Router();

// إعداد تخزين Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // التأكد من أن المسار موجود
        cb(null, 'public/uploads/');
    },
    filename: (req, file, cb) => {
        // إنشاء اسم ملف فريد
        const uniqueSuffix = uuidv4();
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

// فلترة الملفات
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/gif') {
        cb(null, true);
    } else {
        cb(null, false);
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 5 // 5MB
    },
    fileFilter: fileFilter
});

// ============ Routes ============

// رفع صورة الملف الشخصي (Avatar)
router.post('/avatar', authenticateToken, upload.single('avatar'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const userId = req.user.id;
        // المسار الذي سيتم حفظه في قاعدة البيانات
        const avatarUrl = `/uploads/${req.file.filename}`;

        // تحديث حقل avatarUrl للمستخدم
        await User.findByIdAndUpdate(userId, { avatarUrl }, { new: true });

        res.json({
            message: 'Avatar uploaded successfully',
            avatarUrl: avatarUrl
        });

    } catch (error) {
        console.error('Error uploading avatar:', error);
        res.status(500).json({ error: 'Failed to upload avatar' });
    }
});

// رفع صورة الغلاف (Banner)
router.post('/banner', authenticateToken, upload.single('banner'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const userId = req.user.id;
        const bannerUrl = `/uploads/${req.file.filename}`;

        await User.findByIdAndUpdate(userId, { bannerUrl }, { new: true });

        res.json({
            message: 'Banner uploaded successfully',
            bannerUrl: bannerUrl
        });

    } catch (error) {
        console.error('Error uploading banner:', error);
        res.status(500).json({ error: 'Failed to upload banner' });
    }
});

// يمكن إضافة مسار لرفع صور القصص هنا لاحقًا إذا كان هناك نموذج للقصص (Stories)
// بما أن نموذج القصة غير موجود في models.js، سنكتفي بالملف الشخصي حاليًا.

export default router;
