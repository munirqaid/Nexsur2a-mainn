// ============ Global Variables ============
const API_BASE_URL = 'http://localhost:3000/api';
let currentUser = null;
let authToken = localStorage.getItem('authToken');
let mediaFile = null; // لتخزين ملف الوسائط المختار

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
const feedSection = document.getElementById('feedSection');
const notificationsBtn = document.getElementById('notificationsBtn');
const settingsBtn = document.getElementById('settingsBtn');
const userProfileBtn = document.getElementById('userProfileBtn');
const addStoryBtn = document.getElementById('addStoryBtn');

// Modals
const notificationsModal = document.getElementById('notificationsModal');
const settingsModal = document.getElementById('settingsModal');
const profileModal = document.getElementById('profileModal');
const addStoryModal = document.getElementById('addStoryModal');
const viewStoryModal = document.getElementById('viewStoryModal');

// Post Composer Elements
const postTextarea = document.getElementById('postTextarea');
const composerMediaBtn = document.getElementById('composerMediaBtn');
const composerCameraBtn = document.getElementById('composerCameraBtn');
const composerEmojiBtn = document.getElementById('composerEmojiBtn');
const postSubmitBtn = document.getElementById('postSubmitBtn');
const mediaPreview = document.getElementById('mediaPreview');

// Media Selection Elements
const mediaFileInput = document.getElementById('mediaFileInput');
const cameraInput = document.getElementById('cameraInput');

// Story Elements
const uploadMediaStoryBtn = document.getElementById('uploadMediaBtn');
const openCameraStoryBtn = document.getElementById('openCameraBtn');
const storyPreview = document.getElementById('storyPreview');
const storyImage = document.getElementById('storyImage');
const storyVideo = document.getElementById('storyVideo');
const storyCaption = document.getElementById('storyCaption');
const publishStoryBtn = document.getElementById('publishStoryBtn');

// ============ Modal Functions ============
function openModal(modal) {
    if (modal) modal.classList.add('active');
}

function closeModal(modal) {
    if (modal) modal.classList.remove('active');
}

document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', function() {
        const modal = this.closest('.modal');
        closeModal(modal);
    });
});

window.addEventListener('click', function(event) {
    if (event.target.classList.contains('modal')) {
        closeModal(event.target);
    }
});

