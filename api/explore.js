import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import mockDb from '../database/db.js';
import { authenticateToken } from './auth.js';

const router = express.Router();

// ============ Trends ============

// Get trending topics
router.get('/trends', authenticateToken, async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const trends = [
      {
        id: 'trend-1',
        title: 'الذكاء الاصطناعي',
        description: 'أحدث التطورات في مجال الذكاء الاصطناعي والتعلم الآلي',
        mentions: 15000,
        growth: 45,
        category: 'technology',
      },
      {
        id: 'trend-2',
        title: 'التطوير الويب',
        description: 'أفضل أدوات وتقنيات التطوير الحديثة',
        mentions: 12000,
        growth: 32,
        category: 'technology',
      },
      {
        id: 'trend-3',
        title: 'التسويق الرقمي',
        description: 'استراتيجيات التسويق الفعالة على الإنترنت',
        mentions: 10000,
        growth: 28,
        category: 'marketing',
      },
      {
        id: 'trend-4',
        title: 'الإبداع والفن',
        description: 'أحدث الأعمال الفنية والتصاميم الإبداعية',
        mentions: 8500,
        growth: 22,
        category: 'creative',
      },
      {
        id: 'trend-5',
        title: 'التعليم الإلكتروني',
        description: 'منصات وأدوات التعليم الحديثة',
        mentions: 7200,
        growth: 18,
        category: 'education',
      },
    ];

    res.json({
      trends: trends.slice(0, parseInt(limit)),
      totalTrends: trends.length,
    });
  } catch (error) {
    console.error('Error getting trends:', error);
    res.status(500).json({ error: 'Failed to get trends' });
  }
});

// ============ Popular Content ============

// Get popular posts
router.get('/popular', authenticateToken, async (req, res) => {
  try {
    const { limit = 12 } = req.query;

    const posts = [
      {
        id: 'post-1',
        title: 'منشور شهير ومميز',
        image: 'https://via.placeholder.com/250x200',
        authorName: 'أحمد محمد',
        authorHandle: 'ahmed',
        authorAvatar: 'https://via.placeholder.com/32x32',
        likes: 1200,
        comments: 250,
        shares: 180,
      },
      {
        id: 'post-2',
        title: 'محتوى إبداعي وجذاب',
        image: 'https://via.placeholder.com/250x200',
        authorName: 'فاطمة علي',
        authorHandle: 'fatima',
        authorAvatar: 'https://via.placeholder.com/32x32',
        likes: 950,
        comments: 180,
        shares: 120,
      },
      {
        id: 'post-3',
        title: 'نصائح مفيدة وعملية',
        image: 'https://via.placeholder.com/250x200',
        authorName: 'محمود سالم',
        authorHandle: 'mahmoud',
        authorAvatar: 'https://via.placeholder.com/32x32',
        likes: 850,
        comments: 150,
        shares: 100,
      },
    ];

    res.json({
      posts: posts.slice(0, parseInt(limit)),
      totalPosts: posts.length,
    });
  } catch (error) {
    console.error('Error getting popular posts:', error);
    res.status(500).json({ error: 'Failed to get popular posts' });
  }
});

// ============ Recommendations ============

// Get personalized recommendations
router.get('/recommendations', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 12 } = req.query;

    const recommendations = [
      {
        id: 'rec-1',
        title: 'الفن والتصميم',
        description: 'استكشف أحدث الأعمال الفنية والتصاميم الإبداعية',
        icon: '🎨',
        category: 'creative',
      },
      {
        id: 'rec-2',
        title: 'الموسيقى والفنون',
        description: 'اكتشف الموسيقيين والفنانين الموهوبين',
        icon: '🎵',
        category: 'music',
      },
      {
        id: 'rec-3',
        title: 'التعليم والتطوير',
        description: 'تعلم مهارات جديدة من الخبراء',
        icon: '📚',
        category: 'education',
      },
      {
        id: 'rec-4',
        title: 'الرياضة واللياقة',
        description: 'نصائح وتمارين للياقة البدنية',
        icon: '⚽',
        category: 'sports',
      },
      {
        id: 'rec-5',
        title: 'السفر والمغامرات',
        description: 'استكشف أماكن جديدة وتجارب فريدة',
        icon: '✈️',
        category: 'travel',
      },
      {
        id: 'rec-6',
        title: 'الطعام والطهي',
        description: 'وصفات لذيذة وأفكار للطهي',
        icon: '🍽️',
        category: 'food',
      },
    ];

    res.json({
      recommendations: recommendations.slice(0, parseInt(limit)),
      totalRecommendations: recommendations.length,
    });
  } catch (error) {
    console.error('Error getting recommendations:', error);
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
});

