import express from 'express';
import { Notification } from '../database/models.js';
import { authenticateToken } from './auth.js';

const router = express.Router();

// الحصول على جميع إشعارات المستخدم
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50);

    // تحويل الإشعارات إلى تنسيق رسائل مقروءة
    const formattedNotifications = notifications.map(n => {
      let message = '';
      switch (n.type) {
        case 'like': message = 'قام شخص ما بالإعجاب بمنشورك'; break;
        case 'comment': message = 'قام شخص ما بالتعليق على منشورك'; break;
        case 'follow': message = 'بدأ شخص ما بمتابعتك'; break;
        case 'mention': message = 'قام شخص ما بالإشارة إليك في منشور'; break;
        default: message = 'لديك تنبيه جديد';
      }
      return {
        id: n._id,
        type: n.type,
        message,
        isRead: n.isRead,
        createdAt: n.createdAt
      };
    });

    res.json({ notifications: formattedNotifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// تحديد الإشعارات كمقروءة
router.put('/read-all', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    await Notification.updateMany({ userId, isRead: false }, { isRead: true });
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    res.status(500).json({ error: 'Failed to update notifications' });
  }
});

export default router;
