// ============ Global Variables ============
const API_BASE_URL = 'http://localhost:3000/api';
let authToken = localStorage.getItem('authToken');
let currentTool = 'video-editor';

// ============ DOM Elements ============
const navItems = document.querySelectorAll('.nav-item');
const toolSections = document.querySelectorAll('.tool-section');

// ============ Tool Navigation ============
navItems.forEach(item => {
    item.addEventListener('click', function() {
        const toolName = this.dataset.tool;
        switchTool(toolName);
    });
});

function switchTool(toolName) {
    // Update active nav item
    navItems.forEach(item => item.classList.remove('active'));
    document.querySelector(`[data-tool="${toolName}"]`).classList.add('active');

    // Update active section
    toolSections.forEach(section => section.classList.remove('active'));
    document.getElementById(toolName).classList.add('active');

    currentTool = toolName;
}

// ============ Video Editor Functions ============
const videoEditorButtons = document.querySelectorAll('#video-editor .btn-primary');
const templateCards = document.querySelectorAll('#video-editor .template-card');
const effectButtons = document.querySelectorAll('#video-editor .effect-btn');
const aspectButtons = document.querySelectorAll('#video-editor .aspect-btn');

templateCards.forEach(card => {
    card.addEventListener('click', function() {
        alert('تم تحديد القالب: ' + this.querySelector('p').textContent);
    });
});

effectButtons.forEach(btn => {
    btn.addEventListener('click', function() {
        alert('تم تطبيق المؤثر: ' + this.querySelector('span').textContent);
    });
});

aspectButtons.forEach(btn => {
    btn.addEventListener('click', function() {
        aspectButtons.forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        alert('تم تغيير نسبة العرض والارتفاع إلى: ' + this.textContent);
    });
});

// ============ Photo Tools Functions ============
const filterButtons = document.querySelectorAll('#photo-tools .filter-btn');
const photoToolsButtons = document.querySelectorAll('#photo-tools .control-section .btn-primary');

filterButtons.forEach(btn => {
    btn.addEventListener('click', function() {
        alert('تم تطبيق الفلتر: ' + this.querySelector('span').textContent);
    });
});

photoToolsButtons.forEach(btn => {
    btn.addEventListener('click', function() {
        const text = this.textContent.trim();
        alert('جاري تشغيل: ' + text);
    });
});

// ============ Audio Tools Functions ============
const musicButtons = document.querySelectorAll('#audio-tools .music-card .btn-small');
const audioToolsButtons = document.querySelectorAll('#audio-tools .control-section .btn-primary');
const generateVoiceBtn = document.querySelector('#audio-tools .voiceover-options .btn-primary');

musicButtons.forEach(btn => {
    btn.addEventListener('click', function(e) {
        e.preventDefault();
        const musicName = this.closest('.music-card').querySelector('h4').textContent;
        alert('تم اختيار الموسيقى: ' + musicName);
    });
});

audioToolsButtons.forEach(btn => {
    btn.addEventListener('click', function() {
        const text = this.textContent.trim();
        alert('جاري تشغيل: ' + text);
    });
});

if (generateVoiceBtn) {
    generateVoiceBtn.addEventListener('click', function() {
        const textarea = document.querySelector('#audio-tools .voiceover-options textarea');
        const select = document.querySelector('#audio-tools .voiceover-options select');
        
        if (!textarea.value.trim()) {
            alert('يرجى إدخال النص أولاً');
            return;
        }
        
        if (select.value === '') {
            alert('يرجى اختيار صوتاً');
            return;
        }
        
        alert('جاري توليد الصوت...\nالنص: ' + textarea.value + '\nالصوت: ' + select.options[select.selectedIndex].text);
    });
}

// ============ Templates Functions ============
const templateUseButtons = document.querySelectorAll('#templates .template-item .btn-small');
const arEffectButtons = document.querySelectorAll('#templates .effect-card');

templateUseButtons.forEach(btn => {
    btn.addEventListener('click', function(e) {
        e.preventDefault();
        const templateName = this.closest('.template-item').querySelector('h4').textContent;
        alert('تم اختيار القالب: ' + templateName);
    });
});

arEffectButtons.forEach(btn => {
    btn.addEventListener('click', function() {
        const effectName = this.querySelector('span').textContent;
        alert('تم تفعيل المؤثر: ' + effectName);
    });
});

// ============ AI Assistant Functions ============
const aiToolButtons = document.querySelectorAll('#ai-assistant .ai-tool-card .btn-primary');

