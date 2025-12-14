// ============ Post Interactions Module ============
// هذا الملف يتعامل مع الإعجابات والتعليقات والمشاركات والكاميرا

const API_BASE_URL = 'http://localhost:3000/api';
let authToken = localStorage.getItem('authToken');

// ============ Like Functionality ============
async function toggleLike(postId, button) {
    if (!authToken) {
        alert('يرجى تسجيل الدخول أولاً');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/posts/${postId}/like`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (response.ok) {
            button.classList.toggle('liked');
            
            // تحديث عدد الإعجابات
            const statsDiv = button.closest('.post-card').querySelector('.post-stats');
            if (statsDiv) {
                const likeSpan = statsDiv.querySelector('span');
                const currentCount = parseInt(likeSpan.textContent) || 0;
                const newCount = data.liked ? currentCount + 1 : currentCount - 1;
                likeSpan.innerHTML = `<i class="fas fa-thumbs-up"></i> ${newCount} إعجاب`;
            }
        } else {
            alert('حدث خطأ في معالجة الإعجاب');
        }
    } catch (error) {
        console.error('Error toggling like:', error);
        alert('حدث خطأ في الاتصال بالخادم');
    }
}

// ============ Share Functionality ============
async function sharePost(postId, button) {
    if (!authToken) {
        alert('يرجى تسجيل الدخول أولاً');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/posts/${postId}/share`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (response.ok) {
            // تحديث عدد المشاركات
            const statsDiv = button.closest('.post-card').querySelector('.post-stats');
            if (statsDiv) {
                const shareSpan = statsDiv.querySelectorAll('span')[2];
                const currentCount = parseInt(shareSpan.textContent) || 0;
                const newCount = currentCount + 1;
                shareSpan.innerHTML = `<i class="fas fa-share"></i> ${newCount} مشاركة`;
            }
            
            alert('تم مشاركة المنشور بنجاح');
        } else {
            alert('حدث خطأ في مشاركة المنشور');
        }
    } catch (error) {
        console.error('Error sharing post:', error);
        alert('حدث خطأ في الاتصال بالخادم');
    }
}

// ============ Comments Modal ============
function openCommentsModal(postId) {
    if (!authToken) {
        alert('يرجى تسجيل الدخول أولاً');
        return;
    }

    // إنشاء modal للتعليقات
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = `comments-modal-${postId}`;
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>التعليقات</h2>
                <button class="modal-close">&times;</button>
            </div>
            <div class="comments-list" id="comments-list-${postId}">
                <p style="text-align: center; padding: 2rem;">جاري تحميل التعليقات...</p>
            </div>
            <div class="comment-input-section">
                <textarea id="comment-input-${postId}" placeholder="أضف تعليقاً..." class="comment-input"></textarea>
                <button class="comment-submit-btn" onclick="submitComment('${postId}')">إرسال</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // إغلاق modal
    modal.querySelector('.modal-close').addEventListener('click', () => {
        modal.remove();
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });

    // تحميل التعليقات
    loadComments(postId);
}

async function loadComments(postId) {
    try {
        const response = await fetch(`${API_BASE_URL}/comments/post/${postId}?limit=50`);
        const data = await response.json();

        const commentsList = document.getElementById(`comments-list-${postId}`);
        commentsList.innerHTML = '';

        if (data.comments && data.comments.length > 0) {
            data.comments.forEach(comment => {
                const commentElement = createCommentElement(comment);
                commentsList.appendChild(commentElement);
            });
        } else {
            commentsList.innerHTML = '<p style="text-align: center; padding: 2rem;">لا توجد تعليقات حتى الآن</p>';
        }
    } catch (error) {
        console.error('Error loading comments:', error);
        document.getElementById(`comments-list-${postId}`).innerHTML = '<p style="text-align: center; color: red;">حدث خطأ في تحميل التعليقات</p>';
    }
}

function createCommentElement(comment) {
    const div = document.createElement('div');
    div.className = 'comment-item';
    div.innerHTML = `
        <div class="comment-header">
            <img src="${comment.author.avatarUrl || 'https://picsum.photos/40/40'}" alt="Avatar" class="comment-avatar">
            <div class="comment-info">
                <p class="comment-author">${comment.author.displayName}</p>
                <p class="comment-time">${getTimeAgo(new Date(comment.createdAt))}</p>
            </div>
        </div>
        <p class="comment-content">${comment.content}</p>
    `;
    return div;
}

