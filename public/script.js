// ============ Global Variables ============
const API_BASE_URL = 'http://localhost:3000/api';
let authToken = localStorage.getItem('token');
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


// ============ Post Composer Functions ============

if (postSubmitBtn) {
    postSubmitBtn.addEventListener('click', async () => {
        const content = postTextarea.value.trim();

        if (content === '') {
            alert('يرجى كتابة نص في المنشور.');
            return;
        }

        // Show loading indicator
        postSubmitBtn.disabled = true;
        postSubmitBtn.innerHTML = '<div class="spinner"></div> جاري النشر...';

        try {
            const postData = {
                content: content,
                postType: 'text', // تحديد نوع المنشور كنص
                // لا توجد وسائط حالياً
            };

            const postResponse = await fetch(`${API_BASE_URL}/posts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(postData)
            });

            if (!postResponse.ok) {
                let errorText = 'Failed to create post';
                try {
                    const errorData = await postResponse.json();
                    errorText = errorData.error || errorText;
                } catch (e) {
                    errorText = postResponse.statusText || 'Unknown error';
                }
                throw new Error(errorText);
            }

            const result = await postResponse.json();
            console.log('Post created:', result);

            // Clear composer
            postTextarea.value = '';

            // Reload the feed to show the new post
            await loadFeed();

        } catch (error) {
            console.error('Error creating post:', error);
            alert('حدث خطأ أثناء نشر المنشور: ' + error.message);
        } finally {
            // Hide loading indicator
            postSubmitBtn.disabled = false;
            postSubmitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> <span>نشر</span>';
        }
    });
}


// ============ Logout Function ============
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/auth.html';
}

// ============ Initialization ============
window.addEventListener('load', function() {
    // إضافة مستمع لحدث الضغط على زر تسجيل الخروج إذا كان موجوداً
    const logoutBtn = document.getElementById('logoutBtn') || document.querySelector('.sidebar-item i.fa-sign-out-alt')?.parentElement;
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }

    if (authToken) {
        loadFeed();
    }
    console.log('✅ Nexora loaded successfully with new UI logic');
});
