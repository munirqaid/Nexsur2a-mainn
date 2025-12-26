
const API_BASE_URL = window.location.origin + '/api';
let authToken = localStorage.getItem('token') || localStorage.getItem('authToken');

// التأكد من وجود التوكن في كلا المفتاحين لضمان التوافق
if (authToken) {
    localStorage.setItem('token', authToken);
    localStorage.setItem('authToken', authToken);
}

// ============ Authentication Check ============
function checkAuthAndRedirect() {
    let token = localStorage.getItem('token') || localStorage.getItem('authToken');
    const isAuthPage = window.location.pathname.includes('auth.html');

    if (!token && !isAuthPage) {
        window.location.replace('/auth.html');
    } else if (token && isAuthPage) {
        window.location.replace('/index.html');
    }
}

// تشغيل التحقق فوراً
checkAuthAndRedirect();

// ============ Logout Function ============
function logout(redirect = true) {
    console.log('Logging out...');
    localStorage.removeItem('token');
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    // مسح أي بيانات أخرى قد تكون مخزنة
    localStorage.clear(); 
    
    if (redirect) {
        window.location.href = '/auth.html';
    }
}

// ============ Feed Functions ============
async function loadFeed() {
    const feedSection = document.getElementById('feedSection');
    if (!feedSection) return;

    feedSection.innerHTML = '<div class="loading" style="text-align: center; padding: 20px;"><div class="spinner" style="margin: 0 auto;"></div><p>جارٍ تحميل المنشورات...</p></div>';

    try {
        const response = await fetch(`${API_BASE_URL}/posts`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.status === 401 || response.status === 403) {
            logout(true);
            return;
        }

        if (!response.ok) {
            throw new Error('فشل جلب المنشورات');
        }

        const data = await response.json();
        
        if (data.posts && data.posts.length > 0) {
            displayPosts(data.posts);
        } else {
            feedSection.innerHTML = '<p class="empty-feed" style="text-align: center; padding: 20px; color: #777;">لا توجد منشورات حالياً. كن أول من ينشر!</p>';
        }
    } catch (error) {
        console.error('Error loading feed:', error);
        feedSection.innerHTML = `<p class="empty-feed error" style="text-align: center; padding: 20px; color: red;">حدث خطأ في تحميل الخلاصة: ${error.message}</p>`;
    }
}

function displayPosts(posts) {
    const feedSection = document.getElementById('feedSection');
    if (!feedSection) return;
    feedSection.innerHTML = '';
    posts.forEach(post => {
        const postElement = createPostElement(post);
        feedSection.appendChild(postElement);
    });
    
    setupPostMenuListeners();
}