// ============ Topic Hubs ============

// Get topic hubs
router.get('/topics', authenticateToken, async (req, res) => {
  try {
    const { limit = 12 } = req.query;

    const topics = [
      {
        id: 'topic-1',
        name: 'البرمجة',
        icon: '💻',
        members: 5200,
        description: 'مجتمع البرمجين والمطورين',
      },
      {
        id: 'topic-2',
        name: 'الألعاب',
        icon: '🎮',
        members: 8500,
        description: 'عشاق الألعاب والجيمرز',
      },
      {
        id: 'topic-3',
        name: 'الأفلام والمسلسلات',
        icon: '🎬',
        members: 12000,
        description: 'محبو الأفلام والمسلسلات',
      },
      {
        id: 'topic-4',
        name: 'الرياضة',
        icon: '⚽',
        members: 9800,
        description: 'عشاق الرياضة والألعاب',
      },
      {
        id: 'topic-5',
        name: 'التكنولوجيا',
        icon: '🔧',
        members: 7600,
        description: 'متابعو أحدث التقنيات',
      },
      {
        id: 'topic-6',
        name: 'الموسيقى',
        icon: '🎵',
        members: 6400,
        description: 'عشاق الموسيقى والفنون',
      },
    ];

    res.json({
      topics: topics.slice(0, parseInt(limit)),
      totalTopics: topics.length,
    });
  } catch (error) {
    console.error('Error getting topics:', error);
    res.status(500).json({ error: 'Failed to get topics' });
  }
});

// ============ Suggested People ============

// Get suggested people
router.get('/suggested-people', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 12 } = req.query;

    const people = [
      {
        id: 'user-1',
        name: 'فاطمة علي',
        handle: 'fatima',
        avatar: 'https://via.placeholder.com/80x80',
        bio: 'منشئة محتوى ومصممة',
        followers: 5200,
      },
      {
        id: 'user-2',
        name: 'محمود سالم',
        handle: 'mahmoud',
        avatar: 'https://via.placeholder.com/80x80',
        bio: 'مطور ويب وخبير تقنية',
        followers: 3800,
      },
      {
        id: 'user-3',
        name: 'ليلى محمد',
        handle: 'layla',
        avatar: 'https://via.placeholder.com/80x80',
        bio: 'كاتبة ومؤلفة',
        followers: 4200,
      },
    ];

    res.json({
      people: people.slice(0, parseInt(limit)),
      totalPeople: people.length,
    });
  } catch (error) {
    console.error('Error getting suggested people:', error);
    res.status(500).json({ error: 'Failed to get suggested people' });
  }
});

// ============ Events ============

// Get events
router.get('/events', authenticateToken, async (req, res) => {
  try {
    const { limit = 12 } = req.query;

    const events = [
      {
        id: 'event-1',
        title: 'ندوة الذكاء الاصطناعي',
        date: 'غداً',
        time: '8:00 PM',
        attendees: 250,
        isLive: true,
      },
      {
        id: 'event-2',
        title: 'ورشة عمل التطوير الويب',
        date: '2024-12-01',
        time: '6:00 PM',
        attendees: 180,
        isLive: false,
      },
      {
        id: 'event-3',
        title: 'حفل الموسيقى الحي',
        date: '2024-12-05',
        time: '9:00 PM',
        attendees: 500,
        isLive: false,
      },
    ];

    res.json({
      events: events.slice(0, parseInt(limit)),
      totalEvents: events.length,
    });
  } catch (error) {
    console.error('Error getting events:', error);
    res.status(500).json({ error: 'Failed to get events' });
  }
});

// ============ Sidebar Content ============

