// ============ Global Variables ============
const API_BASE_URL = '/api'; // تم التعديل لاستخدام مسار نسبي ليعمل على Railway
let mediaFile = null; // لتخزين ملف الوسائط المختار

// ============ DOM Elements ============
const feedSection = document.getElementById('postsContainer');
const settingsBtn = document.getElementById('settingsSidebarBtn');
const profileBtn = document.getElementById('profileSidebarBtn');
const logoutBtn = document.getElementById('logoutBtn');
const userProfileBtn = document.getElementById('userProfileBtn');

// Post Composer Elements
const postInput = document.getElementById('postInput');
const composerImageBtn = document.getElementById('composerImageBtn');
const composerImageUploadBtn = document.getElementById('composerImageUploadBtn');
const composerVideoBtn = document.getElementById('composerVideoBtn');
const composerPollBtn = document.getElementById('composerPollBtn');
const publishBtn = document.getElementById('publishBtn');
const mediaPreview = document.getElementById('mediaPreview');

// Media Selection Elements
const mediaFileInput = document.getElementById('mediaFileInput');

// Camera Elements
let stream = null; // للحفاظ على تيار الكاميرا

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
        if (modal === cameraModal) {
            stopCameraStream();
        }
    });
});

window.addEventListener('click', function(event) {
    if (event.target.classList.contains('modal')) {
        closeModal(event.target);
        if (event.target === cameraModal) {
            stopCameraStream();
        }
    }
});

