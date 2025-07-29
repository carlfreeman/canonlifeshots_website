document.addEventListener('DOMContentLoaded', function() {
    // Navigation
    const navLinks = document.querySelectorAll('.nav__link');
    const sections = document.querySelectorAll('.section');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all links and sections
            navLinks.forEach(l => l.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));
            
            // Add active class to clicked link and corresponding section
            this.classList.add('active');
            const sectionId = this.getAttribute('data-section');
            document.getElementById(sectionId).classList.add('active');
            
            // Scroll to top
            window.scrollTo(0, 0);
            
            // Load content if needed
            if (sectionId === 'portfolio') {
                loadPortfolio();
            } else if (sectionId === 'blog') {
                loadBlog();
            }
        });
    });
    
    // Header scroll effect
    window.addEventListener('scroll', function() {
        const header = document.querySelector('.header');
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });
    
    // Initial animations
    animateHero();
    
    // Load initial content
    loadPortfolio();
    loadBlog();
});

function animateHero() {
    const heroTitle = document.querySelector('.hero__title');
    const heroSubtitle = document.querySelector('.hero__subtitle');
    
    setTimeout(() => {
        heroTitle.classList.add('fade-in');
    }, 300);
    
    setTimeout(() => {
        heroSubtitle.classList.add('fade-in', 'delay-1');
    }, 600);
}

async function loadPortfolio() {
    const portfolioGrid = document.querySelector('.portfolio-grid');
    if (portfolioGrid.innerHTML !== '') return;
    
    try {
        const response = await fetch('data/portfolio.json');
        const portfolioData = await response.json();
        
        portfolioGrid.innerHTML = '';
        
        portfolioData.forEach((item, index) => {
            const portfolioItem = document.createElement('div');
            portfolioItem.className = 'portfolio-item';
            portfolioItem.setAttribute('data-categories', item.categories.join(' '));
            item.categories.forEach(cat => {
                portfolioItem.classList.add(cat);
            });
            
            // Use AVIF if supported, otherwise fallback to JPG
            const imageExt = supportsAVIF() ? 'avif' : 'avif';
            const thumbSrc = `images/optimized/${item.id}.${imageExt}`;
            
            portfolioItem.innerHTML = `
              <img src="${thumbSrc}" alt="${item.title}" loading="lazy">
              <div class="portfolio-item__overlay">
                <h3 class="portfolio-item__title">${item.title}</h3>
                <p class="portfolio-item__category">${item.categories.map(cat => getCategoryName(cat)).join(', ')}</p>
              </div>
              <div class="portfolio-mobile-caption">
                <div class="portfolio-mobile-caption__title">${item.title}</div>
                <div class="portfolio-mobile-caption__categories">
                  ${item.categories.map(cat => `
                    <span class="portfolio-mobile-caption__category">${getCategoryName(cat)}</span>
                  `).join('')}
                </div>
              </div>
            `;
            
            portfolioItem.style.animationDelay = `${index * 0.05}s`;
            portfolioItem.classList.add('fade-in');
            
            portfolioItem.addEventListener('click', () => openLightbox(item, portfolioData));
            
            portfolioGrid.appendChild(portfolioItem);
        });
        
        // Фильтрация - исправленная часть:
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(button => {
            button.addEventListener('click', function() {
                filterButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                
                const category = this.getAttribute('data-category');
                const items = document.querySelectorAll('.portfolio-item');
                
                items.forEach(item => {
                    const itemCategories = item.getAttribute('data-categories').split(' ');
                    if (category === 'all' || itemCategories.includes(category)) {
                        item.style.display = 'block';
                    } else {
                        item.style.display = 'none';
                    }
                });
            });
        });
        
        // Animate portfolio title and filters
        const portfolioTitle = document.querySelector('.portfolio-title');
        const portfolioFilters = document.querySelector('.portfolio-filters');
        
        setTimeout(() => {
            portfolioTitle.classList.add('fade-in');
        }, 300);
        
        setTimeout(() => {
            portfolioFilters.classList.add('fade-in', 'delay-1');
        }, 600);
        
    } catch (error) {
        console.error('Error loading portfolio:', error);
        portfolioGrid.innerHTML = '<p>Не удалось загрузить портфолио. Пожалуйста, попробуйте позже.</p>';
    }
}

