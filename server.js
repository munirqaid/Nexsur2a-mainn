import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './database/db.js';
import path from 'path';
import { fileURLToPath } from 'url';

// Import API routes
import authRoutes from './api/auth.js';
import usersRoutes from './api/users.js';
import postsRoutes from './api/posts.js';
import commentsRoutes from './api/comments.js';
import notificationsRoutes from './api/notifications.js';
import searchRoutes from './api/search.js';
import creatorRoutes from './api/creator.js';
import uploadRoutes from './api/upload.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// ============ Middleware ============
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// ============ API Routes ============
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/comments', commentsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/creator', creatorRoutes);
app.use('/api/upload', uploadRoutes);

// ============ Health Check ============
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Nexora API is running' });
});

// ============ Serve Frontend ============
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ============ Error Handling ============
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    status: err.status || 500,
  });
});

// ============ Start Server ============
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Nexora Server running on http://localhost:${PORT}`);
    console.log(`📱 API available at http://localhost:${PORT}/api`);
  });
});
