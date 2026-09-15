/* Turns a loaded Virtus GLB into shell Parts (hood, doors, glass, wheels, lights, rear, body) that the
   scroll timeline can explode/fade exactly like the procedural shell. Node/material names are matched with
   the patterns in modelConfig.js — tune those after inspecting the model (npm run model:inspect). */
import * as THREE from 'three';
import { MODEL } from '../data/modelConfig.js';
import { WB } from './builders.js';

const holoMat = new THREE.MeshBasicMaterial({ color: 0x4a8cff, wireframe: true, transparent: true, opacity: 0, depthWrite: false });

function classify(name) {
  const n = name.toLowerCase().trim();
  for (const [key, re] of MODEL.match) if (re.test(n)) return key;
  return 'body';
}

export function upgradeMaterial(m, kind) {
  const base = m.clone();
  if (kind === 'paint') {
    return new THREE.MeshPhysicalMaterial({ color: MODEL.paintColor ?? base.color, map: base.map, metalness: 0.6, roughness: 0.35, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 1.2, transparent: true });
  }
  if (kind === 'glass') { const gm = new THREE.MeshPhysicalMaterial({ color: 0x0b1524, metalness: 0.9, roughness: 0.05, transparent: true, opacity: 0.75, envMapIntensity: 1.2, depthWrite: false }); gm.userData.noDepthToggle = true; return gm; }
  if (kind === 'chrome') return new THREE.MeshStandardMaterial({ color: 0xe6eaf0, map: base.map, metalness: 0.9, roughness: 0.18, envMapIntensity: 0.9, transparent: true });
  if (kind === 'tyre') return new THREE.MeshStandardMaterial({ color: 0x101214, roughness: 0.92, metalness: 0, map: base.map, normalMap: base.normalMap, transparent: true });
  if (kind === 'lamp') return new THREE.MeshStandardMaterial({ color: 0xffffff, map: base.map, emissive: 0xdfeaff, emissiveIntensity: 0, roughness: 0.15, metalness: 0.4, transparent: true });
  if (kind === 'tail') return new THREE.MeshStandardMaterial({ color: 0x8a0d16, map: base.map, emissive: 0xff2a2a, emissiveIntensity: 0, roughness: 0.25, transparent: true });
  base.transparent = true; if (base.envMapIntensity !== undefined) base.envMapIntensity = 0.5; if (base.roughness !== undefined && base.roughness > 0.95) base.roughness = 0.8; return base;
}
function materialKind(m, partKey) {
  const n = (m.name || '').toLowerCase();
  for (const [kind, re] of MODEL.materialMatch) if (re.test(n)) return kind;
  if (partKey === 'glass') return 'glass';
  return 'other';
}

