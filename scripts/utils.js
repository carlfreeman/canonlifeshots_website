export function getCategoryName(category) {
    const categories = {
        'best': 'Лучшее',
        'street': 'Стрит',
        'nature': 'Природа',
        'concept': 'Концепт',
        'mono': 'Моно-ЧБ',
        'experiments': 'Эксперименты',
        'arch': 'Архитектура'
    };
    
    return categories[category] || category;
}

export function supportsAVIF() {
    return document.createElement('canvas').toDataURL('image/avif').indexOf('data:image/avif') === 0;
}