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

let currentCategory = 'all';
let loadingQueue = [];
let isProcessingQueue = false;

async function loadPortfolio() {
    const portfolioGrid = document.querySelector('.portfolio-grid');
    const response = await fetch('data/portfolio.json');
    const portfolioData = await response.json();
    
    // Очищаем сетку и создаем элементы без изображений
    portfolioGrid.innerHTML = '';
    
    portfolioData.forEach((item, index) => {
        const portfolioItem = document.createElement('div');
        portfolioItem.className = `portfolio-item ${item.categories.join(' ')}`;
        portfolioItem.setAttribute('data-categories', item.categories.join(' '));
        portfolioItem.setAttribute('data-id', item.id);
        
        // Создаем контейнер для изображения
        portfolioItem.innerHTML = `
            <div class="image-container"></div>
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
        
        portfolioGrid.appendChild(portfolioItem);
    });
    
    // Инициализируем очередь загрузки
    initLoadingQueue();
}

function initLoadingQueue() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const item = entry.target;
                const itemId = item.getAttribute('data-id');
                const categories = item.getAttribute('data-categories').split(' ');
                
                if (currentCategory === 'all' || categories.includes(currentCategory)) {
                    addToLoadingQueue(item, itemId);
                }
                observer.unobserve(item);
            }
        });
    }, { threshold: 0.1 });
    
    document.querySelectorAll('.portfolio-item').forEach(item => {
        observer.observe(item);
    });
}

function addToLoadingQueue(item, itemId) {
    loadingQueue.push({ item, itemId });
    if (!isProcessingQueue) {
        processLoadingQueue();
    }
}

async function processLoadingQueue() {
    if (loadingQueue.length === 0) {
        isProcessingQueue = false;
        return;
    }
    
    isProcessingQueue = true;
    const { item, itemId } = loadingQueue.shift();
    
    // Проверяем видимость элемента перед загрузкой
    if (isElementInViewport(item)) {
        const imageContainer = item.querySelector('.image-container');
        const imageExt = supportsAVIF() ? 'avif' : 'jpg';
        const img = new Image();
        
        img.src = `images/optimized/${itemId}.${imageExt}`;
        img.alt = item.querySelector('.portfolio-item__title').textContent;
        img.loading = 'lazy';
        img.classList.add('fade-in');
        
        img.onload = () => {
            imageContainer.innerHTML = '';
            imageContainer.appendChild(img);
            setTimeout(() => {
                img.style.opacity = 1;
            }, 100);
        };
        
        // img.onerror = () => {
        //     if (imageExt === 'avif') {
        //         img.src = `images/optimized/${itemId}_thumb.jpg`;
        //     }
        // };
    }
    
    // Обрабатываем следующее изображение с небольшой задержкой
    setTimeout(processLoadingQueue, 300);
}

function isElementInViewport(el) {
    const rect = el.getBoundingClientRect();
    return (
        rect.top <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.bottom >= 0
    );
}

// Инициализация фильтров (вызывается при загрузке страницы)
function initFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Удаляем активный класс у всех кнопок
            filterButtons.forEach(btn => btn.classList.remove('active'));
            
            // Добавляем активный класс текущей кнопке
            this.classList.add('active');
            
            // Получаем выбранную категорию
            const category = this.getAttribute('data-category');
            
            // Применяем фильтр с новой логикой
            applyCategoryFilter(category);
            
            // Прокрутка к началу галереи для лучшего UX
            document.querySelector('#portfolio').scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        });
    });
    
    // Инициализируем фильтр "Все" по умолчанию
    document.querySelector('.filter-btn[data-category="all"]').click();
}

// Обновленная функция фильтрации
function applyCategoryFilter(category) {
    // Обновляем текущую категорию
    currentCategory = category;
    
    // Очищаем текущую очередь загрузки
    loadingQueue = [];
    
    // Получаем все элементы галереи
    const portfolioItems = document.querySelectorAll('.portfolio-item');
    let hasVisibleItems = false;
    
    portfolioItems.forEach(item => {
        const categories = item.getAttribute('data-categories').split(' ');
        const isVisible = category === 'all' || categories.includes(category);
        
        // Устанавливаем видимость элемента
        item.style.display = isVisible ? 'block' : 'none';
        
        if (isVisible) {
            hasVisibleItems = true;
            
            // Если элемент видим и в области просмотра - добавляем в очередь загрузки
            if (isElementInViewport(item)) {
                const itemId = item.getAttribute('data-id');
                
                // Проверяем, не загружено ли уже изображение
                if (!item.querySelector('img')) {
                    addToLoadingQueue(item, itemId);
                }
            }
        } else {
            // Для скрытых элементов можно выгрузить изображения (опционально)
            const imgContainer = item.querySelector('.image-container');
            if (imgContainer) imgContainer.innerHTML = '';
        }
    });
    
    // Если нет видимых элементов - показываем сообщение
    const emptyMessage = document.querySelector('.portfolio-empty-message');
    if (!hasVisibleItems) {
        if (!emptyMessage) {
            const message = document.createElement('div');
            message.className = 'portfolio-empty-message';
            message.textContent = 'В этой категории пока нет работ';
            document.querySelector('.portfolio-grid').appendChild(message);
        }
    } else if (emptyMessage) {
        emptyMessage.remove();
    }
    
    // Запускаем обработку очереди, если она не активна
    if (!isProcessingQueue) {
        processLoadingQueue();
    }
}

// async function loadBlog() {
//     const blogPostsContainer = document.querySelector('.blog-posts');
//     if (blogPostsContainer.innerHTML !== '') return;
    
//     try {
//         // In a real implementation, you would fetch this from a JSON file or API
//         const blogData = [
//             {
//                 id: 1,
//                 title: "Искусство видеть",
//                 date: "15 мая 2023",
//                 excerpt: "Размышления о том, как научиться видеть необычное в обычном и замечать моменты, которые становятся искусством.",
//                 content: "Полное содержание поста..."
//             },
//             {
//                 id: 2,
//                 title: "Чёрно-белое восприятие",
//                 date: "2 апреля 2023",
//                 excerpt: "Почему чёрно-белая фотография часто оказывается более выразительной, чем цветная?",
//                 content: "Полное содержание поста..."
//             }
//         ];
        
//         blogPostsContainer.innerHTML = '';
        
//         blogData.forEach((post, index) => {
//             const postElement = document.createElement('article');
//             postElement.className = 'blog-post';
//             postElement.style.animationDelay = `${index * 0.1}s`;
//             postElement.classList.add('fade-in');
            
//             postElement.innerHTML = `
//                 <h3 class="blog-post__title">${post.title}</h3>
//                 <p class="blog-post__date">${post.date}</p>
//                 <p class="blog-post__excerpt">${post.excerpt}</p>
//                 <a href="#" class="blog-post__link" data-post-id="${post.id}">Читать далее</a>
//             `;
            
//             blogPostsContainer.appendChild(postElement);
//         });
        
//         // Animate blog title
//         const blogTitle = document.querySelector('.blog-title');
//         setTimeout(() => {
//             blogTitle.classList.add('fade-in');
//         }, 300);
        
//     } catch (error) {
//         console.error('Error loading blog:', error);
//         blogPostsContainer.innerHTML = '<p>Не удалось загрузить блог. Пожалуйста, попробуйте позже.</p>';
//     }
// }

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
    loadPortfolio();
    initFilters();
    // Обновляем при изменении размера окна
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            createHeroCollage();
        }
    });
});