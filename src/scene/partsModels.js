/* Accessory models replacing procedural parts. All Sketchfab, CC BY 4.0:
   turbo   — "Basic Turbo Charger" (Angus Whitburn)
   transaxle — "Manual Transmission Gearbox With Differential" (avredu): gear cluster, differential, CV axles, McPherson strut
   brake   — "6-Lug Brake Rotor and Brembo brake calipers" (DRIVER-FIRE)
   exhaust — "MUFFLER & EXHAUST" (VR DESIGNER) */
import * as THREE from 'three';
import { WX, TR, WR } from './builders.js';

const steel = (c = 0x8f959e, r = 0.4) => new THREE.MeshStandardMaterial({ color: c, metalness: 0.9, roughness: r, envMapIntensity: 0.7, transparent: true });
const rubber = () => new THREE.MeshStandardMaterial({ color: 0x14161a, metalness: 0, roughness: 0.92, transparent: true });
function meshes(o) { const out = []; o.traverse(x => { if (x.isMesh) out.push(x); }); return out; }
function centre(o) { return new THREE.Box3().setFromObject(o).getCenter(new THREE.Vector3()); }
function pivotAt(mesh, p) { const g = new THREE.Group(); g.position.copy(p); mesh.parent.add(g); g.attach(mesh); return g; }
/** Pivot group at the mesh's own bounding-box centre (or bottom), expressed in the parent's frame — no world matrices involved. */
function pivotAtCentre(mesh, bottom = false) { mesh.updateMatrix(); mesh.geometry.computeBoundingBox(); const bb = mesh.geometry.boundingBox; const c = bb.getCenter(new THREE.Vector3()); if (bottom) c.y = bb.min.y; c.applyMatrix4(mesh.matrix);
  const g = new THREE.Group(); g.position.copy(c); const parent = mesh.parent; parent.remove(mesh); mesh.position.sub(c); parent.add(g); g.add(mesh);
  /* spin axis = the thinnest side of the disc-like mesh, in the pivot's frame */
  const s = bb.getSize(new THREE.Vector3()).applyQuaternion(mesh.quaternion).multiply(parent.scale); const ax = ['x', 'y', 'z']; const abs = [Math.abs(s.x), Math.abs(s.y), Math.abs(s.z)]; g.userData.axis = ax[abs.indexOf(Math.min(...abs))]; return g; }
function tagMats(root, api, partName, list) { const part = api.parts.find(p => p.name === partName); meshes(root).forEach(m => { m.castShadow = true; m.receiveShadow = true; m.userData.part = part; list.push(m.material); }); }

