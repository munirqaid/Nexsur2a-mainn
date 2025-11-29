import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../database/db.js';

import { eq, desc, and } from 'drizzle-orm';
import { authenticateToken } from './auth.js';

const router = express.Router();

// ============ Routes ============

// الحصول على إشعارات المستخدم
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    const offset = (page - 1) * limit;

    let query = db.select()
      .from(notifications)
      .where(eq(notifications.userId, userId));

    if (unreadOnly === 'true') {
      query = db.select()
        .from(notifications)
        .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
    }

    const userNotifications = await query
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset);

    // الحصول على معلومات المستخدمين الذين قاموا بالإجراء
    const notificationsWithData = await Promise.all(
      userNotifications.map(async (notif) => {
        const actor = notif.actorId 
          ? await db.select().from(users).where(eq(users.id, notif.actorId)).limit(1)
          : null;

        return {
          ...notif,
          actor: actor ? actor[0] : null,
        };
      })
    );

    res.json({ notifications: notificationsWithData });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// وضع علامة على الإشعار كمقروء
router.put('/:notificationId/read', authenticateToken, async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    const notification = await db.select()
      .from(notifications)
      .where(eq(notifications.id, notificationId))
      .limit(1);

    if (notification.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    if (notification[0].userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await db.update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, notificationId));

    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// وضع علامة على جميع الإشعارات كمقروءة
router.put('/read-all', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    await db.update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

// حذف إشعار
router.delete('/:notificationId', authenticateToken, async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    const notification = await db.select()
      .from(notifications)
      .where(eq(notifications.id, notificationId))
      .limit(1);

    if (notification.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    if (notification[0].userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await db.delete(notifications).where(eq(notifications.id, notificationId));

    res.json({ message: 'Notification deleted' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

// الحصول على تفضيلات الإشعارات
router.get('/preferences', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const preferences = await db.select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, userId))
      .limit(1);

    if (preferences.length === 0) {
      // إنشاء تفضيلات افتراضية
      const prefId = uuidv4();
      const now = new Date();

      await db.insert(notificationPreferences).values({
        id: prefId,
        userId,
        createdAt: now,
        updatedAt: now,
      });

      return res.json({
        pushEnabled: true,
        emailEnabled: true,
        inAppEnabled: true,
        notificationFrequency: 'instant',
      });
    }

    res.json(preferences[0]);
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    res.status(500).json({ error: 'Failed to fetch notification preferences' });
  }
});

// تحديث تفضيلات الإشعارات
router.put('/preferences', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { pushEnabled, emailEnabled, inAppEnabled, notificationFrequency } = req.body;

    const preferences = await db.select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, userId))
      .limit(1);

    if (preferences.length === 0) {
      const prefId = uuidv4();
      const now = new Date();

      await db.insert(notificationPreferences).values({
        id: prefId,
        userId,
        pushEnabled: pushEnabled !== undefined ? pushEnabled : true,
        emailEnabled: emailEnabled !== undefined ? emailEnabled : true,
        inAppEnabled: inAppEnabled !== undefined ? inAppEnabled : true,
        notificationFrequency: notificationFrequency || 'instant',
        createdAt: now,
        updatedAt: now,
      });
    } else {
      await db.update(notificationPreferences)
        .set({
          pushEnabled: pushEnabled !== undefined ? pushEnabled : undefined,
          emailEnabled: emailEnabled !== undefined ? emailEnabled : undefined,
          inAppEnabled: inAppEnabled !== undefined ? inAppEnabled : undefined,
          notificationFrequency: notificationFrequency || undefined,
          updatedAt: new Date(),
        })
        .where(eq(notificationPreferences.userId, userId));
    }

    res.json({ message: 'Notification preferences updated' });
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    res.status(500).json({ error: 'Failed to update notification preferences' });
  }
});

export default router;
