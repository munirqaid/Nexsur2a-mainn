// ============ Global Variables ============
const API_BASE_URL = 'http://localhost:3000/api';
let currentUser = null;
let authToken = localStorage.getItem('authToken');

// ============ Persona Data ============
const personaData = {
    casual: {
        title: "مستخدم عادي",
        icon: "fas fa-user",
        features: [
            { icon: "fas fa-newspaper", text: "آخر الأخبار (Newsfeed)" },
            { icon: "fas fa-bolt", text: "القصص السريعة (Stories)" },
            { icon: "fas fa-search", text: "اكتشاف المحتوى (Discovery)" },
            { icon: "fas fa-smile", text: "سهولة النشر (Easy Posting)" },
        ]
    },
    creator: {
        title: "منشئ محتوى",
        icon: "fas fa-paint-brush",
        features: [
            { icon: "fas fa-chart-line", text: "تحليلات الأداء (Analytics)" },
            { icon: "fas fa-money-bill-wave", text: "أدوات تحقيق الدخل (Monetization)" },
            { icon: "fas fa-tools", text: "أدوات إبداعية متقدمة (Creative Tools)" },
            { icon: "fas fa-users", text: "مساحات التعاون (Collaboration Spaces)" },
        ]
    },
    business: {
        title: "أعمال",
        icon: "fas fa-briefcase",
        features: [
            { icon: "fas fa-store", text: "المتجر والسوق (Marketplace)" },
            { icon: "fas fa-bullhorn", text: "إدارة الإعلانات (Ad Manager)" },
            { icon: "fas fa-headset", text: "أدوات CRM (إدارة العملاء)" },
            { icon: "fas fa-chart-bar", text: "تحليلات المبيعات (Sales Analytics)" },
        ]
    },
    gamer: {
        title: "لاعب",
        icon: "fas fa-gamepad",
        features: [
            { icon: "fas fa-video", text: "البث المباشر (Live Streaming)" },
            { icon: "fas fa-comments", text: "محادثات المجموعات (Group Chats)" },
            { icon: "fas fa-trophy", text: "لوحات الصدارة (Leaderboards)" },
            { icon: "fas fa-gift", text: "نظام المكافآت (Rewards System)" },
        ]
    },
    professional: {
        title: "محترف",
        icon: "fas fa-user-tie",
        features: [
            { icon: "fas fa-handshake", text: "الشبكات المهنية (Networking)" },
            { icon: "fas fa-graduation-cap", text: "مجتمعات التعلم (Learning Communities)" },
            { icon: "fas fa-check-circle", text: "حسابات موثقة (Verified Accounts)" },
            { icon: "fas fa-calendar-alt", text: "إدارة الفعاليات (Events Management)" },
        ]
    },
    privacy: {
        title: "مهتم بالخصوصية",
        icon: "fas fa-lock",
        features: [
            { icon: "fas fa-user-secret", text: "النشر المجهول (Anonymous Posting)" },
            { icon: "fas fa-shield-alt", text: "إعدادات الخصوصية المتقدمة" },
            { icon: "fas fa-key", text: "الرسائل المشفرة (Encrypted Messages)" },
            { icon: "fas fa-database", text: "التحكم في البيانات (Data Control)" },
        ]
    }
};

// ============ DOM Elements ============
const rightSidebar = document.getElementById('rightSidebar');
const personaSelect = document.getElementById('personaSelect');
const feedSection = document.getElementById('feedSection');
// const profileBtn = document.getElementById('profileBtn'); // Removed from navbar
const notificationsBtn = document.getElementById('notificationsBtn');
const searchBtn = document.getElementById('searchBtn');
const settingsBtn = document.getElementById('settingsBtn');
const menuBtn = document.getElementById('menuBtn');

const profileModal = document.getElementById('profileModal');
const notificationsModal = document.getElementById('notificationsModal');
const searchModal = document.getElementById('searchModal');
const settingsModal = document.getElementById('settingsModal');

// ============ Modal Functions ============
function openModal(modal) {
    modal.classList.add('active');
}

function closeModal(modal) {
    modal.classList.remove('active');
}

// Close modal when clicking close button
document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', function() {
        this.closest('.modal').classList.remove('active');
    });
});

// Close modal when clicking outside
window.addEventListener('click', function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.classList.remove('active');
    }
});

// ============ Sidebar Functions ============
function updateSidebar(personaKey) {
    const persona = personaData[personaKey];
    if (!persona) return;

    let htmlContent = `
        <h3 class="sidebar-title">
            <i class="${persona.icon} persona-icon"></i>
            ${persona.title}
        </h3>
        <p class="sidebar-description">ميزات Nexora المخصصة لك:</p>
        <ul class="feature-list">
    `;

    persona.features.forEach(feature => {
        htmlContent += `
            <li class="feature-item">
                <i class="${feature.icon} feature-icon"></i>
                <span>${feature.text}</span>
            </li>
        `;
    });

    htmlContent += `</ul>`;
    rightSidebar.innerHTML = htmlContent;

    if (window.innerWidth > 1024) {
        rightSidebar.style.display = 'block';
    }

    document.body.className = '';
    document.body.classList.add(`persona-${personaKey}`);
}