async function loadBlog() {
    const blogPostsContainer = document.querySelector('.blog-posts');
    if (blogPostsContainer.innerHTML !== '') return;
    
    try {
        // In a real implementation, you would fetch this from a JSON file or API
        const blogData = [
            {
                id: 1,
                title: "Искусство видеть",
                date: "15 мая 2023",
                excerpt: "Размышления о том, как научиться видеть необычное в обычном и замечать моменты, которые становятся искусством.",
                content: "Полное содержание поста..."
            },
            {
                id: 2,
                title: "Чёрно-белое восприятие",
                date: "2 апреля 2023",
                excerpt: "Почему чёрно-белая фотография часто оказывается более выразительной, чем цветная?",
                content: "Полное содержание поста..."
            }
        ];
        
        blogPostsContainer.innerHTML = '';
        
        blogData.forEach((post, index) => {
            const postElement = document.createElement('article');
            postElement.className = 'blog-post';
            postElement.style.animationDelay = `${index * 0.1}s`;
            postElement.classList.add('fade-in');
            
            postElement.innerHTML = `
                <h3 class="blog-post__title">${post.title}</h3>
                <p class="blog-post__date">${post.date}</p>
                <p class="blog-post__excerpt">${post.excerpt}</p>
                <a href="#" class="blog-post__link" data-post-id="${post.id}">Читать далее</a>
            `;
            
            blogPostsContainer.appendChild(postElement);
        });
        
        // Animate blog title
        const blogTitle = document.querySelector('.blog-title');
        setTimeout(() => {
            blogTitle.classList.add('fade-in');
        }, 300);
        
    } catch (error) {
        console.error('Error loading blog:', error);
        blogPostsContainer.innerHTML = '<p>Не удалось загрузить блог. Пожалуйста, попробуйте позже.</p>';
    }
}

function openLightbox(item, allItems) {
    const lightbox = document.querySelector('.lightbox');
    const lightboxContent = document.querySelector('.lightbox__content');
    const lightboxImg = document.querySelector('.lightbox__image');
    const lightboxCaption = document.querySelector('.lightbox__caption');
    
    const closeBtn = document.querySelector('.lightbox__close');
    
    closeBtn.replaceWith(closeBtn.cloneNode(true));
    
    lightboxContent.style.display = 'flex';
    lightboxContent.style.flexDirection = 'column';
    lightboxContent.style.alignItems = 'center';
    
    const fullSizeSrc = `images/original/${item.id}.jpg`;
    
    lightboxImg.src = '';
    lightboxImg.style.display = 'none';
    lightboxCaption.textContent = 'Загрузка...';
    lightbox.classList.add('active');
    
    // Load image
    const img = new Image();
    img.src = fullSizeSrc;
    img.onload = function() {
        lightboxImg.src = fullSizeSrc;
        lightboxImg.style.display = 'block';
        lightboxCaption.textContent = `${item.title}`;
        
        if (item.description) {
            lightboxCaption.textContent += `: ${item.description}`;
        }
        
        centerImage(lightboxImg);
    };
    
    img.onerror = function() {
        lightboxCaption.textContent = 'Не удалось загрузить изображение';
    };

    const currentIndex = allItems.findIndex(i => i.id === item.id);
    
    function closeLightbox() {
        lightbox.classList.remove('active');
        document.removeEventListener('keydown', handleKeyDown);
    }
    

    function centerImage(imgElement) {
        const container = lightboxContent;
        const img = imgElement;
        
        img.style.maxWidth = 'none';
        img.style.maxHeight = 'none';
        img.style.width = 'auto';
        img.style.height = 'auto';
        
        const imgWidth = img.naturalWidth;
        const imgHeight = img.naturalHeight;
        
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        
        const widthRatio = containerWidth / imgWidth;
        const heightRatio = containerHeight / imgHeight;
        const scale = Math.min(widthRatio, heightRatio, 1); // Не увеличиваем больше оригинала
        
        img.style.width = `${imgWidth * scale}px`;
        img.style.height = `${imgHeight * scale}px`;
    }
    
    window.addEventListener('resize', () => {
        if (lightbox.classList.contains('active') && lightboxImg.src) {
            centerImage(lightboxImg);
        }
    });

    
    document.querySelector('.lightbox__close').addEventListener('click', closeLightbox);
   
    function handleKeyDown(e) {
        if (!lightbox.classList.contains('active')) return;
        
        switch (e.key) {
            case 'Escape':
                closeLightbox();
                break;
        }
    }
    
    document.addEventListener('keydown', handleKeyDown);
}

function getCategoryName(category) {
    const categories = {
        'best': 'Лучшее',
        'street': 'Стрит',
        'concept': 'Концепт',
        'mono': 'Моно-ЧБ',
        'experiments': 'Эксперименты',
        'philosophy': 'Философия'
    };
    
    return categories[category] || category;
}

function supportsAVIF() {
    // Simple feature detection for AVIF support
    return document.createElement('canvas').toDataURL('image/avif').indexOf('data:image/avif') === 0;
}