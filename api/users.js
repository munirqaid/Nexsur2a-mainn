import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { User, Relationship } from '../database/models.js';
import { authenticateToken } from './auth.js';

const router = express.Router();

// ============ Routes ============

// الحصول على ملف المستخدم
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: user,
      profile: user,
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// تحديث ملف المستخدم
router.put('/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { displayName, bio, avatarUrl, bannerUrl, privacyLevel } = req.body;

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
    if (avatarUrl) updateData.avatarUrl = avatarUrl;
    if (bannerUrl) updateData.bannerUrl = bannerUrl;
    if (privacyLevel) updateData.privacyLevel = privacyLevel;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    await User.findByIdAndUpdate(userId, updateData, { new: true });

    res.json({ message: 'Profile updated successfully' });
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

    if (followerId === userId) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // التحقق مما إذا كان المستخدم يتابع بالفعل
    const existingFollow = await Relationship.findOne({ followerId, followingId: userId });
    if (existingFollow) {
      return res.status(400).json({ error: 'Already following this user' });
    }

    // إضافة علاقة المتابعة
    await Relationship.create({ followerId, followingId: userId });

    // تحديث قوائم المتابعة/المتابَعين (اختياري لكن مفيد)
    await User.findByIdAndUpdate(followerId, { $push: { following: userId } });
    await User.findByIdAndUpdate(userId, { $push: { followers: followerId } });

    res.json({ message: 'User followed successfully' });
  } catch (error) {
    console.error('Error following user:', error);
    res.status(500).json({ error: 'Failed to follow user' });
  }
});

// إلغاء متابعة مستخدم
router.post('/:userId/unfollow', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const followerId = req.user.id;

    // حذف علاقة المتابعة
    const result = await Relationship.deleteOne({ followerId, followingId: userId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Not following this user' });
    }

    // تحديث قوائم المتابعة/المتابَعين (اختياري لكن مفيد)
    await User.findByIdAndUpdate(followerId, { $pull: { following: userId } });
    await User.findByIdAndUpdate(userId, { $pull: { followers: followerId } });

    res.json({ message: 'User unfollowed successfully' });
  } catch (error) {
    console.error('Error unfollowing user:', error);
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
    console.error('Error fetching followers:', error);
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
    console.error('Error fetching following:', error);
    res.status(500).json({ error: 'Failed to fetch following' });
  }
});

export default router;
