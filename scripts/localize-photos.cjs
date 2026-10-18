// One-time photo migration. Downloads must all succeed before application URLs change.
// Run with --download to collect originals, --apply to switch URLs, or --verify to audit.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {createHash} = require('node:crypto');
const {spawn} = require('node:child_process');
const root = path.resolve(__dirname, '..');
const publicRoot = path.join(root, 'public');
const manifestPath = path.join(root, 'media', 'photo-sources.json');
const read = file => fs.readFileSync(path.join(publicRoot, file), 'utf8');
const write = (file, value) => fs.writeFileSync(path.join(publicRoot, file), value);
const sha = buffer => createHash('sha256').update(buffer).digest('hex');
const localFile = url => {
  if (!url.startsWith('/images/') || url.includes('..')) throw Error(`Invalid image path: ${url}`);
  return path.join(publicRoot, url);
};
function isImage(buffer) {
  return buffer.length > 100 && (
    buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff])) ||
    buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) ||
    (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') ||
    buffer.toString('ascii', 0, 3) === 'GIF'
  );
}
function renovationFolder(filename) {
  if (/basement-renovation/.test(filename)) return 'basement';
  if (/bathroom|shower/.test(filename)) return 'bathroom-and-tile';
  if (/deck-refinish/.test(filename)) return 'deck-refinishing';
  if (/fence/.test(filename)) return 'fences';
  if (/interior-work/.test(filename)) return 'interior-work';
  if (/patio|steps/.test(filename)) return 'patios-and-steps';
  if (/roof-deck/.test(filename)) return 'roof-decks';
  return 'exteriors';
}
function serviceFolder(slug, filename) {
  if (slug === 'landscaping-and-lawn') return /before|after|bushes|nushes|flowerbed/.test(filename) ? 'before-and-after' : 'gallery';
  if (slug === 'auto-detailing') return /car-interior/.test(filename) ? 'interiors' : 'gallery';
  if (slug === 'demolition-junk-removal') return /cleanout/.test(filename) ? 'cleanouts' : 'gallery';
  if (slug === 'repairs-maintenance') return /hvac/.test(filename) ? 'hvac' : 'gallery';
  return 'gallery';
}
function plan() {
  const app = read('app.js');
  if (!app.includes("const base='https://primary.jwwb.nl/")) throw Error('Runtime already migrated. Use --verify to audit local photos.');
  const context = vm.createContext({});
  vm.runInContext(app.slice(0, app.indexOf('const dialog=')) + '\nglobalThis.inventory={base,projectSpecs,services};', context);
  const {base, projectSpecs, services} = context.inventory;
  const photos = JSON.parse(read('photos.json'));
  const servicePhotos = JSON.parse(read('service-photos.json'));
  const entries = new Map();
  const destinations = new Set();
  function register(source, folder) {
    if (!source.startsWith('https://')) return source;
    source = source.split('?')[0];
    if (entries.has(source)) return entries.get(source).path;
    const filename = path.posix.basename(new URL(source).pathname);
    const destination = `/images/${folder}/${filename}`;
    if (destinations.has(destination)) throw Error(`Filename collision: ${destination}`);
    destinations.add(destination);
    entries.set(source, {source, path: destination});
    return destination;
  }
  for (const source of photos) register(source, `home-renovations/${renovationFolder(path.posix.basename(source))}`);
  for (const [slug, media] of Object.entries(servicePhotos)) {
    if (media.hero) register(media.hero, `${slug}/header`);
    for (const source of media.photos) register(source, `${slug}/${serviceFolder(slug, path.posix.basename(source))}`);
  }
  for (const spec of projectSpecs) {
    const filename = `${spec[4]}-high.jpg`;
    register(base + filename, `home-renovations/${renovationFolder(filename)}`);
  }
  for (const match of app.matchAll(/photo\('([^']+)'\)/g)) {
    const filename = `${match[1]}-high.jpg`;
    register(base + filename, `home-renovations/${renovationFolder(filename)}`);
  }
  // The service metadata includes two additional cover photos; preserve those too.
  for (const service of services) if (service[3]) register(base + service[3], `${service[1]}/header`);
  for (const match of app.matchAll(/https:\/\/primary\.jwwb\.nl\/[^"'`\s<>]+/g)) {
    const source = match[0].split('?')[0];
    if (/\.(?:jpg|jpeg|png|webp)$/.test(source)) register(source, 'about-us');
  }
  register(base + 'gazebo-high-b58is5.jpg', 'testimonials');
  return {app, photos, servicePhotos, base, projectSpecs, services, entries};
}
function curl(source, destination) {
  return new Promise((resolve, reject) => {
    const child = spawn('curl', ['--fail', '--location', '--retry', '3', '--retry-delay', '1', '--connect-timeout', '20', '--max-time', '180', '--silent', '--show-error', '--output', destination, source]);
    let error = '';
    child.stderr.on('data', chunk => { error += chunk; });
    child.on('error', reject);
    child.on('close', code => code === 0 ? resolve() : reject(Error(`${source}: ${error.trim() || `curl exit ${code}`}`)));
  });
}
async function download() {
  const {entries} = plan();
  const queue = [...entries.values()];
  const failures = [];
  let completed = 0;
  async function worker() {
    for (let entry; (entry = queue.shift());) {
      try {
        const destination = localFile(entry.path);
        fs.mkdirSync(path.dirname(destination), {recursive: true});
        if (!fs.existsSync(destination)) {
          const temporary = destination + '.download';
          await curl(entry.source, temporary);
          if (!isImage(fs.readFileSync(temporary))) throw Error(`Not an image: ${entry.source}`);
          fs.renameSync(temporary, destination);
        }
        const buffer = fs.readFileSync(destination);
        if (!isImage(buffer)) throw Error(`Invalid image: ${destination}`);
        Object.assign(entry, {bytes: buffer.length, sha256: sha(buffer)});
        completed++;
        if (completed % 20 === 0 || completed === entries.size) console.log(`Downloaded ${completed}/${entries.size} photos`);
      } catch (error) { failures.push(error.message); }
    }
  }
  await Promise.all(Array.from({length: 4}, worker));
  if (failures.length) throw Error(`Application URLs have not been changed. Retry --download after resolving:\n${failures.join('\n')}`);
  fs.mkdirSync(path.dirname(manifestPath), {recursive: true});
  fs.writeFileSync(manifestPath, JSON.stringify({downloadedAt: new Date().toISOString(), files: [...entries.values()]}, null, 2) + '\n');
  const total = [...entries.values()].reduce((sum, entry) => sum + entry.bytes, 0);
  console.log(`Saved ${entries.size} source photos (${(total / 1048576).toFixed(1)} MiB). Runtime URLs are unchanged until --apply.`);
}
function verify() {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  let bytes = 0;
  for (const entry of manifest.files) {
    const buffer = fs.readFileSync(localFile(entry.path));
    if (!isImage(buffer) || buffer.length !== entry.bytes || sha(buffer) !== entry.sha256) throw Error(`Photo failed verification: ${entry.path}`);
    bytes += buffer.length;
  }
  console.log(`Verified ${manifest.files.length} files and SHA-256 checksums (${(bytes / 1048576).toFixed(1)} MiB).`);
  if (manifest.appliedAt) {
    const app = read('app.js');
    if (app.includes('primary.jwwb.nl')) throw Error('Runtime still depends on Webador');
    const galleries = JSON.parse(read('photos.json'));
    const serviceMedia = Object.values(JSON.parse(read('service-photos.json')));
    const references = new Set([
      ...galleries,
      ...serviceMedia.flatMap(media => [media.hero, ...media.photos]).filter(Boolean),
      ...[...app.matchAll(/["'](\/images\/[^"'<>`]+)["']/g)].map(match => match[1]),
    ]);
    for (const url of references) {
      if (!isImage(fs.readFileSync(localFile(url)))) throw Error(`Invalid runtime image: ${url}`);
    }
    console.log(`Verified ${references.size} unique runtime photo paths are local and readable.`);
  }
  return manifest;
}
function apply() {
  const manifest = verify();
  const inventory = plan();
  const paths = new Map(manifest.files.map(entry => [entry.source, entry.path]));
  const resolve = source => {
    if (source.startsWith('/')) return source;
    const destination = paths.get(source.split('?')[0]);
    if (!destination) throw Error(`Photo not downloaded: ${source}`);
    return destination;
  };
  const photos = inventory.photos.map(resolve);
  const servicePhotos = JSON.parse(JSON.stringify(inventory.servicePhotos));
  for (const media of Object.values(servicePhotos)) {
    media.photos = media.photos.map(resolve);
    if (media.hero) media.hero = resolve(media.hero);
  }
  // Keep a service-owned copy of the three shared tile photos for the flooring page.
  servicePhotos.flooring.photos = photos.filter(url => url.includes('bathroom-tile')).map(source => {
    const destination = '/images/flooring/tile-work/' + path.posix.basename(source);
    fs.mkdirSync(path.dirname(localFile(destination)), {recursive: true});
    fs.copyFileSync(localFile(source), localFile(destination));
    return destination;
  });
  const snow = '/images/snow-removal/header/pickup-plowing-snow.jpg';
  fs.mkdirSync(path.dirname(localFile(snow)), {recursive: true});
  fs.copyFileSync(path.join(publicRoot, servicePhotos['snow-removal'].hero), localFile(snow));
  servicePhotos['snow-removal'].hero = snow;
  const projectSpecs = inventory.projectSpecs.map(spec => [...spec.slice(0, 4), resolve(inventory.base + spec[4] + '-high.jpg')]);
  const services = inventory.services.map(service => service.map((value, i) => i === 3 && value ? resolve(inventory.base + value) : value));
  let app = inventory.app
    .replace(/^const base=.*\nconst photo=.*\n/, '')
    .replace(/const services=\[[\s\S]*?\n\];/, `const services=${JSON.stringify(services, null, 1)};`)
    .replace(/const projectSpecs=\[[^\n]+;/, `const projectSpecs=${JSON.stringify(projectSpecs)};`)
    .replace(/photo\('([^']+)'\)/g, (_, name) => JSON.stringify(resolve(inventory.base + name + '-high.jpg')))
    .replace(/\$\{"(\/images\/[^\"]+)"\}/g, '$1')
    .replace('cover:photo(cover)', 'cover')
    .replace('${base}gazebo-high-b58is5.jpg?width=1000', resolve(inventory.base + 'gazebo-high-b58is5.jpg'))
    .replace(/https:\/\/primary\.jwwb\.nl\/[^"'`\s<>]+/g, source => resolve(source))
    .replace('?width=650', '').replace('?width=800', '')
    .replace(" if(slug==='flooring')media[slug].photos=photos.filter(url=>url.includes('bathroom-tile'));\n", '');
  if (app.includes('primary.jwwb.nl') || app.includes('${base}') || /\bphoto\(/.test(app)) throw Error('Unconverted photo reference in app.js');
  // Audit the generated code before replacing the live file.
  new vm.Script(app, {filename: 'app.js'});
  write('app.js', app);
  write('photos.json', JSON.stringify(photos, null, 2) + '\n');
  write('service-photos.json', JSON.stringify(servicePhotos, null, 2) + '\n');
  write('index.html', read('index.html').replace('<link rel="preconnect" href="https://primary.jwwb.nl">\n', ''));
  for (const local of [snow, ...servicePhotos.flooring.photos]) {
    const buffer = fs.readFileSync(localFile(local));
    manifest.files.push({source: local === snow ? '/assets/snow-removal-hero.jpg' : photos.find(url => path.posix.basename(url) === path.posix.basename(local)), path: local, bytes: buffer.length, sha256: sha(buffer), copiedLocally: true});
  }
  manifest.appliedAt = new Date().toISOString();
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  console.log('All runtime photo references now use local service folders.');
}
const mode = process.argv[2];
Promise.resolve().then(() => {
  if (mode === '--download') return download();
  if (mode === '--apply') return apply();
  if (mode === '--verify') return verify();
  throw Error('Use --download, --apply, or --verify');
}).catch(error => {console.error(error.message); process.exitCode = 1;});
