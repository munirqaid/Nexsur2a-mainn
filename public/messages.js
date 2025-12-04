// ============ Global Variables ============
const API_BASE_URL = 'http://localhost:3000/api';
let authToken = localStorage.getItem('authToken');
let currentConversation = null;
let currentUser = null;
let messages = [];
let conversations = [];

// ============ DOM Elements ============
const newChatBtn = document.getElementById('newChatBtn');
const newChatModal = document.getElementById('newChatModal');
const conversationsList = document.getElementById('conversationsList');
const messagesList = document.getElementById('messagesList');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const attachBtn = document.getElementById('attachBtn');
const fileInput = document.getElementById('fileInput');
const voiceCallBtn = document.getElementById('voiceCallBtn');
const videoCallBtn = document.getElementById('videoCallBtn');
const voiceMessageBtn = document.getElementById('voiceMessageBtn');
const chatHeader = document.getElementById('chatHeader');
const chatTitle = document.getElementById('chatTitle');
const chatStatus = document.getElementById('chatStatus');
const userSearch = document.getElementById('userSearch');
const usersList = document.getElementById('usersList');
const searchConversations = document.getElementById('searchConversations');
const conversationsTabs = document.querySelectorAll('.tab-btn');

// ============ Sample Data ============
const sampleConversations = [
    {
        id: 'conv-1',
        type: 'direct',
        participantId: 'user-2',
        participantName: 'فاطمة علي',
        participantAvatar: 'https://picsum.photos/50/50?random=2',
        lastMessage: 'كيف حالك؟',
        lastMessageTime: new Date(Date.now() - 300000),
        unreadCount: 2,
        isOnline: true,
    },
    {
        id: 'conv-2',
        type: 'group',
        name: 'فريق التطوير',
        avatar: 'https://picsum.photos/50/50?random=3',
        lastMessage: 'تم إنهاء المشروع بنجاح',
        lastMessageTime: new Date(Date.now() - 600000),
        unreadCount: 0,
        memberCount: 5,
    },
    {
        id: 'conv-3',
        type: 'channel',
        name: 'الإعلانات',
        avatar: 'https://picsum.photos/50/50?random=4',
        lastMessage: 'تحديث جديد متاح',
        lastMessageTime: new Date(Date.now() - 900000),
        unreadCount: 1,
    },
];

const sampleMessages = [
    {
        id: 'msg-1',
        senderId: 'user-2',
        senderName: 'فاطمة علي',
        senderAvatar: 'https://picsum.photos/36/36?random=2',
        content: 'مرحباً! كيف حالك؟',
        timestamp: new Date(Date.now() - 600000),
        type: 'text',
    },
    {
        id: 'msg-2',
        senderId: 'user-1',
        senderName: 'أنت',
        senderAvatar: 'https://picsum.photos/36/36?random=1',
        content: 'بخير، شكراً! وأنت؟',
        timestamp: new Date(Date.now() - 300000),
        type: 'text',
    },
];

const sampleUsers = [
    {
        id: 'user-3',
        name: 'محمود حسن',
        username: 'mahmoud_hassan',
        avatar: 'https://picsum.photos/45/45?random=3',
    },
    {
        id: 'user-4',
        name: 'سارة أحمد',
        username: 'sarah_ahmed',
        avatar: 'https://picsum.photos/45/45?random=4',
    },
    {
        id: 'user-5',
        name: 'علي محمد',
        username: 'ali_mohammad',
        avatar: 'https://picsum.photos/45/45?random=5',
    },
];

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

// ============ Conversations Functions ============
function loadConversations() {
    conversationsList.innerHTML = '';
    
    sampleConversations.forEach(conv => {
        const convElement = createConversationElement(conv);
        conversationsList.appendChild(convElement);
    });
}

function createConversationElement(conv) {
    const div = document.createElement('div');
    div.className = 'conversation-item';
    div.dataset.conversationId = conv.id;
    
    const avatar = conv.type === 'direct' ? conv.participantAvatar : conv.avatar;
    const name = conv.type === 'direct' ? conv.participantName : conv.name;
    const unreadClass = conv.unreadCount > 0 ? 'style="font-weight: 600;"' : '';
    
    div.innerHTML = `
        <img src="${avatar}" alt="${name}" class="conversation-avatar">
        <div class="conversation-info">
            <p class="conversation-name" ${unreadClass}>${name}</p>
            <p class="conversation-preview">${conv.lastMessage}</p>
        </div>
        <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem;">
            <p class="conversation-time">${getTimeAgo(conv.lastMessageTime)}</p>
            ${conv.unreadCount > 0 ? `<div class="unread-badge">${conv.unreadCount}</div>` : ''}
        </div>
    `;
    
    div.addEventListener('click', function() {
        selectConversation(conv);
    });
    
    return div;
}