/** Building moves meshes out of gltf.scene, so it can only happen once per loaded model — later calls get the cached result. */
const built = new WeakMap();
export function buildShellFromGLTF(gltf, api) {
  if (built.has(gltf)) return built.get(gltf);
  const result = buildShellOnce(gltf, api); built.set(gltf, result); return result;
}
function buildShellOnce(gltf, api) {
  const root = new THREE.Group(); const src = gltf.scene;
  src.rotation.set(MODEL.rotation[0], MODEL.rotation[1], MODEL.rotation[2]); src.updateMatrixWorld(true);
  const bb = new THREE.Box3().setFromObject(src); const size = bb.getSize(new THREE.Vector3());
  const s = 4.561 / Math.max(size.x, 0.001) * (MODEL.scale ?? 1); src.scale.setScalar(s); src.updateMatrixWorld(true);
  const bb2 = new THREE.Box3().setFromObject(src); const c = bb2.getCenter(new THREE.Vector3());
  src.position.set(-c.x + (MODEL.offset?.[0] ?? 0), -bb2.min.y + (MODEL.offset?.[1] ?? 0), -c.z + (MODEL.offset?.[2] ?? 0)); src.updateMatrixWorld(true);

  /* bucket meshes by part key; keep world transforms by re-parenting through attach() */
  const buckets = {}; const meshes = []; src.traverse(o => { if (o.isMesh) meshes.push(o); });
  const wheelSpins = []; const lampMats = [], tailMats = [];
  for (const m of meshes) {
    const key = classify(m.name || (m.parent?.name || ''));
    const kind = materialKind(m.material, key);
    m.material = upgradeMaterial(m.material, kind); m.castShadow = true; m.receiveShadow = true;
    if (kind === 'lamp') lampMats.push(m.material); if (kind === 'tail') tailMats.push(m.material);
    if (!buckets[key]) buckets[key] = [];
    buckets[key].push(m);
  }
  /* wheels: group each by quadrant so they can spin about their own axle */
  const offsets = { body: [0, -0.9, 0], glass: [0, 1.3, 0], hood: [0.4, 1.4, 0], door: [0, 0, 0], light: [1.6, 0, 0], grille: [1.3, 0, 0], rear: [-1.6, 0, 0], wheel: [0, -0.9, 0], cabin: [0, 1.6, 0], steer: [0, 1.6, 0] };
  const parts = [], cabinParts = [], steerParts = [];
  for (const key in buckets) {
    if (key === 'wheel') {
      const groups = {};
      for (const m of buckets[key]) { const wp = m.getWorldPosition(new THREE.Vector3()); const q = (wp.x > 0 ? 'F' : 'R') + (wp.z > 0 ? 'R' : 'L'); (groups[q] ||= []).push(m); }
      for (const q in groups) {
        const ms = groups[q]; const box = new THREE.Box3(); ms.forEach(m => box.expandByObject(m)); const ctr = box.getCenter(new THREE.Vector3());
        const g = new THREE.Group(); g.position.copy(ctr); const spin = new THREE.Group(); g.add(spin); root.add(g);
        ms.forEach(m => spin.attach(m)); wheelSpins.push(spin);
        parts.push(new api.Part((q[0] === 'F' ? 'Front' : 'Rear') + ' wheel', g, new THREE.Vector3(0, -0.9, ctr.z > 0 ? 0.9 : -0.9), 'shell'));
      }
      continue;
    }
    if (key === 'door') {
      const sides = { L: [], R: [] }; for (const m of buckets[key]) sides[m.getWorldPosition(new THREE.Vector3()).z > 0 ? 'R' : 'L'].push(m);
      for (const sd in sides) { if (!sides[sd].length) continue; const g = new THREE.Group(); root.add(g); sides[sd].forEach(m => g.attach(m)); parts.push(new api.Part('Doors', g, new THREE.Vector3(0, 0, sd === 'R' ? 1.6 : -1.6), 'shell')); }
      continue;
    }
    const g = new THREE.Group(); root.add(g); buckets[key].forEach(m => g.attach(m));
    const off = offsets[key] || [0, 0, 0];
    const isInt = key === 'cabin' || key === 'steer';
    const pt = new api.Part(key === 'cabin' ? 'Interior' : key === 'steer' ? 'Steering wheel' : key[0].toUpperCase() + key.slice(1), g, new THREE.Vector3(...off), isInt ? 'int' : 'shell');
    if (isInt) cabinParts.push(pt); else parts.push(pt);
    if (key === 'steer') steerParts.push(pt);
  }
  /* key each part so asm tracks apply */
  const keyOf = { Body: 'body', Glass: 'glass', Hood: 'hood', Doors: 'door', Light: 'light', Grille: 'grille', Rear: 'rear', 'Front wheel': 'wheel', 'Rear wheel': 'wheel', Interior: 'interior', 'Steering wheel': 'interior' };
  parts.forEach(pt => pt.key = keyOf[pt.name] || 'body'); cabinParts.forEach(pt => pt.key = 'interior');
  /* hologram wireframe clones (desktop only — the mesh is heavy) */
  if (!MODEL.skipWireframe) parts.forEach(pt => pt.obj.traverse(o => { if (o.isMesh && !o.userData.holo) { const w = new THREE.Mesh(o.geometry, holoMat.clone()); w.userData.holo = true; w.userData.holoScale = 0.22; o.add(w); pt.edges.push(w); } }));
  return { root, parts, cabinParts, steerParts, wheelSpins, lampMats, tailMats };
}
