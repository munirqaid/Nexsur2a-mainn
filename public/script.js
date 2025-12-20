// ============ Global Variables ============
const API_BASE_URL = window.location.origin + '/api';
let authToken = localStorage.getItem('token') || localStorage.getItem('authToken');

// التأكد من وجود التوكن في كلا المفتاحين لضمان التوافق
if (authToken) {
    localStorage.setItem('token', authToken);
    localStorage.setItem('authToken', authToken);
}

if (!authToken && !window.location.pathname.includes('auth.html')) {
    window.location.href = '/auth.html';
}


// ============ DOM Elements ============
const postTextarea = document.getElementById('postTextarea');
const postSubmitBtn = document.getElementById('postSubmitBtn');
const feedSection = document.getElementById('feedSection');


// ============ Feed Functions ============
async function loadFeed() {
    if (!feedSection) return;

    // 1. مؤشر التحميل
    feedSection.innerHTML = '<div class="loading" style="text-align: center; padding: 20px;"><div class="spinner" style="margin: 0 auto;"></div><p>جارٍ تحميل المنشورات...</p></div>';

    try {
        const response = await fetch(`${API_BASE_URL}/posts`);
        
        if (!response.ok) {
            let errorText = 'فشل جلب المنشورات من الخادم';
            try {
                const errorData = await response.json();
                errorText = errorData.error || errorText;
            } catch (e) {
                errorText = response.statusText || 'خطأ غير معروف';
            }
            throw new Error(errorText);
        }

        const data = await response.json();
        
        if (data.posts && data.posts.length > 0) {
            displayPosts(data.posts);
        } else {
            feedSection.innerHTML = '<p class="empty-feed" style="text-align: center; padding: 20px; color: #777;">لا توجد منشورات حالياً. كن أول من ينشر!</p>';
        }
    } catch (error) {
        // 2. معالجة الأخطاء
        console.error('Error loading feed:', error);
        feedSection.innerHTML = `<p class="empty-feed error" style="text-align: center; padding: 20px; color: red;">حدث خطأ في تحميل الخلاصة: ${error.message}</p>`;
    }
}

function displayPosts(posts) {
    if (!feedSection) return;
    feedSection.innerHTML = '';
    posts.forEach(post => {
        const postElement = createPostElement(post);
        feedSection.appendChild(postElement);
    });
}

function createPostElement(post) {
    const div = document.createElement('div');
    div.className = 'post-card';
    
    const author = post.author || { displayName: 'مستخدم', avatarUrl: 'https://picsum.photos/40/40' };
    
    const timeAgo = post.createdAt ? getTimeAgo(new Date(post.createdAt)) : 'الآن';
    
    div.innerHTML = `
        <div class="post-header">
            <img src="${author.avatarUrl || 'https://picsum.photos/40/40'}" alt="المستخدم" class="post-avatar">
            <div class="post-header-info">
                <h4 class="post-author">${author.displayName || 'مستخدم'}</h4>
                <p class="post-time">${timeAgo}</p>
            </div>
            <button class="post-menu-btn"><i class="fas fa-ellipsis-h"></i></button>
        </div>
        <div class="post-content"><p>${post.content}</p></div>
        <div class="post-stats">
            <span><i class="fas fa-thumbs-up"></i> ${post.likeCount || 0}</span>
            <span>${post.commentCount || 0} تعليق</span>
        </div>
        <div class="post-divider"></div>
        <div class="post-actions">
            <button class="post-action-btn" data-action="like"><i class="fas fa-thumbs-up"></i> <span>إعجاب</span></button>
            <button class="post-action-btn" data-action="comment"><i class="fas fa-comment"></i> <span>تعليق</span></button>
            <button class="post-action-btn" data-action="share"><i class="fas fa-share"></i> <span>مشاركة</span></button>
        </div>
    `;
    return div;
}

function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return 'الآن';
    const intervals = {
        'سنة': 31536000,
        'شهر': 2592000,
        'أسبوع': 604800,
        'يوم': 86400,
        'ساعة': 3600,
        'دقيقة': 60,
    };
    for (const [key, value] of Object.entries(intervals)) {
        const interval = Math.floor(seconds / value);
        if (interval >= 1) return `قبل ${interval} ${key}`;
    }
}


// ============ Post Composer Logic is now handled in initializeApp ============


// ============ Logout Function ============
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/auth.html';
}

// ============ UI Interaction Functions ============

function setupModals() {
    const modals = document.querySelectorAll('.modal');
    const closeButtons = document.querySelectorAll('.modal-close');

    closeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            modals.forEach(modal => modal.classList.remove('active'));
        });
    });

    window.addEventListener('click', (e) => {
        modals.forEach(modal => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });
}

