import { setupNavigation } from './navigation.js';
import { animateHero, createHeroCollage } from './hero.js';
import { loadPortfolio } from './portfolio.js';

document.addEventListener('DOMContentLoaded', function() {
    setupNavigation();
    if (!window.location.hash.startsWith('#blog/')) {
        document.querySelector('.nav__link[href="#home"]').click();
    }
    
    window.addEventListener('scroll', function() {
        const header = document.querySelector('.header');
        header.classList.toggle('scrolled', window.scrollY > 50);
    });
    
    animateHero();
    loadPortfolio();
    createHeroCollage();
});