async function submitComment(postId) {
    if (!authToken) {
        alert('يرجى تسجيل الدخول أولاً');
        return;
    }

    const textarea = document.getElementById(`comment-input-${postId}`);
    const content = textarea.value.trim();

    if (!content) {
        alert('يرجى كتابة تعليق');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/comments`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                postId,
                content
            })
        });

        const data = await response.json();

        if (response.ok) {
            textarea.value = '';
            
            // تحديث عدد التعليقات
            const postCard = document.querySelector(`[data-post-id="${postId}"]`).closest('.post-card');
            const statsDiv = postCard.querySelector('.post-stats');
            if (statsDiv) {
                const commentSpan = statsDiv.querySelectorAll('span')[1];
                const currentCount = parseInt(commentSpan.textContent) || 0;
                const newCount = currentCount + 1;
                commentSpan.innerHTML = `<i class="fas fa-comment"></i> ${newCount} تعليق`;
            }
            
            // إعادة تحميل التعليقات
            loadComments(postId);
        } else {
            alert('حدث خطأ في إضافة التعليق');
        }
    } catch (error) {
        console.error('Error submitting comment:', error);
        alert('حدث خطأ في الاتصال بالخادم');
    }
}

// ============ Camera Functionality ============
async function openCameraModal() {
    if (!authToken) {
        alert('يرجى تسجيل الدخول أولاً');
        return;
    }

    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = 'camera-modal';
    modal.innerHTML = `
        <div class="modal-content camera-modal-content">
            <div class="modal-header">
                <h2>التقط صورة</h2>
                <button class="modal-close">&times;</button>
            </div>
            <div class="camera-container">
                <video id="camera-video" autoplay playsinline></video>
                <canvas id="camera-canvas" style="display: none;"></canvas>
            </div>
            <div class="camera-controls">
                <button id="capture-btn" class="camera-btn">
                    <i class="fas fa-camera"></i> التقط صورة
                </button>
                <button id="retake-btn" class="camera-btn" style="display: none;">
                    <i class="fas fa-redo"></i> إعادة محاولة
                </button>
                <button id="use-photo-btn" class="camera-btn" style="display: none;">
                    <i class="fas fa-check"></i> استخدام الصورة
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // إغلاق modal
    modal.querySelector('.modal-close').addEventListener('click', () => {
        stopCamera();
        modal.remove();
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            stopCamera();
            modal.remove();
        }
    });

    // بدء الكاميرا
    startCamera();

    // معالجات الأزرار
    document.getElementById('capture-btn').addEventListener('click', capturePhoto);
    document.getElementById('retake-btn').addEventListener('click', retakePhoto);
    document.getElementById('use-photo-btn').addEventListener('click', usePhoto);
}

async function startCamera() {
    try {
        const video = document.getElementById('camera-video');
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user' },
            audio: false
        });
        video.srcObject = stream;
    } catch (error) {
        console.error('Error accessing camera:', error);
        alert('لا يمكن الوصول إلى الكاميرا. تأكد من منح الأذونات.');
    }
}

function stopCamera() {
    const video = document.getElementById('camera-video');
    if (video && video.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop());
    }
}

function capturePhoto() {
    const video = document.getElementById('camera-video');
    const canvas = document.getElementById('camera-canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    // إخفاء الفيديو وإظهار الصورة
    video.style.display = 'none';
    canvas.style.display = 'block';

    // تحديث الأزرار
    document.getElementById('capture-btn').style.display = 'none';
    document.getElementById('retake-btn').style.display = 'inline-block';
    document.getElementById('use-photo-btn').style.display = 'inline-block';
}

function retakePhoto() {
    const video = document.getElementById('camera-video');
    const canvas = document.getElementById('camera-canvas');

    video.style.display = 'block';
    canvas.style.display = 'none';

    document.getElementById('capture-btn').style.display = 'inline-block';
    document.getElementById('retake-btn').style.display = 'none';
    document.getElementById('use-photo-btn').style.display = 'none';
}

function usePhoto() {
    const canvas = document.getElementById('camera-canvas');
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    
    // إغلاق modal
    const modal = document.getElementById('camera-modal');
    stopCamera();
    modal.remove();

    // إرسال الصورة إلى خادم التحميل
    uploadCapturedPhoto(imageData);
}

async function uploadCapturedPhoto(imageData) {
    if (!authToken) {
        alert('يرجى تسجيل الدخول أولاً');
        return;
    }

    try {
        // تحويل base64 إلى blob
        const blob = dataURItoBlob(imageData);
        const formData = new FormData();
        formData.append('files', blob, 'camera-photo.jpg');

        const response = await fetch(`${API_BASE_URL}/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            },
            body: formData
        });

        const data = await response.json();

        if (response.ok && data.files && data.files.length > 0) {
            // إضافة الصورة إلى منشور جديد
            addPhotoToNewPost(data.files[0]);
        } else {
            alert('حدث خطأ في تحميل الصورة');
        }
    } catch (error) {
        console.error('Error uploading photo:', error);
        alert('حدث خطأ في الاتصال بالخادم');
    }
}

function dataURItoBlob(dataURI) {
    const byteString = atob(dataURI.split(',')[1]);
    const mimeString = dataURI.split(',')[0].match(/:(.*?);/)[1];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
}

function addPhotoToNewPost(photoUrl) {
    // إنشاء modal لإضافة نص مع الصورة
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = 'new-post-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>إنشاء منشور جديد</h2>
                <button class="modal-close">&times;</button>
            </div>
            <div class="new-post-form">
                <textarea id="post-content" placeholder="ما الذي تفكر فيه؟" class="post-textarea"></textarea>
                <img src="${photoUrl}" alt="الصورة الملتقطة" class="preview-image">
                <button id="post-submit-btn" class="post-submit-btn">نشر</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('.modal-close').addEventListener('click', () => {
        modal.remove();
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });

    document.getElementById('post-submit-btn').addEventListener('click', () => {
        submitNewPost(photoUrl);
        modal.remove();
    });
}

async function submitNewPost(photoUrl) {
    if (!authToken) {
        alert('يرجى تسجيل الدخول أولاً');
        return;
    }

    const content = document.getElementById('post-content').value.trim();

    if (!content && !photoUrl) {
        alert('يرجى كتابة نص أو إضافة صورة');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/posts`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                content: content || 'صورة',
                postType: photoUrl ? 'image' : 'text',
                mediaUrls: photoUrl ? [photoUrl] : []
            })
        });

        const data = await response.json();

        if (response.ok) {
            alert('تم نشر المنشور بنجاح');
            // إعادة تحميل الخلاصة
            location.reload();
        } else {
            alert('حدث خطأ في نشر المنشور');
        }
    } catch (error) {
        console.error('Error submitting post:', error);
        alert('حدث خطأ في الاتصال بالخادم');
    }
}

// ============ Utility Functions ============
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
