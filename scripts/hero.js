export function animateHero() {
    const heroTitle = document.querySelector('.hero__title');
    const heroSubtitle = document.querySelector('.hero__subtitle');
    
    setTimeout(() => {
        heroTitle.classList.add('fade-in');
    }, 50);
    
    setTimeout(() => {
        heroSubtitle.classList.add('fade-in', 'delay-1');
    }, 100);
}

export async function createHeroCollage() {
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