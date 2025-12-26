import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Comment, Post } from '../database/models.js';
import { authenticateToken } from './auth.js';

const router = express.Router();

// ============ Routes ============

// إضافة تعليق على منشور
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { postId, content, parentCommentId, mentions } = req.body;
    const userId = req.user.id;

    if (!postId || !content) {
      return res.status(400).json({ error: 'Post ID and content are required' });
    }

    // التحقق من وجود المنشور
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const newComment = new Comment({
      postId,
      userId,
      content,
      parentCommentId: parentCommentId || null,
    });

    await newComment.save();

    // تحديث عدد التعليقات
    await Post.findByIdAndUpdate(postId, { $inc: { commentCount: 1 } });

    res.status(201).json({
      message: 'Comment added successfully',
      commentId: newComment._id,
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// الحصول على تعليقات منشور
router.get('/post/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const postComments = await Comment.find({ postId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset)
      .populate('userId', 'username displayName avatarUrl');

    const commentsWithData = postComments.map(comment => ({
      id: comment._id,
      postId: comment.postId,
      userId: comment.userId._id,
      content: comment.content,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      author: {
        id: comment.userId._id,
        username: comment.userId.username,
        displayName: comment.userId.displayName,
        avatarUrl: comment.userId.avatarUrl,
      },
    }));

    res.json({ comments: commentsWithData });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// تحديث تعليق
router.put('/:commentId', authenticateToken, async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (comment.userId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await Comment.findByIdAndUpdate(commentId, { content }, { new: true });

    res.json({ message: 'Comment updated successfully' });
  } catch (error) {
    console.error('Error updating comment:', error);
    res.status(500).json({ error: 'Failed to update comment' });
  }
});

// حذف تعليق
router.delete('/:commentId', authenticateToken, async (req, res) => {
  try {
    const { commentId } = req.params;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (comment.userId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // حذف التعليق
    const result = await Comment.findByIdAndDelete(commentId);

    // تحديث عدد التعليقات
    if (result) {
      await Post.findByIdAndUpdate(comment.postId, { $inc: { commentCount: -1 } });
    }

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

// إضافة رد فعل على تعليق
router.post('/:commentId/react', authenticateToken, async (req, res) => {
  try {
    const { commentId } = req.params;
    const { reactionType } = req.body;
    const userId = req.user.id;

    if (!reactionType) {
      return res.status(400).json({ error: 'Reaction type is required' });
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // هنا يجب أن يكون هناك جدول منفصل للتفاعلات، ولكن للتبسيط سنقوم بزيادة العداد مباشرة
    // في تطبيق حقيقي، يجب التحقق من أن المستخدم لم يتفاعل بالفعل
    if (reactionType === 'like') {
      await Comment.findByIdAndUpdate(commentId, { $inc: { likeCount: 1 } });
    }

    res.status(201).json({ message: 'Reaction added successfully' });
  } catch (error) {
    console.error('Error adding reaction:', error);
    res.status(500).json({ error: 'Failed to add reaction' });
  }
});

export default router;
