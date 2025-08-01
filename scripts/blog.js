let blogCache = null;
let allTags = new Set();
const POSTS_PER_PAGE = 6;
let activeTags = new Set(['all']);
let tagCounts = {};

export async function initBlog() {
    await loadBlogData();
    initTagFilters();
    initRouter();
    loadInitialPosts();
    setupInfiniteScroll();
}

async function loadBlogData() {
    if (blogCache) return blogCache;
    
    try {
        const response = await fetch('data/blog.json');
        if (!response.ok) throw new Error('Network response was not ok');
        
        const data = await response.json();
        data.forEach(post => {
            post.tags.forEach(tag => allTags.add(tag));
        });
        
        blogCache = data;
        return data;
    } catch (error) {
        console.error('Ошибка загрузки данных блога:', error);
        blogCache = [];
        return [];
    }
}

function initTagFilters() {
    const filtersContainer = document.querySelector('.blog-filters');
        filtersContainer.innerHTML = '';
    
    const allButton = document.createElement('button');
    allButton.className = 'blog-filter active';
    allButton.dataset.tag = 'all';
    allButton.textContent = `Все (${blogCache.length})`;
    filtersContainer.appendChild(allButton);
    
    activeTags = new Set(['all']);
    
    const tagCountMap = new Map();
    blogCache.forEach(post => {
        const uniqueTags = [...new Set(post.tags)];
        uniqueTags.forEach(tag => {
            tagCountMap.set(tag, (tagCountMap.get(tag) || 0) + 1);
        });
    });
    
    const sortedTags = [...tagCountMap.entries()]
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .map(entry => entry[0]);
    
    sortedTags.forEach(tag => {
        const button = document.createElement('button');
        button.className = 'blog-filter';
        button.dataset.tag = tag;
        button.textContent = `${tag} (${tagCountMap.get(tag)})`;
        filtersContainer.appendChild(button);
    });
    updateFilterHandlers();
}

function updateFilterHandlers() {
    document.querySelectorAll('.blog-filter').forEach(btn => {
        btn.addEventListener('click', function() {
            const tag = this.dataset.tag;
            
            if (tag === 'all') {
                activeTags = new Set(['all']);
                document.querySelectorAll('.blog-filter').forEach(b => {
                    b.classList.toggle('active', b.dataset.tag === 'all');
                });
            } else {
                activeTags.delete('all');
                document.querySelector('.blog-filter[data-tag="all"]').classList.remove('active');
                
                if (activeTags.has(tag)) {
                    activeTags.delete(tag);
                    this.classList.remove('active');
                } else {
                    activeTags.add(tag);
                    this.classList.add('active');
                }
                
                if (activeTags.size === 0) {
                    activeTags.add('all');
                    document.querySelector('.blog-filter[data-tag="all"]').classList.add('active');
                }
            }
            
            renderBlogPosts();
        });
    });
}

function loadInitialPosts() {
    if (activeTags.size === 0) {
        activeTags = new Set(['all']);
        document.querySelector('.blog-filter[data-tag="all"]')?.classList.add('active');
    }
    
    renderBlogPosts();
}

function updateTagCounters(activeTags) {
    if (!blogCache) return;

    const allPosts = blogCache;
    let filteredPosts = allPosts;

    if (activeTags.size > 0 && !activeTags.has('all')) {
        filteredPosts = allPosts.filter(post => 
            Array.from(activeTags).every(tag => post.tags.includes(tag))
        );
    }

    const availableTagCounts = new Map();

    document.querySelectorAll('.blog-filter:not([data-tag="all"])').forEach(btn => {
        availableTagCounts.set(btn.dataset.tag, 0);
    });

    filteredPosts.forEach(post => {
        post.tags.forEach(tag => {
            if (availableTagCounts.has(tag)) {
                availableTagCounts.set(tag, availableTagCounts.get(tag) + 1);
            }
        });
    });

    document.querySelectorAll('.blog-filter').forEach(btn => {
        const tag = btn.dataset.tag;

        if (tag === 'all') {
            btn.textContent = `Все (${filteredPosts.length})`;
        } else {
            const count = availableTagCounts.get(tag) || 0;
            btn.textContent = `${tag} (${count})`;

            if (count === 0) {
                btn.classList.add('disabled');
                btn.disabled = true;
            } else {
                btn.classList.remove('disabled');
                btn.disabled = false;
            }
        }
    });
}


