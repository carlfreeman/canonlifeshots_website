export function openLightbox(item, allItems) {
    const lightbox = document.querySelector('.lightbox');
    const lightboxContent = document.querySelector('.lightbox__content');
    const lightboxImg = document.querySelector('.lightbox__image');
    const lightboxCaption = document.querySelector('.lightbox__caption');

    const spinnerHTML = `
    <div class="loading-spinner-container active">
      <div class="loading-spinner"></div>
      <div class="loading-text">Загрузка</div>
    </div>
    `;
    lightboxContent.insertAdjacentHTML('beforeend', spinnerHTML);
    const spinnerContainer = lightboxContent.querySelector('.loading-spinner-container');

    
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
    const img = new Image();
    img.src = fullSizeSrc;
    img.onload = function() {
        spinnerContainer.classList.remove('active');
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
        spinnerContainer.querySelector('.loading-text').textContent = 'Ошибка загрузки';
        setTimeout(() => {
          spinnerContainer.remove();
        }, 2000);
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
}