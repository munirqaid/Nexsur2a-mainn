import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';
import { Post, User, Like } from '../database/models.js';
import { authenticateToken } from './auth.js';

const router = express.Router();

// ============= Routes =============

// إنشاء منشور جديrouter.post("/", async (req, res) => {
    try {
        const { content, postType, mediaUrls, location, hashtags, mentions, isMonetized } = req.body;
        const userId = req.body.userId; // تم حذف authenticateToken بناءً على طلب المستخدم، يجب أن يتم تمرير userId من الواجهة الأمامية

        if (!content && !postType) {
            return res.status(400).json({ error: 'Content and post type are required' });
        }

        const newPost = new Post({
            userId,
            content,
            postType,
            mediaUrls: mediaUrls || [],
            location: location || null,
            hashtags: hashtags || [],
            mentions: (mentions && Array.isArray(mentions) && mentions.every(m => mongoose.Types.ObjectId.isValid(m))) ? mentions : [],
            isMonetized: isMonetized || false,
        });

        await newPost.save();

        res.status(201).json({
            message: 'Post created successfully',
            postId: newPost._id,
        });
    } catch (error) {
        console.error('Error creating post:', error.message || error);
        console.error('Full Error Stack:', error.stack);
        console.error('Request Body:', req.body);
        res.status(500).json({ error: 'Failed to create post' });
    }
});

// دالة مساعدة لتحويل المنشورات من قاعدة البيانات (مع Mongoose لم تعد ضرورية)
const formatPost = (post) => ({
    id: post._id.toString(),
    userId: post.userId ? post.userId._id.toString() : null,
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
    viewCount: post.viewCount,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    author: post.userId ? {
        id: post.userId._id.toString(),
        displayName: post.userId.displayName || 'مستخدم',
        username: post.userId.username,
        avatarUrl: post.userId.avatarUrl || '/placeholder.svg',
        isVerified: post.userId.isVerified || false,
    } : {
        id: null,
        displayName: 'مستخدم محذوف',
        username: 'deleted_user',
        avatarUrl: '/placeholder.svg',
        isVerified: false,
    },
    isLiked: post.isLiked || false, // سيتم تعيينها لاحقًا في مسار getFeed
});

// الحصول على الخلاصة (Feed)
router.get('/', async (req, res) => {
    try {
        // التحقق من التوكن اختياريًا لتحديد ما إذا كان المستخدم مسجلاً للدخول
        // إذا كان المستخدم مسجلاً للدخول، يمكننا تخصيص الخلاصة له
        // إذا لم يكن مسجلاً للدخول، سنعرض الخلاصة العامة
        let userId = null;
        let authHeader = req.headers['authorization'];
        let token = authHeader && authHeader.split(' ')[1];

        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
                userId = decoded.id;
            } catch (error) {
                // تجاهل الأخطاء إذا كان التوكن غير صالح، فقط لن نستخدم userId
                console.warn('Optional token verification failed for feed:', error.message);
            }
        }

        const posts = await Post.find()
            .sort({ createdAt: -1 })
            .limit(20)
            .populate('userId', 'displayName username avatarUrl isVerified') // جلب معلومات المؤلف
            .lean(); // استخدام lean لتحسين الأداء

        // تنسيق المنشورات وإضافة حالة الإعجاب إذا كان المستخدم مسجلاً للدخول
        const formattedPosts = await Promise.all(posts.map(async (post) => {
            let isLiked = false;
            if (userId) {
                const like = await Like.findOne({ userId, postId: post._id });
                isLiked = !!like;
            }
            return {
                ...formatPost({ ...post, userId: post.userId }),
                isLiked,
            };
        }));

        res.json({ posts: formattedPosts });
    } catch (error) {
        console.error('Error fetching feed:', error.message || error);
        console.error('Full Error Stack:', error.stack);
        res.status(500).json({ error: 'Failed to fetch feed' });
    }
});