// ============ Feed Functions ============
async function loadFeed() {
    try {
        const response = await fetch(`${API_BASE_URL}/posts`);
        const data = await response.json();
        
        if (data.posts && data.posts.length > 0) {
            displayPosts(data.posts);
        } else {
            feedSection.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">لا توجد منشورات حالياً</p>';
        }
    } catch (error) {
        console.error('Error loading feed:', error);
        feedSection.innerHTML = '<p style="text-align: center; color: red; padding: 2rem;">حدث خطأ في تحميل الخلاصة</p>';
    }
}

function displayPosts(posts) {
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
    const mediaHtml = post.mediaUrls && post.mediaUrls.length > 0 
        ? `<div class="post-image"><img src="${post.mediaUrls[0]}" alt="صورة المنشور"></div>`
        : '';
    
    const createdAt = new Date(post.createdAt);
    const timeAgo = getTimeAgo(createdAt);
    
    div.innerHTML = `
        <div class="post-header">
            <img src="${author.avatarUrl || 'https://picsum.photos/40/40'}" alt="المستخدم" class="post-avatar">
            <div class="post-header-info">
                <h4 class="post-author">${author.displayName || 'مستخدم'}</h4>
                <p class="post-time">${timeAgo}</p>
            </div>
            <button class="post-menu-btn">
                <i class="fas fa-ellipsis-h"></i>
            </button>
        </div>
        <div class="post-content">
            <p>${post.content}</p>
        </div>
        ${mediaHtml}
        <div class="post-stats">
            <span><i class="fas fa-thumbs-up"></i> ${post.likeCount || 0} إعجاب</span>
            <span>${post.commentCount || 0} تعليق</span>
            <span>${post.shareCount || 0} مشاركة</span>
        </div>
        <div class="post-divider"></div>
        <div class="post-actions">
            <button class="post-action-btn" data-post-id="${post.id}" data-action="like">
                <i class="fas fa-thumbs-up"></i>
                <span>إعجاب</span>
            </button>
            <button class="post-action-btn" data-post-id="${post.id}" data-action="comment">
                <i class="fas fa-comment"></i>
                <span>تعليق</span>
            </button>
            <button class="post-action-btn" data-post-id="${post.id}" data-action="share">
                <i class="fas fa-share"></i>
                <span>مشاركة</span>
            </button>
        </div>
    `;
    
    return div;
}

function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
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
        if (interval >= 1) {
            return `قبل ${interval} ${key}`;
        }
    }
    
    return 'الآن';
}

