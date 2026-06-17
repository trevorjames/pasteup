# Pasteup — Product Roadmap

A living roadmap for the Pasteup collage art studio. Update this as features ship or priorities shift.

## Phase 1 — Core editor (complete)

- [x] Next.js + Fabric.js canvas engine
- [x] NYPL Digital Collections search and image loading
- [x] Image proxy (CORS handling for external sources)
- [x] Select, move, resize, rotate
- [x] Crop tool (rectangular)
- [x] Circle crop tool (with live outline preview)
- [x] Lasso tool (freehand pixel extraction)
- [x] Extract / scissors tool
- [x] Tape tool (torn-edge effect)
- [x] Text tool (font choices: serif, sans, typewriter, handwritten)
- [x] Pencil draw tool (size + color)
- [x] Brush tool (size + color)
- [x] Layer ordering (bring to front/back, forward/backward)
- [x] Opacity, rotation, scale, flip controls
- [x] Blend modes
- [x] Undo / delete
- [x] Canvas format switching (8×10, 5×7, 18×24)
- [x] Download as PNG

## Tool ideas — backlog

Tools and refinements identified during development, not yet built.

- [ ] **Stitch tool** — decorative freehand "thread" line with perpendicular tick marks, mimicking hand-sewn seams. Drawn the same way as lasso (freehand drag), rendered as a dashed path with stitch marks at intervals. Could later support a functional mode that visually "sews" two overlapping pieces together at their seam.
- [ ] **Smudge tool** — pixel-level blending/smearing effect. Technically complex (requires reading and blending surrounding pixel colors via Canvas 2D), likely a Phase 3 item once core persistence is in place.
- [ ] Live image preview inside circle crop while dragging (currently shows outline only — Fabric clipPath rendering on temporary preview clones proved unreliable; revisit with a different rendering approach, e.g. offscreen canvas preview instead of a Fabric clone).
- [ ] Shape mask presets (diamond, arch, star) as quick one-click alternatives to freehand lasso.
- [ ] Eraser tool for brush/pencil strokes.
- [ ] Adjustable tape color/opacity in the properties panel (currently fixed aged-paper tone).

## Phase 2 — Persistence & sharing

- [ ] Supabase integration: `collages` table with `canvas_state jsonb` column
- [ ] Save / resume collages (auth required)
- [ ] Supabase Auth — user accounts
- [ ] Publish toggle — make a collage viewable via shareable public URL
- [ ] Collage gallery / "my collages" view

## Phase 3 — More image sources

- [ ] Smithsonian Open Access API integration
- [ ] Europeana API integration
- [ ] Unified search across all connected sources
- [ ] Source attribution display on exported/published collages

## Phase 4 — Print & export

- [ ] Server-side PDF export at 300 DPI (Puppeteer or equivalent headless render)
- [ ] Print-ready file generation per format (8×10, 5×7, 18×24)
- [ ] "Order a print" flow (print fulfillment partner integration — TBD)

## Phase 5 — Polish & growth

- [ ] Onboarding flow for first-time users
- [ ] Mobile-responsive editor (or mobile-specific simplified mode)
- [ ] Performance pass for canvases with many layered pieces
- [ ] Keyboard shortcuts reference / cheat sheet
- [ ] Export to additional formats (JPEG, print PDF variants)

---

*Last updated: reflects state as of this conversation. Update phase checkboxes and backlog as work progresses.*
