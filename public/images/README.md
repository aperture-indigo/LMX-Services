# Local website photos

Website URLs start with `/images/`. Photos retain the original downloaded quality and filenames. No Webador account or image host is required to serve this collection.

- `home-renovations/` — projects grouped into `basement/`, `bathroom-and-tile/`, `deck-refinishing/`, `fences/`, `interior-work/`, `patios-and-steps/`, `roof-decks/`, `exteriors/`, and a source `header/` cover.
- `landscaping-and-lawn/` — `header/`, `gallery/`, and `before-and-after/`.
- `demolition-junk-removal/` — `header/`, `gallery/`, and `cleanouts/`.
- `flooring/` — `header/` and `tile-work/`.
- `repairs-maintenance/` — `header/`, `hvac/`, and `gallery/`.
- `custom-projects/` — `header/` and `gallery/`.
- `auto-detailing/` — `header/`, `gallery/`, and `interiors/`.
- `snow-removal/` — `header/`; add a `gallery/` folder when project photos are available.
- `pest-rodent-control/` — `header/`; no project gallery yet.
- `about-us/` — the About Us photo.
- `testimonials/` — the Testimonials photo.

Snow Removal uses a Boston residential street winter photo. Pest & Rodent Control uses a candid treatment photo. Both use the Pexels License. Source and license details are in `public/assets/photo-credits.md`; both headers are served locally.

Gallery lists are in `public/photos.json` and `public/service-photos.json`. New photos should be added to the appropriate folder and referenced in those lists with a local `/images/...` path.

The original source URLs, file sizes, and checksums are recorded in the project's `media/photo-sources.json` manifest. Run `npm run verify:photos` from the project root to audit the collection.
