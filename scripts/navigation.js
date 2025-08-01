import { loadPortfolio } from './portfolio.js';

export function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav__link');
    const sections = document.querySelectorAll('.section');
    
    navLinks.forEach(link => {
        link.addEventListener('click', async function(e) {
            if (this.getAttribute('href') === '#blog') {
                // При переходе в блог закрываем открытый пост
                closeBlogPost();
            }
            e.preventDefault();
            
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            
            sections.forEach(section => {
                section.classList.remove('active');
            });
            
            const targetSection = document.querySelector(this.getAttribute('href'));
            if (targetSection) {
                targetSection.classList.add('active');
                
                if (targetSection.id === 'blog') {
                    try {
                        const { initBlog, renderBlogPosts } = await import('./blog.js');
                        
                        if (!window.blogInitialized) {
                            await initBlog();
                            window.blogInitialized = true;
                        }
                        
                        if (document.querySelectorAll('.blog-card').length === 0) {
                            renderBlogPosts();
                        }
                    } catch (error) {
                        console.error('Ошибка загрузки блога:', error);
                    }
                }
            }
        });
    });
    
    handleInitialNavigation();
}

function handleInitialNavigation() {
    const hash = window.location.hash;
    const targetLink = hash 
        ? document.querySelector(`.nav__link[href="${hash}"]`)
        : document.querySelector('.nav__link[href="#home"]');
        
    if (targetLink) {
        targetLink.click();
    }
}

export function smoothSectionTransitions() {
    document.querySelectorAll('.nav__link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetSection = document.querySelector(link.getAttribute('href'));
            
            document.querySelectorAll('.section').forEach(section => {
                section.style.opacity = '0';
                section.style.transform = 'translateY(20px)';
                section.classList.remove('active');
            });
            
            setTimeout(() => {
                targetSection.classList.add('active');
                targetSection.style.opacity = '1';
                targetSection.style.transform = 'translateY(0)';
            }, 300);
        });
    });
}

export function setupDynamicTitle() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const section = entry.target.id;
                document.title = `${section === 'home' ? 'LC | М.Литвак' : `LC | ${section.charAt(0).toUpperCase() + section.slice(1)}`}`;
            }
        });
    }, { threshold: 0.5 });

    document.querySelectorAll('section').forEach(section => {
        observer.observe(section);
    });
}