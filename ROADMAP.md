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
- [x] Image upload (client-side resize, 5MB limit, session storage)

## Tool ideas — backlog

Tools and refinements identified during development, not yet built.

- [ ] **Stitch tool** — decorative freehand "thread" line with perpendicular tick marks, mimicking hand-sewn seams. Drawn the same way as lasso (freehand drag), rendered as a dashed path with stitch marks at intervals. Could later support a functional mode that visually "sews" two overlapping pieces together at their seam.
- [ ] **Smudge tool** — pixel-level blending/smearing effect. Technically complex (requires reading and blending surrounding pixel colors via Canvas 2D), likely a Phase 3 item once core persistence is in place.
- [ ] Live image preview inside circle crop while dragging (currently shows outline only — Fabric clipPath rendering on temporary preview clones proved unreliable; revisit with a different rendering approach, e.g. offscreen canvas preview instead of a Fabric clone).
- [ ] Shape mask presets (diamond, arch, star) as quick one-click alternatives to freehand lasso.
- [ ] Eraser tool for brush/pencil strokes.
- [ ] Adjustable tape color/opacity in the properties panel (currently fixed aged-paper tone).

## Phase 2 — Persistence & sharing (complete)

- [x] Supabase integration: `collages` table with `canvas_state jsonb` column
- [x] Supabase Auth — user accounts (sign up, sign in, forgot password)
- [x] Save / resume collages
- [x] Preview thumbnail generation on save
- [x] My Collages gallery page
- [x] Open saved collage back into editor
- [x] Delete collage
- [ ] Supabase Storage for uploaded images (so uploads survive session)
- [ ] Publish toggle — make a collage viewable via shareable public URL
- [ ] **Public discovery gallery** — a browse-all page (e.g. `/gallery` or `/explore`) listing every collage where `published = true` and `show_in_gallery = true`, rendering `preview_url` thumbnails linked to each `/c/[id]`. Distinct from `/collages`, which is the user's *own* private saved-work gallery. Note: the `show_in_gallery` column and the publish-modal "Show in gallery" toggle already exist and write the flag, but **nothing reads it yet** — the gallery page, its query, and a Supabase RLS policy allowing anonymous reads of gallery rows still need to be built. Until then the toggle is a no-op.

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

## Tool ideas added since initial roadmap

- [ ] **X-Acto knife tool** — freehand line cut that splits an image into two independent pieces along the cut line. Simpler version: straight line only. Full version: freehand curved cut using Clipper.js for polygon boolean geometry.
- [ ] **Zoom tool** — scroll to zoom centered on cursor, +/- toolbar buttons, zoom % display, Cmd+0 to reset, spacebar to pan. Clamp between 25%-400%.
- [ ] **Moveable/dockable toolbar** — allow the floating canvas toolbar to be repositioned so it doesn't obstruct the full canvas view. Options: drag to reposition freely, or dock to left/right edge as a vertical toolbar.
- [ ] **Diffuser tool** — softens/feathers the edges of an image object so it blends into the canvas instead of sitting on a hard rectangular or cut edge. Adjustable feather radius (and optionally strength) in the properties panel. Most naturally implemented as a post-process on the offscreen canvas already used by the pixel-extraction helpers (`extractPieceAsPixels`, `extractCircle`, `applyRectCrop`): after drawing the piece, apply a feathered alpha mask — e.g. blur a copy of the piece's silhouette and composite it with `globalCompositeOperation = 'destination-in'`, or paint a transparent→opaque alpha gradient around the edges — then reload the result as a new Fabric image. Should work on any placed image as a "feather edges" action on the selected object, not just on freehand cuts.

## AI & Voice features (future phases)

- [ ] **Voice-activated AI composition** — user speaks commands like "cut out the bird" or "place the face on top of the landscape layer". Uses:
  - Web Speech API for voice-to-text (browser native)
  - Claude API to interpret the command and map it to canvas actions
  - Vision-based object segmentation (Meta SAM — Segment Anything Model, or Claude vision) to identify and outline the named object in the image automatically
  - Segmentation output feeds into existing extractPieceAsPixels for the actual cut
  - Could also handle layer commands ("bring to front", "make 50% transparent", "add sepia")
  - Longer term: "make a collage about summer in New York" generates a full composition suggestion from NYPL search results

- [ ] **AI object selection** — click an image and AI automatically detects and selects a specific object (person, animal, building) for extraction, without needing to manually lasso. Similar to Photoshop's "Select Subject" feature.

- [ ] **AI image search suggestions** — based on what's already on the canvas, AI suggests complementary NYPL search terms to find images that would work well together compositionally.

## Autosave

- [ ] **Autosave** — automatically save the collage every 2-3 minutes while the user is actively editing. Only fires if:
  - User is signed in (no account = nothing to save to)
  - Canvas has unsaved changes (`saved === false`)
  - User hasn't manually saved in the last 30 seconds (avoid double-saves)
  - Show a subtle "Autosaved" indicator in the topbar when it fires
  - On page unload/close, warn if there are unsaved changes ("You have unsaved changes — are you sure you want to leave?")
  - Local storage fallback — even for logged-out users, save canvas JSON to localStorage so work isn't lost on accidental refresh
