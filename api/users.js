import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { User, Relationship } from '../database/models.js';
import { authenticateToken } from './auth.js';

const router = express.Router();

// إعداد multer لتخزين الملفات
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'public/uploads/profiles';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// ============ Routes ============

// الحصول على ملف المستخدم
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user: user, profile: user });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// الحصول على ملف المستخدم الحالي
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user: user, profile: user });
  } catch (error) {
    console.error('Error fetching current user:', error);
    res.status(500).json({ error: 'Failed to fetch current user' });
  }
});

// تحديث ملف المستخدم (يدعم رفع الصور)
router.put('/:userId', authenticateToken, upload.fields([
  { name: 'avatar', maxCount: 1 },
  { name: 'banner', maxCount: 1 }
]), async (req, res) => {
  try {
    const { userId } = req.params;
    const { displayName, bio, privacyLevel } = req.body;

    if (req.user.id !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updateData = {};
    if (displayName) updateData.displayName = displayName;
    if (bio) updateData.bio = bio;
    if (privacyLevel) updateData.privacyLevel = privacyLevel;

    // معالجة رفع الصورة الشخصية
    if (req.files && req.files['avatar']) {
      updateData.avatarUrl = `/uploads/profiles/${req.files['avatar'][0].filename}`;
    }

    // معالجة رفع صورة الغلاف
    if (req.files && req.files['banner']) {
      updateData.bannerUrl = `/uploads/profiles/${req.files['banner'][0].filename}`;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true }).select('-password');

    res.json({ 
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// متابعة مستخدم
router.post('/:userId/follow', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const followerId = req.user.id;
    if (followerId === userId) return res.status(400).json({ error: 'Cannot follow yourself' });
    const targetUser = await User.findById(userId);
    if (!targetUser) return res.status(404).json({ error: 'User not found' });
    const existingFollow = await Relationship.findOne({ followerId, followingId: userId });
    if (existingFollow) return res.status(400).json({ error: 'Already following this user' });
    await Relationship.create({ followerId, followingId: userId });
    await User.findByIdAndUpdate(followerId, { $push: { following: userId } });
    await User.findByIdAndUpdate(userId, { $push: { followers: followerId } });
    res.json({ message: 'User followed successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to follow user' });
  }
});

// إلغاء متابعة مستخدم
router.post('/:userId/unfollow', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const followerId = req.user.id;
    const result = await Relationship.deleteOne({ followerId, followingId: userId });
    if (result.deletedCount === 0) return res.status(404).json({ error: 'Not following this user' });
    await User.findByIdAndUpdate(followerId, { $pull: { following: userId } });
    await User.findByIdAndUpdate(userId, { $pull: { followers: followerId } });
    res.json({ message: 'User unfollowed successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to unfollow user' });
  }
});

// الحصول على قائمة المتابعين
router.get('/:userId/followers', async (req, res) => {
  try {
    const { userId } = req.params;
    const followers = await Relationship.find({ followingId: userId })
      .populate('followerId', 'username displayName avatarUrl')
      .select('followerId -_id');
    const formattedFollowers = followers.map(f => ({
      id: f.followerId._id,
      username: f.followerId.username,
      displayName: f.followerId.displayName,
      avatarUrl: f.followerId.avatarUrl,
    }));
    res.json({ followers: formattedFollowers });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch followers' });
  }
});

// الحصول على قائمة المتابَعين
router.get('/:userId/following', async (req, res) => {
  try {
    const { userId } = req.params;
    const following = await Relationship.find({ followerId: userId })
      .populate('followingId', 'username displayName avatarUrl')
      .select('followingId -_id');
    const formattedFollowing = following.map(f => ({
      id: f.followingId._id,
      username: f.followingId.username,
      displayName: f.followingId.displayName,
      avatarUrl: f.followingId.avatarUrl,
    }));
    res.json({ following: formattedFollowing });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch following' });
  }
});

export default router;
