// ============ Global Variables ============
const API_BASE_URL = 'http://localhost:3000/api';
let authToken = localStorage.getItem('authToken');
let currentCategory = 'all';
let currentFilters = {
    contentType: ['posts', 'images', 'videos'],
    timeRange: 'all',
    location: 'global',
    sortBy: 'recent',
};

// ============ DOM Elements ============
const tabButtons = document.querySelectorAll('.tab-btn');
const exploreSections = document.querySelectorAll('.explore-section');
const searchInput = document.getElementById('exploreSearch');
const filterBtn = document.getElementById('filterBtn');
const filterModal = document.getElementById('filterModal');
const applyFiltersBtn = document.getElementById('applyFilters');
const resetFiltersBtn = document.getElementById('resetFilters');
const modalClose = document.querySelector('.modal-close');

// ============ Tab Navigation ============
tabButtons.forEach(btn => {
    btn.addEventListener('click', function() {
        const category = this.dataset.category;
        switchCategory(category);
    });
});

function switchCategory(category) {
    currentCategory = category;

    // Update active tab
    tabButtons.forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-category="${category}"]`).classList.add('active');

    // Update visible sections
    exploreSections.forEach(section => section.classList.remove('active'));
    
    if (category === 'all') {
        exploreSections.forEach(section => section.classList.add('active'));
    } else {
        const sectionId = `${category}-section`;
        const section = document.getElementById(sectionId);
        if (section) section.classList.add('active');
    }

    // Load content for the category
    loadContent(category);
}

// ============ Content Loading ============

/**
 * Load content based on category
 */
async function loadContent(category) {
    try {
        if (category === 'all' || category === 'trending') {
            await loadTrends();
        }
        if (category === 'all' || category === 'popular') {
            await loadPopularPosts();
        }
        if (category === 'all' || category === 'recommended') {
            await loadRecommendations();
        }
        if (category === 'all') {
            await loadTopics();
            await loadSuggestedPeople();
            await loadEvents();
            await loadSidebarContent();
        }
    } catch (error) {
        console.error('Error loading content:', error);
    }
}

/**
 * Load trending topics
 */
async function loadTrends() {
    try {
        const response = await fetch(`${API_BASE_URL}/explore/trends`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to load trends');
        }

        const data = await response.json();
        renderTrends(data.trends);
    } catch (error) {
        console.error('Error loading trends:', error);
        renderTrendsPlaceholder();
    }
}

/**
 * Render trends in the grid
 */
function renderTrends(trends) {
    const trendsGrid = document.getElementById('trendsGrid');
    trendsGrid.innerHTML = '';

    trends.forEach(trend => {
        const trendCard = document.createElement('div');
        trendCard.className = 'trend-card';
        trendCard.innerHTML = `
            <span class="trend-badge">🔥 اتجاه</span>
            <h3 class="trend-title">${trend.title}</h3>
            <p class="trend-description">${trend.description || 'محتوى شهير ومتفاعل'}</p>
            <div class="trend-stats">
                <div class="trend-stat">
                    <div class="trend-stat-value">${trend.mentions || 0}</div>
                    <div class="trend-stat-label">منشورات</div>
                </div>
                <div class="trend-stat">
                    <div class="trend-stat-value">${trend.growth || 0}%</div>
                    <div class="trend-stat-label">نمو</div>
                </div>
            </div>
        `;
        trendsGrid.appendChild(trendCard);
    });
}

/**
 * Render trends placeholder
 */
function renderTrendsPlaceholder() {
    const trendsGrid = document.getElementById('trendsGrid');
    trendsGrid.innerHTML = `
        <div class="trend-card">
            <span class="trend-badge">🔥 اتجاه</span>
            <h3 class="trend-title">الذكاء الاصطناعي</h3>
            <p class="trend-description">أحدث التطورات في مجال الذكاء الاصطناعي</p>
            <div class="trend-stats">
                <div class="trend-stat">
                    <div class="trend-stat-value">15K</div>
                    <div class="trend-stat-label">منشورات</div>
                </div>
                <div class="trend-stat">
                    <div class="trend-stat-value">45%</div>
                    <div class="trend-stat-label">نمو</div>
                </div>
            </div>
        </div>
        <div class="trend-card">
            <span class="trend-badge">🔥 اتجاه</span>
            <h3 class="trend-title">التطوير الويب</h3>
            <p class="trend-description">أفضل أدوات وتقنيات التطوير</p>
            <div class="trend-stats">
                <div class="trend-stat">
                    <div class="trend-stat-value">12K</div>
                    <div class="trend-stat-label">منشورات</div>
                </div>
                <div class="trend-stat">
                    <div class="trend-stat-value">32%</div>
                    <div class="trend-stat-label">نمو</div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Load popular posts
 */
