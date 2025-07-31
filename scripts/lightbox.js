export function openLightbox(item, allItems) {
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
    
    const placeholder = document.createElement('div');
    placeholder.className = 'image-placeholder';
    lightboxContent.appendChild(placeholder);
    const spinner = document.createElement('div');
    spinner.className = 'loading-spinner';
    lightboxContent.appendChild(spinner);
    const img = new Image();
    img.src = fullSizeSrc;
    img.onload = function() {
        spinner.remove();
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
        spinner.remove();
        lightboxCaption.textContent = 'Не удалось загрузить изображение';
    };

    // Initialize rating display
    const starsContainer = lightbox.querySelector('.stars');
    const ratingText = lightbox.querySelector('.rating-text');

    function updateRatingDisplay(average, count) {
      // Update stars
      const stars = starsContainer.querySelectorAll('span');
      stars.forEach((star, index) => {
        star.classList.toggle('active', index < Math.round(average));
      });
      
      // Update text
      ratingText.textContent = count > 0 
        ? `★${average.toFixed(1)} (${count} votes)` 
        : "No ratings yet";
    }

    // Initialize display
    updateRatingDisplay(item.votes?.average || 0, item.votes?.count || 0);

    // Handle voting
    starsContainer.addEventListener('click', async (e) => {
      const star = e.target.closest('[data-rating]');
      if (!star || !canVote(item.id)) return;
      
      const userRating = parseInt(star.dataset.rating);
      
      // Visual feedback
      highlightStars(userRating);
      markAsVoted(item.id);
      
      try {
        const response = await saveVote(item.id, userRating);
        if (response.success) {
          updateRatingDisplay(response.newAverage, response.newCount);
        }
      } catch (error) {
        console.error("Failed to save vote:", error);
      }
    });

    // Star hover effect
    starsContainer.addEventListener('mouseover', (e) => {
      const star = e.target.closest('[data-rating]');
      if (star && canVote(item.id)) {
        highlightStars(parseInt(star.dataset.rating));
      }
    });

    starsContainer.addEventListener('mouseout', () => {
      if (canVote(item.id)) {
        highlightStars(Math.round(item.votes?.average || 0));
      }
    });

    function highlightStars(count) {
      const stars = starsContainer.querySelectorAll('span');
      stars.forEach((star, index) => {
        star.classList.toggle('hover', index < count);
      });
    }

    // Voting helpers
    function canVote(itemId) {
      return !sessionStorage.getItem(`voted_${itemId}`);
    }

    function markAsVoted(itemId) {
      sessionStorage.setItem(`voted_${itemId}`, 'true');
    }

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

    async function saveVote(itemId, rating) {
      try {
        const response = await fetch('/api/save-vote', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            itemId,
            rating
          })
        });
        
        if (!response.ok) {
          throw new Error('Failed to save vote');
        }
        
        return await response.json();
      } catch (error) {
        console.error('Voting error:', error);
        return { success: false, error: error.message };
      }
    }
}