// Get top topics for sidebar
router.get('/top-topics', authenticateToken, async (req, res) => {
  try {
    const topics = [
      { id: 'topic-1', name: 'الذكاء الاصطناعي', posts: 1500 },
      { id: 'topic-2', name: 'التطوير الويب', posts: 1200 },
      { id: 'topic-3', name: 'التسويق الرقمي', posts: 950 },
      { id: 'topic-4', name: 'الإبداع والفن', posts: 850 },
      { id: 'topic-5', name: 'التعليم الإلكتروني', posts: 720 },
    ];

    res.json({ topics });
  } catch (error) {
    console.error('Error getting top topics:', error);
    res.status(500).json({ error: 'Failed to get top topics' });
  }
});

// Get new followers
router.get('/new-followers', authenticateToken, async (req, res) => {
  try {
    const followers = [
      { id: 'user-1', name: 'أحمد محمد', handle: 'ahmed', avatar: 'https://via.placeholder.com/40x40' },
      { id: 'user-2', name: 'فاطمة علي', handle: 'fatima', avatar: 'https://via.placeholder.com/40x40' },
      { id: 'user-3', name: 'محمود سالم', handle: 'mahmoud', avatar: 'https://via.placeholder.com/40x40' },
    ];

    res.json({ followers });
  } catch (error) {
    console.error('Error getting new followers:', error);
    res.status(500).json({ error: 'Failed to get new followers' });
  }
});

// Get upcoming events
router.get('/upcoming-events', authenticateToken, async (req, res) => {
  try {
    const events = [
      { id: 'event-1', title: 'ندوة الذكاء الاصطناعي', time: 'غداً - 8:00 PM' },
      { id: 'event-2', title: 'ورشة عمل البرمجة', time: 'الجمعة - 6:00 PM' },
      { id: 'event-3', title: 'حفل الموسيقى الحي', time: 'السبت - 9:00 PM' },
    ];

    res.json({ events });
  } catch (error) {
    console.error('Error getting upcoming events:', error);
    res.status(500).json({ error: 'Failed to get upcoming events' });
  }
});

// ============ Notifications & Alerts ============

// Subscribe to trend alerts
router.post('/subscribe-trends', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { topics } = req.body;

    if (!topics || topics.length === 0) {
      return res.status(400).json({ error: 'Topics are required' });
    }

    if (!mockDb.trendSubscriptions) mockDb.trendSubscriptions = [];
    
    const subscription = {
      id: uuidv4(),
      userId,
      topics,
      createdAt: new Date(),
    };

    mockDb.trendSubscriptions.push(subscription);

    res.status(201).json({
      message: 'Subscription created successfully',
      subscriptionId: subscription.id,
    });
  } catch (error) {
    console.error('Error subscribing to trends:', error);
    res.status(500).json({ error: 'Failed to subscribe to trends' });
  }
});

// Get user subscriptions
router.get('/subscriptions', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    if (!mockDb.trendSubscriptions) mockDb.trendSubscriptions = [];

    const userSubscriptions = mockDb.trendSubscriptions.filter(
      sub => sub.userId === userId
    );

    res.json({ subscriptions: userSubscriptions });
  } catch (error) {
    console.error('Error getting subscriptions:', error);
    res.status(500).json({ error: 'Failed to get subscriptions' });
  }
});

// ============ Discovery Preferences ============

// Update discovery preferences
router.put('/preferences', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { interests, categories, languages } = req.body;

    if (!mockDb.discoveryPreferences) mockDb.discoveryPreferences = [];

    const existingPrefs = mockDb.discoveryPreferences.find(p => p.userId === userId);

    if (existingPrefs) {
      existingPrefs.interests = interests || existingPrefs.interests;
      existingPrefs.categories = categories || existingPrefs.categories;
      existingPrefs.languages = languages || existingPrefs.languages;
      existingPrefs.updatedAt = new Date();
    } else {
      const newPrefs = {
        id: uuidv4(),
        userId,
        interests,
        categories,
        languages,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockDb.discoveryPreferences.push(newPrefs);
    }

    res.json({ message: 'Preferences updated successfully' });
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

// Get discovery preferences
router.get('/preferences', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    if (!mockDb.discoveryPreferences) mockDb.discoveryPreferences = [];

    const prefs = mockDb.discoveryPreferences.find(p => p.userId === userId);

    res.json({
      preferences: prefs || {
        interests: [],
        categories: [],
        languages: ['ar', 'en'],
      },
    });
  } catch (error) {
    console.error('Error getting preferences:', error);
    res.status(500).json({ error: 'Failed to get preferences' });
  }
});

export default router;
