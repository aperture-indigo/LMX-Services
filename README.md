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
- `/about-us` — About Us
- `/client-testimonials` — Client Testimonials

The seven service pages appear under the Our Services dropdown. The parent link opens the services overview; the arrow button opens the dropdown. Keyboard users can press Arrow Down on the arrow button to open and focus the first service, and Escape to close. The mobile navigation supports the same dropdown.

All 64 renovation photos use the existing remote URLs, listed in `public/photos.json`. They are grouped by the original filenames; confirm project boundaries before launch. The supplied marketing artwork is in `public/assets/` and framed with CSS. Google Fonts provides Barlow and Barlow Condensed, with system fallbacks.

`public/service-photos.json` adds 91 hosted gallery photos from the remaining original service pages: landscaping (55), demolition (12), repairs (4), custom projects (4), and auto detailing (16). Photos initially show in batches of 12 with a Show more button; the full-screen viewer includes the entire collection. The original flooring album is empty, so the flooring page explicitly presents three tile photos from the existing renovation collection. Reviews and names on the testimonials page are carried over from the original site.

Photo galleries support previous/next buttons, arrow keys, Escape to close, photo counts, and links to originals. Estimate buttons lead to contact details and open email; there is no submission backend.

`public/app.js` holds rendering and gallery behavior; `public/page-content.js` holds the remaining service descriptions and client reviews. `public/styles.css`, `public/expressive.css`, and `public/pages.css` hold responsive styles. Express serves the existing page paths and `/health`. Nothing has been published.

## Verification

Desktop (1440 px) and mobile (390 px) browser checks covered all 11 pages, hosted image loading, gallery navigation and pagination, filtering, dropdown behavior, keyboard controls, horizontal overflow, and JavaScript errors. `scripts/verify-pages.cjs` is the complete local QA helper using the Playwright runtime available in this environment; `scripts/verify-demo.cjs` covers the initial three pages.

## Mockup-inspired visual redesign

`public/expressive.css` layers the red paint splashes, charcoal textures, chrome-style wordmark, circular service illustrations, and white textured band over the responsive layout. `public/assets/paint-grunge.png` was generated with the built-in image generation tool using the supplied mockup as a style reference. See `public/assets/paint-grunge-prompt.txt` for the complete prompt.
