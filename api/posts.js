import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Post, User, Like } from '../database/models.js';
import { authenticateToken } from './auth.js';

const router = express.Router();

// ============ Routes ============

// إنشاء منشور جديد
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { content, postType, mediaUrls, location, hashtags, mentions, isMonetized } = req.body;
    const userId = req.user.id;

    if (!content || !postType) {
      return res.status(400).json({ error: 'Content and post type are required' });
    }

    const newPost = new Post({
      userId,
      content,
      postType,
      mediaUrls: mediaUrls || [],
      location: location || null,
      hashtags: hashtags || [],
      mentions: mentions || [],
      isMonetized: isMonetized || false,
    });

    await newPost.save();

    res.status(201).json({
      message: 'Post created successfully',
      postId: newPost._id,
    });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// دالة مساعدة لتحويل المنشورات من قاعدة البيانات (لم تعد ضرورية مع Mongoose)
const formatPost = (post) => ({
  id: post._id,
  userId: post.userId,
  content: post.content,
  postType: post.postType,
  mediaUrls: post.mediaUrls,
  location: post.location,
  hashtags: post.hashtags,
  mentions: post.mentions,
  isMonetized: post.isMonetized,
  likeCount: post.likeCount,
  commentCount: post.commentCount,
  shareCount: post.shareCount,
  createdAt: post.createdAt,
  updatedAt: post.updatedAt,
  author: post.userId ? {
    id: post.userId._id,
    username: post.userId.username,
    displayName: post.userId.displayName,
    avatarUrl: post.userId.avatarUrl,
  } : null,
});

// الحصول على جميع المنشورات (خلاصة)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset)
      .populate('userId', 'username displayName avatarUrl');

    const postsWithUsers = posts.map(formatPost);

    res.json({ posts: postsWithUsers });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// الحصول على منشور واحد
router.get('/:postId', async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await Post.findById(postId).populate('userId', 'username displayName avatarUrl');

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json(formatPost(post));
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

// تحديث منشور
router.put('/:postId', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const { content, hashtags, mentions } = req.body;
    const userId = req.user.id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (post.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const updateData = {};
    if (content) updateData.content = content;
    if (hashtags) updateData.hashtags = hashtags;
    if (mentions) updateData.mentions = mentions;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    await Post.findByIdAndUpdate(postId, updateData, { new: true });

    res.json({ message: 'Post updated successfully' });
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ error: 'Failed to update post' });
  }
});

// حذف منشور
router.delete('/:postId', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (post.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await Post.findByIdAndDelete(postId);

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

// الإعجاب/إلغاء الإعجاب بمنشور
router.post('/:postId/like', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const existingLike = await Like.findOne({ postId, userId });

    if (existingLike) {
      // إلغاء الإعجاب
      await Like.findByIdAndDelete(existingLike._id);
      await Post.findByIdAndUpdate(postId, { $inc: { likeCount: -1 } });
      res.json({ message: 'Post unliked successfully', liked: false });
    } else {
      // الإعجاب
      const newLike = new Like({ postId, userId });
      await newLike.save();
      await Post.findByIdAndUpdate(postId, { $inc: { likeCount: 1 } });
      res.json({ message: 'Post liked successfully', liked: true });
    }
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({ error: 'Failed to toggle like' });
  }
});

// مشاركة منشور (زيادة عداد المشاركات)
router.post('/:postId/share', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    await Post.findByIdAndUpdate(postId, { $inc: { shareCount: 1 } });

    res.json({ message: 'Post shared successfully' });
  } catch (error) {
    console.error('Error sharing post:', error);
    res.status(500).json({ error: 'Failed to share post' });
  }
});

// الحصول على منشورات المستخدم
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const userPosts = await Post.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset)
      .populate('userId', 'username displayName avatarUrl');

    const postsWithData = userPosts.map(formatPost);

    res.json({ posts: postsWithData });
  } catch (error) {
    console.error('Error fetching user posts:', error);
    res.status(500).json({ error: 'Failed to fetch user posts' });
  }
});

export default router;