async function loadPopularPosts() {
    try {
        const response = await fetch(`${API_BASE_URL}/explore/popular`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to load popular posts');
        }

        const data = await response.json();
        renderPopularPosts(data.posts);
    } catch (error) {
        console.error('Error loading popular posts:', error);
        renderPopularPostsPlaceholder();
    }
}

/**
 * Render popular posts
 */
function renderPopularPosts(posts) {
    const popularGrid = document.getElementById('popularGrid');
    popularGrid.innerHTML = '';

    posts.forEach(post => {
        const postCard = document.createElement('div');
        postCard.className = 'post-card';
        postCard.innerHTML = `
            <img src="${post.image || 'https://via.placeholder.com/250x200'}" alt="post" class="post-image">
            <div class="post-content">
                <div class="post-author">
                    <img src="${post.authorAvatar || 'https://via.placeholder.com/32x32'}" alt="avatar" class="post-avatar">
                    <div class="post-author-info">
                        <p class="post-author-name">${post.authorName || 'مستخدم'}</p>
                        <p class="post-author-handle">@${post.authorHandle || 'user'}</p>
                    </div>
                </div>
                <h3 class="post-title">${post.title || 'منشور جديد'}</h3>
                <div class="post-engagement">
                    <span>❤️ ${post.likes || 0}</span>
                    <span>💬 ${post.comments || 0}</span>
                    <span>🔄 ${post.shares || 0}</span>
                </div>
            </div>
        `;
        popularGrid.appendChild(postCard);
    });
}

/**
 * Render popular posts placeholder
 */
function renderPopularPostsPlaceholder() {
    const popularGrid = document.getElementById('popularGrid');
    popularGrid.innerHTML = `
        <div class="post-card">
            <div style="width: 100%; height: 200px; background: linear-gradient(135deg, #00d4ff, #a855f7); display: flex; align-items: center; justify-content: center; color: white; font-size: 2rem;">📱</div>
            <div class="post-content">
                <div class="post-author">
                    <img src="https://via.placeholder.com/32x32" alt="avatar" class="post-avatar">
                    <div class="post-author-info">
                        <p class="post-author-name">أحمد محمد</p>
                        <p class="post-author-handle">@ahmed</p>
                    </div>
                </div>
                <h3 class="post-title">منشور شهير ومميز</h3>
                <div class="post-engagement">
                    <span>❤️ 1.2K</span>
                    <span>💬 250</span>
                    <span>🔄 180</span>
                </div>
            </div>
        </div>
    `;
}

/**
 * Load recommendations
 */
async function loadRecommendations() {
    try {
        const response = await fetch(`${API_BASE_URL}/explore/recommendations`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to load recommendations');
        }

        const data = await response.json();
        renderRecommendations(data.recommendations);
    } catch (error) {
        console.error('Error loading recommendations:', error);
        renderRecommendationsPlaceholder();
    }
}

/**
 * Render recommendations
 */
function renderRecommendations(recommendations) {
    const recommendationsGrid = document.getElementById('recommendationsGrid');
    recommendationsGrid.innerHTML = '';

    recommendations.forEach(rec => {
        const recCard = document.createElement('div');
        recCard.className = 'recommendation-card';
        recCard.innerHTML = `
            <div class="recommendation-icon">${rec.icon || '⭐'}</div>
            <h3 class="recommendation-title">${rec.title}</h3>
            <p class="recommendation-description">${rec.description}</p>
            <button class="recommendation-btn">استكشف</button>
        `;
        recommendationsGrid.appendChild(recCard);
    });
}

/**
 * Render recommendations placeholder
 */
