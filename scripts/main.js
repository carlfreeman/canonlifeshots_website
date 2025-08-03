import { setupNavigation } from './navigation.js';
import { animateHero, createHeroCollage } from './hero.js';
import { loadPortfolio } from './portfolio.js';

if (window.location.search.includes('blog=')) {
    const postId = new URLSearchParams(window.location.search).get('blog');
    window.location.href = `/#blog/${postId}`;
}

document.addEventListener('DOMContentLoaded', function() {
    setupNavigation();
    
    window.addEventListener('scroll', function() {
        const header = document.querySelector('.header');
        header.classList.toggle('scrolled', window.scrollY > 50);
    });
    
    animateHero();
    loadPortfolio();
    createHeroCollage();
});