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
All 3D assets are by independent artists on Sketchfab under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Attribution appears on the site (Credits button, spec wall, finale and each component's panel) and here:

| Used for | Model | Author |
|---|---|---|
| Body, glass, lights, wheels, cabin | [2022 Volkswagen Virtus GT](https://sketchfab.com/3d-models/2022-volkswagen-virtus-gt-3955e5c050f843398b49b2b21ab2f232) | [BHP3D](https://sketchfab.com/BHP3D) |
| Engine block, head, valvetrain, timing chain, flywheel | [Car Engine](https://sketchfab.com/3d-models/car-engine-d440e8b6ec914b17b144a241ddbfa136) | [klaxoneer](https://sketchfab.com/klaxoneer) |
| Animated crank, rods, pistons | [Rigged 4-Cylinder Engine (FREE)](https://sketchfab.com/3d-models/rigged-4-cylinder-engine-free-e14ebe68273d49a3becda6802270b4b0) | [david.gnzlv](https://sketchfab.com/david.gnzlv) |
| Turbocharger | [Basic Turbo Charger](https://sketchfab.com/3d-models/basic-turbo-charger-414dd8615bb24b798807fd187cedfe73) | [Angus Whitburn](https://sketchfab.com/AngusWhitburn) |
| Gear cluster, differential, driveshafts, front struts | [Manual Transmission Gearbox With Differential](https://sketchfab.com/3d-models/manual-transmission-gearbox-with-differential-d48d46543d844857b31475e56f941410) | [avredu](https://sketchfab.com/avredu) |
| Front brake discs and calipers | [6- Lug Brake Rotor and Brembo brake calipers](https://sketchfab.com/3d-models/6-lug-brake-rotor-and-brembo-brake-calipers-ef37be6ddce44f49b6f616145c1e16af) | [DRIVER-FIRE](https://sketchfab.com/DRIVER-FIRE) |
| Rear silencer and tailpipes | [MUFFLER & EXHAUST](https://sketchfab.com/3d-models/muffler-exhaust-8e7403032ecb4ea49c590b3dc4aa5ebc) | [VR DESIGNER](https://sketchfab.com/vr.designer_09) |

Sound (Pixabay Content Licence): [Import car revs on Chassis Dyno with Turbo](https://pixabay.com/sound-effects/city-import-car-revs-on-chassis-dyno-with-turbo-66272/) by freesound_community.

Fonts: Barlow / Barlow Condensed (Jeremy Tribby) and IBM Plex Mono (IBM), SIL Open Font License. Volkswagen and Virtus are trademarks of Volkswagen AG; this is an unofficial fan project.

## Content
Specifications reflect the India-spec 2026 Virtus (11 variants, ₹10.71–19.20 lakh ex-showroom; 6 airbags standard; 205/55 R16 on all trims) as of September 2026. The 1.5 TSI GT Plus is the variant shown. Figures Volkswagen India does not publish (0–100 km/h, top speed) are marked “verify” on the site. A facelift with ADAS was spotted testing in April 2026 and had not launched at time of writing.
