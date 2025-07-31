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

async function saveVote(itemId, rating) {
  const response = await fetch('save_vote.php', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      itemId,
      rating
    })
  });
  return await response.json();
}