function renderRecommendationsPlaceholder() {
    const recommendationsGrid = document.getElementById('recommendationsGrid');
    recommendationsGrid.innerHTML = `
        <div class="recommendation-card">
            <div class="recommendation-icon">🎨</div>
            <h3 class="recommendation-title">الفن والتصميم</h3>
            <p class="recommendation-description">استكشف أحدث الأعمال الفنية والتصاميم الإبداعية</p>
            <button class="recommendation-btn">استكشف</button>
        </div>
        <div class="recommendation-card">
            <div class="recommendation-icon">🎵</div>
            <h3 class="recommendation-title">الموسيقى والفنون</h3>
            <p class="recommendation-description">اكتشف الموسيقيين والفنانين الموهوبين</p>
            <button class="recommendation-btn">استكشف</button>
        </div>
        <div class="recommendation-card">
            <div class="recommendation-icon">📚</div>
            <h3 class="recommendation-title">التعليم والتطوير</h3>
            <p class="recommendation-description">تعلم مهارات جديدة من الخبراء</p>
            <button class="recommendation-btn">استكشف</button>
        </div>
    `;
}

/**
 * Load topics
 */
async function loadTopics() {
    try {
        const response = await fetch(`${API_BASE_URL}/explore/topics`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to load topics');
        }

        const data = await response.json();
        renderTopics(data.topics);
    } catch (error) {
        console.error('Error loading topics:', error);
        renderTopicsPlaceholder();
    }
}

/**
 * Render topics
 */
function renderTopics(topics) {
    const topicsGrid = document.getElementById('topicsGrid');
    topicsGrid.innerHTML = '';

    topics.forEach(topic => {
        const topicCard = document.createElement('div');
        topicCard.className = 'topic-card';
        topicCard.innerHTML = `
            <div class="topic-icon">${topic.icon || '📌'}</div>
            <h3 class="topic-name">${topic.name}</h3>
            <p class="topic-members">${topic.members || 0} عضو</p>
            <button class="topic-btn">الانضمام</button>
        `;
        topicsGrid.appendChild(topicCard);
    });
}

/**
 * Render topics placeholder
 */
function renderTopicsPlaceholder() {
    const topicsGrid = document.getElementById('topicsGrid');
    topicsGrid.innerHTML = `
        <div class="topic-card">
            <div class="topic-icon">💻</div>
            <h3 class="topic-name">البرمجة</h3>
            <p class="topic-members">5.2K عضو</p>
            <button class="topic-btn">الانضمام</button>
        </div>
        <div class="topic-card">
            <div class="topic-icon">🎮</div>
            <h3 class="topic-name">الألعاب</h3>
            <p class="topic-members">8.5K عضو</p>
            <button class="topic-btn">الانضمام</button>
        </div>
        <div class="topic-card">
            <div class="topic-icon">🎬</div>
            <h3 class="topic-name">الأفلام والمسلسلات</h3>
            <p class="topic-members">12K عضو</p>
            <button class="topic-btn">الانضمام</button>
        </div>
    `;
}

/**
 * Load suggested people
 */
async function loadSuggestedPeople() {
    try {
        const response = await fetch(`${API_BASE_URL}/explore/suggested-people`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to load suggested people');
        }

        const data = await response.json();
        renderSuggestedPeople(data.people);
    } catch (error) {
        console.error('Error loading suggested people:', error);
        renderSuggestedPeoplePlaceholder();
    }
}

/**
 * Render suggested people
 */
function renderSuggestedPeople(people) {
    const peopleGrid = document.getElementById('peopleGrid');
    peopleGrid.innerHTML = '';

    people.forEach(person => {
        const personCard = document.createElement('div');
        personCard.className = 'person-card';
        personCard.innerHTML = `
            <img src="${person.avatar || 'https://via.placeholder.com/80x80'}" alt="avatar" class="person-avatar">
            <h3 class="person-name">${person.name}</h3>
            <p class="person-handle">@${person.handle}</p>
            <p class="person-bio">${person.bio || 'مستخدم نشط'}</p>
            <button class="person-follow-btn">متابعة</button>
        `;
        peopleGrid.appendChild(personCard);
    });
}

/**
 * Render suggested people placeholder
 */