export function buildParts(g, api) {
  const out = { roots: [], mats: [], spin: [], gears: [], rotorPivots: [], springs: [], update: null };

  /* ---------- turbo: shaft along file X → engine-local Z ---------- */
  if (g.turbo) {
    const src = g.turbo.scene; const root = new THREE.Group(); root.add(src);
    const s = 0.22 / 14.2; src.scale.setScalar(s); src.rotation.y = -Math.PI / 2;
    src.position.set(0, 0, 0); src.updateMatrixWorld(true); const c = centre(src); src.position.sub(c);
    root.position.set(0.32, 0.06, 0.08);                  // where the procedural turbo sat (engine-local)
    meshes(src).forEach(m => { m.material = m.material.clone(); m.material.transparent = true; m.material.metalness = 0.85; m.material.roughness = 0.45; m.material.envMapIntensity = 0.7; });
    for (const m of meshes(src)) if (/Compressor_Turbine|Exhaust_Turbine/.test(m.name)) { const p = pivotAtCentre(m); p.userData.turbo = true; out.spin.push(p); }
    tagMats(src, api, 'Engine', out.mats); out.roots.push({ root, parent: 'engine' });
  }

  /* ---------- transaxle: axle axis file X → car Z (right = +Z) ---------- */
  if (g.transaxle) {
    const src = g.transaxle.scene; src.updateMatrixWorld(true);
    const all = meshes(src); const info = new Map(all.map(m => { const b = new THREE.Box3().setFromObject(m); return [m, { c: b.getCenter(new THREE.Vector3()), s: b.getSize(new THREE.Vector3()) }]; }));
    const bucket = { gearbox: [], diff: [], axle: [], strut: [] };
    for (const m of all) { const { c, s } = info.get(m); const n = m.name;
      if (/Object_(192|200|194|76|136|138|140|142|144|146|148|150|152|154|156|158|6|8|10|12|14|16|18|20|22|186|188|190|196|198)$/.test(n)) continue;   // tyre, rim, shifter linkage, caliper, hub disc
      if (c.z > 8.8) bucket.gearbox.push(m);
      else if (c.x > 9 && c.y > 8.8) bucket.strut.push(m);
      else if (c.x > -4.7 && c.x < -0.3) bucket.diff.push(m);
      else bucket.axle.push(m); }
    const S = 0.032; const rotY = -Math.PI / 2;
    /* bake each mesh's source-world transform into a neutral group, then scale/rotate that group (attach() alone would cancel the scale) */
    const make = (list, name, scale = S) => { const grp = new THREE.Group(); const inner = new THREE.Group(); grp.add(inner); inner.scale.setScalar(scale); inner.rotation.y = rotY;
      const bake = new THREE.Group(); list.forEach(m => bake.attach(m)); inner.add(bake); inner.updateMatrixWorld(true); const c = centre(inner); inner.position.sub(c); return grp; };
    /* materials: educational colours → metals, boots stay rubber */
    all.forEach(m => { const mn = m.material.name || ''; m.userData.matName = mn; m.material = /rubber/i.test(mn) ? rubber() : /Gear|shaft|Shaft|pin|Bearings|Default|Material_(1|2|3|4|5|6|8|9|10|11|12|13|15|20|21)$/.test(mn) ? steel(0x9aa1ab, 0.35) : steel(0x5c626c, 0.5); });
    /* gearbox cluster at the procedural gearbox position */
    const gb = make(bucket.gearbox, 'gearbox'); gb.position.set(1.42, 0.42, -0.44);
    for (const m of bucket.gearbox) { const nm = m.userData.matName || ''; const c = info.get(m).c; let axis = null;
      if (/Gear_[1-5]$|Gear_-_Main_Shaft|Bearings|Material_(2|6|8|11|12|13)$/.test(nm) || Math.abs(c.z - 10) < 0.3 && Math.abs(c.y - 7.4) < 0.3) axis = { y: 7.4, z: 10, dir: 1 };
      else if (/Clutch_Shaft|Material_21/.test(nm) || Math.abs(c.z - 11.4) < 0.3) axis = { y: 9.4, z: 11.4, dir: -1 };
      else if (/Reverse_Gear/.test(nm)) axis = { y: 9.8, z: 9.9, dir: -1 };
      if (!axis) continue; const wc = new THREE.Vector3(c.x, axis.y, axis.z); /* bake-local == source coordinates */ const p = pivotAt(m, wc); p.userData.axis = 'x'; p.userData.dir = axis.dir; out.spin.push(p);
      const gm = nm.match(/^Gear_([1-5])$/); if (gm) out.gears.push({ n: +gm[1], mesh: m }); }
    out.roots.push({ root: gb, parent: 'car', part: 'Transmission' }); tagMats(gb, api, 'Transmission', out.mats);
    /* differential just behind the gearbox, on the axle line */
    const df = make(bucket.diff, 'diff'); df.position.set(WX, 0.34, -0.3); out.roots.push({ root: df, parent: 'car', part: 'Driveshafts' }); tagMats(df, api, 'Driveshafts', out.mats);
    /* CV axles: reuse the right-hand pieces for both sides, stretched to the real track */
    const pick = re => bucket.axle.find(m => re.test(m.name));
    const pieces = { shaft: pick(/Object_51$/), innerBoot: pick(/Object_37$/), outerBoot: pick(/Object_35$/), outerJoint: pick(/Object_33$/) };
    const axle = (side, zInner, zOuter) => { const grp = new THREE.Group(); const len = Math.abs(zOuter - zInner);
      const put = (m, z, stretch = 1) => { if (!m) return; const cl = m.clone(); cl.material = m.material; cl.matrix.copy(m.matrixWorld); cl.matrix.decompose(cl.position, cl.quaternion, cl.scale); const holder = new THREE.Group(); holder.scale.set(S, S, S * stretch); holder.rotation.y = rotY; holder.add(cl); holder.updateMatrixWorld(true); const c = centre(holder); holder.position.set(WX - c.x, 0.34 - c.y, z - c.z); grp.add(holder); };
      put(pieces.innerBoot, zInner + side * 0.07); put(pieces.outerBoot, zOuter - side * 0.1); put(pieces.outerJoint, zOuter - side * 0.02);
      put(pieces.shaft, (zInner + zOuter) / 2, (len - 0.2) / (8.9 * S)); return grp; };
    const axR = axle(1, -0.12, TR - 0.16), axL = axle(-1, -0.48, -(TR - 0.16));
    out.roots.push({ root: axR, parent: 'car', part: 'Driveshafts' }, { root: axL, parent: 'car', part: 'Driveshafts' }); tagMats(axR, api, 'Driveshafts', out.mats); tagMats(axL, api, 'Driveshafts', out.mats);
    bucket.axle.forEach(m => { m.visible = false; });
    /* front struts, one per side (mirrored) */
    const strutOnce = make(bucket.strut, 'strut', 0.55 / 13.7); const strutClone = strutOnce.clone();   // clone before any userData tagging
    [1, -1].forEach(side => { const st = side === 1 ? strutOnce : strutClone; st.scale.z = side; const b = new THREE.Box3().setFromObject(st); st.position.set(WX + 0.02, WR + 0.02 - b.min.y + st.position.y, side * 0.64);
      out.roots.push({ root: st, parent: 'car', part: 'Suspension' }); tagMats(st, api, 'Suspension', out.mats);
      meshes(st).forEach(m => { if (/Object_181$/.test(m.name)) out.springs.push(pivotAtCentre(m, true)); }); });
  }

  /* ---------- brakes: rotor axis file Z → car Z ---------- */
  if (g.brake) {
    const brakeScenes = { 1: g.brake.scene, '-1': g.brake.scene.clone() };   // clone before tagging
    [1, -1].forEach(side => { const src = brakeScenes[side]; const root = new THREE.Group(); root.add(src);
      const s = 0.29 / 76.2; src.scale.set(s, s, s * side); src.position.set(0, 0, 0); src.updateMatrixWorld(true);
      const rotor = meshes(src).find(m => /Object_3$/.test(m.name)); const rc = centre(rotor); src.position.sub(rc);
      root.position.set(WX, WR, side * (TR - 0.17)); root.rotation.y = side === 1 ? 0 : 0;
      meshes(src).forEach(m => { m.material = m.material.clone(); m.material.transparent = true; if (/Object_3$/.test(m.name)) { m.material.metalness = 0.9; m.material.roughness = 0.4; m.material.color.setHex(0xaeb4bc); } if (/Object_4$/.test(m.name)) { m.material.color.setHex(0xc0181c); m.material.metalness = 0.4; m.material.roughness = 0.35; } m.material.envMapIntensity = 0.7; });
      const p = pivotAtCentre(rotor); out.rotorPivots.push(p);
      out.roots.push({ root, parent: 'car', part: 'Suspension' }); tagMats(src, api, 'Suspension', out.mats); });
  }

  /* ---------- muffler: tips along file -Z → car -X ---------- */
  if (g.exhaust) {
    const src = g.exhaust.scene; const root = new THREE.Group(); root.add(src);
    const s = 0.72 / 574.6; src.scale.setScalar(s); src.rotation.y = Math.PI / 2; src.updateMatrixWorld(true); const c = centre(src); src.position.sub(c);
    root.position.set(-1.72, 0.25, 0.42);
    meshes(src).forEach(m => { m.material = steel(0x3a3d43, 0.55); });
    out.roots.push({ root, parent: 'car', part: 'Exhaust' }); tagMats(src, api, 'Exhaust', out.mats);
  }
  return out;
}