function renderBlogPosts(page = 1) {
    const grid = document.querySelector('.blog-grid');
    grid.innerHTML = '';
    
    let filteredPosts = blogCache;
    
    if (!activeTags.has('all') && activeTags.size > 0) {
        filteredPosts = blogCache.filter(post => 
            Array.from(activeTags).every(tag => post.tags.includes(tag))
        );
        
        filteredPosts.sort((a, b) => {
            const aMatches = a.tags.filter(tag => activeTags.has(tag)).length;
            const bMatches = b.tags.filter(tag => activeTags.has(tag)).length;
            
            return bMatches - aMatches;
        });
    }

    updateTagCounters(activeTags);
    updateActiveFiltersIndicator();

    
    const start = (page - 1) * POSTS_PER_PAGE;
    const end = start + POSTS_PER_PAGE;
    const postsToShow = filteredPosts.slice(0, end);
    
    postsToShow.forEach(post => {
        const postElement = createPostElement(post);
        grid.appendChild(postElement);
    });
    
    const loader = document.querySelector('.blog-loader');
    if (loader) {
        loader.style.display = end < filteredPosts.length ? 'block' : 'none';
    }
    
    const allButton = document.querySelector('.blog-filter[data-tag="all"]');
    if (allButton) {
        allButton.textContent = `Все (${blogCache.length})`;
    }
}

function updateActiveFiltersIndicator() {
    let container = document.querySelector('.blog-active-filters');
    
    if (!container) {
        container = document.createElement('div');
        container.className = 'blog-active-filters';
        document.querySelector('.blog-header').appendChild(container);
    }
    
    container.innerHTML = '';
    
    if (activeTags.has('all') || activeTags.size === 0) return;
    
    Array.from(activeTags).forEach(tag => {
        if (tag === 'all') return;
        
        const filterEl = document.createElement('div');
        filterEl.className = 'blog-active-filter';
        filterEl.innerHTML = `
            ${tag}
            <button class="blog-active-filter-remove" data-tag="${tag}">×</button>
        `;
        container.appendChild(filterEl);
    });
    
    document.querySelectorAll('.blog-active-filter-remove').forEach(btn => {
        btn.addEventListener('click', () => {
            const tag = btn.dataset.tag;
            activeTags.delete(tag);
            
            if (activeTags.size === 0) {
                activeTags.add('all');
                document.querySelector('.blog-filter[data-tag="all"]').classList.add('active');
            }
            
            document.querySelector(`.blog-filter[data-tag="${tag}"]`)?.classList.remove('active');
            
            renderBlogPosts();
        });
    });
}

function createPostElement(post) {
    const card = document.createElement('article');
    card.className = 'blog-card fade-in';
    card.dataset.id = post.id;
    
    const date = new Date(post.date);
    const formattedDate = `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear().toString().slice(2)}`;
    
    card.innerHTML = `
        <div class="blog-card__image-container">
            <img data-src="${post.image}" alt="${post.title}" loading="lazy">
        </div>
        <div class="blog-card__content">
            <div class="blog-meta">
                <time datetime="${post.date}">${formattedDate}</time>
                <div class="blog-tags">
                    ${post.tags.map(tag => `<span class="blog-tag">${tag}</span>`).join('')}
                </div>
            </div>
            <h3 class="blog-card__title">${post.title}</h3>
            <p class="blog-card__excerpt">${post.excerpt}</p>
            <a href="#blog/${post.id}" class="blog-card__link">Читать →</a>
        </div>
    `;
    
    const img = card.querySelector('img');
    if (img.dataset.src) {
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
    }
    
    return card;
}

function setupInfiniteScroll() {
    let isLoading = false;
    
    window.addEventListener('scroll', async () => {
        const loader = document.querySelector('.blog-loader');
        if (!loader || isLoading) return;
        
        const loaderPos = loader.getBoundingClientRect();
        if (loaderPos.top < window.innerHeight * 1.5) {
            isLoading = true;
            
            const currentPosts = document.querySelectorAll('.blog-card').length;
            const currentPage = Math.ceil(currentPosts / POSTS_PER_PAGE);
            
            await new Promise(resolve => setTimeout(resolve, 300));
            renderBlogPosts(currentPage + 1);
            
            isLoading = false;
        }
    });
}

function initRouter() {
    processHash();
    
    window.addEventListener('hashchange', () => {
        if (document.querySelector('#blog.active')) {
            processHash();
        }
    });
}

