import { setupNavigation } from './navigation.js';
import { animateHero, createHeroCollage } from './hero.js';
import { loadPortfolio } from './portfolio.js';

// Редирект /blog/* → /#blog/*
if (window.location.pathname.startsWith('/blog/')) {
    const postId = window.location.pathname.split('/blog/')[1];
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