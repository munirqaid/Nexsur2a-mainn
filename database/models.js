import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const { Schema } = mongoose;

// =================================================================
// 1. مخطط المستخدم (User Schema)
// =================================================================
const userSchema = new Schema({
    _id: { type: String, default: uuidv4 },
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true }, // سيتم تخزين الهاش هنا
    displayName: { type: String, required: true, trim: true },
    bio: { type: String, default: '' },
    avatarUrl: { type: String, default: '' },
    bannerUrl: { type: String, default: '' },
    privacyLevel: { type: String, enum: ['public', 'private'], default: 'public' },
    followers: [{ type: String, ref: 'User' }], // مصفوفة من IDs المستخدمين الذين يتابعونه
    following: [{ type: String, ref: 'User' }], // مصفوفة من IDs المستخدمين الذين يتابعهم
}, { timestamps: true });

// =================================================================
// 2. مخطط المنشور (Post Schema)
// =================================================================
const postSchema = new Schema({
    _id: { type: String, default: uuidv4 },
    userId: { type: String, ref: 'User', required: true },
    content: { type: String, required: true },
    postType: { type: String, enum: ['text', 'image', 'video', 'poll'], default: 'text' },
    mediaUrls: [{ type: String }],
    location: { type: String },
    hashtags: [{ type: String }],
    mentions: [{ type: String, ref: 'User' }],
    isMonetized: { type: Boolean, default: false },
    likeCount: { type: Number, default: 0 },
    commentCount: { type: Number, default: 0 },
    shareCount: { type: Number, default: 0 },
}, { timestamps: true });

// =================================================================
// 3. مخطط الإعجاب (Like Schema)
// =================================================================
const likeSchema = new Schema({
    _id: { type: String, default: uuidv4 },
    postId: { type: String, ref: 'Post', required: true },
    userId: { type: String, ref: 'User', required: true },
    // يمكن إضافة نوع التفاعل هنا لاحقًا إذا لزم الأمر
}, { timestamps: true });

// =================================================================
// 4. مخطط التعليق (Comment Schema)
// =================================================================
const commentSchema = new Schema({
    _id: { type: String, default: uuidv4 },
    postId: { type: String, ref: 'Post', required: true },
    userId: { type: String, ref: 'User', required: true },
    content: { type: String, required: true },
    parentCommentId: { type: String, ref: 'Comment', default: null },
    likeCount: { type: Number, default: 0 },
}, { timestamps: true });

// =================================================================
// 4. مخطط الإشعار (Notification Schema)
// =================================================================
const notificationSchema = new Schema({
    _id: { type: String, default: uuidv4 },
    userId: { type: String, ref: 'User', required: true },
    type: { type: String, required: true, enum: ['like', 'comment', 'follow', 'mention'] },
    sourceId: { type: String }, // ID of the post, comment, or user that triggered the notification
    isRead: { type: Boolean, default: false },
}, { timestamps: true });

// =================================================================
// 5. مخطط العلاقة (Relationship Schema) - للمتابعة
// سنستخدمه لتسهيل استعلامات المتابعة/المتابَعين
// =================================================================
const relationshipSchema = new Schema({
    followerId: { type: String, ref: 'User', required: true },
    followingId: { type: String, ref: 'User', required: true },
}, { timestamps: true });

// إنشاء النماذج
const User = mongoose.model('User', userSchema);
const Post = mongoose.model('Post', postSchema);
const Like = mongoose.model('Like', likeSchema);
const Comment = mongoose.model('Comment', commentSchema);
const Notification = mongoose.model('Notification', notificationSchema);
const Relationship = mongoose.model('Relationship', relationshipSchema);

export { User, Post, Like, Comment, Notification, Relationship };
