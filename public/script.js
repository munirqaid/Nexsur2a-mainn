// ============ Global Variables ============
const API_BASE_URL = 'http://localhost:3000/api';
let authToken = localStorage.getItem('authToken');
let mediaFile = null; // لتخزين ملف الوسائط المختار

// ============ DOM Elements ============
const feedSection = document.getElementById('feedSection');
const notificationsBtn = document.getElementById('notificationsBtn');
const settingsBtn = document.getElementById('settingsBtn');

// Modals
const notificationsModal = document.getElementById('notificationsModal');
const settingsModal = document.getElementById('settingsModal');
const mediaSelectModal = document.getElementById('mediaSelectModal');
const cameraModal = document.getElementById('cameraModal');

// Post Composer Elements
const postTextarea = document.getElementById('postTextarea');
const composerMediaBtn = document.getElementById('composerMediaBtn');
const composerCameraBtn = document.getElementById('composerCameraBtn');
const composerEmojiBtn = document.getElementById('composerEmojiBtn');
const postSubmitBtn = document.getElementById('postSubmitBtn');
const mediaPreview = document.getElementById('mediaPreview');

// Media Selection Elements
const uploadMediaBtn = document.getElementById('uploadMediaBtn');
const galleryMediaBtn = document.getElementById('galleryMediaBtn');
const mediaFileInput = document.getElementById('mediaFileInput');

// Camera Elements
const cameraVideo = document.getElementById('camera-video');
const cameraCanvas = document.getElementById('camera-canvas');
const captureImageBtn = document.getElementById('captureImageBtn');
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
composerMediaBtn.addEventListener('click', () => openModal(mediaSelectModal));
composerCameraBtn.addEventListener('click', () => {
    openModal(cameraModal);
    startCameraStream();
});
composerEmojiBtn.addEventListener('click', () => alert('ميزة الإيموجي قيد التطوير!'));

// Media Selection
uploadMediaBtn.addEventListener('click', () => mediaFileInput.click());
galleryMediaBtn.addEventListener('click', () => alert('ميزة المعرض قيد التطوير!'));

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
        closeModal(mediaSelectModal);
    }
});

// Camera Functions
async function startCameraStream() {
    try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        cameraVideo.srcObject = stream;
    } catch (error) {
        console.error('Error accessing camera:', error);
        alert('لا يمكن الوصول إلى الكاميرا. يرجى التحقق من الأذونات.');
        closeModal(cameraModal);
    }
}

function stopCameraStream() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }
}

captureImageBtn.addEventListener('click', () => {
    cameraCanvas.width = cameraVideo.videoWidth;
    cameraCanvas.height = cameraVideo.videoHeight;
    const context = cameraCanvas.getContext('2d');
    context.drawImage(cameraVideo, 0, 0, cameraCanvas.width, cameraCanvas.height);
    
    const dataUrl = cameraCanvas.toDataURL('image/png');
    mediaPreview.innerHTML = `<img src="${dataUrl}" alt="صورة ملتقطة">`;
    mediaPreview.style.display = 'block';
    
    // تحويل الصورة إلى ملف لاستخدامه لاحقاً
    fetch(dataUrl).then(res => res.blob()).then(blob => {
        mediaFile = new File([blob], 'capture.png', { type: 'image/png' });
    });

    stopCameraStream();
    closeModal(cameraModal);
});

// Post Submission
postSubmitBtn.addEventListener('click', async () => {
    const content = postTextarea.value.trim();
    if (!content && !mediaFile) {
        alert('يرجى كتابة نص أو إضافة وسائط.');
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
	                throw new Error('Media upload failed');
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
	            throw new Error('Post submission failed');
	        }
	
	        // 3. Reload feed to show the new post from the database
	        await loadFeed();
	        
	        console.log('Post submitted successfully.');
	    } catch (error) {
	        console.error('Error submitting post:', error);
	        alert('فشل نشر المنشور. يرجى المحاولة مرة أخرى.');
	        return;
	    }

    // Clear composer
    postTextarea.value = '';
    mediaPreview.innerHTML = '';
    mediaPreview.style.display = 'none';
    mediaFile = null;
    mediaFileInput.value = ''; // Reset file input
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
    // In a real app, you would load posts from an API
// Load posts from the API
	    loadFeed();
    console.log('✅ Nexora loaded successfully with new UI logic');
});

// ============ Settings Functions ============
const saveSettingsBtn = document.getElementById('saveSettingsBtn');
const privacySelect = document.getElementById('privacySelect');
const passwordInput = document.getElementById('passwordInput');
const notificationsToggle = document.getElementById('notificationsToggle');

function loadSettings() {
    const savedPrivacy = localStorage.getItem('nexora_privacy') || 'public';
    const savedNotifications = localStorage.getItem('nexora_notifications') !== 'false'; // true by default

    if (privacySelect) privacySelect.value = savedPrivacy;
    if (notificationsToggle) notificationsToggle.checked = savedNotifications;
}

if (saveSettingsBtn) {
    saveSettingsBtn.addEventListener('click', () => {
        const privacy = privacySelect ? privacySelect.value : 'public';
        const notifications = notificationsToggle ? notificationsToggle.checked : true;
        const newPassword = passwordInput ? passwordInput.value : '';

        localStorage.setItem('nexora_privacy', privacy);
        localStorage.setItem('nexora_notifications', notifications);

        if (newPassword.trim() !== '') {
            // Placeholder for API call to change password
            alert('سيتم تغيير كلمة المرور (تحتاج إلى تطوير في الخلفية).');
            passwordInput.value = '';
        }

        alert('تم حفظ الإعدادات بنجاح!');
        closeModal(settingsModal);
    });
}

// Load settings on page load
window.addEventListener('load', loadSettings);
