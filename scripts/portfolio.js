import { openLightbox } from './lightbox.js';
import { getCategoryName, supportsAVIF } from './utils.js';

let lazyLoadController = new AbortController();

export async function loadPortfolio() {
    const portfolioGrid = document.querySelector('.portfolio-grid');
    if (portfolioGrid.innerHTML !== '') return;

    try {
        const response = await fetch('data/portfolio.json');
        const portfolioData = await response.json();

        portfolioGrid.innerHTML = '';

        const years = [...new Set(portfolioData.map(item => item.year))].sort((a, b) => b - a);
        const yearFiltersContainer = document.querySelector('.portfolio-year-filters');

        document.querySelectorAll('.year-filter-btn:not([data-year="all"])').forEach(btn => btn.remove());

        years.forEach(year => {
            const yearBtn = document.createElement('button');
            yearBtn.className = 'year-filter-btn';
            yearBtn.setAttribute('data-year', year);
            yearBtn.textContent = year;
            yearFiltersContainer.insertBefore(yearBtn, yearFiltersContainer.lastElementChild);
        });

        const portfolioItems = portfolioData.map((item, index) => {
            const portfolioItem = document.createElement('div');
            portfolioItem.className = 'portfolio-item';
            portfolioItem.innerHTML = `
                <img data-src="images/optimized/${item.id}.avif" alt="${item.title}" loading="lazy">
                <div class="loading-spinner-container">
                    <div class="loading-spinner"></div>
                    <div class="loading-text">Загрузка</div>
                </div>
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
                    if (b.matches !== a.matches) return b.matches - a.matches;
                    return b.year - a.year;
                });

            return {
                filtered: filteredItems.map(item => item.element),
                all: portfolioItems
            };
        }

        function updateGrid() {
            const { filtered, all } = applyFiltersAndSort();
            
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
          const spinnerContainer = item.querySelector('.loading-spinner-container');
          
          if (img && img.dataset.src) {
            spinnerContainer.classList.add('active');
            
            img.onload = function() {
              spinnerContainer.classList.remove('active');
              img.style.opacity = '0';
              setTimeout(() => {
                img.style.opacity = '1';
              }, 10);
            };
            
            img.onerror = function() {
              spinnerContainer.querySelector('.loading-text').textContent = 'Ошибка загрузки';
              setTimeout(() => {
                spinnerContainer.classList.remove('active');
              }, 2000);
            };
            
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
          }
          loadObserver.unobserve(entry.target);
        }
      });
    }, { rootMargin: '200px' });

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