// الحصول على منشور واحد
router.get('/:postId', async (req, res) => {
    try {
        const { postId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(postId)) {
            return res.status(400).json({ error: 'Invalid post ID' });
        }

        const post = await Post.findById(postId)
            .populate('userId', 'displayName username avatarUrl isVerified')
            .lean();

        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        // لا نحتاج إلى التحقق من الإعجاب هنا، يمكن أن يتم ذلك في الواجهة الأمامية
        res.json(formatPost({ ...post, userId: post.userId }));
    } catch (error) {
        console.error('Error fetching single post:', error.message || error);
        res.status(500).json({ error: 'Failed to fetch post' });
    }
});

// تحديث منشور
router.put('/:postId', authenticateToken, async (req, res) => {
    try {
        const { postId } = req.params;
        const { content, postType, mediaUrls, location, hashtags, mentions, isMonetized } = req.body;
        const userId = req.user.id; // تم استعادة استخدام authenticateToken للحصول على معرف المستخدم من التوكن

        if (!mongoose.Types.ObjectId.isValid(postId)) {
            return res.status(400).json({ error: 'Invalid post ID' });
        }

        const post = await Post.findOne({ _id: postId, userId });

        if (!post) {
            return res.status(404).json({ error: 'Post not found or unauthorized' });
        }

        post.content = content || post.content;
        post.postType = postType || post.postType;
        post.mediaUrls = mediaUrls || post.mediaUrls;
        post.location = location || post.location;
        post.hashtags = hashtags || post.hashtags;
        post.mentions = (mentions && Array.isArray(mentions) && mentions.every(m => mongoose.Types.ObjectId.isValid(m))) ? mentions : post.mentions;
        post.isMonetized = isMonetized !== undefined ? isMonetized : post.isMonetized;

        await post.save();

        res.json({ message: 'Post updated successfully' });
    } catch (error) {
        console.error('Error updating post:', error.message || error);
        res.status(500).json({ error: 'Failed to update post' });
    }
});

// حذف منشور
router.delete('/:postId', authenticateToken, async (req, res) => {
    try {
        const { postId } = req.params;
        const userId = req.user.id; // تم استعادة استخدام authenticateToken للحصول على معرف المستخدم من التوكن

        if (!mongoose.Types.ObjectId.isValid(postId)) {
            return res.status(400).json({ error: 'Invalid post ID' });
        }

        const result = await Post.deleteOne({ _id: postId, userId });

        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Post not found or unauthorized' });
        }

        // حذف الإعجابات والتعليقات المتعلقة بالمنشور (اختياري)
        // await Like.deleteMany({ postId });
        // await Comment.deleteMany({ postId });

        res.json({ message: 'Post deleted successfully' });
    } catch (error) {
        console.error('Error deleting post:', error.message || error);
        res.status(500).json({ error: 'Failed to delete post' });
    }
});

// إضافة تفاعل (إعجاب)
router.post('/:postId/react', authenticateToken, async (req, res) => {
    try {
        const { postId } = req.params;
        const userId = req.user.id; // تم استعادة استخدام authenticateToken للحصول على معرف المستخدم من التوكن
        const { reactionType = 'like' } = req.body; // يمكن توسيعها لتشمل أنواع تفاعلات أخرى

        if (!mongoose.Types.ObjectId.isValid(postId)) {
            return res.status(400).json({ error: 'Invalid post ID' });
        }

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        const existingLike = await Like.findOne({ userId, postId });

        if (existingLike) {
            // إلغاء الإعجاب
            await Like.deleteOne({ _id: existingLike._id });
            post.likeCount = Math.max(0, post.likeCount - 1);
            await post.save();
            return res.json({ message: 'Post unliked successfully', isLiked: false });
        } else {
            // إضافة إعجاب
            const newLike = new Like({ userId, postId, reactionType });
            await newLike.save();
            post.likeCount += 1;
            await post.save();
            return res.json({ message: 'Post liked successfully', isLiked: true });
        }

    } catch (error) {
        console.error('Error reacting to post:', error.message || error);
        res.status(500).json({ error: 'Failed to react to post' });
    }
});

