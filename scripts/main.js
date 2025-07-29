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
            // } else if (sectionId === 'blog') {
            //     loadBlog();
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
    // loadBlog();
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
        
        // Extract unique years from portfolio data
        const years = [...new Set(portfolioData.map(item => item.year))].sort((a, b) => b - a);
        const yearFiltersContainer = document.querySelector('.portfolio-year-filters');
        
        // Clear existing year filters (except "all")
        document.querySelectorAll('.year-filter-btn:not([data-year="all"])').forEach(btn => btn.remove());
        
        // Add year filter buttons dynamically
        years.forEach(year => {
            const yearBtn = document.createElement('button');
            yearBtn.className = 'year-filter-btn';
            yearBtn.setAttribute('data-year', year);
            yearBtn.textContent = year;
            yearFiltersContainer.insertBefore(yearBtn, yearFiltersContainer.lastElementChild);
        });
        
        portfolioData.forEach((item, index) => {
            const portfolioItem = document.createElement('div');
            portfolioItem.className = 'portfolio-item';
            portfolioItem.setAttribute('data-categories', item.categories.join(' '));
            portfolioItem.setAttribute('data-year', item.year);
            
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
        
        // New multiple filter implementation
        const filterButtons = document.querySelectorAll('.filter-btn, .year-filter-btn');
        
        filterButtons.forEach(button => {
            button.addEventListener('click', function() {
                // Determine if this is a category or year filter
                const isCategoryFilter = this.classList.contains('filter-btn');
                const isYearFilter = this.classList.contains('year-filter-btn');
                
                // Get the appropriate group selector and "all" button
                const group = isCategoryFilter ? '.filter-btn' : '.year-filter-btn';
                const allButton = document.querySelector(`${group}[data-${isCategoryFilter ? 'category' : 'year'}="all"]`);
                
                // If "all" is clicked, deactivate others in its group
                if (this.getAttribute(isCategoryFilter ? 'data-category' : 'data-year') === 'all') {
                    document.querySelectorAll(group).forEach(btn => {
                        if (btn !== this) btn.classList.remove('active');
                    });
                } 
                // For other buttons, deactivate "all" in its group
                else {
                    if (allButton) allButton.classList.remove('active');
                }
                
                // Toggle active state for the clicked button
                this.classList.toggle('active');
                
                // Check if any filters are active in each group
                const activeCategories = document.querySelectorAll('.filter-btn.active');
                const activeYears = document.querySelectorAll('.year-filter-btn.active');
                
                const items = document.querySelectorAll('.portfolio-item');
                
                items.forEach(item => {
                    const itemCategories = item.getAttribute('data-categories').split(' ');
                    const itemYear = item.getAttribute('data-year');
                    
                    // Check category filters
                    let categoryMatch = activeCategories.length === 0 || 
                        Array.from(activeCategories).some(btn => {
                            const category = btn.getAttribute('data-category');
                            return category === 'all' || itemCategories.includes(category);
                        });
                    
                    // Check year filters
                    let yearMatch = activeYears.length === 0 || 
                        Array.from(activeYears).some(btn => {
                            const year = btn.getAttribute('data-year');
                            return year === 'all' || itemYear === year;
                        });
                    
                    // Show item only if it matches both category and year filters
                    item.style.display = (categoryMatch && yearMatch) ? 'block' : 'none';
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
    
    const fullSizeSrc = `images/original/${item.id}.webp`;
    
    lightboxImg.src = '';
    lightboxImg.style.display = 'none';
    lightboxCaption.textContent = 'Загрузка...';
    lightbox.classList.add('active');
    
    // Load image
    const placeholder = document.createElement('div');
    placeholder.className = 'image-placeholder';
    lightboxContent.appendChild(placeholder);
    const img = new Image();
    img.src = fullSizeSrc;
    img.onload = function() {
        lightboxContent.removeChild(placeholder);
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
        'nature': 'Природа',
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

// Функция для создания коллажа
async function createHeroCollage() {
    const collageContainer = document.querySelector('.hero-collage');
    
    try {
        // Загружаем данные портфолио
        const response = await fetch('data/portfolio.json');
        const portfolioData = await response.json();
        
        // Фильтруем изображения из папки optimized
        const optimizedImages = portfolioData.map(item => ({
            url: `images/optimized/${item.id}.avif`,
            title: item.title
        }));
        
        // Очищаем контейнер
        collageContainer.innerHTML = '';
        
        // Создаем 12 случайных элементов коллажа
        const shuffledImages = [...optimizedImages].sort(() => 0.5 - Math.random());
        const selectedImages = shuffledImages.slice(0, 12);
        
        selectedImages.forEach((image, index) => {
            const img = document.createElement('img');
            img.src = image.url;
            img.alt = image.title;
            img.loading = 'lazy';
            img.style.opacity = 0;
            
            // Плавное появление с задержкой
            setTimeout(() => {
                img.style.opacity = 1;
            }, index * 100);
            
            
            collageContainer.appendChild(img);
        });
        
    } catch (error) {
        console.error('Error creating collage:', error);
        collageContainer.innerHTML = '';
    }
}

// Вызываем при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    createHeroCollage();
    
    // Обновляем при изменении размера окна
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            createHeroCollage();
        }
    });
});