let currentFilteredItems = [];
let allItems = [];

document.addEventListener('DOMContentLoaded', function() {
    const navLinks = document.querySelectorAll('.nav__link');
    const sections = document.querySelectorAll('.section');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            navLinks.forEach(l => l.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));
            
            this.classList.add('active');
            const sectionId = this.getAttribute('data-section');
            document.getElementById(sectionId).classList.add('active');
            
            window.scrollTo(0, 0);
            
            if (sectionId === 'portfolio') {
                loadPortfolio();
            }
        });
    });
    
    window.addEventListener('scroll', function() {
        const header = document.querySelector('.header');
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });
    
    animateHero();
    
    loadPortfolio();
    createHeroCollage();
});

function animateHero() {
    const heroTitle = document.querySelector('.hero__title');
    const heroSubtitle = document.querySelector('.hero__subtitle');
    
    setTimeout(() => {
        heroTitle.classList.add('fade-in');
    }, 50);
    
    setTimeout(() => {
        heroSubtitle.classList.add('fade-in', 'delay-1');
    }, 100);
}

let lazyLoadController = new AbortController();

async function loadPortfolio() {
    const portfolioGrid = document.querySelector('.portfolio-grid');
    if (portfolioGrid.innerHTML !== '') return;

    try {
        const response = await fetch('data/portfolio.json');
        const allItems = await response.json();

        portfolioGrid.innerHTML = '';

        const years = [...new Set(allItems.map(item => item.year))].sort((a, b) => b - a);
        const yearFiltersContainer = document.querySelector('.portfolio-year-filters');

        document.querySelectorAll('.year-filter-btn:not([data-year="all"])').forEach(btn => btn.remove());

        years.forEach(year => {
            const yearBtn = document.createElement('button');
            yearBtn.className = 'year-filter-btn';
            yearBtn.setAttribute('data-year', year);
            yearBtn.textContent = year;
            yearFiltersContainer.insertBefore(yearBtn, yearFiltersContainer.lastElementChild);
        });

        const portfolioItems = allItems.map((item, index) => {
            const portfolioItem = document.createElement('div');
            portfolioItem.className = 'portfolio-item loading';
            portfolioItem.setAttribute('data-categories', item.categories.join(' '));
            portfolioItem.setAttribute('data-year', item.year);
            portfolioItem.dataset.id = item.id;

            const spinner = document.createElement('div');
            spinner.className = 'loading-spinner';
            portfolioItem.appendChild(spinner);

            item.categories.forEach(cat => {
                portfolioItem.classList.add(cat);
            });

            const imageExt = supportsAVIF() ? 'avif' : 'avif';
            const thumbSrc = `images/optimized/${item.id}.${imageExt}`;

            portfolioItem.innerHTML = `
                <img data-src="${thumbSrc}" alt="${item.title}" loading="lazy">
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

            portfolioItem.style.animationDelay = `${index * 0.1}s`;
            portfolioItem.classList.add('fade-in');

            portfolioItem.addEventListener('click', () => {
                const itemId = item.id;
                const itemToShow = currentFilteredItems.find(i => i.id === itemId) || 
                                  allItems.find(i => i.id === itemId);
                if (itemToShow) {
                    openLightbox(itemToShow, allItems);
                }
            });
            return portfolioItem;
        });

        currentFilteredItems = [...allItems];

        portfolioItems.forEach(item => portfolioGrid.appendChild(item));

        initLazyLoading(portfolioItems);

        function applyFiltersAndSort() {
            const activeCategoryFilters = Array.from(document.querySelectorAll('.filter-btn.active'))
                .map(btn => btn.getAttribute('data-category'))
                .filter(cat => cat !== 'all');

            const activeYearFilters = Array.from(document.querySelectorAll('.year-filter-btn.active'))
                .map(btn => btn.getAttribute('data-year'))
                .filter(year => year !== 'all');

            const processedItems = portfolioItems.map(item => {
                const itemCategories = item.getAttribute('data-categories').split(' ');
                const itemYear = parseInt(item.getAttribute('data-year'));
                
                const categoryMatches = activeCategoryFilters.length > 0 ? 
                    itemCategories.filter(cat => activeCategoryFilters.includes(cat)).length : 0;
                
                const yearMatch = activeYearFilters.length === 0 || 
                    activeYearFilters.includes(itemYear.toString());
                
                return {
                    element: item,
                    matches: categoryMatches,
                    yearMatch: yearMatch,
                    categories: itemCategories,
                    year: itemYear
                };
            });

            const filteredItems = processedItems
                .filter(item => {
                    return item.yearMatch && 
                        (activeCategoryFilters.length === 0 || item.matches > 0);
                })
                .sort((a, b) => {
                    // Primary sort by number of matching categories (descending)
                    if (b.matches !== a.matches) return b.matches - a.matches;
                    
                    // Secondary sort by year (newest first)
                    return b.year - a.year;
                });

            return {
                filtered: filteredItems.map(item => item.element),
                all: portfolioItems
            };
        }

        function updateGrid() {
            const { filtered, all } = applyFiltersAndSort();
            currentFilteredItems = filtered.map(item => {
                return allItems.find(i => i.id === item.dataset.id);
            });
            
            portfolioGrid.innerHTML = '';
            
            filtered.forEach(item => {
                item.classList.remove('fade-in');
                item.style.opacity = '0';
                portfolioGrid.appendChild(item);
                item.style.display = 'block';
            });
            
            all.forEach(item => {
                if (!filtered.includes(item)) {
                    item.style.display = 'none';
                }
            });
            
            initLazyLoading(filtered);
        }

        function setupFilterButtons() {
            document.querySelectorAll('.filter-btn, .year-filter-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const isYearFilter = this.classList.contains('year-filter-btn');
                    const group = isYearFilter ? '.year-filter-btn' : '.filter-btn';
                    const allButton = document.querySelector(`${group}[data-${isYearFilter ? 'year' : 'category'}="all"]`);
                    const isAllButton = this === allButton;

                    this.classList.toggle('active');

                    if (isAllButton) {
                        document.querySelectorAll(`${group}:not([data-${isYearFilter ? 'year' : 'category'}="all"])`).forEach(btn => {
                            btn.classList.remove('active');
                        });
                    } else {
                        if (allButton.classList.contains('active')) {
                            allButton.classList.remove('active');
                        }

                        const specificButtons = document.querySelectorAll(`${group}:not([data-${isYearFilter ? 'year' : 'category'}="all"])`);
                        const allSpecificActive = Array.from(specificButtons).every(btn => btn.classList.contains('active'));

                        if (allSpecificActive) {
                            specificButtons.forEach(btn => btn.classList.remove('active'));
                            allButton.classList.add('active');
                        }
                    }

                    updateGrid();
                });
            });
        }

        updateGrid();
        setupFilterButtons();

        const portfolioTitle = document.querySelector('.portfolio-title');
        const portfolioFilters = document.querySelector('.portfolio-filters');
        
        setTimeout(() => {
            portfolioTitle.classList.add('fade-in');
        }, 50);
        
        setTimeout(() => {
            portfolioFilters.classList.add('fade-in', 'delay-1');
        }, 100);

    } catch (error) {
        console.error('Error loading portfolio:', error);
        portfolioGrid.innerHTML = '<p>Не удалось загрузить портфолио. Пожалуйста, попробуйте позже.</p>';
    }
}

function initLazyLoading(items) {
    lazyLoadController.abort();
    lazyLoadController = new AbortController();

    const animationObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const item = entry.target;
                item.style.animationDelay = '0s';
                item.classList.add('fade-in');
                animationObserver.unobserve(item);
            }
        });
    }, {
        rootMargin: '100px',
        threshold: 0.01,
        signal: lazyLoadController.signal
    });

    const loadObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const item = entry.target;
                const img = item.querySelector('img');
                
                if (img && img.dataset.src) {
                    item.classList.add('loading');
                    
                    if (!item.querySelector('.loading-spinner')) {
                        const spinner = document.createElement('div');
                        spinner.className = 'loading-spinner';
                        item.appendChild(spinner);
                    }
                    
                    img.onload = function() {
                        item.classList.remove('loading');
                        const spinner = item.querySelector('.loading-spinner');
                        if (spinner) spinner.remove();
                        
                        img.style.transition = 'opacity 0.3s ease';
                        img.style.opacity = '0';
                        setTimeout(() => {
                            img.style.opacity = '1';
                        }, 10);
                    };
                    
                    img.onerror = function() {
                        item.classList.remove('loading');
                        const spinner = item.querySelector('.loading-spinner');
                        if (spinner) spinner.remove();
                    };
                    
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                }
                loadObserver.unobserve(entry.target);
            }
        });
    }, {
        rootMargin: '200px',
        threshold: 0.01,
        signal: lazyLoadController.signal
    });

    items.forEach(item => {
        item.classList.remove('fade-in');
        item.style.opacity = '0';
        item.style.animationDelay = '0s';
    });

    items.forEach(item => {
        animationObserver.observe(item);
        
        const img = item.querySelector('img');
        if (img && img.hasAttribute('data-src')) {
            loadObserver.observe(item);
        }
    });
}

function openLightbox(item, allItems) {
    const lightbox = document.querySelector('.lightbox');
    const lightboxContent = document.querySelector('.lightbox__content');
    const lightboxImg = document.querySelector('.lightbox__image');
    const lightboxCaption = document.querySelector('.lightbox__caption');
    
    const items = currentFilteredItems.length > 0 ? currentFilteredItems : allItems;
    const currentIndex = items.findIndex(i => i.id === item.id);

    const arrowsHTML = `
        <div class="lightbox__nav-arrows">
            <button class="lightbox__arrow lightbox__arrow--prev" aria-label="Previous image" 
                    ${currentIndex <= 0 ? 'disabled' : ''}>←</button>
            <button class="lightbox__arrow lightbox__arrow--next" aria-label="Next image" 
                    ${currentIndex >= items.length - 1 ? 'disabled' : ''}>→</button>
        </div>
    `;
    lightbox.insertAdjacentHTML('beforeend', arrowsHTML);
    
    const closeBtn = document.querySelector('.lightbox__close');
    const prevBtn = document.querySelector('.lightbox__arrow--prev');
    const nextBtn = document.querySelector('.lightbox__arrow--next');
    
    prevBtn.disabled && prevBtn.classList.add('disabled');
    nextBtn.disabled && nextBtn.classList.add('disabled');

    closeBtn.replaceWith(closeBtn.cloneNode(true));

    lightboxContent.style.display = 'flex';
    lightbox.classList.add('active');
    
    const fullSizeSrc = `images/original/${item.id}.webp`;
    
    lightboxImg.src = '';
    lightboxImg.style.display = 'none';
    lightboxCaption.textContent = 'Загрузка...';
    
    let touchStartX = 0;
    let touchEndX = 0;
    
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

    function navigate(direction) {
        let newIndex = currentIndex;
        if (direction === 'prev' && currentIndex > 0) {
            newIndex = currentIndex - 1;
        } else if (direction === 'next' && currentIndex < items.length - 1) {
            newIndex = currentIndex + 1;
        }
        
        if (newIndex !== currentIndex) {
            openLightbox(items[newIndex], allItems);
        }
    }

    // Touch events for mobile swipe
    lightboxContent.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    
    lightboxContent.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, { passive: true });
    
    function handleSwipe() {
        const threshold = 50;
        const difference = touchStartX - touchEndX;
        
        if (difference > threshold && currentIndex < items.length - 1) {
            navigate('next');
        } else if (difference < -threshold && currentIndex > 0) {
            navigate('prev');
        }
    }
    
    prevBtn.addEventListener('click', () => navigate('prev'));
    nextBtn.addEventListener('click', () => navigate('next'));
    
    function handleKeyDown(e) {
        if (!lightbox.classList.contains('active')) return;
        
        switch (e.key) {
            case 'Escape':
                closeLightbox();
                break;
            case 'ArrowLeft':
                navigate('prev');
                break;
            case 'ArrowRight':
                navigate('next');
                break;
        }
    }
    
    document.addEventListener('keydown', handleKeyDown);
    
    function closeLightbox() {
        lightbox.classList.remove('active');
        document.removeEventListener('keydown', handleKeyDown);
        lightboxContent.removeEventListener('touchstart', handleTouchStart);
        lightboxContent.removeEventListener('touchend', handleTouchEnd);
        
        const arrows = document.querySelector('.lightbox__nav-arrows');
        if (arrows) arrows.remove();
    }
    
    document.querySelector('.lightbox__close').addEventListener('click', closeLightbox);
    
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
        const scale = Math.min(widthRatio, heightRatio, 1);
        
        img.style.width = `${imgWidth * scale}px`;
        img.style.height = `${imgHeight * scale}px`;
    }
    
    window.addEventListener('resize', () => {
        if (lightbox.classList.contains('active') && lightboxImg.src) {
            centerImage(lightboxImg);
        }
    });
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
    return document.createElement('canvas').toDataURL('image/avif').indexOf('data:image/avif') === 0;
}

async function createHeroCollage() {
    const collageContainer = document.querySelector('.hero-collage');
    
    try {
        const response = await fetch('data/portfolio.json');
        const allItems = await response.json();
        
        const optimizedImages = allItems.map(item => ({
            url: `images/optimized/${item.id}.avif`,
            title: item.title
        }));
        
        collageContainer.innerHTML = '';
        
        const shuffledImages = [...optimizedImages].sort(() => 0.5 - Math.random());
        const selectedImages = shuffledImages.slice(0, 8);
        
        selectedImages.forEach((image, index) => {
            const img = document.createElement('img');
            img.src = image.url;
            img.alt = image.title;
            img.loading = 'lazy';
            img.style.opacity = 0;
            
            setTimeout(() => {
                img.style.opacity = 1;
            }, index * 30);
            
            collageContainer.appendChild(img);
        });
        
    } catch (error) {
        console.error('Error creating collage:', error);
        collageContainer.innerHTML = '';
    }
}