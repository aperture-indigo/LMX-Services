// Import hosted photo URLs from downloaded original pages, without downloading photos.
const fs = require('node:fs');
if (fs.existsSync('public/service-photos.json') && fs.readFileSync('public/service-photos.json', 'utf8').includes('/images/')) {
  throw new Error('Photos have been migrated locally. Update public/service-photos.json with local paths; this legacy importer must not overwrite the local photo collection.');
}
const names = {
  'landscaping-and-lawn': 'landscaping',
  'demolition-junk-removal': 'demolition',
  'flooring': 'flooring',
  'repairs-maintenance': 'repairs',
  'custom-projects': 'custom',
  'auto-detailing': 'auto',
};
const result = {};
for (const [slug, file] of Object.entries(names)) {
  const html = fs.readFileSync(`/tmp/lmx-${file}.html`, 'utf8');
  const main = html.match(/<main\b[\s\S]*?<\/main>/)?.[0] || '';
  const images = [...main.matchAll(/<img\b[^>]*>/g)];
  const album = images.filter(([tag]) => tag.includes('jw-album-image__image'));
  result[slug] = {
    photos: [...new Set(album.map(([tag]) => tag.match(/\bsrc="([^"]+)"/)?.[1].split('?')[0]).filter(Boolean))],
    hero: images[0]?.[0].match(/\bsrc="([^"]+)"/)?.[1].split('?')[0] || null,
  };
}
fs.writeFileSync('public/service-photos.json', JSON.stringify(result, null, 2) + '\n');
console.log(Object.entries(result).map(([slug, data]) => `${slug}: ${data.photos.length} gallery photos`).join('\n'));