// ============ Feed Functions ============
async function loadFeed() {
    try {
        // إضافة timestamp لتجنب caching
        const timestamp = new Date().getTime();
        const response = await fetch(`${API_BASE_URL}/posts?t=${timestamp}`, {
            cache: 'no-store',
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });
        const data = await response.json();
        
        if (data.posts && data.posts.length > 0) {
            displayPosts(data.posts);
            // حفظ المنشورات في localStorage كنسخة احتياطية
            localStorage.setItem('nexora_posts_cache', JSON.stringify(data.posts));
            localStorage.setItem('nexora_posts_cache_time', timestamp.toString());
        } else {
            feedSection.innerHTML = '<p class="empty-feed">لا توجد منشورات حالياً. كن أول من ينشر!</p>';
        }
    } catch (error) {
        console.error('Error loading feed:', error);
        // محاولة استعادة البيانات من localStorage في حالة الخطأ
        const cachedPosts = localStorage.getItem('nexora_posts_cache');
        if (cachedPosts) {
            try {
                const posts = JSON.parse(cachedPosts);
                displayPosts(posts);
                console.log('Loaded posts from cache');
            } catch (e) {
                feedSection.innerHTML = '<p class="empty-feed error">حدث خطأ في تحميل الخلاصة</p>';
            }
        } else {
            feedSection.innerHTML = '<p class="empty-feed error">حدث خطأ في تحميل الخلاصة</p>';
        }
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
    
    const author = post.author || { displayName: 'مستخدم', avatarUrl: '/placeholder.svg' };
	    const mediaHtml = post.mediaUrls && post.mediaUrls.length > 0
	        ? `<div class="post-image"><img src="${post.mediaUrls[0]}" alt="صورة المنشور"></div>`
	        : '';
    
    const timeAgo = post.createdAt ? getTimeAgo(new Date(post.createdAt)) : 'الآن';
    
    div.innerHTML = `
        <div class="post-header">
            <img src="${author.avatarUrl || '/placeholder.svg'}" alt="المستخدم" class="post-avatar">
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

// ============ Post Composer Functions ============
if (composerImageBtn) {
    composerImageBtn.addEventListener('click', () => {
        startCameraStream();
    });
}

if (composerImageUploadBtn) {
    composerImageUploadBtn.addEventListener('click', () => {
        mediaFileInput.click();
    });
}

if (composerVideoBtn) {
    composerVideoBtn.addEventListener('click', () => alert('ميزة الفيديو قيد التطوير!'));
}

if (composerPollBtn) {
    composerPollBtn.addEventListener('click', () => alert('ميزة الاستطلاع قيد التطوير!'));
}

mediaFileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        mediaFile = file;
        const reader = new FileReader();
        reader.onload = (e) => {
            mediaPreview.innerHTML = `<img src="${e.target.result}" alt="معاينة الوسائط">`;
            mediaPreview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
});

// Camera Functions
async function startCameraStream() {
    try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        console.log('Camera stream started');
    } catch (error) {
        console.error('Error accessing camera:', error);
        alert('لا يمكن الوصول إلى الكاميرا. يرجى التحقق من الأذونات.');
    }
}

function stopCameraStream() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }
}

// Post Submission
if (publishBtn) {
    publishBtn.addEventListener('click', async () => {
        // تحديث authToken من localStorage قبل كل محاولة نشر
        // تحقق من كلا الأسماء المحتملة للتوكن (token أو authToken)
        const authToken = localStorage.getItem('authToken') || localStorage.getItem('token');

        const content = postInput.value.trim();
    if (!content && !mediaFile) {
        alert('يرجى كتابة نص أو إضافة وسائط.');
        return;
    }

    if (!authToken) {
        alert('يرجى تسجيل الدخول أولاً لنشر منشور.');
        return;
    }

// 1. Upload media if available
	    let mediaUrls = [];
	    if (mediaFile) {
	        const formData = new FormData();
	        formData.append('files', mediaFile);
	
	        try {
	            const uploadResponse = await fetch(`${API_BASE_URL}/upload`, {
	                method: 'POST',
	                headers: {
	                    'Authorization': `Bearer ${authToken}`
	                },
	                body: formData
	            });
	
if (!uploadResponse.ok) {
                if (uploadResponse.status === 401 || uploadResponse.status === 403) {
                    throw new Error('Authentication failed. Please log in again.');
                }
                throw new Error('Media upload failed with status: ' + uploadResponse.status);
            }
	
	            const uploadData = await uploadResponse.json();
	            mediaUrls = uploadData.files;
	        } catch (error) {
	            console.error('Error uploading media:', error);
	            alert('فشل تحميل الوسائط. لن يتم نشر المنشور.');
	            return;
	        }
	    }
	
	    // 2. Submit post to API
	    try {
	        const postResponse = await fetch(`${API_BASE_URL}/posts`, {
	            method: 'POST',
	            headers: {
	                'Content-Type': 'application/json',
	                'Authorization': `Bearer ${authToken}`
	            },
	            body: JSON.stringify({
	                content: content,
	                postType: mediaUrls.length > 0 ? 'media' : 'text', // تحديد نوع المنشور
	                mediaUrls: mediaUrls,
	            })
	        });
	
if (!postResponse.ok) {
            if (postResponse.status === 401 || postResponse.status === 403) {
                throw new Error('Authentication failed. Please log in first.');
            }
            throw new Error('Post submission failed with status: ' + postResponse.status);
        }
	
	        // 3. Reload feed to show the new post from the database
	        await loadFeed();
	        
	        console.log('Post submitted successfully.');
    } catch (error) {
        console.error('Error submitting post:', error);
        let errorMessage = 'فشل نشر المنشور. يرجى المحاولة مرة أخرى.';
        if (error.message.includes('Authentication failed')) {
            errorMessage = 'فشل التوثيق. يرجى تسجيل الدخول أولاً.';
        } else if (error.message.includes('Post submission failed with status')) {
            errorMessage = `فشل نشر المنشور. رمز الخطأ: ${error.message.split(': ')[1]}`;
        }
        alert(errorMessage);
        return;
    }

        // Clear composer
        postInput.value = '';
        mediaPreview.innerHTML = '';
        mediaPreview.style.display = 'none';
        mediaFile = null;
        mediaFileInput.value = ''; // Reset file input
    });
}


// ============ Event Listeners for Navbar ============
if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
        alert('الإعدادات قيد التطوير!');
    });
}

if (profileBtn) {
    profileBtn.addEventListener('click', () => {
        alert('الملف الشخصي قيد التطوير!');
    });
}

if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/auth.html';
    });
}

// ============ User Avatar Update ============
function updateUserAvatar() {
    const user = localStorage.getItem('user');
    if (user) {
        try {
            const userData = JSON.parse(user);
            const initials = (userData.displayName || userData.username || 'A').charAt(0).toUpperCase();
            const creatorAvatar = document.getElementById('creatorAvatar');
            const userAvatarNav = document.getElementById('userAvatarNav');
            const userNameNav = document.getElementById('userNameNav');
            
            if (creatorAvatar) creatorAvatar.textContent = initials;
            if (userAvatarNav) userAvatarNav.textContent = initials;
            if (userNameNav) userNameNav.textContent = userData.displayName || userData.username || 'المستخدم';
        } catch (e) {
            console.error('Error parsing user data:', e);
        }
    }
}

// ============ Initialization ============
window.addEventListener('load', function() {
    loadFeed();
    updateUserAvatar();
    console.log('✅ Nexora loaded successfully!');
});