async function loadNotifications() {
    const notificationsList = document.getElementById('notificationsList');
    if (!notificationsList) return;

    notificationsList.innerHTML = '<p style="text-align: center; padding: 20px;">جارٍ تحميل الإشعارات...</p>';

    try {
        const response = await fetch(`${API_BASE_URL}/notifications`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) throw new Error('فشل تحميل الإشعارات');

        const data = await response.json();
        if (data.notifications && data.notifications.length > 0) {
            notificationsList.innerHTML = '';
            data.notifications.forEach(notif => {
                const item = document.createElement('div');
                item.className = `notification-item ${notif.isRead ? '' : 'unread'}`;
                item.innerHTML = `
                    <div class="notification-content">
                        <p>${notif.message || 'لديك إشعار جديد'}</p>
                        <span class="notification-time">${getTimeAgo(new Date(notif.createdAt))}</span>
                    </div>
                `;
                notificationsList.appendChild(item);
            });
        } else {
            notificationsList.innerHTML = '<p style="text-align: center; padding: 20px;">لا توجد إشعارات حالياً.</p>';
        }
    } catch (error) {
        console.error('Error loading notifications:', error);
        notificationsList.innerHTML = '<p style="text-align: center; padding: 20px; color: red;">حدث خطأ أثناء تحميل الإشعارات.</p>';
    }
}

async function loadUserPosts() {
    const userFeedSection = document.getElementById('userFeedSection');
    if (!userFeedSection) return;

    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) return;

    userFeedSection.innerHTML = '<p style="text-align: center; padding: 20px;">جارٍ تحميل منشوراتك...</p>';

    try {
        const response = await fetch(`${API_BASE_URL}/posts/user/${user.id}`);
        if (!response.ok) throw new Error('فشل تحميل المنشورات');

        const data = await response.json();
        if (data.posts && data.posts.length > 0) {
            userFeedSection.innerHTML = '';
            data.posts.forEach(post => {
                const postElement = createPostElement(post);
                userFeedSection.appendChild(postElement);
            });
            const postCount = document.getElementById('postCount');
            if (postCount) postCount.innerText = data.posts.length;
        } else {
            userFeedSection.innerHTML = '<p style="text-align: center; padding: 20px;">لم تقم بنشر أي شيء بعد.</p>';
        }
    } catch (error) {
        console.error('Error loading user posts:', error);
        userFeedSection.innerHTML = '<p style="text-align: center; padding: 20px; color: red;">حدث خطأ أثناء تحميل المنشورات.</p>';
    }
}

// ============ Initialization ============
function initializeApp() {
    console.log('🚀 Initializing Nexora UI...');
    
    // إعداد المودالز
    setupModals();

    // زر تسجيل الخروج
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.onclick = (e) => {
            e.preventDefault();
            logout();
        };
    }

    // زر الإشعارات
    const notificationsBtn = document.getElementById('notificationsBtn');
    const notificationsModal = document.getElementById('notificationsModal');
    if (notificationsBtn && notificationsModal) {
        notificationsBtn.onclick = (e) => {
            e.preventDefault();
            notificationsModal.classList.add('active');
            loadNotifications();
        };
    }

    // زر الإعدادات
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsModal = document.getElementById('settingsModal');
    if (settingsBtn && settingsModal) {
        settingsBtn.onclick = (e) => {
            e.preventDefault();
            settingsModal.classList.add('active');
        };
    }

    // تحميل البيانات إذا كان المستخدم مسجلاً
    if (authToken) {
        loadFeed();
        if (window.location.pathname.includes('profile.html')) {
            loadUserPosts();
        }
    }
    
    // تفعيل زر النشر إذا كان موجوداً
    const postSubmitBtn = document.getElementById('postSubmitBtn');
    if (postSubmitBtn) {
        postSubmitBtn.onclick = handlePostSubmit;
    }

    console.log('✅ Nexora UI initialized successfully');
}

// دالة معالجة النشر المنفصلة لضمان الربط الصحيح
async function handlePostSubmit() {
    const postTextarea = document.getElementById('postTextarea');
    const content = postTextarea.value.trim();

    if (content === '') {
        alert('يرجى كتابة نص في المنشور.');
        return;
    }

    const btn = document.getElementById('postSubmitBtn');
    btn.disabled = true;
    btn.innerHTML = '<div class="spinner"></div> جاري النشر...';

    try {
        const response = await fetch(`${API_BASE_URL}/posts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ content, postType: 'text' })
        });

        if (!response.ok) throw new Error('فشل النشر');

        postTextarea.value = '';
        await loadFeed();
    } catch (error) {
        console.error('Error:', error);
        alert('حدث خطأ أثناء النشر');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-paper-plane"></i> <span>نشر</span>';
    }
}

// استخدام DOMContentLoaded لضمان تحميل جميع العناصر قبل التنفيذ
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}
