import express from 'express';
import db from '../database/db.js';

import { like, desc } from 'drizzle-orm';

const router = express.Router();

// ============ Routes ============

// البحث عن المستخدمين
router.get('/users', async (req, res) => {
  try {
    const { q, limit = 20 } = req.query;

    if (!q || q.length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }

    const searchResults = await db.select()
      .from(users)
      .where(like(users.username, `%${q}%`))
      .limit(limit);

    res.json({ users: searchResults });
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ error: 'Failed to search users' });
  }
});

// البحث عن المنشورات
router.get('/posts', async (req, res) => {
  try {
    const { q, limit = 20, page = 1 } = req.query;
    const offset = (page - 1) * limit;

    if (!q || q.length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }

    const searchResults = await db.select()
      .from(posts)
      .where(like(posts.content, `%${q}%`))
      .orderBy(desc(posts.createdAt))
      .limit(limit)
      .offset(offset);

    // الحصول على معلومات المستخدمين
    const postsWithUsers = await Promise.all(
      searchResults.map(async (post) => {
        const author = await db.select().from(users).where((u) => u.id === post.userId).limit(1);
        return {
          ...post,
          author: author[0] || null,
          mediaUrls: JSON.parse(post.mediaUrls || '[]'),
          hashtags: JSON.parse(post.hashtags || '[]'),
        };
      })
    );

    res.json({ posts: postsWithUsers });
  } catch (error) {
    console.error('Error searching posts:', error);
    res.status(500).json({ error: 'Failed to search posts' });
  }
});

// البحث عن الهاشتاجات
router.get('/hashtags', async (req, res) => {
  try {
    const { q, limit = 20 } = req.query;

    if (!q || q.length < 1) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const searchResults = await db.select()
      .from(hashtags)
      .where(like(hashtags.tag, `%${q}%`))
      .orderBy(desc(hashtags.usageCount))
      .limit(limit);

    res.json({ hashtags: searchResults });
  } catch (error) {
    console.error('Error searching hashtags:', error);
    res.status(500).json({ error: 'Failed to search hashtags' });
  }
});

// الحصول على المواضيع الرائجة
router.get('/trending', async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const trendingResults = await db.select()
      .from(trendingTopics)
      .orderBy(desc(trendingTopics.trendingScore))
      .limit(limit);

    res.json({ trending: trendingResults });
  } catch (error) {
    console.error('Error fetching trending topics:', error);
    res.status(500).json({ error: 'Failed to fetch trending topics' });
  }
});

// البحث المتقدم (متعدد الأنواع)
router.get('/', async (req, res) => {
  try {
    const { q, type = 'all', limit = 20 } = req.query;

    if (!q || q.length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }

    const results = {};

    if (type === 'all' || type === 'users') {
      const userResults = await db.select()
        .from(users)
        .where(like(users.username, `%${q}%`))
        .limit(limit);
      results.users = userResults;
    }

    if (type === 'all' || type === 'posts') {
      const postResults = await db.select()
        .from(posts)
        .where(like(posts.content, `%${q}%`))
        .orderBy(desc(posts.createdAt))
        .limit(limit);
      results.posts = postResults;
    }

    if (type === 'all' || type === 'hashtags') {
      const hashtagResults = await db.select()
        .from(hashtags)
        .where(like(hashtags.tag, `%${q}%`))
        .orderBy(desc(hashtags.usageCount))
        .limit(limit);
      results.hashtags = hashtagResults;
    }

    res.json(results);
  } catch (error) {
    console.error('Error performing search:', error);
    res.status(500).json({ error: 'Failed to perform search' });
  }
});

// الحصول على الاقتراحات التلقائية
router.get('/autocomplete', async (req, res) => {
  try {
    const { q, type = 'all' } = req.query;

    if (!q || q.length < 1) {
      return res.json({ suggestions: [] });
    }

    const suggestions = [];

    if (type === 'all' || type === 'users') {
      const userSuggestions = await db.select()
        .from(users)
        .where(like(users.username, `%${q}%`))
        .limit(5);
      suggestions.push(...userSuggestions.map(u => ({ type: 'user', ...u })));
    }

    if (type === 'all' || type === 'hashtags') {
      const hashtagSuggestions = await db.select()
        .from(hashtags)
        .where(like(hashtags.tag, `%${q}%`))
        .orderBy(desc(hashtags.usageCount))
        .limit(5);
      suggestions.push(...hashtagSuggestions.map(h => ({ type: 'hashtag', ...h })));
    }

    res.json({ suggestions });
  } catch (error) {
    console.error('Error fetching autocomplete suggestions:', error);
    res.status(500).json({ error: 'Failed to fetch suggestions' });
  }
});

export default router;
