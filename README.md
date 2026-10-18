# LMX+ website demo

Responsive black, red, and white demo inspired by the two supplied marketing materials.

## Run

```bash
npm install
npm run dev
```

Open http://localhost:3000. Use `PORT=3010 npm run dev` if port 3000 is occupied. `npm start` runs without file watching.

## Pages

- `/` — Home
- `/our-services` — Our Services
- `/our-services/home-renovations` — Home Renovations, with eight project galleries and interior/exterior filters
- `/our-services/landscaping-and-lawn` — Landscaping & Lawn
- `/our-services/demolition-junk-removal` — Demolition & Junk Removal
- `/our-services/flooring` — Flooring
- `/our-services/repairs-maintenance` — Repairs & Maintenance
- `/our-services/custom-projects` — Custom Projects
- `/our-services/auto-detailing` — Auto Detailing
- `/our-services/pest-rodent-control` — Pest & Rodent Control, with a matching illustration and no photo gallery
- `/our-services/snow-removal` — Snow Removal, with a Worcester Common winter header photo and matching illustration; gallery reserved for future photos
- `/about-us` — About Us
- `/client-testimonials` — Client Testimonials

The nine service pages appear under the Our Services dropdown. The home-page snow removal icon links directly to the Snow Removal page. The parent link opens the services overview; the arrow button opens the dropdown. Keyboard users can press Arrow Down on the arrow button to open and focus the first service, and Escape to close. The mobile navigation supports the same dropdown.

All website photos are local under `public/images/`, organized by service and project. `public/photos.json` lists the 64 renovation gallery paths, with originals stored in subfolders for basements, bathrooms and tile, deck refinishing, fences, interior work, patios and steps, roof decks, and exteriors. Project groupings and original filenames have been preserved. The supplied marketing artwork remains in `public/assets/` and is framed with CSS. Google Fonts provides Barlow and Barlow Condensed, with system fallbacks.

`public/service-photos.json` lists local service headers and 91 gallery photos: landscaping (55), demolition (12), repairs (4), custom projects (4), and auto detailing (16). Photos initially show in batches of 12 with a Show more button; the full-screen viewer includes the entire collection. Flooring has its own local copies of three tile photos from the renovation collection. Reviews and names on the testimonials page are carried over from the original site.

The snow removal header shows deep snow on Worcester Common in February 2015 (CC0 public domain). The pest control header shows candid warehouse treatment (Pexels License). Both files are local and neither requires an on-page credit; source details and license links are recorded in `public/assets/photo-credits.md`. Put future snow photos in `public/images/snow-removal/gallery/` and add their `/images/snow-removal/gallery/filename.jpg` paths to the `snow-removal.photos` array in `public/service-photos.json`; the gallery renders automatically when that array contains photos.

Photo galleries support previous/next buttons, arrow keys, Escape to close, photo counts, and links to locally stored originals. Estimate buttons lead to contact details and open email; there is no submission backend.

## Local photo archive

The migration downloaded 165 source images from Webador (about 126 MiB) without resizing or recompressing them. Including the archived snow header, its replacement, the pest header, and three shared tile copies, `public/images/` contains 171 photo files (about 128 MiB). Extra source cover images referenced in service metadata were preserved too. All service headers, project covers, gallery thumbnails, gallery originals, About Us, and Testimonials photos use local paths. No runtime photo request depends on Webador.

`media/photo-sources.json` records the original source URL, local path, byte count, and SHA-256 checksum of each migrated image. Original filenames are retained for easy identification. The manifest is for provenance and verification; it is not loaded by the website. Keep a backup of this checkout and its images when decommissioning Webador.

Run `npm run verify:photos` to check archived file checksums and all runtime photo paths. `scripts/localize-photos.cjs` retains the one-time downloader (`--download`) and URL migration (`--apply`) for reference, but those phases are already complete; use `--verify` for the migrated site. The legacy `import-service-photos.cjs` script refuses to overwrite local paths with hosted URLs.

`public/app.js` holds rendering and gallery behavior; `public/page-content.js` holds the remaining service descriptions and client reviews. `public/styles.css`, `public/expressive.css`, and `public/pages.css` hold responsive styles. Express serves the existing page paths and `/health`. Nothing has been published.

## Verification

Desktop (1440 px) and mobile (390 px) browser checks covered all 13 pages, local image loading, gallery navigation and pagination, filtering, dropdown behavior, keyboard controls, horizontal overflow, and JavaScript errors. External photo requests are blocked during the check, and every original in all eight renovation galleries is opened and decoded. The Pest & Rodent Control and Snow Removal pages are checked for their illustrations, service details, and absence of photo galleries. The home-page snow icon is checked for navigation to the new page. `scripts/verify-pages.cjs` is the complete local QA helper using the Playwright runtime available in this environment; `scripts/verify-demo.cjs` covers the initial three pages.

## Mockup-inspired visual redesign

`public/expressive.css` layers the red paint splashes, charcoal textures, chrome-style wordmark, circular service illustrations, and white textured band over the responsive layout. `public/assets/paint-grunge.png` was generated with the built-in image generation tool using the supplied mockup as a style reference. See `public/assets/paint-grunge-prompt.txt` for the complete prompt.
