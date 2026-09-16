/* Tuned for "2022 Volkswagen Virtus GT" by BHP3D (Sketchfab, CC BY 4.0).
   Node names are tested in order against `match` (first hit wins); material names against `materialMatch`. */
/* Rigged crank/rod/piston assembly by david.gnzlv (Sketchfab, CC BY 4.0). Crank axis runs along +X in the file; pistons move along +Y.
   Scaled so the bore spacing (2.25 units) becomes 82 mm, which gives a 74 mm piston — a 1.5-litre four. */
export const ENGINE = {
  url: (import.meta.env.VITE_MODEL_URL || 'models/virtus.glb').replace(/virtus\.(glb|json)$/, 'engine.$1'),        // klaxoneer engine
  rigUrl: (import.meta.env.VITE_MODEL_URL || 'models/virtus.glb').replace(/virtus\.(glb|json)$/, 'engine-rig.$1'), // david.gnzlv crank/rod/piston rig
  credits: [
    { title: 'Car Engine', author: 'klaxoneer', url: 'https://sketchfab.com/3d-models/car-engine-d440e8b6ec914b17b144a241ddbfa136', license: 'CC BY 4.0' },
    { title: 'Rigged 4-Cylinder Engine (FREE)', author: 'david.gnzlv', url: 'https://sketchfab.com/3d-models/rigged-4-cylinder-engine-free-e14ebe68273d49a3becda6802270b4b0', license: 'CC BY 4.0' },
  ],
  crankLocal: [0, -0.06, 0],          // engine-local position of the crank axis
  /* klaxoneer file: cylinders vertical, crank along Z, flywheel at -Z. Bore spacing 2.5 units = 82 mm. */
  klax: { scale: 0.082 / 2.5 * 1.12, crank: [-0.18, -6.24], boreMidZ: -3.97, boreX: 0.3 },   // ×1.12: reads better against the bay
  /* rig file: crank along X, pistons along Y. Stretched (x,y,z after rotation) to the klaxoneer bore spacing and crank-to-deck height. */
  rig: { rotation: [0, Math.PI / 2, 0], crankCentre: [2.78, -2.92, 0], pistonMidX: 3.38, stretch: [1.03, 1.40, 1.111] },
  animSpeed: [0.25, 3.0],
};

const base = import.meta.env.VITE_MODEL_URL || 'models/virtus.glb';
export const PARTS = { turbo: base.replace(/virtus\.(glb|json)$/, 'turbo.$1'), transaxle: base.replace(/virtus\.(glb|json)$/, 'gearbox.$1'), brake: base.replace(/virtus\.(glb|json)$/, 'brake.$1'), exhaust: base.replace(/virtus\.(glb|json)$/, 'exhaust.$1'),
  credits: [
    { title: 'Basic Turbo Charger', author: 'Angus Whitburn', url: 'https://sketchfab.com/3d-models/basic-turbo-charger-414dd8615bb24b798807fd187cedfe73' },
    { title: 'Manual Transmission Gearbox With Differential', author: 'avredu', url: 'https://sketchfab.com/3d-models/manual-transmission-gearbox-with-differential-d48d46543d844857b31475e56f941410' },
    { title: '6-Lug Brake Rotor and Brembo brake calipers', author: 'DRIVER-FIRE', url: 'https://sketchfab.com/3d-models/6-lug-brake-rotor-and-brembo-brake-calipers-ef37be6ddce44f49b6f616145c1e16af' },
    { title: 'MUFFLER & EXHAUST', author: 'VR DESIGNER', url: 'https://sketchfab.com/3d-models/muffler-exhaust-8e7403032ecb4ea49c590b3dc4aa5ebc' },
  ] };

export const MODEL = {
  url: import.meta.env.VITE_MODEL_URL || 'models/virtus.glb',   // a .json URL is a base64-wrapped GLB (used where binary files can't be served)
  holoUrl: (import.meta.env.VITE_MODEL_URL || 'models/virtus.glb').replace(/virtus\.(glb|json)$/, 'virtus.holo.$1'),   // decimated copy used for the wireframe hologram
  credit: { title: '2022 Volkswagen Virtus GT', author: 'BHP3D', url: 'https://sketchfab.com/3d-models/2022-volkswagen-virtus-gt-3955e5c050f843398b49b2b21ab2f232', license: 'CC BY 4.0' },
  rotation: [0, -Math.PI / 2, 0],  // model nose is -Z → our +X; model +X (driver side, RHD) → our +Z
  scale: 1,
  offset: [0, 0, 0],
  paintColor: null,                // keep the model's Wild Cherry Red; set e.g. 0xd4a017 to repaint
  skipWireframe: false,
  match: [
    ['wheel', /^wheel[1-4]_/],
    ['door', /^(door|dor|adoor|dior|dioor)_?[lr][fr]/],
    ['rear', /^main.*rear light|^boot_|^b_oot|^rear_bump|tail_light|rear_light|^exh_part|^sens_rear|^rear_hggf/],
    ['light', /^main|head_lights|headlights|lits_plas|lights_alu|^fog_/],
    ['grille', /^bump_frnt|^plate_frnt|^gt_frnt|^gt_left|^gt_right|^gt_bg/],
    ['glass', /^windshield|^sunroof_glass/],
    ['body', /^biodyshell|^roof_main|^chass_|^wipers|^door_locks|^partss_primary|^rubber_|^mirr_part|^rear_bak_part|^sunroof_int/],
    ['steer', /^steer|^ster|^stee/],
    ['cabin', /seat|dash|dasj|cons|coms|gear|pedal|carpet|int_|pillars|mirr_middle|tray|comp|^ac_|handbreak|hand_brake|rpart|pill_|roof_pads|alu_int|button|ldark|base_|stt_parts|defogger|plsddd/],
  ],
  materialMatch: [
    ['glass', /^glass$/], ['lamp', /front_light|front light/], ['tail', /rear_light|rear light/], ['tyre', /^tyre/], ['chrome', /seatbelt_alu|gt_frnt|alu_int|mirr_middle/], ['paint', /^primary/],
  ],
};
