# Virtus Digital Showroom

Scroll-driven 3D journey through the Volkswagen Virtus. Vite + React + React Three Fiber, drei, postprocessing, GSAP, Lenis.

## Run
```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # static output in dist/ (deploy to Vercel / Netlify / any static host)
```

## Adding the real car model
The scene renders a procedural stand-in until a model exists at `public/models/virtus.glb`.

1. Download a Virtus model as glTF/GLB, e.g. [2022 Volkswagen Virtus GT by BHP3D](https://sketchfab.com/3d-models/2022-volkswagen-virtus-gt-3955e5c050f843398b49b2b21ab2f232) (CC BY 4.0 — credit the author on the site; for commercial use buy an official-grade model instead).
2. Save it as `public/models/virtus.glb` (if the download is a zip with `scene.gltf` + textures, run `npx gltf-transform copy scene.gltf public/models/virtus.glb` from inside the unzipped folder).
3. `npm run model:inspect` — prints node and material names.
4. Edit `src/data/modelConfig.js` so the `match` / `materialMatch` patterns pick out hood, doors, glass, wheels, lights and rear; set `rotation` so the nose points +X.
5. `npm run model:optimize` — Draco-compresses geometry and converts textures to WebP (keeps `virtus.source.glb` as backup).
6. Reload — the procedural shell is replaced automatically. The engine bay, gearbox, suspension and cabin fittings stay procedural and sit inside the real body.

## Layout
- `src/scene/builders.js` — all procedural geometry + the per-frame mechanical animation
- `src/scene/glbShell.js` — turns a loaded GLB into explodable "parts"
- `src/data/tracks.js` — scroll keyframes (camera + every animated value, 0–100 %)
- `src/data/hotspots.js` — hotspot copy and specs; `src/ui/overlayHtml.js` — chapter copy
- `legacy/virtus-procedural.html` — the original single-file version

## Deploy
Pushing to `main` builds the site and publishes `dist/` to GitHub Pages via `.github/workflows/deploy.yml`.

## Credits
3D model: ["2022 Volkswagen Virtus GT"](https://sketchfab.com/3d-models/2022-volkswagen-virtus-gt-3955e5c050f843398b49b2b21ab2f232) by [BHP3D](https://sketchfab.com/BHP3D), licensed under [CC BY 4.0](http://creativecommons.org/licenses/by/4.0/). Engine: ["Car Engine"](https://sketchfab.com/3d-models/car-engine-d440e8b6ec914b17b144a241ddbfa136) by [klaxoneer](https://sketchfab.com/klaxoneer), CC BY 4.0. Engine internals: ["Rigged 4-Cylinder Engine (FREE)"](https://sketchfab.com/3d-models/rigged-4-cylinder-engine-free-e14ebe68273d49a3becda6802270b4b0) by [david.gnzlv](https://sketchfab.com/david.gnzlv), CC BY 4.0. Volkswagen and Virtus are trademarks of Volkswagen AG; this is an unofficial fan project.
