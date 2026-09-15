/* Tuned for "2022 Volkswagen Virtus GT" by BHP3D (Sketchfab, CC BY 4.0).
   Node names are tested in order against `match` (first hit wins); material names against `materialMatch`. */
export const MODEL = {
  url: import.meta.env.VITE_MODEL_URL || 'models/virtus.glb',   // a .json URL is a base64-wrapped GLB (used where binary files can't be served)
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