function renderSuggestedPeoplePlaceholder() {
    const peopleGrid = document.getElementById('peopleGrid');
    peopleGrid.innerHTML = `
        <div class="person-card">
            <img src="https://via.placeholder.com/80x80" alt="avatar" class="person-avatar">
            <h3 class="person-name">فاطمة علي</h3>
            <p class="person-handle">@fatima</p>
            <p class="person-bio">منشئة محتوى ومصممة</p>
            <button class="person-follow-btn">متابعة</button>
        </div>
    `;
}

/**
 * Load events
 */
async function loadEvents() {
    try {
        const response = await fetch(`${API_BASE_URL}/explore/events`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to load events');
        }

        const data = await response.json();
        renderEvents(data.events);
    } catch (error) {
        console.error('Error loading events:', error);
        renderEventsPlaceholder();
    }
}

/**
 * Render events
 */
function renderEvents(events) {
    const eventsGrid = document.getElementById('eventsGrid');
    eventsGrid.innerHTML = '';

    events.forEach(event => {
        const eventCard = document.createElement('div');
        eventCard.className = 'event-card';
        const isLive = event.isLive ? '<div class="event-live-badge">🔴 بث مباشر</div>' : '';
        eventCard.innerHTML = `
            <div class="event-image" style="background: linear-gradient(135deg, #00d4ff, #a855f7);">
                ${isLive}
            </div>
            <div class="event-content">
                <h3 class="event-title">${event.title}</h3>
                <div class="event-info">
                    <div class="event-info-item">
                        <i class="fas fa-calendar"></i>
                        <span>${event.date || 'قريباً'}</span>
                    </div>
                    <div class="event-info-item">
                        <i class="fas fa-clock"></i>
                        <span>${event.time || '8:00 PM'}</span>
                    </div>
                    <div class="event-info-item">
                        <i class="fas fa-users"></i>
                        <span>${event.attendees || 0} حضور</span>
                    </div>
                </div>
                <button class="event-btn">${event.isLive ? 'شاهد الآن' : 'احجز مقعدك'}</button>
            </div>
        `;
        eventsGrid.appendChild(eventCard);
    });
}

/**
 * Render events placeholder
 */
function renderEventsPlaceholder() {
    const eventsGrid = document.getElementById('eventsGrid');
    eventsGrid.innerHTML = `
        <div class="event-card">
            <div class="event-image" style="background: linear-gradient(135deg, #00d4ff, #a855f7);"></div>
            <div class="event-content">
                <h3 class="event-title">ندوة الذكاء الاصطناعي</h3>
                <div class="event-info">
                    <div class="event-info-item">
                        <i class="fas fa-calendar"></i>
                        <span>غداً</span>
                    </div>
                    <div class="event-info-item">
                        <i class="fas fa-clock"></i>
                        <span>8:00 PM</span>
                    </div>
                    <div class="event-info-item">
                        <i class="fas fa-users"></i>
                        <span>250 حضور</span>
                    </div>
                </div>
                <button class="event-btn">احجز مقعدك</button>
            </div>
        </div>
    `;
}

/**
 * Load sidebar content
 */