// ============ Feed Functions (تم الاحتفاظ بها كما هي) ============
async function loadFeed() {
    try {
        const response = await fetch(`${API_BASE_URL}/posts`);
        const data = await response.json();
        
        if (data.posts && data.posts.length > 0) {
            displayPosts(data.posts);
        } else {
            feedSection.innerHTML = '<p class="empty-feed">لا توجد منشورات حالياً. كن أول من ينشر!</p>';
        }
    } catch (error) {
        console.error('Error loading feed:', error);
        feedSection.innerHTML = '<p class="empty-feed error">حدث خطأ في تحميل الخلاصة</p>';
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
    const mediaHtml = post.mediaUrl
        ? `<div class="post-image"><img src="${post.mediaUrl}" alt="صورة المنشور"></div>`
        : '';
    
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
        ${mediaHtml}
        <div class="post-stats">
            <span><i class="fas fa-thumbs-up"></i> ${post.likeCount || 0}</span>
            <span>${post.commentCount || 0} تعليق</span>
        </div>
        <div class="post-divider"></div>
        <div class="post-actions">
            <button class="post-action-btn" data-post-id="${post.id || 'dummy'}" data-action="like"><i class="fas fa-thumbs-up"></i> <span>إعجاب</span></button>
            <button class="post-action-btn" data-post-id="${post.id || 'dummy'}" data-action="comment"><i class="fas fa-comment"></i> <span>تعليق</span></button>
            <button class="post-action-btn" data-post-id="${post.id || 'dummy'}" data-action="share"><i class="fas fa-share"></i> <span>مشاركة</span></button>
        </div>
    `;
    
    // إضافة مستمعي الأحداث لأزرار التفاعل
    div.querySelectorAll('.post-action-btn').forEach(btn => {
        btn.addEventListener('click', handlePostAction);
    });

    return div;
}

function handlePostAction(e) {
    const btn = e.currentTarget;
    const postId = btn.dataset.postId;
    const action = btn.dataset.action;

    if (action === 'like') {
        // محاكاة الإعجاب
        btn.classList.toggle('liked');
        alert('تم محاكاة الإعجاب للمنشور: ' + postId);
    } else if (action === 'comment') {
        // توجيه المستخدم إلى صفحة المنشور الفردي
        window.location.href = `post.html?id=${postId}`;
    } else if (action === 'share') {
        alert('تم محاكاة مشاركة المنشور: ' + postId);
    }
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

// ============ Post Composer Functions (تم الاحتفاظ بها كما هي) ============
// (تم حذف الدوال المتعلقة بالـ Composer لعدم التعارض)

// ============ دوال التعامل مع القصص (Stories) ============

// فتح Modal إضافة قصة
if (addStoryBtn) {
    addStoryBtn.addEventListener('click', () => {
        openModal(addStoryModal);
    });
}

// زر اختيار من الوسائط
if (uploadMediaStoryBtn) {
    uploadMediaStoryBtn.addEventListener('click', () => {
        mediaFileInput.click();
    });
}

// زر فتح الكاميرا
if (openCameraStoryBtn) {
    openCameraStoryBtn.addEventListener('click', () => {
        cameraInput.click();
    });
}

// معالجة اختيار الملف من الوسائط
mediaFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const isVideo = file.type.startsWith('video');
            storyPreview.style.display = 'flex';
            
            if (isVideo) {
                storyImage.style.display = 'none';
                storyVideo.style.display = 'block';
                storyVideo.src = event.target.result;
            } else {
                storyImage.style.display = 'block';
                storyVideo.style.display = 'none';
                storyImage.src = event.target.result;
            }
        };
        reader.readAsDataURL(file);
    }
});

// معالجة فتح الكاميرا
cameraInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const isVideo = file.type.startsWith('video');
            storyPreview.style.display = 'flex';
            
            if (isVideo) {
                storyImage.style.display = 'none';
                storyVideo.style.display = 'block';
                storyVideo.src = event.target.result;
            } else {
                storyImage.style.display = 'block';
                storyVideo.style.display = 'none';
                storyImage.src = event.target.result;
            }
        };
        reader.readAsDataURL(file);
    }
});

// نشر القصة (محاكاة)
if (publishStoryBtn) {
    publishStoryBtn.addEventListener('click', async () => {
        const caption = storyCaption.value;
        const storyImgSrc = storyImage.src;
        const storyVidSrc = storyVideo.src;
        
        if (!storyImgSrc && !storyVidSrc) {
            alert('يرجى اختيار صورة أو فيديو');
            return;
        }
        
        // محاكاة إرسال القصة إلى الخادم
        console.log('Publishing story:', { caption, media: storyImgSrc || storyVidSrc });
        
        alert('تم محاكاة نشر القصة بنجاح! (تحتاج إلى API حقيقي)');
        closeModal(addStoryModal);
        storyPreview.style.display = 'none';
        storyCaption.value = '';
        loadStories();
    });
}

// تحميل القصص (محاكاة)
async function loadStories() {
    const dummyStories = [
        { id: 1, author: { displayName: 'أحمد', avatarUrl: 'https://picsum.photos/80/80?random=1' }, mediaUrl: 'https://picsum.photos/80/80?random=101' },
        { id: 2, author: { displayName: 'فاطمة', avatarUrl: 'https://picsum.photos/80/80?random=2' }, mediaUrl: 'https://picsum.photos/80/80?random=102' },
        { id: 3, author: { displayName: 'خالد', avatarUrl: 'https://picsum.photos/80/80?random=3' }, mediaUrl: 'https://picsum.photos/80/80?random=103' },
        { id: 4, author: { displayName: 'ليلى', avatarUrl: 'https://picsum.photos/80/80?random=4' }, mediaUrl: 'https://picsum.photos/80/80?random=104' },
    ];
    displayStories(dummyStories);
}

// عرض القصص
function displayStories(stories) {
    const storiesContainer = document.getElementById('storiesContainer');
    if (!storiesContainer) return;
    
    storiesContainer.innerHTML = '';
    
    stories.forEach(story => {
        const storyItem = document.createElement('div');
        storyItem.className = 'story-item';
        
        const mediaUrl = story.mediaUrl || 'https://picsum.photos/80/80';
        const author = story.author || { displayName: 'مستخدم' };
        
        storyItem.innerHTML = `
            <div class="story-circle" onclick="viewStory('${story.id}', '${mediaUrl}', '${author.displayName}')">
                <img src="${mediaUrl}" alt="${author.displayName}">
            </div>
            <p class="story-label">${author.displayName}</p>
        `;
        
        storiesContainer.appendChild(storyItem);
    });
}

// عرض القصة
function viewStory(storyId, mediaUrl, authorName) {
    document.getElementById('viewStoryImage').src = mediaUrl;
    document.getElementById('storyAuthorName').textContent = authorName;
    document.getElementById('storyAuthorAvatar').src = `https://picsum.photos/40/40?random=${storyId}`;
    openModal(viewStoryModal);
}

// ============ دوال التعامل مع الملف الشخصي ============

// فتح الملف الشخصي من زر الـ Navbar
if (userProfileBtn) {
    userProfileBtn.addEventListener('click', () => {
        openModal(profileModal);
    });
}

// فتح الملف الشخصي من صورة المنشور
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('post-avatar')) {
        // يمكن إضافة منطق لفتح ملف شخصي محدد
        openModal(profileModal);
    }
});

// ============ Event Listeners for Navbar ============
if (notificationsBtn) {
    notificationsBtn.addEventListener('click', () => openModal(notificationsModal));
}

if (settingsBtn) {
    settingsBtn.addEventListener('click', () => openModal(settingsModal));
}

// ============ Initialization ============
window.addEventListener('load', function() {
    loadFeed();
    loadStories();
});
