import json
import datetime
from pathlib import Path

# Конфигурация
SITE_URL = "https://little-can.vercel.app"
PORTFOLIO_JSON = "data/portfolio.json"
OUTPUT_FILE = "sitemap.xml"

# Загрузка данных портфолио
with open(PORTFOLIO_JSON, 'r', encoding='utf-8') as f:
    portfolio_data = json.load(f)

# Шаблоны XML с явным указанием кодировки UTF-8
xml_header = '<?xml version="1.0" encoding="UTF-8"?>\n'
urlset_open = '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n'
urlset_open += '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n'
urlset_close = '</urlset>'

url_template = """  <url>
    <loc>{url}</loc>
    <lastmod>{date}</lastmod>
    <changefreq>weekly</changefreq>
    {images}
  </url>"""

image_template = """    <image:image>
      <image:loc>{image_url}</image:loc>
      <image:title>{title}</image:title>
      <image:caption>{caption}</image:caption>
    </image:image>"""

# Генерация содержимого
today = datetime.datetime.now().strftime("%Y-%m-%d")
base_url = f"{SITE_URL}/"

urls = []
for item in portfolio_data:
    images_tags = []
    
    # Оригинальное изображение
    original_img = f"{SITE_URL}/images/original/{item['id']}.webp"
    images_tags.append(image_template.format(
        image_url=original_img,
        title=item['title'],
        caption=item.get('description', '')
    ))
    
    # Оптимизированная версия (AVIF)
    optimized_img = f"{SITE_URL}/images/optimized/{item['id']}.avif"
    images_tags.append(image_template.format(
        image_url=optimized_img,
        title=f"Миниатюра: {item['title']}",
        caption=item.get('description', '')
    ))
    
    url_entry = url_template.format(
        url=f"{base_url}",
        date=today,
        images="\n".join(images_tags)
    )
    urls.append(url_entry)

# Собираем итоговый XML
sitemap_content = xml_header + urlset_open + "\n".join(urls) + "\n" + urlset_close

# Сохраняем с указанием кодировки UTF-8
with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
    f.write(sitemap_content)

print(f"Sitemap успешно сгенерирован: {OUTPUT_FILE}")