function createPostElement(post) {
    const div = document.createElement('div');
    div.className = 'post-card';
    div.id = `post-${post._id}`;
    div.style.position = 'relative';
    
    const author = post.author || { displayName: 'مستخدم' };
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const isMyPost = currentUser && (currentUser.id === post.author?.id || currentUser.id === post.author?._id || currentUser._id === post.author?._id);
    
    const timeAgo = post.createdAt ? getTimeAgo(new Date(post.createdAt)) : 'الآن';
    const mediaHtml = post.mediaUrls && post.mediaUrls.length > 0 
        ? `<div class="post-media"><img src="${post.mediaUrls[0]}" alt="Post Media" style="width: 100%; border-radius: 8px; margin-top: 10px;"></div>` 
        : '';

    const avatarHtml = author.avatarUrl 
        ? `<img src="${author.avatarUrl}" alt="المستخدم" class="post-avatar">`
        : `<div class="post-avatar-placeholder" style="width:44px; height:44px; border-radius:50%; background:#eee; display:flex; align-items:center; justify-content:center;"><i class="fas fa-user" style="color:#ccc;"></i></div>`;

    div.innerHTML = `
        <div class="post-header">
            ${avatarHtml}
            <div class="post-header-info">
                <h4 class="post-author">${author.displayName || 'مستخدم'}</h4>
                <p class="post-time">${timeAgo}</p>
            </div>
            <div class="post-menu-container">
                <button class="post-menu-btn" data-post-id="${post._id}"><i class="fas fa-ellipsis-h"></i></button>
                <div class="post-dropdown-menu" id="menu-${post._id}">
                    <a href="#" class="menu-item" data-action="save"><i class="fas fa-bookmark"></i> حفظ المنشور</a>
                    ${isMyPost ? `<a href="#" class="menu-item delete-post-btn" data-post-id="${post._id}" style="color: #ff4757;"><i class="fas fa-trash-alt"></i> حذف المنشور</a>` : ''}
                    <a href="#" class="menu-item" data-action="report"><i class="fas fa-flag"></i> إبلاغ عن المنشور</a>
                </div>
            </div>
        </div>
        <div class="post-content">
            <p>${post.content}</p>
            ${mediaHtml}
        </div>
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
    return 'منذ فترة';
}

// ============ UI Interaction Functions ============
function setupModals() {
    const modals = document.querySelectorAll('.modal');
    const closeButtons = document.querySelectorAll('.modal-close');

    closeButtons.forEach(btn => {
        btn.onclick = () => {
            modals.forEach(modal => modal.classList.remove('active'));
        };
    });

    window.onclick = (e) => {
        modals.forEach(modal => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    };
}

async function fetchCurrentUser() {
    if (!authToken) return;
    try {
        const response = await fetch(`${API_BASE_URL}/users/me`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('user', JSON.stringify(data.user));
        } else if (response.status === 401 || response.status === 403) {
            logout(true);
        }
    } catch (error) {
        console.error('Error fetching current user:', error);
    }
}

// ============ Initialization ============
async function initializeApp() {
    console.log('Initializing Nexora App...');
    
    // 1. التحقق من التوكن
    if (authToken) {
        const response = await fetch(`${API_BASE_URL}/auth/verify`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (!response.ok) {
            logout(true);
            return;
        }
        await fetchCurrentUser();
    } else {
        checkAuthAndRedirect();
        return;
    }

    // 2. إعداد المودالز
    setupModals();

    // 3. ربط الأزرار العلوية (Navbar)
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.onclick = (e) => {
            e.preventDefault();
            logout();
        };
    }

    const notificationsBtn = document.getElementById('notificationsBtn');
    const notificationsModal = document.getElementById('notificationsModal');
    if (notificationsBtn && notificationsModal) {
        notificationsBtn.onclick = (e) => {
            e.preventDefault();
            notificationsModal.classList.add('active');
            loadNotifications();
        };
    }

    const settingsBtn = document.getElementById('settingsBtn');
    const settingsModal = document.getElementById('settingsModal');
    if (settingsBtn && settingsModal) {
        settingsBtn.onclick = (e) => {
            e.preventDefault();
            settingsModal.classList.add('active');
        };
    }

    // 4. تحميل البيانات
    if (window.location.pathname.includes('profile.html')) {
        loadUserPosts();
    } else {
        loadFeed();
    }
    
    // تحديث صورة المستخدم الحالي في الواجهة
    const user = JSON.parse(localStorage.getItem('user'));
    const currentAvatar = document.getElementById('currentUserAvatar');
    if (user && user.avatarUrl && currentAvatar) {
        currentAvatar.src = user.avatarUrl;
        currentAvatar.style.display = 'block';
    }

    setupMediaUpload();
    setupComments();

    console.log('✅ Nexora UI initialized successfully');
}

async function loadUserPosts() {
    const user = JSON.parse(localStorage.getItem('user'));
    const feedSection = document.getElementById('userFeedSection');
    if (!user || !feedSection) return;

    feedSection.innerHTML = '<div class="spinner" style="margin: 20px auto;"></div>';

    try {
        const response = await fetch(`${API_BASE_URL}/posts/user/${user.id || user._id}`);
        const data = await response.json();
        
        if (data.posts && data.posts.length > 0) {
            feedSection.innerHTML = '';
            data.posts.forEach(post => {
                feedSection.appendChild(createPostElement(post));
            });
            setupPostMenuListeners();
        } else {
            feedSection.innerHTML = '<p style="text-align: center; padding: 20px;">لا توجد منشورات بعد.</p>';
        }
    } catch (error) {
        feedSection.innerHTML = 'خطأ في تحميل المنشورات';
    }
}

// ============ Media Upload ============
function setupMediaUpload() {
    const mediaUploadBtn = document.getElementById('mediaUploadBtn');
    const mediaDropdown = document.getElementById('mediaDropdown');
    const mediaFileInput = document.getElementById('mediaFileInput');
    const postSubmitBtn = document.getElementById('postSubmitBtn');

    if (mediaUploadBtn && mediaDropdown) {
        mediaUploadBtn.onclick = (e) => {
            e.stopPropagation();
            mediaDropdown.classList.toggle('active');
        };
        document.addEventListener('click', () => mediaDropdown.classList.remove('active'));
    }

    if (postSubmitBtn) {
        postSubmitBtn.onclick = handlePostSubmit;
    }

    const openGalleryBtn = document.getElementById('openGalleryBtn');
    if (openGalleryBtn && mediaFileInput) {
        openGalleryBtn.onclick = () => mediaFileInput.click();
    }
    
    const openCameraBtn = document.getElementById('openCameraBtn');
    if (openCameraBtn && mediaFileInput) {
        openCameraBtn.onclick = () => {
            mediaFileInput.setAttribute('capture', 'environment');
            mediaFileInput.click();
        };
    }

    if (mediaFileInput) {
        mediaFileInput.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const preview = document.getElementById('mediaPreview');
                    const container = document.getElementById('mediaPreviewContainer');
                    if (preview && container) {
                        preview.src = event.target.result;
                        container.classList.add('active');
                    }
                };
                reader.readAsDataURL(file);
            }
        };
    }

    const removeMediaBtn = document.getElementById('removeMediaBtn');
    if (removeMediaBtn) {
        removeMediaBtn.onclick = () => {
            if (mediaFileInput) mediaFileInput.value = '';
            const preview = document.getElementById('mediaPreview');
            const container = document.getElementById('mediaPreviewContainer');
            if (preview) preview.src = '';
            if (container) container.classList.remove('active');
        };
    }
}

// ============ Post Submission ============
async function handlePostSubmit() {
    const postTextarea = document.getElementById('postTextarea');
    const mediaFileInput = document.getElementById('mediaFileInput');
    const btn = document.getElementById('postSubmitBtn');
    
    const content = postTextarea?.value.trim() || '';
    const mediaFile = mediaFileInput?.files[0];

    if (!content && !mediaFile) {
        alert('يرجى كتابة نص أو اختيار صورة للمنشور.');
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<div class="spinner"></div> جاري النشر...';

    try {
        let response;
        if (mediaFile) {
            const formData = new FormData();
            formData.append('content', content);
            formData.append('postType', 'image');
            formData.append('media', mediaFile);

            response = await fetch(`${API_BASE_URL}/posts`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${authToken}` },
                body: formData
            });
        } else {
            response = await fetch(`${API_BASE_URL}/posts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({ content, postType: 'text' })
            });
        }

        if (response.ok) {
            if (postTextarea) postTextarea.value = '';
            if (mediaFileInput) mediaFileInput.value = '';
            document.getElementById('mediaPreviewContainer')?.classList.remove('active');
            loadFeed();
        } else {
            const err = await response.json();
            alert('خطأ: ' + (err.error || 'فشل النشر'));
        }
    } catch (error) {
        alert('حدث خطأ أثناء النشر');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-paper-plane"></i> <span>نشر</span>';
    }
}

// ============ Comments Logic ============
function setupComments() {
    const submitCommentBtn = document.getElementById('submitCommentBtn');
    if (submitCommentBtn) {
        submitCommentBtn.onclick = async () => {
            const commentTextarea = document.getElementById('commentTextarea');
            const content = commentTextarea?.value.trim();
            const postId = window.currentPostIdForComments;
            
            if (!content || !postId) return;

            try {
                const response = await fetch(`${API_BASE_URL}/comments`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`
                    },
                    body: JSON.stringify({ postId, content })
                });
                if (response.ok) {
                    commentTextarea.value = '';
                    loadComments(postId);
                }
            } catch (e) { console.error(e); }
        };
    }

    document.addEventListener('click', (e) => {
        const commentBtn = e.target.closest('.post-action-btn[data-action="comment"]');
        if (commentBtn) {
            const postCard = commentBtn.closest('.post-card');
            const postId = postCard.id.replace('post-', '');
            window.currentPostIdForComments = postId;
            document.getElementById('commentsModal')?.classList.add('active');
            loadComments(postId);
        }
    });
}