aiToolButtons.forEach(btn => {
    btn.addEventListener('click', function() {
        const cardTitle = this.closest('.ai-tool-card').querySelector('h3').textContent;
        const textarea = this.closest('.ai-tool-card').querySelector('textarea');
        
        if (textarea && !textarea.value.trim()) {
            alert('يرجى إدخال النص أولاً');
            return;
        }
        
        alert('جاري معالجة طلبك: ' + cardTitle);
        
        // Simulate AI processing
        setTimeout(() => {
            if (cardTitle.includes('كاتب')) {
                alert('الكاتب المقترح:\n\n"محتوى رائع وجذاب يستحق المتابعة! 📱✨"');
            } else if (cardTitle.includes('هاشتاج')) {
                alert('الهاشتاجات المقترحة:\n#محتوى #ذكاء_اصطناعي #تطوير #إبداع #تقنية');
            } else if (cardTitle.includes('اتجاهات')) {
                alert('الاتجاهات الحالية:\n1. الذكاء الاصطناعي\n2. التطوير الويب\n3. التسويق الرقمي');
            } else if (cardTitle.includes('نصائح')) {
                alert('نصائح التحسين:\n1. استخدم صور عالية الجودة\n2. أضف نصوص جذابة\n3. استخدم الهاشتاجات المناسبة');
            }
        }, 1000);
    });
});

// ============ Collaboration Functions ============
const collabButtons = document.querySelectorAll('#collaboration .collab-card .btn-primary');

collabButtons.forEach(btn => {
    btn.addEventListener('click', function() {
        const cardTitle = this.closest('.collab-card').querySelector('h3').textContent;
        alert('جاري فتح: ' + cardTitle);
    });
});

// ============ File Upload Simulation ============
function setupFileUpload() {
    const videoPreview = document.querySelector('.video-preview');
    const photoPreview = document.querySelector('.photo-preview');

    if (videoPreview) {
        videoPreview.addEventListener('click', function() {
            alert('اختر ملف فيديو من جهازك');
        });
    }

    if (photoPreview) {
        photoPreview.addEventListener('click', function() {
            alert('اختر صورة من جهازك');
        });
    }
}

// ============ API Integration Functions ============

/**
 * Generate caption using AI
 */
async function generateCaption(content) {
    try {
        const response = await fetch(`${API_BASE_URL}/ai/caption`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
            },
            body: JSON.stringify({ content }),
        });

        if (!response.ok) {
            throw new Error('Failed to generate caption');
        }

        const data = await response.json();
        return data.caption;
    } catch (error) {
        console.error('Error generating caption:', error);
        return null;
    }
}

/**
 * Get hashtag suggestions
 */
async function getHashtagSuggestions(content) {
    try {
        const response = await fetch(`${API_BASE_URL}/ai/hashtags`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
            },
            body: JSON.stringify({ content }),
        });

        if (!response.ok) {
            throw new Error('Failed to get hashtags');
        }

        const data = await response.json();
        return data.hashtags;
    } catch (error) {
        console.error('Error getting hashtags:', error);
        return [];
    }
}

/**
 * Get trend analysis
 */
async function getTrendAnalysis() {
    try {
        const response = await fetch(`${API_BASE_URL}/ai/trends`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to get trends');
        }

        const data = await response.json();
        return data.trends;
    } catch (error) {
        console.error('Error getting trends:', error);
        return [];
    }
}

/**
 * Get content optimization tips
 */
async function getOptimizationTips(content) {
    try {
        const response = await fetch(`${API_BASE_URL}/ai/optimize`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
            },
            body: JSON.stringify({ content }),
        });

        if (!response.ok) {
            throw new Error('Failed to get optimization tips');
        }

        const data = await response.json();
        return data.tips;
    } catch (error) {
        console.error('Error getting optimization tips:', error);
        return [];
    }
}

/**
 * Create collaborative post
 */
async function createCollaborativePost(collaborators, content) {
    try {
        const response = await fetch(`${API_BASE_URL}/posts/collaborative`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
            },
            body: JSON.stringify({
                collaborators,
                content,
                status: 'draft',
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to create collaborative post');
        }

        const data = await response.json();
        return data.postId;
    } catch (error) {
        console.error('Error creating collaborative post:', error);
        return null;
    }
}

/**
 * Save draft
 */
async function saveDraft(title, content, type = 'post') {
    try {
        const response = await fetch(`${API_BASE_URL}/drafts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
            },
            body: JSON.stringify({
                title,
                content,
                type,
                status: 'draft',
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to save draft');
        }

        const data = await response.json();
        return data.draftId;
    } catch (error) {
        console.error('Error saving draft:', error);
        return null;
    }
}

// ============ Initialization ============
window.addEventListener('load', function() {
    setupFileUpload();
    console.log('✅ Creator tools loaded successfully');
});
