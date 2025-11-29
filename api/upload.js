import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs-extra';
import { v4 as uuidv4 } from 'uuid';
import { authenticateToken } from './auth.js';

const router = express.Router();
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

// التأكد من وجود مجلد التحميل
fs.ensureDirSync(UPLOAD_DIR);

// إعداد Multer لتخزين الملفات
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const filename = `${uuidv4()}${ext}`;
        cb(null, filename);
    },
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        // قبول الصور والفيديوهات فقط
        if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image and video files are allowed!'), false);
        }
    },
});

// مسار رفع الملفات
router.post('/', authenticateToken, upload.array('files', 5), (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }

        const fileUrls = req.files.map(file => {
            // يتم تخزين الملفات في public/uploads، لذا يكون المسار العام هو /uploads/filename
            return `/uploads/${file.filename}`;
        });

        res.json({
            message: 'Files uploaded successfully',
            files: fileUrls,
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: error.message || 'File upload failed' });
    }
});

export default router;