async function loadSidebarContent() {
    try {
        // Load top topics
        const topicsResponse = await fetch(`${API_BASE_URL}/explore/top-topics`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`,
            },
        });

        if (topicsResponse.ok) {
            const topicsData = await topicsResponse.json();
            renderTopTopics(topicsData.topics);
        }

        // Load new followers
        const followersResponse = await fetch(`${API_BASE_URL}/explore/new-followers`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`,
            },
        });

        if (followersResponse.ok) {
            const followersData = await followersResponse.json();
            renderNewFollowers(followersData.followers);
        }

        // Load upcoming events
        const upcomingResponse = await fetch(`${API_BASE_URL}/explore/upcoming-events`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`,
            },
        });

        if (upcomingResponse.ok) {
            const upcomingData = await upcomingResponse.json();
            renderUpcomingEvents(upcomingData.events);
        }
    } catch (error) {
        console.error('Error loading sidebar content:', error);
        renderSidebarPlaceholder();
    }
}

/**
 * Render top topics in sidebar
 */
function renderTopTopics(topics) {
    const topTopics = document.getElementById('topTopics');
    topTopics.innerHTML = '';

    topics.forEach(topic => {
        const topicItem = document.createElement('div');
        topicItem.className = 'topic-item';
        topicItem.innerHTML = `
            <p class="topic-item-name">${topic.name}</p>
            <p class="topic-item-count">${topic.posts || 0} منشورات</p>
        `;
        topTopics.appendChild(topicItem);
    });
}

/**
 * Render new followers in sidebar
 */
function renderNewFollowers(followers) {
    const newFollowers = document.getElementById('newFollowers');
    newFollowers.innerHTML = '';

    followers.forEach(follower => {
        const followerItem = document.createElement('div');
        followerItem.className = 'follower-item';
        followerItem.innerHTML = `
            <img src="${follower.avatar || 'https://via.placeholder.com/40x40'}" alt="avatar" class="follower-avatar">
            <div class="follower-info">
                <p class="follower-name">${follower.name}</p>
                <p class="follower-handle">@${follower.handle}</p>
            </div>
        `;
        newFollowers.appendChild(followerItem);
    });
}

/**
 * Render upcoming events in sidebar
 */
function renderUpcomingEvents(events) {
    const upcomingEvents = document.getElementById('upcomingEvents');
    upcomingEvents.innerHTML = '';

    events.forEach(event => {
        const eventItem = document.createElement('div');
        eventItem.className = 'upcoming-event-item';
        eventItem.innerHTML = `
            <p class="upcoming-event-title">${event.title}</p>
            <p class="upcoming-event-time">${event.time || 'قريباً'}</p>
        `;
        upcomingEvents.appendChild(eventItem);
    });
}

/**
 * Render sidebar placeholder
 */
function renderSidebarPlaceholder() {
    const topTopics = document.getElementById('topTopics');
    topTopics.innerHTML = `
        <div class="topic-item">
            <p class="topic-item-name">الذكاء الاصطناعي</p>
            <p class="topic-item-count">1.5K منشورات</p>
        </div>
        <div class="topic-item">
            <p class="topic-item-name">التطوير الويب</p>
            <p class="topic-item-count">1.2K منشورات</p>
        </div>
    `;
}

// ============ Filter Modal ============
filterBtn.addEventListener('click', function() {
    filterModal.classList.add('active');
});

modalClose.addEventListener('click', function() {
    filterModal.classList.remove('active');
});

filterModal.addEventListener('click', function(e) {
    if (e.target === filterModal) {
        filterModal.classList.remove('active');
    }
});

applyFiltersBtn.addEventListener('click', function() {
    // Get filter values
    const contentTypeCheckboxes = document.querySelectorAll('.filter-checkbox input:checked');
    const timeFilter = document.getElementById('timeFilter').value;
    const locationFilter = document.getElementById('locationFilter').value;
    const sortFilter = document.getElementById('sortFilter').value;

    currentFilters.contentType = Array.from(contentTypeCheckboxes).map(cb => cb.parentElement.textContent.trim());
    currentFilters.timeRange = timeFilter;
    currentFilters.location = locationFilter;
    currentFilters.sortBy = sortFilter;

    filterModal.classList.remove('active');
    loadContent(currentCategory);
});

resetFiltersBtn.addEventListener('click', function() {
    // Reset all filters
    document.querySelectorAll('.filter-checkbox input').forEach(cb => {
        cb.checked = cb.defaultChecked;
    });
    document.getElementById('timeFilter').value = 'all';
    document.getElementById('locationFilter').value = 'global';
    document.getElementById('sortFilter').value = 'recent';

    currentFilters = {
        contentType: ['posts', 'images', 'videos'],
        timeRange: 'all',
        location: 'global',
        sortBy: 'recent',
    };
});

// ============ Search Functionality ============
searchInput.addEventListener('input', function(e) {
    const query = e.target.value;
    if (query.length > 2) {
        performSearch(query);
    }
});

/**
 * Perform search
 */
async function performSearch(query) {
    try {
        const response = await fetch(`${API_BASE_URL}/search?q=${encodeURIComponent(query)}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`,
            },
        });

        if (!response.ok) {
            throw new Error('Search failed');
        }

        const data = await response.json();
        // Display search results
        console.log('Search results:', data);
    } catch (error) {
        console.error('Error performing search:', error);
    }
}

// ============ Initialization ============
window.addEventListener('load', function() {
    // Load initial content
    loadContent('all');
    console.log('✅ Explore page loaded successfully');
});
