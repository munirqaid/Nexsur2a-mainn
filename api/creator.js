import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database/db.js';

import { eq, and, desc } from 'drizzle-orm';
import { authenticateToken } from './auth.js';

const router = express.Router();

// ============ Routes ============

// الحصول على تحليلات المنشئ
router.get('/analytics', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const analytics = await db.select()
      .from(creatorAnalytics)
      .where(eq(creatorAnalytics.userId, userId))
      .limit(1);

    if (analytics.length === 0) {
      // إنشاء تحليلات افتراضية
      const analyticsId = uuidv4();
      const now = new Date();

      await db.insert(creatorAnalytics).values({
        id: analyticsId,
        userId,
        createdAt: now,
        updatedAt: now,
      });

      return res.json({
        totalReach: 0,
        totalEngagement: 0,
        totalImpressions: 0,
        followerGrowth: 0,
      });
    }

    res.json(analytics[0]);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// الحصول على تحليلات منشور محدد
router.get('/post/:postId/analytics', authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user.id;

    const post = await db.select()
      .from(posts)
      .where(and(eq(posts.id, postId), eq(posts.userId, userId)))
      .limit(1);

    if (post.length === 0) {
      return res.status(404).json({ error: 'Post not found or unauthorized' });
    }

    const reactions = await db.select()
      .from(postReactions)
      .where(eq(postReactions.postId, postId));

    const postComments = await db.select()
      .from(comments)
      .where(eq(comments.postId, postId));

    const analytics = {
      postId,
      content: post[0].content.substring(0, 100),
      likeCount: post[0].likeCount,
      commentCount: post[0].commentCount,
      shareCount: post[0].shareCount,
      reactionBreakdown: {
        like: reactions.filter(r => r.reactionType === 'like').length,
        love: reactions.filter(r => r.reactionType === 'love').length,
        laugh: reactions.filter(r => r.reactionType === 'laugh').length,
        wow: reactions.filter(r => r.reactionType === 'wow').length,
        sad: reactions.filter(r => r.reactionType === 'sad').length,
        angry: reactions.filter(r => r.reactionType === 'angry').length,
      },
      totalEngagement: post[0].likeCount + post[0].commentCount + post[0].shareCount,
      createdAt: post[0].createdAt,
    };

    res.json(analytics);
  } catch (error) {
    console.error('Error fetching post analytics:', error);
    res.status(500).json({ error: 'Failed to fetch post analytics' });
  }
});

// الحصول على معلومات التحقق من الدخل
router.get('/monetization', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const monetizationInfo = await db.select()
      .from(monetization)
      .where(eq(monetization.userId, userId))
      .limit(1);

    if (monetizationInfo.length === 0) {
      // إنشاء معلومات تحقق افتراضية
      const monetId = uuidv4();
      const now = new Date();

      await db.insert(monetization).values({
        id: monetId,
        userId,
        isMonetized: false,
        totalEarnings: 0,
        createdAt: now,
        updatedAt: now,
      });

      return res.json({
        isMonetized: false,
        totalEarnings: 0,
        bankAccount: null,
        paymentMethod: null,
      });
    }

    res.json(monetizationInfo[0]);
  } catch (error) {
    console.error('Error fetching monetization info:', error);
    res.status(500).json({ error: 'Failed to fetch monetization info' });
  }
});

// تفعيل التحقق من الدخل
router.post('/monetization/enable', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { bankAccount, paymentMethod } = req.body;

    if (!bankAccount || !paymentMethod) {
      return res.status(400).json({ error: 'Bank account and payment method are required' });
    }

    const monetizationInfo = await db.select()
      .from(monetization)
      .where(eq(monetization.userId, userId))
      .limit(1);

    if (monetizationInfo.length === 0) {
      const monetId = uuidv4();
      const now = new Date();

      await db.insert(monetization).values({
        id: monetId,
        userId,
        isMonetized: true,
        bankAccount,
        paymentMethod,
        createdAt: now,
        updatedAt: now,
      });
    } else {
      await db.update(monetization)
        .set({
          isMonetized: true,
          bankAccount,
          paymentMethod,
          updatedAt: new Date(),
        })
        .where(eq(monetization.userId, userId));
    }

    res.json({ message: 'Monetization enabled successfully' });
  } catch (error) {
    console.error('Error enabling monetization:', error);
    res.status(500).json({ error: 'Failed to enable monetization' });
  }
});

// الحصول على أفضل المنشورات
router.get('/top-posts', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 10 } = req.query;

    const topPosts = await db.select()
      .from(posts)
      .where(and(eq(posts.userId, userId), eq(posts.isDraft, false)))
      .orderBy(desc(posts.likeCount))
      .limit(limit);

    const postsWithEngagement = topPosts.map(post => ({
      ...post,
      totalEngagement: post.likeCount + post.commentCount + post.shareCount,
    }));

    res.json({ posts: postsWithEngagement });
  } catch (error) {
    console.error('Error fetching top posts:', error);
    res.status(500).json({ error: 'Failed to fetch top posts' });
  }
});

// الحصول على إحصائيات الجمهور
router.get('/audience-stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const userPosts = await db.select()
      .from(posts)
      .where(and(eq(posts.userId, userId), eq(posts.isDraft, false)));

    const totalReactions = await Promise.all(
      userPosts.map(async (post) => {
        const reactions = await db.select()
          .from(postReactions)
          .where(eq(postReactions.postId, post.id));
        return reactions.length;
      })
    );

    const stats = {
      totalPosts: userPosts.length,
      totalReactions: totalReactions.reduce((a, b) => a + b, 0),
      totalComments: userPosts.reduce((sum, post) => sum + post.commentCount, 0),
      totalShares: userPosts.reduce((sum, post) => sum + post.shareCount, 0),
      averageEngagement: userPosts.length > 0
        ? (totalReactions.reduce((a, b) => a + b, 0) + userPosts.reduce((sum, post) => sum + post.commentCount, 0)) / userPosts.length
        : 0,
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching audience stats:', error);
    res.status(500).json({ error: 'Failed to fetch audience stats' });
  }
});

export default router;