async function loadComments(postId) {
    const list = document.getElementById('commentsList');
    if (!list) return;
    list.innerHTML = '<div class="spinner" style="margin: 20px auto;"></div>';
    try {
        const res = await fetch(`${API_BASE_URL}/comments/post/${postId}`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const data = await res.json();
        list.innerHTML = (data.comments || []).map(c => `
            <div class="comment-item">
                <img src="${c.userId?.avatarUrl || 'https://picsum.photos/32/32'}" class="comment-avatar">
                <div class="comment-content-wrapper">
                    <div class="comment-author">${c.userId?.displayName || 'مستخدم'}</div>
                    <div class="comment-text">${c.content}</div>
                </div>
            </div>
        `).join('') || '<p style="text-align:center; padding:10px;">لا توجد تعليقات</p>';
    } catch (e) { list.innerHTML = 'خطأ في التحميل'; }
}

async function loadNotifications() {
    const list = document.getElementById('notificationsList');
    if (!list) return;
    try {
        const res = await fetch(`${API_BASE_URL}/notifications`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const data = await res.json();
        list.innerHTML = (data.notifications || []).map(n => `
            <div class="notification-item">
                <div class="notification-content"><p>${n.message}</p></div>
            </div>
        `).join('') || '<p style="text-align:center; padding:10px;">لا توجد إشعارات</p>';
    } catch (e) { }
}

function setupPostMenuListeners() {
    document.querySelectorAll('.post-menu-btn').forEach(btn => {
        btn.onclick = (e) => {
            e.stopPropagation();
            const menu = document.getElementById(`menu-${btn.dataset.postId}`);
            document.querySelectorAll('.post-dropdown-menu').forEach(m => m !== menu && m.classList.remove('active'));
            menu?.classList.toggle('active');
        };
    });
    document.addEventListener('click', () => document.querySelectorAll('.post-dropdown-menu').forEach(m => m.classList.remove('active')));
    
    document.querySelectorAll('.delete-post-btn').forEach(btn => {
        btn.onclick = async (e) => {
            e.preventDefault();
            if (confirm('حذف المنشور؟')) {
                const res = await fetch(`${API_BASE_URL}/posts/${btn.dataset.postId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${authToken}` }
                });
                if (res.ok) loadFeed();
            }
        };
    });
}

