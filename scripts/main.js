import { setupNavigation } from './navigation.js';
import { animateHero, createHeroCollage } from './hero.js';
import { loadPortfolio } from './portfolio.js';

document.addEventListener('DOMContentLoaded', function() {
    setupNavigation();
    
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