// ============ Notifications Functions ============
async function loadNotifications() {
    try {
        if (!authToken) {
            notificationsModal.innerHTML = '<p style="padding: 2rem;">يرجى تسجيل الدخول أولاً</p>';
            return;
        }

        const response = await fetch(`${API_BASE_URL}/notifications`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        const data = await response.json();
        
        if (data.notifications && data.notifications.length > 0) {
            displayNotifications(data.notifications);
        } else {
            document.getElementById('notificationsList').innerHTML = '<p style="padding: 2rem; text-align: center;">لا توجد إشعارات</p>';
        }
    } catch (error) {
        console.error('Error loading notifications:', error);
    }
}

function displayNotifications(notifications) {
    const list = document.getElementById('notificationsList');
    list.innerHTML = '';
    
    notifications.forEach(notif => {
        const item = document.createElement('div');
        item.className = `notification-item ${notif.isRead ? '' : 'unread'}`;
        item.innerHTML = `
            <img src="${notif.actor?.avatarUrl || 'https://picsum.photos/40/40'}" alt="Avatar" class="notification-avatar">
            <div class="notification-content">
                <p class="notification-text">${notif.message}</p>
                <p class="notification-time">${getTimeAgo(new Date(notif.createdAt))}</p>
            </div>
        `;
        list.appendChild(item);
    });
}

// ============ Search Functions ============
async function performSearch(query) {
    if (!query || query.length < 2) {
        document.getElementById('searchResults').innerHTML = '<p style="padding: 1rem;">اكتب على الأقل حرفين للبحث</p>';
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        
        const resultsDiv = document.getElementById('searchResults');
        resultsDiv.innerHTML = '';
        
        // Display users
        if (data.users && data.users.length > 0) {
            const usersTitle = document.createElement('h3');
            usersTitle.style.marginTop = '1rem';
            usersTitle.style.marginBottom = '0.5rem';
            usersTitle.style.color = 'var(--color-cyber-aqua)';
            usersTitle.textContent = 'المستخدمون';
            resultsDiv.appendChild(usersTitle);
            
            data.users.forEach(user => {
                const item = document.createElement('div');
                item.className = 'search-result-item';
                item.innerHTML = `
                    <img src="${user.avatarUrl || 'https://picsum.photos/50/50'}" alt="Avatar" class="search-result-avatar">
                    <div class="search-result-info">
                        <p class="search-result-name">${user.displayName}</p>
                        <p class="search-result-username">@${user.username}</p>
                    </div>
                `;
                resultsDiv.appendChild(item);
            });
        }
        
        // Display posts
        if (data.posts && data.posts.length > 0) {
            const postsTitle = document.createElement('h3');
            postsTitle.style.marginTop = '1rem';
            postsTitle.style.marginBottom = '0.5rem';
            postsTitle.style.color = 'var(--color-cyber-aqua)';
            postsTitle.textContent = 'المنشورات';
            resultsDiv.appendChild(postsTitle);
            
            data.posts.forEach(post => {
                const item = document.createElement('div');
                item.className = 'search-result-item';
                item.innerHTML = `
                    <div class="search-result-info">
                        <p class="search-result-name">${post.content.substring(0, 50)}...</p>
                        <p class="search-result-username">${getTimeAgo(new Date(post.createdAt))}</p>
                    </div>
                `;
                resultsDiv.appendChild(item);
            });
        }
        
        if ((!data.users || data.users.length === 0) && (!data.posts || data.posts.length === 0)) {
            resultsDiv.innerHTML = '<p style="padding: 1rem; text-align: center;">لم يتم العثور على نتائج</p>';
        }
    } catch (error) {
        console.error('Error performing search:', error);
    }
}

// ============ Event Listeners ============

// Persona selector
personaSelect.addEventListener('change', function() {
    const selectedPersona = this.value;
    updateSidebar(selectedPersona);
    localStorage.setItem('nexoraPersona', selectedPersona);
});

// Add button
const addBtn = document.getElementById('addBtn');
if (addBtn) {
    addBtn.addEventListener('click', function() {
        // نختار التنبيه بدلاً من الدالة المفقودة
        alert('ميزة إضافة منشور جديد قيد التطوير');
    });
}

// Notifications button
notificationsBtn.addEventListener('click', function() {
    openModal(notificationsModal);
    loadNotifications();
});

// Search button
searchBtn.addEventListener('click', function() {
    openModal(searchModal);
    document.querySelector('.search-input').focus();
});

// Settings button
settingsBtn.addEventListener('click', function() {
    openModal(settingsModal);
});

// Save Settings button (Placeholder)
document.getElementById('saveSettingsBtn').addEventListener('click', function() {
    alert('تم حفظ الإعدادات بنجاح (وظيفة الحفظ تحتاج إلى تطوير في الخلفية)');
    closeModal(settingsModal);
});

// Search input
document.querySelector('.search-input').addEventListener('input', function(e) {
    performSearch(e.target.value);
});

// Menu button
menuBtn.addEventListener('click', function() {
    if (window.innerWidth <= 1024) {
        rightSidebar.style.display = rightSidebar.style.display === 'block' ? 'none' : 'block';
    }
});

// Post action buttons

// Placeholder for comment modal function
function openCommentModal(postId) {
    alert(\`فتح نافذة التعليقات للمنشور رقم: \${postId}\`);
}

// Placeholder for media file input
const mediaFileInput = document.getElementById('mediaFileInput');

// Event listeners for composer buttons
const composerEmojiBtn = document.getElementById('composerEmojiBtn');
const composerImageBtn = document.getElementById('composerImageBtn');
const composerVideoBtn = document.getElementById('composerVideoBtn');

if (composerEmojiBtn) {
    composerEmojiBtn.addEventListener('click', () => {
        alert('فتح منتقي الإيموجي');
    });
}

if (composerImageBtn) {
    composerImageBtn.addEventListener('click', () => {
        mediaFileInput.click();
    });
}

if (composerVideoBtn) {
    composerVideoBtn.addEventListener('click', () => {
        alert('فتح منتقي الفيديو');
    });
}

// Post action buttons
document.addEventListener('click', function(e) {
    if (e.target.closest('.post-action-btn')) {
        const btn = e.target.closest('.post-action-btn');
        const action = btn.dataset.action;
        const postId = btn.dataset.postId;
        
        if (action === 'like') {
            toggleLike(postId, btn);
        } else if (action === 'comment') {
            // فتح نافذة التعليقات بدلاً من التنبيه
            openCommentModal(postId);
        } else if (action === 'share') {
            sharePost(postId, btn);
        }
    }
});

// Window resize
window.addEventListener('resize', function() {
    if (window.innerWidth > 1024) {
        rightSidebar.style.display = 'block';
    } else {
        rightSidebar.style.display = '';
    }
});

// ============ Initialization ============
window.addEventListener('load', function() {
    const savedPersona = localStorage.getItem('nexoraPersona') || 'casual';
    personaSelect.value = savedPersona;
    updateSidebar(savedPersona);
    loadFeed();
    console.log('✅ Nexora loaded successfully');
});
