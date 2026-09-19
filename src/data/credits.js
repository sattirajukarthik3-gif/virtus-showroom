/* Single source of truth for attribution. Every 3D asset is CC BY 4.0 from Sketchfab — the licence requires
   the author to be credited wherever the work is shown, so these feed the spec wall, the finale, every
   hotspot panel, the Credits button and the README. Authors and titles are copied from each model's license.txt. */
export const LICENSE = { name: 'CC BY 4.0', url: 'https://creativecommons.org/licenses/by/4.0/' };

export const MODELS = {
  car:     { title: '2022 Volkswagen Virtus GT', author: 'BHP3D', authorUrl: 'https://sketchfab.com/BHP3D', url: 'https://sketchfab.com/3d-models/2022-volkswagen-virtus-gt-3955e5c050f843398b49b2b21ab2f232', used: 'Body, glass, lights, wheels and the complete cabin' },
  engine:  { title: 'Car Engine', author: 'klaxoneer', authorUrl: 'https://sketchfab.com/klaxoneer', url: 'https://sketchfab.com/3d-models/car-engine-d440e8b6ec914b17b144a241ddbfa136', used: 'Engine block, cylinder head, valvetrain, timing chain, pulley and flywheel' },
  rig:     { title: 'Rigged 4-Cylinder Engine (FREE)', author: 'david.gnzlv', authorUrl: 'https://sketchfab.com/david.gnzlv', url: 'https://sketchfab.com/3d-models/rigged-4-cylinder-engine-free-e14ebe68273d49a3becda6802270b4b0', used: 'Animated crankshaft, connecting rods and pistons' },
  turbo:   { title: 'Basic Turbo Charger', author: 'Angus Whitburn', authorUrl: 'https://sketchfab.com/AngusWhitburn', url: 'https://sketchfab.com/3d-models/basic-turbo-charger-414dd8615bb24b798807fd187cedfe73', used: 'Turbocharger' },
  transaxle: { title: 'Manual Transmission Gearbox With Differential', author: 'avredu', authorUrl: 'https://sketchfab.com/avredu', url: 'https://sketchfab.com/3d-models/manual-transmission-gearbox-with-differential-d48d46543d844857b31475e56f941410', used: 'Gear cluster, differential, driveshafts and front struts' },
  brake:   { title: '6- Lug Brake Rotor and Brembo brake calipers', author: 'DRIVER-FIRE', authorUrl: 'https://sketchfab.com/DRIVER-FIRE', url: 'https://sketchfab.com/3d-models/6-lug-brake-rotor-and-brembo-brake-calipers-ef37be6ddce44f49b6f616145c1e16af', used: 'Front brake discs and calipers' },
  exhaust: { title: 'MUFFLER & EXHAUST', author: 'VR DESIGNER', authorUrl: 'https://sketchfab.com/vr.designer_09', url: 'https://sketchfab.com/3d-models/muffler-exhaust-8e7403032ecb4ea49c590b3dc4aa5ebc', used: 'Rear silencer and tailpipes' },
};

export const AUDIO = [
  { title: 'Rally Car Idle Loop 05', author: 'freesound_community', url: 'https://pixabay.com/sound-effects/city-rally-car-idle-loop-05-103801/', used: 'Engine idle' },
  { title: 'Import car revs on Chassis Dyno with Turbo', author: 'freesound_community', url: 'https://pixabay.com/sound-effects/city-import-car-revs-on-chassis-dyno-with-turbo-66272/', used: 'Gear changes' },
  { title: 'Turbo flutter', author: 'spinopel', url: 'https://pixabay.com/sound-effects/film-special-effects-turbo-flutter-336362/', used: 'Blow-off on upshifts' },
];
export const AUDIO_LICENSE = { name: 'Pixabay Content Licence', url: 'https://pixabay.com/service/license-summary/' };

export const OTHER = [
  { title: 'Barlow & Barlow Condensed', author: 'Jeremy Tribby', url: 'https://fonts.google.com/specimen/Barlow', license: 'SIL Open Font License' },
  { title: 'IBM Plex Mono', author: 'IBM', url: 'https://fonts.google.com/specimen/IBM+Plex+Mono', license: 'SIL Open Font License' },
  { title: 'three.js, React Three Fiber, drei, postprocessing, GSAP, Lenis', author: 'their respective authors', url: 'https://github.com/sattirajukarthik3-gif/virtus-showroom/blob/main/package.json', license: 'MIT / GSAP licence' },
];

/** One-line plain-text credit, e.g. for the panel note. */
export const creditLine = keys => keys.map(k => MODELS[k]).map(m => `“${m.title}” by ${m.author}`).join(' · ') + ` — Sketchfab, ${LICENSE.name}`;
/** HTML list with links (spec wall + credits panel). */
export const creditsHtml = () => Object.values(MODELS).map(m => `<dt>${m.used}</dt><dd><a href="${m.url}" target="_blank" rel="noopener">${m.title}</a> by <a href="${m.authorUrl}" target="_blank" rel="noopener">${m.author}</a><i>${LICENSE.name}</i></dd>`).join('')
  + AUDIO.map(a => `<dt>Sound · ${a.used}</dt><dd><a href="${a.url}" target="_blank" rel="noopener">${a.title}</a> by ${a.author}<i>${AUDIO_LICENSE.name}</i></dd>`).join('')
  + OTHER.map(o => `<dt>${o.title}</dt><dd><a href="${o.url}" target="_blank" rel="noopener">${o.author}</a><i>${o.license}</i></dd>`).join('');
export const creditsCompact = () => Object.values(MODELS).map(m => `${m.title} — ${m.author}`).join(' · ');
