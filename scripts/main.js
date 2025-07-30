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

// Lazy loading controller
let lazyLoadController = new AbortController();

async function loadPortfolio() {
    const portfolioGrid = document.querySelector('.portfolio-grid');
    if (portfolioGrid.innerHTML !== '') return;

    try {
        const response = await fetch('data/portfolio.json');
        const portfolioData = await response.json();

        // Clear existing content
        portfolioGrid.innerHTML = '';

        // Extract unique years from portfolio data (sorted descending)
        const years = [...new Set(portfolioData.map(item => item.year))].sort((a, b) => b - a);
        const yearFiltersContainer = document.querySelector('.portfolio-year-filters');

        // Clear existing year filters (except "all")
        document.querySelectorAll('.year-filter-btn:not([data-year="all"])').forEach(btn => btn.remove());

        // Add year filter buttons dynamically (newest first)
        years.forEach(year => {
            const yearBtn = document.createElement('button');
            yearBtn.className = 'year-filter-btn';
            yearBtn.setAttribute('data-year', year);
            yearBtn.textContent = year;
            yearFiltersContainer.insertBefore(yearBtn, yearFiltersContainer.lastElementChild);
        });

        // Create portfolio items
        const portfolioItems = portfolioData.map((item, index) => {
            const portfolioItem = document.createElement('div');
            portfolioItem.className = 'portfolio-item';
            portfolioItem.setAttribute('data-categories', item.categories.join(' '));
            portfolioItem.setAttribute('data-year', item.year);
            portfolioItem.dataset.id = item.id;

            item.categories.forEach(cat => {
                portfolioItem.classList.add(cat);
            });

            // Use AVIF if supported, otherwise fallback to JPG
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

            portfolioItem.addEventListener('click', () => openLightbox(item, portfolioData));
            return portfolioItem;
        });

        // Add all items to DOM initially
        portfolioItems.forEach(item => portfolioGrid.appendChild(item));

        // Initialize lazy loading
        initLazyLoading(portfolioItems);

        function applyFiltersAndSort() {
            const activeCategoryFilters = Array.from(document.querySelectorAll('.filter-btn.active'))
                .map(btn => btn.getAttribute('data-category'))
                .filter(cat => cat !== 'all');

            const activeYearFilters = Array.from(document.querySelectorAll('.year-filter-btn.active'))
                .map(btn => btn.getAttribute('data-year'))
                .filter(year => year !== 'all');

            // Process all items for filtering and sorting
            const processedItems = portfolioItems.map(item => {
                const itemCategories = item.getAttribute('data-categories').split(' ');
                const itemYear = parseInt(item.getAttribute('data-year'));
                
                // Calculate matches for sorting
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

            // Filter and sort items
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
            
            // Clear existing content
            portfolioGrid.innerHTML = '';
            
            // Add items in sorted order
            filtered.forEach(item => {
                portfolioGrid.appendChild(item);
                item.style.display = 'block';
            });
            
            // Hide non-matching items
            all.forEach(item => {
                if (!filtered.includes(item)) {
                    item.style.display = 'none';
                }
            });
            
            // Reinitialize lazy loading for visible items
            initLazyLoading(filtered);
        }

        // Set up filter event listeners
        function setupFilterButtons() {
            document.querySelectorAll('.filter-btn, .year-filter-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const isYearFilter = this.classList.contains('year-filter-btn');
                    const group = isYearFilter ? '.year-filter-btn' : '.filter-btn';
                    const allButton = document.querySelector(`${group}[data-${isYearFilter ? 'year' : 'category'}="all"]`);
                    const isAllButton = this === allButton;

                    // Toggle clicked button
                    this.classList.toggle('active');

                    if (isAllButton) {
                        // If "all" was clicked, deactivate all other buttons in group
                        document.querySelectorAll(`${group}:not([data-${isYearFilter ? 'year' : 'category'}="all"])`).forEach(btn => {
                            btn.classList.remove('active');
                        });
                    } else {
                        // If specific filter was clicked
                        // Deactivate "all" button if it was active
                        if (allButton.classList.contains('active')) {
                            allButton.classList.remove('active');
                        }

                        // Check if all specific filters are now selected
                        const specificButtons = document.querySelectorAll(`${group}:not([data-${isYearFilter ? 'year' : 'category'}="all"])`);
                        const allSpecificActive = Array.from(specificButtons).every(btn => btn.classList.contains('active'));

                        if (allSpecificActive) {
                            // If all specific filters are selected, activate "all" and deactivate others
                            specificButtons.forEach(btn => btn.classList.remove('active'));
                            allButton.classList.add('active');
                        }
                    }

                    // Update the grid
                    updateGrid();
                });
            });
        }

        // Initial setup
        updateGrid();
        setupFilterButtons();

        // Animate portfolio title and filters
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

// Optimized lazy loading function
function initLazyLoading(items) {
    // Cancel any pending lazy loads
    lazyLoadController.abort();
    lazyLoadController = new AbortController();

    // Get appropriate root margin based on screen size
    const rootMargin = window.innerWidth < 768 ? '100px' : '200px';

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target.querySelector('img') || entry.target;
                if (img.dataset.src) {
                    // Load the image
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    
                    // Add smooth appearance
                    img.style.transition = 'opacity 0.3s ease';
                    img.style.opacity = '0';
                    setTimeout(() => {
                        img.style.opacity = '1';
                    }, 10);
                }
                observer.unobserve(entry.target);
            }
        });
    }, {
        rootMargin: rootMargin,
        threshold: 0.01,
        signal: lazyLoadController.signal
    });

    // Sort items by distance to viewport (top to bottom)
    const sortedItems = [...items].sort((a, b) => {
        const aRect = a.getBoundingClientRect();
        const bRect = b.getBoundingClientRect();
        return aRect.top - bRect.top;
    });

    // Observe only items with unloaded images
    sortedItems.forEach(item => {
        const img = item.querySelector('img');
        if (img && img.hasAttribute('data-src')) {
            observer.observe(item);
        }
    });
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
        const scale = Math.min(widthRatio, heightRatio, 1);
        
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
    return document.createElement('canvas').toDataURL('image/avif').indexOf('data:image/avif') === 0;
}

async function createHeroCollage() {
    const collageContainer = document.querySelector('.hero-collage');
    
    try {
        const response = await fetch('data/portfolio.json');
        const portfolioData = await response.json();
        
        const optimizedImages = portfolioData.map(item => ({
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