// تشغيل التطبيق
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}
// يضيف النص فقط أسفل الحقول في صفحة تسجيل الدخول
function addCreditLogin() {
  const container = document.querySelector(".login-container"); // عدل هذا حسب الـ class أو id
  if(container && !document.getElementById("login-credit")) {
    const credit = document.createElement("div");
    credit.id = "login-credit";
    credit.textContent = "إعداد: منير رجوف";
    credit.style.cssText = "margin-top:10px; text-align:center; color:#1e88e5; font-weight:600; font-size:14px;";
    container.appendChild(credit);
  }
}

// استدعاء الدالة عند تحميل الصفحة أو تغيير hash
window.addEventListener("hashchange", addCreditLogin);
window.addEventListener("DOMContentLoaded", addCreditLogin);
// يضيف النص فقط أسفل الحقول في صفحة تسجيل الدخول
function addCreditLogin() {
  const container = document.querySelector(".login-container"); // عدل حسب الـ class أو id
  if(container && !document.getElementById("login-credit")) {
    const credit = document.createElement("div");
    credit.id = "login-credit";
    credit.textContent = "إعداد: منير رجوف";
    credit.style.cssText = "margin-top:10px; text-align:center; color:#1e88e5; font-weight:600; font-size:14px;";
    container.appendChild(credit);
  }
}

// استدعاء الدالة عند تحميل الصفحة أو تغيير hash
window.addEventListener("hashchange", addCreditLogin);
window.addEventListener("DOMContentLoaded", addCreditLogin);
// إضافة النص أسفل حقول تسجيل الدخول بعد إنشاء DOM
function addCreditLogin() {
  const container = document.querySelector(".login-container"); // عدل هذا إذا كان class مختلف
  if(container && !document.getElementById("login-credit")) {
    const credit = document.createElement("div");
    credit.id = "login-credit";
    credit.textContent = "إعداد: منير رجوف";
    credit.style.cssText = "margin-top:10px; text-align:center; color:#1e88e5; font-weight:600; font-size:14px;";
    container.appendChild(credit);
  }
}

// استدعاء الدالة بعد تحميل الصفحة أو تغيير hash
window.addEventListener("hashchange", addCreditLogin);
window.addEventListener("DOMContentLoaded", addCreditLogin);
