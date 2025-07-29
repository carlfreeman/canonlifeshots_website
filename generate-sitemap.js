// generate-sitemap.js
const fs = require('fs');
const pages = ['', 'portfolio'];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${pages.map(page => `
    <url>
      <loc>https://вашсайт.com/${page}</loc>
      <lastmod>${new Date().toISOString()}</lastmod>
      <changefreq>weekly</changefreq>
      <priority>${page === '' ? 1.0 : 0.8}</priority>
    </url>
  `).join('')}
</urlset>`;

fs.writeFileSync('public/sitemap.xml', sitemap);