export default router;
', authenticateToken, async (req, res) => {
    try {
        const { content, postType, mediaUrls, location, hashtags, mentions, isMonetized } = req.body;
        const userId = req.user.id; // تم استعادة استخدام authenticateToken للحصول على معرف المستخدم من التوكن

        if (!content && !postType) {
            return res.status(400).json({ error: 'Content and post type are required' });
        }

        const newPost = new Post({
            userId,
            content,
            postType,
            mediaUrls: mediaUrls || [],
            location: location || null,
            hashtags: hashtags || [],
            mentions: (mentions && Array.isArray(mentions) && mentions.every(m => mongoose.Types.ObjectId.isValid(m))) ? mentions : [],
            isMonetized: isMonetized || false,
        });

        await newPost.save();

        res.status(201).json({
            message: 'Post created successfully',
            postId: newPost._id,
        });
    } catch (error) {
        console.error('Error creating post:', error.message || error);
        console.error('Full Error Stack:', error.stack);
        console.error('Request Body:', req.body);
        res.status(500).json({ error: 'Failed to create post' });
    }
});

// دالة مساعدة لتحويل المنشورات من قاعدة البيانات (مع Mongoose لم تعد ضرورية)
const formatPost = (post) => ({
    id: post._id.toString(),
    userId: post.userId ? post.userId._id.toString() : null,
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
    viewCount: post.viewCount,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    author: post.userId ? {
        id: post.userId._id.toString(),
        displayName: post.userId.displayName || 'مستخدم',
        username: post.userId.username,
        avatarUrl: post.userId.avatarUrl || '/placeholder.svg',
        isVerified: post.userId.isVerified || false,
    } : {
        id: null,
        displayName: 'مستخدم محذوف',
        username: 'deleted_user',
        avatarUrl: '/placeholder.svg',
        isVerified: false,
    },
    isLiked: post.isLiked || false, // سيتم تعيينها لاحقًا في مسار getFeed
});

// الحصول على الخلاصة (Feed)
router.get('/', async (req, res) => {
    try {
        // التحقق من التوكن اختياريًا لتحديد ما إذا كان المستخدم مسجلاً للدخول
        // إذا كان المستخدم مسجلاً للدخول، يمكننا تخصيص الخلاصة له
        // إذا لم يكن مسجلاً للدخول، سنعرض الخلاصة العامة
        let userId = null;
        let authHeader = req.headers['authorization'];
        let token = authHeader && authHeader.split(' ')[1];

        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
                userId = decoded.id;
            } catch (error) {
                // تجاهل الأخطاء إذا كان التوكن غير صالح، فقط لن نستخدم userId
                console.warn('Optional token verification failed for feed:', error.message);
            }
        }

        const posts = await Post.find()
            .sort({ createdAt: -1 })
            .limit(20)
            .populate('userId', 'displayName username avatarUrl isVerified') // جلب معلومات المؤلف
            .lean(); // استخدام lean لتحسين الأداء

        // تنسيق المنشورات وإضافة حالة الإعجاب إذا كان المستخدم مسجلاً للدخول
        const formattedPosts = await Promise.all(posts.map(async (post) => {
            let isLiked = false;
            if (userId) {
                const like = await Like.findOne({ userId, postId: post._id });
                isLiked = !!like;
            }
            return {
                ...formatPost({ ...post, userId: post.userId }),
                isLiked,
            };
        }));

        res.json({ posts: formattedPosts });
    } catch (error) {
        console.error('Error fetching feed:', error.message || error);
        console.error('Full Error Stack:', error.stack);
        res.status(500).json({ error: 'Failed to fetch feed' });
    }
});

