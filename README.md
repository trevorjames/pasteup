# Pasteup — Collage Art Studio

Create collage art from public domain imagery. Cut, layer, and compose using thousands of open-source works from NYPL, Smithsonian, and Europeana.

## Stack

- **Next.js 15** — App Router, API routes for image proxy + NYPL search
- **Fabric.js 6** — Canvas engine: move, scale, rotate, crop, lasso mask, slice
- **Tailwind CSS** — Styling
- **Supabase** — Database (Phase 3), Storage, Auth

## Getting started

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000/editor](http://localhost:3000/editor).

The editor works immediately with mock NYPL results. To get real images:

1. Request an API token at https://digitalcollections.nypl.org/developers/credentials
2. Add it to `.env.local` as `NYPL_API_TOKEN=your_token_here`

## Project structure

```
src/
  app/
    editor/page.tsx          # Main editor page
    api/
      nypl/search/route.ts   # NYPL search proxy
      image-proxy/route.ts   # CORS proxy for canvas image loading
  components/
    canvas/
      CollageCanvas.tsx      # Fabric.js canvas + all tool logic
      CanvasToolbar.tsx      # Tool mode switcher
    panels/
      ImageLibraryPanel.tsx  # Left panel: search + image grid
      PropertiesPanel.tsx    # Right panel: transform, filters, export
  lib/
    fabricUtils.ts           # Crop, lasso mask, slice, serialize helpers
    nypl.ts                  # NYPL API client
  types/
    index.ts                 # Shared types + canvas format constants
```

## Canvas tools

| Tool | What it does |
|------|-------------|
| Select | Move, resize, rotate any object |
| Crop (rect) | Draw a rectangle — image is masked to that area |
| Lasso | Draw freehand around the area you want to keep |
| Slice | Select an image, draw a line — splits into two pieces |
| Text | Add text elements |
| Draw | Freehand drawing on the canvas |

## Build phases

- [x] **Phase 1** — Canvas engine + NYPL search + core cutting tools
- [ ] **Phase 2** — Full cutting tool polish (Clipper.js for true polygon slicing)
- [ ] **Phase 3** — Supabase persistence (`collages` table, `canvas_state jsonb`)
- [ ] **Phase 4** — Additional image sources (Smithsonian, Europeana)
- [ ] **Phase 5** — Auth + publishing + shareable URLs
- [ ] **Phase 6** — Print PDF export (Puppeteer server-side render at 300 DPI)

## Supabase schema (Phase 3)

```sql
create table collages (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users,
  name        text not null default 'Untitled collage',
  format_id   text not null default '8x10',
  canvas_json jsonb not null,
  preview_url text,
  published   boolean not null default false,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create index on collages (user_id);
create index on collages (published) where published = true;
```
