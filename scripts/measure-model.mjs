/* Prints world-space centres of key nodes so the model orientation can be set in modelConfig.js */
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { getBounds } from '@gltf-transform/core';
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.read(process.argv[2] || 'public/models/virtus.glb');
const pats = (process.argv[3] || 'wheel1_tyre2.5|wheel2_tyre2.5|wheel3_tyre2.5|wheel4_tyre2.5|door_lf_paint|door_rf_paint|door_lr_paint|door_rr_paint|headlights_glass|windshield|boot_paint|^steer_steer|biodyshell|pedals_rear|dash_main').split('|').map(s=>new RegExp(s));
const scene = doc.getRoot().listScenes()[0]; const all = getBounds(scene); console.log('scene bounds', all.min.map(v=>+v.toFixed(2)), all.max.map(v=>+v.toFixed(2)));
for (const n of doc.getRoot().listNodes()) { if (!n.getMesh()) continue; if (!pats.some(p=>p.test(n.getName()))) continue; const b = getBounds(n); const c=[0,1,2].map(i=>+((b.min[i]+b.max[i])/2).toFixed(2)); console.log(n.getName().padEnd(28), 'centre', c, 'size', [0,1,2].map(i=>+(b.max[i]-b.min[i]).toFixed(2))); }
