import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import mockDb from '../database/db.js';
import { authenticateToken } from './auth.js';

const router = express.Router();

// ============ Direct Messages ============

// إرسال رسالة مباشرة
router.post('/direct', authenticateToken, async (req, res) => {
  try {
    const { recipientId, content, messageType = 'text', attachments = [] } = req.body;
    const senderId = req.user.id;

    if (!recipientId || !content) {
      return res.status(400).json({ error: 'Recipient and content are required' });
    }

    const messageId = uuidv4();
    const now = new Date();

    const newMessage = {
      id: messageId,
      conversationId: `direct-${[senderId, recipientId].sort().join('-')}`,
      senderId,
      recipientId,
      content,
      messageType,
      attachments,
      isRead: false,
      createdAt: now,
      updatedAt: now,
    };

    if (!mockDb.messages) mockDb.messages = [];
    mockDb.messages.push(newMessage);

    res.status(201).json({
      message: 'Message sent successfully',
      messageId,
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// الحصول على رسائل محادثة مباشرة
router.get('/direct/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const conversationId = `direct-${[currentUserId, userId].sort().join('-')}`;

    if (!mockDb.messages) mockDb.messages = [];

    const messages = mockDb.messages
      .filter(m => m.conversationId === conversationId)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      .slice(offset, offset + limit);

    res.json({ messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// ============ Group Messages ============

// إنشاء مجموعة
router.post('/groups', authenticateToken, async (req, res) => {
  try {
    const { name, description, memberIds } = req.body;
    const creatorId = req.user.id;

    if (!name || !memberIds || memberIds.length === 0) {
      return res.status(400).json({ error: 'Name and members are required' });
    }

    const groupId = uuidv4();
    const now = new Date();

    const newGroup = {
      id: groupId,
      name,
      description: description || '',
      creatorId,
      memberIds: [creatorId, ...memberIds],
      roles: {
        [creatorId]: 'admin',
        ...memberIds.reduce((acc, id) => ({ ...acc, [id]: 'member' }), {}),
      },
      pinnedMessages: [],
      createdAt: now,
      updatedAt: now,
    };

    if (!mockDb.groups) mockDb.groups = [];
    mockDb.groups.push(newGroup);

    res.status(201).json({
      message: 'Group created successfully',
      groupId,
    });
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({ error: 'Failed to create group' });
  }
});

// إرسال رسالة جماعية
router.post('/groups/:groupId/messages', authenticateToken, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { content, messageType = 'text', attachments = [] } = req.body;
    const senderId = req.user.id;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const messageId = uuidv4();
    const now = new Date();

    const newMessage = {
      id: messageId,
      groupId,
      senderId,
      content,
      messageType,
      attachments,
      reactions: {},
      createdAt: now,
      updatedAt: now,
    };

    if (!mockDb.groupMessages) mockDb.groupMessages = [];
    mockDb.groupMessages.push(newMessage);

    res.status(201).json({
      message: 'Message sent successfully',
      messageId,
    });
  } catch (error) {
    console.error('Error sending group message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// الحصول على رسائل المجموعة
router.get('/groups/:groupId/messages', authenticateToken, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    if (!mockDb.groupMessages) mockDb.groupMessages = [];

    const messages = mockDb.groupMessages
      .filter(m => m.groupId === groupId)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      .slice(offset, offset + limit);

    res.json({ messages });
  } catch (error) {
    console.error('Error fetching group messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// ============ Channels ============

// إنشاء قناة
router.post('/channels', authenticateToken, async (req, res) => {
  try {
    const { name, description, type = 'public', inviteOnly = false } = req.body;
    const creatorId = req.user.id;

    if (!name) {
      return res.status(400).json({ error: 'Channel name is required' });
    }

    const channelId = uuidv4();
    const now = new Date();

    const newChannel = {
      id: channelId,
      name,
      description: description || '',
      type,
      inviteOnly,
      creatorId,
      subscribers: [creatorId],
      pinnedMessages: [],
      createdAt: now,
      updatedAt: now,
    };

    if (!mockDb.channels) mockDb.channels = [];
    mockDb.channels.push(newChannel);

    res.status(201).json({
      message: 'Channel created successfully',
      channelId,
    });
  } catch (error) {
    console.error('Error creating channel:', error);
    res.status(500).json({ error: 'Failed to create channel' });
  }
});

// ============ Message Reactions ============

// إضافة رد فعل على رسالة
router.post('/messages/:messageId/reactions', authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user.id;

    if (!emoji) {
      return res.status(400).json({ error: 'Emoji is required' });
    }

    res.status(201).json({
      message: 'Reaction added successfully',
    });
  } catch (error) {
    console.error('Error adding reaction:', error);
    res.status(500).json({ error: 'Failed to add reaction' });
  }
});

// ============ Message Search ============

// البحث في الرسائل
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const { q, conversationId, type = 'all' } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    if (!mockDb.messages) mockDb.messages = [];

    let results = mockDb.messages.filter(m => 
      m.content.toLowerCase().includes(q.toLowerCase())
    );

    if (conversationId) {
      results = results.filter(m => m.conversationId === conversationId);
    }

    res.json({ results });
  } catch (error) {
    console.error('Error searching messages:', error);
    res.status(500).json({ error: 'Failed to search messages' });
  }
});

// ============ Read Receipts ============

// وضع علامة على الرسالة كمقروءة
router.put('/messages/:messageId/read', authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;

    res.json({ message: 'Message marked as read' });
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({ error: 'Failed to mark as read' });
  }
});

// ============ Conversations List ============

// الحصول على قائمة المحادثات
router.get('/conversations', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    if (!mockDb.messages) mockDb.messages = [];

    const conversations = new Map();

    mockDb.messages.forEach(msg => {
      if (msg.conversationId && (msg.senderId === userId || msg.recipientId === userId)) {
        if (!conversations.has(msg.conversationId)) {
          conversations.set(msg.conversationId, {
            id: msg.conversationId,
            lastMessage: msg.content,
            lastMessageTime: msg.createdAt,
            unreadCount: msg.isRead ? 0 : 1,
          });
        }
      }
    });

    res.json({ conversations: Array.from(conversations.values()) });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

export default router;