function processHash() {
    const hash = window.location.hash;
    
    if (hash.startsWith('#blog/')) {
        const postId = hash.split('/')[1];
        openBlogPost(postId);
    } else {
        closeBlogPost();
        
        document.querySelector('.nav__link[href="#blog"]').click();
        
        if (document.querySelectorAll('.blog-card').length === 0) {
            renderBlogPosts();
        }
    }
}
async function openBlogPost(postId) {
    let postContainer = document.querySelector('.blog-post-container');
    if (!postContainer) {
        postContainer = document.createElement('div');
        postContainer.className = 'blog-post-container';
        document.querySelector('#blog').appendChild(postContainer);
    }
    
    try {
        document.querySelector('.blog-header').style.display = 'none';
        document.querySelector('.blog-grid').style.display = 'none';
        
        postContainer.innerHTML = '<div class="loading-spinner"></div>';
        
        const post = blogCache.find(p => p.id === postId);
        if (!post) {
            throw new Error('Пост не найден');
        }
        
        const date = new Date(post.date);
        const formattedDate = `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear().toString().slice(2)}`;
        
        postContainer.innerHTML = `
            <article class="blog-post">
                <button class="blog-back-btn">← Назад к блогу</button>
                
                <header class="blog-post-header">
                    <h1 class="blog-post-title">${post.title}</h1>
                    <div class="blog-post-meta">
                        <time datetime="${post.date}">${formattedDate}</time>
                        <div class="blog-tags">
                            ${post.tags.map(tag => `<span class="blog-tag">${tag}</span>`).join('')}
                        </div>
                    </div>
                </header>
                
                <div class="blog-post-image">
                    <img src="${post.image}" alt="${post.title}" loading="lazy">
                </div>
                
                <div class="blog-post-content">
                    ${post.content}
                </div>
                
                <footer class="blog-post-footer">
                    <h3>Рекомендуем к прочтению</h3>
                    <div class="blog-recommendations">
                        <!-- Рекомендации будут добавлены динамически -->
                    </div>
                </footer>
            </article>
        `;
        
        document.querySelector('.blog-back-btn').addEventListener('click', () => {
            window.location.hash = '#blog';
        });
        loadRecommendations(post);
        updatePostSEO(post);
    } catch (error) {
        console.error('Ошибка при открытии поста:', error);
        if (postContainer) {
            postContainer.innerHTML = `
                <div class="error-message">
                    <p>Произошла ошибка при загрузке поста</p>
                    <button class="blog-back-btn">← Назад к блогу</button>
                </div>
            `;
            document.querySelector('.blog-back-btn').addEventListener('click', () => {
                window.location.hash = '#blog';
            });
        }
    }
}

function closeBlogPost() {
    document.querySelector('.blog-header').style.display = 'block';
    document.querySelector('.blog-grid').style.display = 'grid';
    
    const postContainer = document.querySelector('.blog-post-container');
    if (postContainer) postContainer.remove();
    
    if (document.querySelectorAll('.blog-card').length === 0) {
        renderBlogPosts();
    }
}

function loadRecommendations(currentPost) {
    const container = document.querySelector('.blog-recommendations');
    if (!container) return;
    
    try {
        const tagBased = [];
        for (const post of blogCache) {
            if (post.id === currentPost.id) continue;
            
            const commonTags = post.tags.filter(tag => 
                currentPost.tags.includes(tag)
            ).length;
            
            if (commonTags > 0) {
                tagBased.push({...post, score: commonTags});
            }
        }
        
        tagBased.sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            return new Date(b.date) - new Date(a.date);
        });
        
        const topTagBased = tagBased.slice(0, 2);
        
        const dateBased = blogCache
            .filter(post => 
                post.id !== currentPost.id &&
                !topTagBased.some(p => p.id === post.id)
            )
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 1);
        
        const recommendations = [...topTagBased, ...dateBased];
        
        if (recommendations.length === 0) {
            container.innerHTML = '<p>Советуем посмотреть все записи в блоге</p>';
            return;
        }
        
        container.innerHTML = '';
        recommendations.forEach(post => {
            const date = new Date(post.date);
            const formattedDate = `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear().toString().slice(2)}`;
            
            const card = document.createElement('a');
            card.className = 'blog-recommendation';
            card.href = `#blog/${post.id}`;
            card.innerHTML = `
                <img src="${post.image}" alt="${post.title}">
                <div>
                    <h4>${post.title}</h4>
                    <time>${formattedDate}</time>
                </div>
            `;
            container.appendChild(card);
        });
    } catch (error) {
        console.error('Ошибка при формировании рекомендаций:', error);
        container.innerHTML = '<p>Не удалось загрузить рекомендации</p>';
    }
}

function updatePostSEO(post) {
    document.title = `${post.title} | Блог | Little Can`;
    
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.name = 'description';
        document.head.appendChild(metaDesc);
    }
    metaDesc.content = post.excerpt;
    
    let script = document.querySelector('script[type="application/ld+json"]');
    if (script) script.remove();
    
    script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": post.title,
        "description": post.excerpt,
        "datePublished": post.date,
        "image": post.image,
        "author": {
            "@type": "Person",
            "name": "М.Литвак"
        }
    });
    document.head.appendChild(script);
}

export { renderBlogPosts, openBlogPost, closeBlogPost };