// الحصول على منشور واحد
router.get('/:postId', async (req, res) => {
    try {
        const { postId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(postId)) {
            return res.status(400).json({ error: 'Invalid post ID' });
        }

        const post = await Post.findById(postId)
            .populate('userId', 'displayName username avatarUrl isVerified')
            .lean();

        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        // لا نحتاج إلى التحقق من الإعجاب هنا، يمكن أن يتم ذلك في الواجهة الأمامية
        res.json(formatPost({ ...post, userId: post.userId }));
    } catch (error) {
        console.error('Error fetching single post:', error.message || error);
        res.status(500).json({ error: 'Failed to fetch post' });
    }
});

// تحديث منشور
router.put('/:postId', authenticateToken, async (req, res) => {
    try {
        const { postId } = req.params;
        const { content, postType, mediaUrls, location, hashtags, mentions, isMonetized } = req.body;
        const userId = req.user.id; // تم استعادة استخدام authenticateToken للحصول على معرف المستخدم من التوكن

        if (!mongoose.Types.ObjectId.isValid(postId)) {
            return res.status(400).json({ error: 'Invalid post ID' });
        }

        const post = await Post.findOne({ _id: postId, userId });

        if (!post) {
            return res.status(404).json({ error: 'Post not found or unauthorized' });
        }

        post.content = content || post.content;
        post.postType = postType || post.postType;
        post.mediaUrls = mediaUrls || post.mediaUrls;
        post.location = location || post.location;
        post.hashtags = hashtags || post.hashtags;
        post.mentions = (mentions && Array.isArray(mentions) && mentions.every(m => mongoose.Types.ObjectId.isValid(m))) ? mentions : post.mentions;
        post.isMonetized = isMonetized !== undefined ? isMonetized : post.isMonetized;

        await post.save();

        res.json({ message: 'Post updated successfully' });
    } catch (error) {
        console.error('Error updating post:', error.message || error);
        res.status(500).json({ error: 'Failed to update post' });
    }
});

// حذف منشور
router.delete('/:postId', authenticateToken, async (req, res) => {
    try {
        const { postId } = req.params;
        const userId = req.user.id; // تم استعادة استخدام authenticateToken للحصول على معرف المستخدم من التوكن

        if (!mongoose.Types.ObjectId.isValid(postId)) {
            return res.status(400).json({ error: 'Invalid post ID' });
        }

        const result = await Post.deleteOne({ _id: postId, userId });

        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Post not found or unauthorized' });
        }

        // حذف الإعجابات والتعليقات المتعلقة بالمنشور (اختياري)
        // await Like.deleteMany({ postId });
        // await Comment.deleteMany({ postId });

        res.json({ message: 'Post deleted successfully' });
    } catch (error) {
        console.error('Error deleting post:', error.message || error);
        res.status(500).json({ error: 'Failed to delete post' });
    }
});

// إضافة تفاعل (إعجاب)
router.post('/:postId/react', authenticateToken, async (req, res) => {
    try {
        const { postId } = req.params;
        const userId = req.user.id; // تم استعادة استخدام authenticateToken للحصول على معرف المستخدم من التوكن
        const { reactionType = 'like' } = req.body; // يمكن توسيعها لتشمل أنواع تفاعلات أخرى

        if (!mongoose.Types.ObjectId.isValid(postId)) {
            return res.status(400).json({ error: 'Invalid post ID' });
        }

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }

        const existingLike = await Like.findOne({ userId, postId });

        if (existingLike) {
            // إلغاء الإعجاب
            await Like.deleteOne({ _id: existingLike._id });
            post.likeCount = Math.max(0, post.likeCount - 1);
            await post.save();
            return res.json({ message: 'Post unliked successfully', isLiked: false });
        } else {
            // إضافة إعجاب
            const newLike = new Like({ userId, postId, reactionType });
            await newLike.save();
            post.likeCount += 1;
            await post.save();
            return res.json({ message: 'Post liked successfully', isLiked: true });
        }

    } catch (error) {
        console.error('Error reacting to post:', error.message || error);
        res.status(500).json({ error: 'Failed to react to post' });
    }
});

export default router;