function selectConversation(conv) {
    currentConversation = conv;
    
    // Update active state
    document.querySelectorAll('.conversation-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-conversation-id="${conv.id}"]`).classList.add('active');
    
    // Update chat header
    const name = conv.type === 'direct' ? conv.participantName : conv.name;
    chatTitle.textContent = name;
    
    if (conv.type === 'direct' && conv.isOnline) {
        chatStatus.textContent = 'متصل الآن';
    } else {
        chatStatus.textContent = `آخر ظهور: ${getTimeAgo(conv.lastMessageTime)}`;
    }
    
    // Load messages
    loadMessages(conv.id);
}

function loadMessages(conversationId) {
    messagesList.innerHTML = '';
    
    sampleMessages.forEach(msg => {
        const msgElement = createMessageElement(msg);
        messagesList.appendChild(msgElement);
    });
    
    // Scroll to bottom
    messagesList.scrollTop = messagesList.scrollHeight;
}

function createMessageElement(msg) {
    const div = document.createElement('div');
    div.className = `message ${msg.senderId === 'user-1' ? 'sent' : 'received'}`;
    
    div.innerHTML = `
        ${msg.senderId !== 'user-1' ? `<img src="${msg.senderAvatar}" alt="${msg.senderName}" class="message-avatar">` : ''}
        <div class="message-content">
            <div class="message-bubble">${msg.content}</div>
            <p class="message-time">${getTimeAgo(msg.timestamp)}</p>
        </div>
        ${msg.senderId === 'user-1' ? `<img src="${msg.senderAvatar}" alt="${msg.senderName}" class="message-avatar">` : ''}
    `;
    
    return div;
}

function sendMessage() {
    const content = messageInput.value.trim();
    
    if (!content || !currentConversation) {
        return;
    }
    
    const newMessage = {
        id: `msg-${Date.now()}`,
        senderId: 'user-1',
        senderName: 'أنت',
        senderAvatar: 'https://picsum.photos/36/36?random=1',
        content: content,
        timestamp: new Date(),
        type: 'text',
    };
    
    messages.push(newMessage);
    
    const msgElement = createMessageElement(newMessage);
    messagesList.appendChild(msgElement);
    messagesList.scrollTop = messagesList.scrollHeight;
    
    messageInput.value = '';
    messageInput.focus();
}

// ============ New Chat Functions ============
function loadUsers() {
    usersList.innerHTML = '';
    
    sampleUsers.forEach(user => {
        const userElement = document.createElement('div');
        userElement.className = 'user-item';
        userElement.innerHTML = `
            <img src="${user.avatar}" alt="${user.name}" class="user-avatar">
            <div class="user-info">
                <p class="user-name">${user.name}</p>
                <p class="user-username">@${user.username}</p>
            </div>
        `;
        
        userElement.addEventListener('click', function() {
            createDirectChat(user);
        });
        
        usersList.appendChild(userElement);
    });
}

function createDirectChat(user) {
    const newConversation = {
        id: `conv-${Date.now()}`,
        type: 'direct',
        participantId: user.id,
        participantName: user.name,
        participantAvatar: user.avatar,
        lastMessage: 'محادثة جديدة',
        lastMessageTime: new Date(),
        unreadCount: 0,
        isOnline: true,
    };
    
    sampleConversations.unshift(newConversation);
    loadConversations();
    selectConversation(newConversation);
    closeModal(newChatModal);
}

// ============ Voice & Video Call Functions ============
voiceCallBtn.addEventListener('click', function() {
    if (!currentConversation) return;
    
    const voiceCallModal = document.getElementById('voiceCallModal');
    document.getElementById('callerName').textContent = 
        currentConversation.type === 'direct' 
            ? currentConversation.participantName 
            : currentConversation.name;
    document.getElementById('callerAvatar').src = 
        currentConversation.type === 'direct' 
            ? currentConversation.participantAvatar 
            : currentConversation.avatar;
    
    openModal(voiceCallModal);
    startVoiceCallTimer();
});

videoCallBtn.addEventListener('click', function() {
    if (!currentConversation) return;
    
    const videoCallModal = document.getElementById('videoCallModal');
    openModal(videoCallModal);
    initializeVideoCall();
});

function startVoiceCallTimer() {
    let seconds = 0;
    const callDuration = document.getElementById('callDuration');
    
    const interval = setInterval(() => {
        seconds++;
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        callDuration.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }, 1000);
    
    document.getElementById('endVoiceCallBtn').addEventListener('click', function() {
        clearInterval(interval);
        closeModal(document.getElementById('voiceCallModal'));
    }, { once: true });
}

function initializeVideoCall() {
    // Placeholder for WebRTC implementation
    const localVideo = document.getElementById('localVideo');
    const remoteVideo = document.getElementById('remoteVideo');
    
    // In production, use WebRTC to get actual video streams
    console.log('Initializing video call...');
}

// ============ File Attachment Functions ============
attachBtn.addEventListener('click', function() {
    fileInput.click();
});

fileInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const fileName = file.name;
        messageInput.value = `📎 ${fileName}`;
    }
});

// ============ Search Functions ============
searchConversations.addEventListener('input', function(e) {
    const query = e.target.value.toLowerCase();
    
    document.querySelectorAll('.conversation-item').forEach(item => {
        const name = item.querySelector('.conversation-name').textContent.toLowerCase();
        if (name.includes(query)) {
            item.style.display = '';
        } else {
            item.style.display = 'none';
        }
    });
});

userSearch.addEventListener('input', function(e) {
    const query = e.target.value.toLowerCase();
    
    document.querySelectorAll('.user-item').forEach(item => {
        const name = item.querySelector('.user-name').textContent.toLowerCase();
        const username = item.querySelector('.user-username').textContent.toLowerCase();
        
        if (name.includes(query) || username.includes(query)) {
            item.style.display = '';
        } else {
            item.style.display = 'none';
        }
    });
});

// ============ Tab Switching ============
conversationsTabs.forEach(tab => {
    tab.addEventListener('click', function() {
        conversationsTabs.forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        
        const tabType = this.dataset.tab;
        // Filter conversations by type
        document.querySelectorAll('.conversation-item').forEach(item => {
            // Implementation for filtering
        });
    });
});

// ============ Event Listeners ============
newChatBtn.addEventListener('click', function() {
    openModal(newChatModal);
    loadUsers();
});

sendBtn.addEventListener('click', sendMessage);

messageInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

voiceMessageBtn.addEventListener('click', function() {
    alert('ميزة الرسائل الصوتية قيد التطوير');
});

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

// ============ Initialization ============
window.addEventListener('load', function() {
    loadConversations();
    console.log('✅ Messaging system loaded successfully');
});
