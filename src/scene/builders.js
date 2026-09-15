/* Procedural showroom geometry. Car frame: +X forward, +Y up, +Z = right (RHD driver at +Z).
   Everything here is plain three.js; React mounts the returned groups with <primitive>. */
import * as THREE from 'three';

export const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (p, a, b) => { const t = clamp((p - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

export const WB = 2.651, WR = 0.316, TR = 0.79, WX = WB / 2;

export function createShowroom({ isMobile = false } = {}) {
  /* ---------- materials ---------- */
  const mat = {
    paint: new THREE.MeshPhysicalMaterial({ color: 0x5b6069, metalness: 0.85, roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.08, envMapIntensity: 0.9, transparent: true }),
    paintDark: new THREE.MeshPhysicalMaterial({ color: 0x2a2e36, metalness: 0.8, roughness: 0.4, clearcoat: 0.8, envMapIntensity: 0.55, transparent: true }),
    glass: new THREE.MeshPhysicalMaterial({ color: 0x0b1524, metalness: 0.95, roughness: 0.06, envMapIntensity: 1.0, transparent: true, opacity: 0.86 }),
    chrome: new THREE.MeshStandardMaterial({ color: 0xe2e6ec, metalness: 1, roughness: 0.14, envMapIntensity: 0.55, transparent: true }),
    rubber: new THREE.MeshStandardMaterial({ color: 0x0f1113, roughness: 0.92, metalness: 0, envMapIntensity: 0.2, transparent: true }),
    plastic: new THREE.MeshStandardMaterial({ color: 0x1b1e24, roughness: 0.75, metalness: 0.1, envMapIntensity: 0.3, transparent: true }),
    alu: new THREE.MeshStandardMaterial({ color: 0xa2a8b2, metalness: 0.9, roughness: 0.38, envMapIntensity: 0.55, transparent: true }),
    steel: new THREE.MeshStandardMaterial({ color: 0x6d737d, metalness: 0.95, roughness: 0.45, envMapIntensity: 0.55, transparent: true }),
    cast: new THREE.MeshStandardMaterial({ color: 0x4a4f58, metalness: 0.7, roughness: 0.6, envMapIntensity: 0.55, transparent: true }),
    leather: new THREE.MeshStandardMaterial({ color: 0x1f2127, roughness: 0.85, metalness: 0.05, envMapIntensity: 0.25, transparent: true }),
    lampOn: new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xdfeaff, emissiveIntensity: 0, roughness: 0.2, metalness: 0.3, transparent: true }),
    tail: new THREE.MeshStandardMaterial({ color: 0x8a0d16, emissive: 0xff2a2a, emissiveIntensity: 0, roughness: 0.3, transparent: true }),
    blueGlow: new THREE.MeshBasicMaterial({ color: 0x7fa8ff, transparent: true, opacity: 0.9 }),
    airbag: new THREE.MeshStandardMaterial({ color: 0xf4f6fa, roughness: 0.9, transparent: true, opacity: 0.65, emissive: 0xffffff, emissiveIntensity: 0.15 }),
  };
  const edgeMat = new THREE.LineBasicMaterial({ color: 0x4a8cff, transparent: true, opacity: 0 });

  /* ---------- part registry ---------- */
  const parts = [];
  class Part {
    constructor(name, obj, offset, group) {
      this.name = name; this.obj = obj; this.home = obj.position.clone(); this.off = offset || V3(0, 0, 0); this.group = group;
      this.mats = []; this.edges = []; this.base = [];
      obj.traverse(o => {
        if (o.isMesh) { o.material = o.material.clone(); o.castShadow = !isMobile; o.receiveShadow = true; this.mats.push(o.material); this.base.push(o.material.opacity); o.userData.part = this; }
        if (o.isLineSegments) this.edges.push(o);
      });
      parts.push(this);
    }
    set(a, op, edge) {
      this.obj.position.copy(this.home).addScaledVector(this.off, 1 - a);
      const o = op * a; this.obj.visible = o > 0.003;
      const shell = this.group === 'shell';
      for (let i = 0; i < this.mats.length; i++) { const mt = this.mats[i]; mt.opacity = this.base[i] * o; if (shell && !mt.userData.noDepthToggle) mt.depthWrite = mt.opacity > 0.5; }
      for (const e of this.edges) { const eo = edge * a * (e.userData.holoScale || 1); e.visible = eo > 0.01; e.material.opacity = eo; }
    }
  }
  function edges(mesh, th = 25) { const l = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry, th), edgeMat.clone()); mesh.add(l); return l; }
  function box(w, h, d, m, x = 0, y = 0, z = 0, e = true) { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); if (e) edges(b); return b; }
  function cyl(rt, rb, h, m, seg = 24, x = 0, y = 0, z = 0) { const c = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m); c.position.set(x, y, z); return c; }
  function helix(r, h, turns, x, y, z) { const pts = []; const n = turns * 16; for (let i = 0; i <= n; i++) { const t = i / n; pts.push(V3(Math.cos(t * turns * Math.PI * 2) * r, t * h, Math.sin(t * turns * Math.PI * 2) * r)); } const g = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), n * 2, 0.012, 6, false); const m = new THREE.Mesh(g, mat.steel); m.position.set(x, y, z); return m; }
  function tube(points, r, m, seg = 48) { return new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), seg, r, 8, false), m); }
  function gearGeo(r, teeth, h) { const s = new THREE.Shape(); const ri = r * 0.86; for (let i = 0; i < teeth; i++) { const a0 = i / teeth * Math.PI * 2, a1 = (i + 0.5) / teeth * Math.PI * 2, aq = (i + 0.25) / teeth * Math.PI * 2, at = (i + 0.75) / teeth * Math.PI * 2; const p = (rad, a) => [Math.cos(a) * rad, Math.sin(a) * rad]; if (i === 0) s.moveTo(...p(ri, a0)); else s.lineTo(...p(ri, a0)); s.lineTo(...p(r, aq)); s.lineTo(...p(r, a1)); s.lineTo(...p(ri, at)); } s.closePath(); const hole = new THREE.Path(); hole.absarc(0, 0, r * 0.3, 0, Math.PI * 2, true); s.holes.push(hole); const g = new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: false }); g.center(); return g; }

  const car = new THREE.Group();

  /* ================= procedural shell (fallback when no GLB) ================= */
  const shell = new THREE.Group(); car.add(shell);
  const bodyShape = (() => { const s = new THREE.Shape();
    s.moveTo(2.25, 0.22); s.lineTo(2.30, 0.44); s.lineTo(2.28, 0.62); s.lineTo(2.14, 0.72); s.lineTo(0.86, 0.90); s.lineTo(-1.42, 1.0); s.lineTo(-2.14, 1.02); s.lineTo(-2.27, 0.86); s.lineTo(-2.30, 0.44); s.lineTo(-2.22, 0.22);
    s.lineTo(-WX - 0.43, 0.22); s.absarc(-WX, 0.22, 0.43, Math.PI, 0, true); s.lineTo(WX - 0.43, 0.22); s.absarc(WX, 0.22, 0.43, Math.PI, 0, true); s.lineTo(2.25, 0.22); return s; })();
  const bodyGeo = new THREE.ExtrudeGeometry(bodyShape, { depth: 1.62, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 3, steps: 1 }); bodyGeo.translate(0, 0, -0.81);
  const bodyMesh = new THREE.Mesh(bodyGeo, mat.paint); edges(bodyMesh, 32);
  const bodyG = new THREE.Group(); bodyG.add(bodyMesh); bodyG.add(box(4.2, 0.06, 1.62, mat.paintDark, 0, 0.2, 0, false));
  shell.add(bodyG); new Part('Body', bodyG, V3(0, -0.9, 0), 'shell');
  const ghShape = (() => { const s = new THREE.Shape(); s.moveTo(0.84, 0.90); s.lineTo(0.16, 1.40); s.lineTo(-0.86, 1.44); s.lineTo(-1.44, 1.02); s.closePath(); return s; })();
  const ghGeo = new THREE.ExtrudeGeometry(ghShape, { depth: 1.46, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 2 }); ghGeo.translate(0, 0, -0.73);
  const glassMesh = new THREE.Mesh(ghGeo, mat.glass); edges(glassMesh, 20);
  const glassG = new THREE.Group(); glassG.add(glassMesh);
  const roof = box(1.0, 0.03, 1.3, mat.paint, -0.36, 1.455, 0); roof.rotation.z = 0.03; glassG.add(roof); glassG.add(box(0.5, 0.012, 0.7, mat.glass, -0.1, 1.472, 0));
  shell.add(glassG); new Part('Glass', glassG, V3(0, 1.3, 0), 'shell');
  const hoodShape = (() => { const s = new THREE.Shape(); s.moveTo(2.14, 0.72); s.lineTo(0.86, 0.90); s.lineTo(0.86, 0.93); s.lineTo(2.12, 0.75); s.closePath(); return s; })();
  const hoodGeo = new THREE.ExtrudeGeometry(hoodShape, { depth: 1.5, bevelEnabled: false }); hoodGeo.translate(0, 0.005, -0.75);
  const hoodMesh = new THREE.Mesh(hoodGeo, mat.paint); edges(hoodMesh, 10);
  const hoodG = new THREE.Group(); hoodG.add(hoodMesh);
  [-0.35, 0.35].forEach(z => { const c = box(1.2, 0.012, 0.02, mat.paintDark, 1.5, 0.84, z, false); c.rotation.z = -0.14; hoodG.add(c); });
  shell.add(hoodG); new Part('Hood', hoodG, V3(0.4, 1.4, 0), 'shell');
  [[0.16, 1.05, 'Front'], [-0.92, 1.0, 'Rear']].forEach(([x, w, n]) => { [1, -1].forEach(side => {
    const g = new THREE.Group();
    g.add(box(w, 0.62, 0.028, mat.paint, x, 0.585, side * 0.822, true));
    g.add(box(0.13, 0.028, 0.02, mat.paint, x - 0.28, 0.74, side * 0.845, false));
    g.add(box(w - 0.04, 0.012, 0.006, mat.chrome, x, 0.905, side * 0.83, false));
    shell.add(g); new Part(n + ' door', g, V3(0, 0, side * 1.6), 'shell');
  }); });
  const mirG = new THREE.Group(); [1, -1].forEach(s => { mirG.add(box(0.12, 0.08, 0.18, mat.paint, 0.62, 0.98, s * 0.9)); }); shell.add(mirG); new Part('Mirrors', mirG, V3(0, 0.6, 0), 'shell');
  const lightsG = new THREE.Group();
  [1, -1].forEach(s => { const l = box(0.12, 0.11, 0.5, mat.lampOn, 2.22, 0.64, s * 0.55, true); l.rotation.y = s * 0.35; lightsG.add(l);
    const drl = box(0.02, 0.012, 0.44, mat.lampOn, 2.29, 0.7, s * 0.55, false); drl.rotation.y = s * 0.35; lightsG.add(drl);
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.9, 5, 24, 1, true), new THREE.MeshBasicMaterial({ color: 0xcfe0ff, transparent: true, opacity: 0, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false })); cone.rotation.z = Math.PI / 2; cone.position.set(4.7, 0.55, s * 0.55); cone.name = 'cone'; lightsG.add(cone); });
  shell.add(lightsG); new Part('LED headlights', lightsG, V3(1.6, 0, 0), 'shell');
  const grilleG = new THREE.Group();
  grilleG.add(box(0.03, 0.16, 1.05, mat.plastic, 2.30, 0.53, 0)); for (let i = 0; i < 3; i++) grilleG.add(box(0.012, 0.012, 1.05, mat.chrome, 2.318, 0.47 + i * 0.05, 0, false));
  grilleG.add(box(0.03, 0.22, 0.9, mat.plastic, 2.31, 0.31, 0));
  const badge = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.012, 10, 32), mat.chrome); badge.rotation.y = Math.PI / 2; badge.position.set(2.33, 0.62, 0); grilleG.add(badge);
  shell.add(grilleG); new Part('Grille', grilleG, V3(1.3, 0, 0), 'shell');
  const rearG = new THREE.Group();
  [1, -1].forEach(s => { const t = box(0.1, 0.1, 0.42, mat.tail, -2.25, 0.86, s * 0.56, true); t.rotation.y = -s * 0.3; rearG.add(t); });
  rearG.add(box(0.02, 0.012, 0.7, mat.chrome, -2.3, 0.86, 0, false)); rearG.add(box(1.0, 0.012, 1.4, mat.paint, -1.8, 1.03, 0, false));
  { const tip = cyl(0.035, 0.035, 0.12, mat.chrome, 16, -2.28, 0.28, 0.55); tip.rotation.z = Math.PI / 2; rearG.add(tip); }
  shell.add(rearG); new Part('Rear', rearG, V3(-1.6, 0, 0), 'shell');
  const wheels = [];
  [[WX, TR], [WX, -TR], [-WX, TR], [-WX, -TR]].forEach(([x, z], i) => {
    const g = new THREE.Group(); g.position.set(x, WR, z); const spin = new THREE.Group(); g.add(spin);
    const tyre = new THREE.Mesh(new THREE.TorusGeometry(WR - 0.06, 0.065, 12, 40), mat.rubber); tyre.scale.z = 1.55; edges(tyre, 20); spin.add(tyre);
    const rimm = cyl(0.205, 0.205, 0.2, mat.alu, 28); rimm.rotation.x = Math.PI / 2; edges(rimm, 30); spin.add(rimm);
    const rimEdge = new THREE.Mesh(new THREE.TorusGeometry(0.205, 0.012, 8, 40), mat.alu); rimEdge.position.z = (z > 0 ? 1 : -1) * 0.1; spin.add(rimEdge);
    for (let k = 0; k < 5; k++) { const sp = box(0.045, 0.33, 0.03, mat.chrome, 0, 0, (z > 0 ? 1 : -1) * 0.105, false); sp.rotation.z = k / 5 * Math.PI * 2; spin.add(sp); }
    const hub = cyl(0.045, 0.045, 0.03, mat.chrome, 16); hub.rotation.x = Math.PI / 2; hub.position.z = (z > 0 ? 1 : -1) * 0.11; spin.add(hub);
    shell.add(g); wheels.push(spin); new Part(i < 2 ? 'Front wheel' : 'Rear wheel', g, V3(0, -0.9, (z > 0 ? 1 : -1) * 0.9), 'shell');
  });

  /* ================= mechanical ================= */
  const discs = [], springs = [], calipers = [];
  const suspG = new THREE.Group(); car.add(suspG);
  [[WX, TR], [WX, -TR]].forEach(([x, z]) => { const s = z > 0 ? 1 : -1;
    const sp = helix(0.065, 0.26, 6, x, 0.5, z - s * 0.18); suspG.add(sp); springs.push(sp);
    suspG.add(cyl(0.03, 0.03, 0.42, mat.alu, 12, x, 0.55, z - s * 0.18)); suspG.add(box(0.08, 0.03, 0.5, mat.cast, x - 0.05, 0.3, z - s * 0.32));
    const disc = cyl(0.145, 0.145, 0.025, mat.steel, 40, x, WR, z - s * 0.13); disc.rotation.order = 'ZYX'; disc.rotation.set(Math.PI / 2, 0, 0); suspG.add(disc); discs.push(disc);
    const cal = box(0.08, 0.14, 0.05, mat.paintDark, x - 0.1, WR + 0.06, z - s * 0.13); suspG.add(cal); calipers.push(cal); });
  [[-WX, TR], [-WX, -TR]].forEach(([x, z]) => { const s = z > 0 ? 1 : -1;
    const sp = helix(0.06, 0.22, 5, x - 0.1, 0.42, z - s * 0.2); suspG.add(sp); springs.push(sp);
    suspG.add(cyl(0.025, 0.025, 0.36, mat.alu, 12, x + 0.1, 0.5, z - s * 0.16)); suspG.add(box(0.55, 0.05, 0.05, mat.cast, x + 0.25, 0.32, z - s * 0.16));
    const drum = cyl(0.115, 0.115, 0.08, mat.cast, 32, x, WR, z - s * 0.13); drum.rotation.x = Math.PI / 2; suspG.add(drum); });
  suspG.add(box(0.06, 0.06, 1.3, mat.cast, -WX + 0.2, 0.32, 0));
  { const rack = cyl(0.02, 0.02, 1.2, mat.alu, 10, WX - 0.3, 0.34, 0); rack.rotation.x = Math.PI / 2; suspG.add(rack); }
  suspG.add(box(0.06, 0.04, 0.7, mat.cast, WX - 0.25, 0.28, 0.35)); suspG.add(box(0.06, 0.04, 0.7, mat.cast, WX - 0.25, 0.28, -0.35));
  new Part('Suspension', suspG, V3(0, -1.2, 0), 'mech');
  const exG = new THREE.Group();
  exG.add(tube([V3(1.25, 0.5, 0.25), V3(1.15, 0.35, 0.25), V3(0.9, 0.22, 0.35), V3(-1.6, 0.22, 0.35), V3(-2.0, 0.26, 0.5), V3(-2.28, 0.28, 0.55)], 0.03, mat.steel, 80));
  exG.add(box(0.7, 0.14, 0.28, mat.alu, -1.7, 0.25, 0.4)); exG.add(box(0.28, 0.16, 0.14, mat.alu, 0.6, 0.24, 0.35));
  car.add(exG); new Part('Exhaust', exG, V3(0, -0.9, 0), 'mech');

  /* engine */
  const engG = new THREE.Group(); engG.position.set(1.42, 0.5, 0.14); car.add(engG);
  const EZ = [-0.165, -0.055, 0.055, 0.165];
  const blockMesh = box(0.42, 0.34, 0.5, mat.cast, 0, 0.08, 0, true); engG.add(blockMesh);
  const headMesh = box(0.44, 0.14, 0.52, mat.alu, 0, 0.32, 0, true); engG.add(headMesh);
  const camCover = box(0.36, 0.05, 0.5, mat.paintDark, 0, 0.415, 0, true); engG.add(camCover);
  for (let i = 0; i < 5; i++) camCover.add(box(0.3, 0.012, 0.012, mat.plastic, 0, 0.03, -0.2 + i * 0.1, false));
  EZ.forEach(z => camCover.add(cyl(0.018, 0.018, 0.05, mat.plastic, 12, -0.06, 0.05, z)));
  [[0.18, 0.2], [-0.18, 0.2], [0.18, -0.2], [-0.18, -0.2]].forEach(([x, z]) => headMesh.add(cyl(0.008, 0.008, 0.02, mat.chrome, 8, x, 0.075, z)));
  const casing = [blockMesh, headMesh, camCover];
  const cylBores = [], pistons = [], rods = [], throws = [], valves = [];
  EZ.forEach((z) => {
    const bore = cyl(0.052, 0.052, 0.3, new THREE.MeshStandardMaterial({ color: 0xb9bfca, metalness: 0.9, roughness: 0.3, transparent: true, opacity: 0.18, depthWrite: false }), 24, 0, 0.15, z); engG.add(bore); cylBores.push(bore);
    const p = cyl(0.048, 0.048, 0.06, mat.alu, 24, 0, 0.1, z); engG.add(p); pistons.push(p);
    const r = box(0.03, 0.16, 0.02, mat.steel, 0, 0, z, false); engG.add(r); rods.push(r);
    const w = box(0.06, 0.12, 0.03, mat.steel, 0, -0.06, z, false); engG.add(w); throws.push(w);
    [-0.02, 0.02].forEach(dx => { const v = cyl(0.006, 0.006, 0.1, mat.chrome, 8, dx, 0.33, z); engG.add(v); valves.push(v); });
  });
  const crank = cyl(0.02, 0.02, 0.5, mat.steel, 14, 0, -0.06, 0); crank.rotation.x = Math.PI / 2; engG.add(crank);
  const camshaft = cyl(0.012, 0.012, 0.5, mat.steel, 10, 0, 0.4, 0); camshaft.rotation.x = Math.PI / 2; engG.add(camshaft);
  const internals = [...cylBores, ...pistons, ...rods, ...throws, crank, camshaft, ...valves];
  const turboG = new THREE.Group(); turboG.position.set(0.32, 0.06, 0.08); engG.add(turboG);
  const turbine = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.032, 12, 28), mat.cast); turbine.rotation.y = Math.PI / 2; turboG.add(turbine);
  const compHouse = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.032, 12, 28), mat.alu); compHouse.rotation.y = Math.PI / 2; compHouse.position.z = 0.12; turboG.add(compHouse);
  const turboShaft = cyl(0.012, 0.012, 0.16, mat.steel, 8, 0, 0, 0.06); turboShaft.rotation.x = Math.PI / 2; turboG.add(turboShaft);
  const impeller = new THREE.Group(); impeller.position.z = 0.12; for (let k = 0; k < 9; k++) { const b = box(0.05, 0.008, 0.02, mat.chrome, 0, 0, 0, false); b.rotation.z = k / 9 * Math.PI * 2; b.rotation.y = 0.6; impeller.add(b); } turboG.add(impeller);
  const turbine2 = new THREE.Group(); for (let k = 0; k < 9; k++) { const b = box(0.045, 0.008, 0.02, mat.steel, 0, 0, 0, false); b.rotation.z = k / 9 * Math.PI * 2; b.rotation.y = -0.6; turbine2.add(b); } turboG.add(turbine2);
  const airbox = box(0.22, 0.14, 0.2, mat.plastic, -0.2, 0.33, 0.36); engG.add(airbox);
  const intakePipe = tube([V3(-0.1, 0.33, 0.36), V3(0.15, 0.3, 0.34), V3(0.32, 0.15, 0.25), V3(0.32, 0.06, 0.2)], 0.028, mat.plastic, 32); engG.add(intakePipe);
  const chargePipe = tube([V3(0.32, 0.06, 0.2), V3(0.5, -0.05, 0.2), V3(0.62, -0.1, 0), V3(0.62, -0.1, -0.25)], 0.024, mat.alu, 32); engG.add(chargePipe);
  const intercooler = box(0.05, 0.28, 0.5, mat.alu, 0.64, -0.06, 0, true); engG.add(intercooler); for (let i = 0; i < 9; i++) intercooler.add(box(0.052, 0.002, 0.5, mat.steel, 0, -0.12 + i * 0.03, 0, false));
  const manifold = tube([V3(0.62, -0.1, -0.25), V3(0.5, 0.1, -0.3), V3(0.25, 0.25, -0.2), V3(0.2, 0.3, 0.1)], 0.024, mat.alu, 32); engG.add(manifold);
  const radiator = box(0.04, 0.42, 0.9, mat.steel, 0.72, 0.02, 0, true); engG.add(radiator);
  const fan = new THREE.Group(); fan.position.set(0.66, 0.02, 0); for (let k = 0; k < 7; k++) { const b = box(0.01, 0.17, 0.04, mat.plastic, 0, 0.085, 0, false); const h = new THREE.Group(); h.add(b); h.rotation.x = k / 7 * Math.PI * 2; fan.add(h); } engG.add(fan);
  const coolantRes = box(0.1, 0.12, 0.1, new THREE.MeshStandardMaterial({ color: 0xd8dee8, transparent: true, opacity: 0.6, roughness: 0.4 }), 0.15, 0.38, 0.42); engG.add(coolantRes);
  const exManifold = new THREE.Group(); EZ.forEach(z => exManifold.add(tube([V3(-0.2, 0.28, z), V3(-0.28, 0.2, z), V3(-0.3, 0.08, 0.1)], 0.018, mat.steel, 16))); engG.add(exManifold);
  const battery = box(0.24, 0.19, 0.17, mat.plastic, -0.3, 0.35, -0.62, true); battery.add(box(0.24, 0.02, 0.17, mat.paintDark, 0, 0.1, 0, false)); engG.add(battery);
  new Part('Engine', engG, V3(1.5, 1.2, 0), 'mech');
  const shroud = [radiator, fan, intercooler, airbox, intakePipe, chargePipe, manifold, coolantRes, exManifold, battery, turbine, compHouse];

  /* transmission */
  const trG = new THREE.Group(); trG.position.set(1.42, 0.44, -0.42); car.add(trG);
  const trCase = box(0.42, 0.34, 0.36, mat.cast, 0, 0, 0, true); trG.add(trCase);
  const gearMeshes = []; const shaftA = cyl(0.016, 0.016, 0.4, mat.steel, 10, 0, 0.07, 0); shaftA.rotation.x = Math.PI / 2; trG.add(shaftA);
  const shaftB = cyl(0.016, 0.016, 0.4, mat.steel, 10, 0, -0.07, 0); shaftB.rotation.x = Math.PI / 2; trG.add(shaftB);
  const gearR = [[0.05, 0.10], [0.06, 0.09], [0.07, 0.08], [0.08, 0.07], [0.09, 0.06], [0.10, 0.05], [0.105, 0.045]];
  gearR.forEach(([ra, rb], i) => { const z = -0.15 + i * 0.05;
    const ga = new THREE.Mesh(gearGeo(ra, Math.round(ra * 160), 0.02), mat.alu); ga.position.set(0, 0.07, z); trG.add(ga);
    const gb = new THREE.Mesh(gearGeo(rb, Math.round(rb * 160), 0.02), mat.alu); gb.position.set(0, -0.07, z); trG.add(gb); gearMeshes.push([ga, gb]); });
  const clutchA = cyl(0.1, 0.1, 0.02, mat.steel, 32, 0, 0, 0.2); clutchA.rotation.x = Math.PI / 2; trG.add(clutchA);
  const clutchB = cyl(0.085, 0.085, 0.02, mat.steel, 32, 0, 0, 0.23); clutchB.rotation.x = Math.PI / 2; trG.add(clutchB);
  new Part('Transmission', trG, V3(0, 1.4, -1.0), 'mech');
  const dsG = new THREE.Group(); car.add(dsG);
  const dsL = cyl(0.018, 0.018, 0.62, mat.steel, 10, WX, 0.34, -0.45); dsL.rotation.x = Math.PI / 2; dsG.add(dsL);
  const dsR = cyl(0.018, 0.018, 1.0, mat.steel, 10, WX, 0.34, 0.2); dsR.rotation.x = Math.PI / 2; dsG.add(dsR);
  [-0.72, 0.72, -0.3, 0.65].forEach(z => { const cv = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 10), mat.cast); cv.position.set(WX, 0.34, z); dsG.add(cv); });
  new Part('Driveshafts', dsG, V3(0, -0.8, 0), 'mech');

  /* ================= interior ================= */
  const intG = new THREE.Group(); car.add(intG);
  intG.add(box(3.0, 0.02, 1.4, mat.leather, -0.5, 0.26, 0, false));
  const dashShape = (() => { const s = new THREE.Shape(); s.moveTo(0.3, 0.55); s.lineTo(0.85, 0.55); s.lineTo(0.85, 0.9); s.quadraticCurveTo(0.6, 0.99, 0.42, 0.98); s.lineTo(0.3, 0.72); s.closePath(); return s; })();
  const dashGeo = new THREE.ExtrudeGeometry(dashShape, { depth: 1.42, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 2 }); dashGeo.translate(0, 0, -0.71);
  const dash = new THREE.Mesh(dashGeo, mat.plastic); edges(dash, 30); intG.add(dash);
  const ambient = box(0.01, 0.008, 1.3, mat.blueGlow.clone(), 0.325, 0.79, 0, false); ambient.rotation.z = -0.43; ambient.material.opacity = 0; intG.add(ambient);
  function screenTex(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.minFilter = THREE.LinearFilter; return { c, t, g: c.getContext('2d') }; }
  const clusterS = screenTex(512, 256), infoS = screenTex(512, 320);
  const cluster = new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.13), new THREE.MeshBasicMaterial({ map: clusterS.t, transparent: true })); cluster.position.set(0.372, 0.9, 0.38); cluster.rotation.order = 'ZYX'; cluster.rotation.set(0, -Math.PI / 2, -0.43); intG.add(cluster);
  intG.add(box(0.16, 0.02, 0.3, mat.plastic, 0.44, 1.0, 0.38, false));
  const info = new THREE.Mesh(new THREE.PlaneGeometry(0.25, 0.155), new THREE.MeshBasicMaterial({ map: infoS.t, transparent: true })); info.position.set(0.36, 0.87, -0.02); info.rotation.order = 'ZYX'; info.rotation.set(0, -Math.PI / 2, -0.43); intG.add(info);
  { const bz = box(0.02, 0.19, 0.29, mat.plastic, 0.375, 0.87, -0.02, false); bz.rotation.z = -0.43; intG.add(bz); }
  const climate = box(0.03, 0.05, 0.28, mat.plastic, 0.30, 0.76, -0.02, true); climate.rotation.z = -0.43; intG.add(climate); for (let i = 0; i < 3; i++) { const kn = cyl(0.012, 0.012, 0.01, mat.chrome, 16, -0.017, 0, -0.08 + i * 0.08); kn.rotation.z = Math.PI / 2; climate.add(kn); }
  intG.add(box(0.9, 0.22, 0.24, mat.plastic, -0.1, 0.42, 0, true)); intG.add(box(0.03, 0.16, 0.03, mat.leather, 0.1, 0.6, 0, false)); intG.add(box(0.05, 0.03, 0.06, mat.chrome, 0.1, 0.68, 0, false));
  intG.add(box(0.12, 0.006, 0.08, mat.paintDark, 0.3, 0.535, 0, true)); intG.add(box(0.3, 0.05, 0.2, mat.leather, -0.4, 0.55, 0, false));
  const swG = new THREE.Group(); swG.position.set(0.36, 0.86, 0.38); swG.rotation.z = -0.35; intG.add(swG);
  const swAxis = V3(1, 0, 0);
  const swRim = new THREE.Mesh(new THREE.TorusGeometry(0.175, 0.02, 12, 40), mat.leather); swRim.rotation.y = Math.PI / 2; swG.add(swRim);
  const swSpokes = new THREE.Group(); [0.52, -0.52, Math.PI].forEach(a => { const s = box(0.02, 0.03, 0.17, mat.plastic, 0, 0, 0, false); const h = new THREE.Group(); h.add(s); s.position.z = 0.09; h.rotation.x = a - Math.PI / 2; swSpokes.add(h); }); swG.add(swSpokes);
  const swAirbag = cyl(0.075, 0.075, 0.03, mat.leather, 24); swAirbag.rotation.z = Math.PI / 2; swG.add(swAirbag);
  const swBadge = new THREE.Mesh(new THREE.TorusGeometry(0.02, 0.005, 8, 24), mat.chrome); swBadge.rotation.y = Math.PI / 2; swBadge.position.x = -0.02; swG.add(swBadge);
  const swCtrl = new THREE.Group(); [0.09, -0.09].forEach(z => swCtrl.add(box(0.015, 0.05, 0.04, mat.chrome, -0.01, -0.02, z, true))); swG.add(swCtrl);
  const swPaddles = new THREE.Group(); [0.1, -0.1].forEach(z => swPaddles.add(box(0.01, 0.03, 0.07, mat.alu, 0.05, 0.03, z, true))); swG.add(swPaddles);
  const swColumn = cyl(0.03, 0.04, 0.2, mat.plastic, 16); swColumn.rotation.z = Math.PI / 2; swColumn.position.x = 0.14; swG.add(swColumn);
  const swParts = [[swAirbag, -0.22], [swBadge, -0.22], [swRim, -0.06], [swSpokes, -0.06], [swCtrl, 0.06], [swPaddles, 0.16], [swColumn, 0.3]];
  swParts.forEach(([o]) => o.userData.home = o.position.clone());
  function seat(x, z, w) { const g = new THREE.Group(); g.position.set(x, 0.42, z); g.add(box(0.5, 0.1, w, mat.leather, 0, 0, 0, true));
    const back = new THREE.Group(); back.position.set(-0.22, 0.05, 0); back.add(box(0.1, 0.6, w, mat.leather, 0, 0.3, 0, true)); const hr = box(0.08, 0.12, 0.22, mat.leather, 0, 0.68, 0, true); back.add(hr); back.rotation.z = 0.3; g.add(back); g.userData = { back, hr }; return g; }
  const seatD = seat(-0.25, 0.38, 0.5), seatP = seat(-0.25, -0.38, 0.5); intG.add(seatD, seatP);
  const rearSeat = new THREE.Group(); rearSeat.position.set(-1.15, 0.42, 0); rearSeat.add(box(0.5, 0.1, 1.3, mat.leather, 0, 0, 0, true)); const rb = box(0.1, 0.6, 1.3, mat.leather, -0.22, 0.35, 0, true); rb.rotation.z = 0.25; rearSeat.add(rb); [0.4, -0.4].forEach(z => rearSeat.add(box(0.08, 0.12, 0.22, mat.leather, -0.34, 0.72, z, true))); intG.add(rearSeat);
  const rearArm = box(0.35, 0.08, 0.24, mat.leather, -1.0, 0.48, 0, true); rearArm.position.set(-1.28, 0.62, 0); intG.add(rearArm);
  const doorPanels = [];
  [1, -1].forEach(s => { const a = box(1.0, 0.5, 0.03, mat.plastic, 0.16, 0.55, s * 0.795, false), b = box(0.95, 0.5, 0.03, mat.plastic, -0.92, 0.55, s * 0.795, false); intG.add(a, b); doorPanels.push(a, b);
    [0.35, -1.05].forEach(x => { const sp = cyl(0.07, 0.07, 0.01, mat.paintDark, 24, x, 0.42, s * 0.78); sp.rotation.x = Math.PI / 2; intG.add(sp); doorPanels.push(sp); }); });
  const bootVol = box(1.0, 0.5, 1.3, new THREE.MeshBasicMaterial({ color: 0x3d7bff, transparent: true, opacity: 0, wireframe: true }), -1.75, 0.55, 0, false); intG.add(bootVol);
  new Part('Interior', intG, V3(0, 1.6, 0), 'int');

  /* ================= safety ================= */
  const safeG = new THREE.Group(); car.add(safeG);
  const airbags = [];
  const ab = (x, y, z, sx, sy, sz) => { const m = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 16), mat.airbag.clone()); m.position.set(x, y, z); m.userData.s = V3(sx, sy, sz); m.scale.set(0.001, 0.001, 0.001); safeG.add(m); airbags.push(m); };
  ab(0.25, 0.9, 0.38, 0.2, 0.22, 0.22); ab(0.25, 0.9, -0.38, 0.26, 0.24, 0.3); ab(-0.1, 0.75, 0.72, 0.18, 0.28, 0.06); ab(-0.1, 0.75, -0.72, 0.18, 0.28, 0.06); ab(-0.6, 1.2, 0.72, 0.95, 0.16, 0.05); ab(-0.6, 1.2, -0.72, 0.95, 0.16, 0.05);
  const cellBox = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(2.6, 1.15, 1.55)), new THREE.LineBasicMaterial({ color: 0x7fa8ff, transparent: true, opacity: 0 })); cellBox.position.set(-0.45, 0.8, 0); safeG.add(cellBox);
  const crumpleF = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1.4, 0.7, 1.5)), new THREE.LineBasicMaterial({ color: 0xffb347, transparent: true, opacity: 0 })); crumpleF.position.set(1.6, 0.6, 0); safeG.add(crumpleF);
  const crumpleR = crumpleF.clone(); crumpleR.material = crumpleF.material.clone(); crumpleR.position.set(-2.0, 0.6, 0); crumpleR.scale.set(0.5, 1, 1); safeG.add(crumpleR);
  const rings = []; [-2.32, 2.32].forEach(x => { [-0.55, -0.18, 0.18, 0.55].forEach(z => { const r = new THREE.Mesh(new THREE.RingGeometry(0.02, 0.03, 24), new THREE.MeshBasicMaterial({ color: 0x7fa8ff, transparent: true, opacity: 0, side: THREE.DoubleSide })); r.position.set(x, 0.4, z); r.rotation.y = Math.PI / 2; r.userData.t = Math.random(); safeG.add(r); rings.push(r); }); });
  const wheelRings = []; [[WX, TR], [WX, -TR], [-WX, TR], [-WX, -TR]].forEach(([x, z]) => { const r = new THREE.Mesh(new THREE.RingGeometry(0.3, 0.33, 40), new THREE.MeshBasicMaterial({ color: 0x7fa8ff, transparent: true, opacity: 0, side: THREE.DoubleSide })); r.position.set(x, WR, z * 1.05); safeG.add(r); wheelRings.push(r); });
  const camCone = new THREE.Mesh(new THREE.ConeGeometry(0.6, 1.6, 4, 1, true), new THREE.MeshBasicMaterial({ color: 0x7fa8ff, transparent: true, opacity: 0, wireframe: true })); camCone.rotation.z = Math.PI / 2; camCone.rotation.y = Math.PI / 4; camCone.position.set(-3.1, 0.55, 0); safeG.add(camCone);

  /* ================= dimension lines ================= */
  const dimG = new THREE.Group(); car.add(dimG);
  function dimLine(a, b, tick) { const g = new THREE.Group(); const m = new THREE.LineBasicMaterial({ color: 0x7fa8ff, transparent: true, opacity: 0 });
    g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([a, b]), m)); [a, b].forEach(p => g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([p.clone().add(tick), p.clone().sub(tick)]), m)));
    g.userData = { m }; dimG.add(g); return g; }
  const dims = { L: dimLine(V3(-2.3, 0.1, 1.2), V3(2.3, 0.1, 1.2), V3(0, 0.06, 0)), WB: dimLine(V3(-WX, 0.5, 1.0), V3(WX, 0.5, 1.0), V3(0, 0.06, 0)), H: dimLine(V3(-2.45, 0, 0.9), V3(-2.45, 1.507, 0.9), V3(0.06, 0, 0)), GC: dimLine(V3(0.3, 0, 1.05), V3(0.3, 0.179, 1.05), V3(0.06, 0, 0)), W: dimLine(V3(2.6, 0.9, -0.876), V3(2.6, 0.9, 0.876), V3(0, 0.06, 0)), B: dimLine(V3(-2.25, 0.3, 0.9), V3(-1.25, 0.3, 0.9), V3(0, 0.06, 0)) };

  /* ================= particles + flow ================= */
  const PN = isMobile ? 1500 : 3600;
  const pos = new Float32Array(PN * 3), tgt = new Float32Array(PN * 3), rnd = new Float32Array(PN * 3);
  const bodyPos = bodyGeo.attributes.position, ghPos = ghGeo.attributes.position;
  for (let i = 0; i < PN; i++) { const src = (i % 4 === 0) ? ghPos : bodyPos; const k = Math.floor(Math.random() * src.count);
    tgt[i * 3] = src.getX(k); tgt[i * 3 + 1] = src.getY(k); tgt[i * 3 + 2] = src.getZ(k);
    const r = 6 + Math.random() * 6, th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
    rnd[i * 3] = Math.sin(ph) * Math.cos(th) * r; rnd[i * 3 + 1] = Math.abs(Math.sin(ph) * Math.sin(th) * r) * 0.6; rnd[i * 3 + 2] = Math.cos(ph) * r; }
  const pGeo = new THREE.BufferGeometry(); pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const pMat = new THREE.PointsMaterial({ color: 0x9dbcff, size: isMobile ? 0.02 : 0.016, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
  const particles = new THREE.Points(pGeo, pMat); car.add(particles);
  const flowCurve = new THREE.CatmullRomCurve3([V3(1.42, 0.62, 0.14), V3(1.42, 0.5, -0.1), V3(1.42, 0.44, -0.42), V3(1.42, 0.36, -0.55), V3(WX, 0.34, -TR), V3(WX, 0.0, -TR), V3(WX - 0.5, 0.0, -TR), V3(WX - 1.6, 0.0, -TR)]);
  const flowCurveR = new THREE.CatmullRomCurve3([V3(1.42, 0.44, -0.42), V3(1.42, 0.36, -0.2), V3(WX, 0.34, TR), V3(WX, 0.0, TR), V3(WX - 0.5, 0.0, TR), V3(WX - 1.6, 0.0, TR)]);
  const flowLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(flowCurve.getPoints(120)), new THREE.LineBasicMaterial({ color: 0x3d7bff, transparent: true, opacity: 0 })); car.add(flowLine);
  car.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(flowCurveR.getPoints(100)), flowLine.material));
  const FN = isMobile ? 60 : 140; const fGeo = new THREE.BufferGeometry(); fGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(FN * 3), 3));
  const flowPts = new THREE.Points(fGeo, new THREE.PointsMaterial({ color: 0xbfd4ff, size: 0.045, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); car.add(flowPts);

  /* extras that live outside the car group */
  const grid = new THREE.GridHelper(40, 80, 0x3d7bff, 0x1b2a4a); grid.material.transparent = true; grid.material.opacity = 0; grid.position.y = 0.002;
  const roadG = new THREE.Group(); for (let i = 0; i < 24; i++) { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.05), new THREE.MeshBasicMaterial({ color: 0x7fa8ff, transparent: true, opacity: 0 })); m.rotation.x = -Math.PI / 2; m.position.set(-6 + i * 0.8, 0.004, 1.15); roadG.add(m); }

  /* ---------- registries ---------- */
  const keyOf = { Body: 'body', Glass: 'glass', Hood: 'hood', 'Front door': 'door', 'Rear door': 'door', Mirrors: 'door', 'LED headlights': 'light', Grille: 'grille', Rear: 'rear', 'Front wheel': 'wheel', 'Rear wheel': 'wheel', Suspension: 'susp', Exhaust: 'susp', Engine: 'engine', Transmission: 'trans', Driveshafts: 'susp', Interior: 'interior' };
  parts.forEach(pt => pt.key = keyOf[pt.name]);
  const casingMats = casing.map(m => m.material), internalMats = internals.map(o => o.material), casingEdges = casing.map(m => m.children.find(c => c.isLineSegments));
  const shroudMats = []; shroud.forEach(o => o.traverse(x => { if (x.isMesh) shroudMats.push(x.material); }));
  const trInternals = [shaftA, shaftB, clutchA, clutchB, ...gearMeshes.flat()].map(o => o.material); const trCaseEdge = trCase.children.find(x => x.isLineSegments);
  const doorPanelMats = doorPanels.map(o => o.material);
  const lampMats = []; lightsG.traverse(o => { if (o.isMesh && o.name !== 'cone') lampMats.push(o.material); }); const cones = lightsG.children.filter(o => o.name === 'cone');
  const tailMats = []; rearG.children.forEach(o => { if (o.isMesh && o.material.emissive && o.material.emissive.r > 0.5) tailMats.push(o.material); });
  [...lampMats, ...tailMats].forEach(m => m.userData.keep = true);

  /* ---------- screen painters ---------- */
  function paintCluster(t, on, speed, rpm, gear) { const { g, c } = clusterS; const W = c.width, H = c.height; g.clearRect(0, 0, W, H); g.fillStyle = '#05070c'; g.fillRect(0, 0, W, H); if (on < 0.02) { clusterS.t.needsUpdate = true; return; }
    g.globalAlpha = on; const arc = (cx, max, val, label, unit) => { g.lineWidth = 3; g.strokeStyle = 'rgba(127,168,255,.25)'; g.beginPath(); g.arc(cx, 140, 88, Math.PI * 0.75, Math.PI * 2.25); g.stroke();
      g.strokeStyle = '#7fa8ff'; g.lineWidth = 5; g.beginPath(); g.arc(cx, 140, 88, Math.PI * 0.75, Math.PI * 0.75 + Math.PI * 1.5 * clamp(val / max, 0, 1)); g.stroke();
      for (let i = 0; i <= 8; i++) { const a = Math.PI * 0.75 + i / 8 * Math.PI * 1.5; g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(cx + Math.cos(a) * 76, 140 + Math.sin(a) * 76); g.lineTo(cx + Math.cos(a) * 82, 140 + Math.sin(a) * 82); g.stroke(); }
      g.fillStyle = '#f1f3f7'; g.font = '600 46px "Barlow Condensed"'; g.textAlign = 'center'; g.fillText(Math.round(val), cx, 150); g.font = '11px "IBM Plex Mono"'; g.fillStyle = '#a9b1c2'; g.fillText(unit, cx, 172); g.fillStyle = '#7fa8ff'; g.fillText(label, cx, 236); };
    arc(120, 220, speed, 'SPEED', 'km/h'); arc(392, 7000, rpm, 'REV', 'rpm');
    g.fillStyle = '#f1f3f7'; g.font = '600 40px "Barlow Condensed"'; g.fillText(gear, 256, 120); g.font = '11px "IBM Plex Mono"'; g.fillStyle = '#a9b1c2'; g.fillText('D · SPORT', 256, 145); g.fillText('RANGE 512 km', 256, 190); g.fillStyle = '#7fa8ff'; g.fillRect(226, 200, 60 * 0.72, 4); g.fillStyle = 'rgba(255,255,255,.15)'; g.fillRect(226 + 60 * 0.72, 200, 60 * 0.28, 4); g.fillStyle = '#a9b1c2'; g.fillText('FUEL', 256, 222);
    g.globalAlpha = 1; clusterS.t.needsUpdate = true; }
  function paintInfo(t, on) { const { g, c } = infoS; const W = c.width, H = c.height; g.fillStyle = '#05070c'; g.fillRect(0, 0, W, H); if (on < 0.02) { infoS.t.needsUpdate = true; return; } g.globalAlpha = on;
    const tabs = ['NAVIGATION', 'MEDIA', 'PHONE', 'VEHICLE', 'CLIMATE']; const active = Math.floor(t / 2.4) % tabs.length;
    g.font = '500 12px "IBM Plex Mono"'; tabs.forEach((n, i) => { g.fillStyle = i === active ? '#f1f3f7' : '#6b7387'; g.textAlign = 'left'; g.fillText(n, 18 + i * 98, 30); if (i === active) { g.fillStyle = '#3d7bff'; g.fillRect(18 + i * 98, 38, 70, 2); } });
    g.strokeStyle = 'rgba(127,168,255,.15)'; g.lineWidth = 1; for (let i = 0; i < 10; i++) { g.beginPath(); g.moveTo(0, 60 + i * 28); g.lineTo(W, 60 + i * 28); g.stroke(); g.beginPath(); g.moveTo(i * 56, 50); g.lineTo(i * 56, H); g.stroke(); }
    if (active === 0) { g.strokeStyle = '#7fa8ff'; g.lineWidth = 4; g.beginPath(); g.moveTo(40, 300); g.quadraticCurveTo(160, 220, 250, 200); g.quadraticCurveTo(360, 180, 440, 90); g.stroke(); g.fillStyle = '#f1f3f7'; g.beginPath(); g.arc(250, 200, 7, 0, 7); g.fill(); g.font = '600 30px "Barlow Condensed"'; g.fillText('2.4 km · Mumbai–Pune Expy', 30, 90); g.font = '12px "IBM Plex Mono"'; g.fillStyle = '#a9b1c2'; g.fillText('ARRIVAL 18:42', 30, 112); }
    else if (active === 1) { g.fillStyle = '#1b2a4a'; g.fillRect(30, 70, 120, 120); g.fillStyle = '#f1f3f7'; g.font = '600 34px "Barlow Condensed"'; g.fillText('NOW PLAYING', 170, 100); g.font = '12px "IBM Plex Mono"'; g.fillStyle = '#a9b1c2'; g.fillText('WIRELESS APP-CONNECT · CARPLAY', 170, 124); g.fillStyle = '#3d7bff'; g.fillRect(170, 160, (t % 30) / 30 * 300, 4); g.fillStyle = 'rgba(255,255,255,.15)'; g.fillRect(170 + (t % 30) / 30 * 300, 160, 300 - (t % 30) / 30 * 300, 4); }
    else if (active === 2) { g.fillStyle = '#f1f3f7'; g.font = '600 34px "Barlow Condensed"'; g.fillText('RECENT CALLS', 30, 100); g.font = '12px "IBM Plex Mono"'; g.fillStyle = '#a9b1c2'; ['SERVICE CENTRE · 11:02', 'HOME · 09:18', 'OFFICE · YESTERDAY'].forEach((s, i) => g.fillText(s, 30, 140 + i * 32)); }
    else if (active === 3) { g.fillStyle = '#f1f3f7'; g.font = '600 34px "Barlow Condensed"'; g.fillText('VEHICLE STATUS', 30, 100); g.font = '12px "IBM Plex Mono"'; g.fillStyle = '#a9b1c2'; ['TYRE PRESSURE  2.3 / 2.3 / 2.2 / 2.3 bar', 'OIL LEVEL  OK', 'NEXT SERVICE  7,400 km', 'DOORS  CLOSED'].forEach((s, i) => g.fillText(s, 30, 140 + i * 32)); }
    else { g.fillStyle = '#f1f3f7'; g.font = '600 54px "Barlow Condensed"'; g.fillText('22 °C', 30, 120); g.fillText('22 °C', 300, 120); g.font = '12px "IBM Plex Mono"'; g.fillStyle = '#a9b1c2'; g.fillText('DRIVER', 30, 145); g.fillText('PASSENGER', 300, 145); g.fillText('AUTO · FAN 3 · REAR VENTS ON', 30, 200); }
    g.globalAlpha = 1; infoS.t.needsUpdate = true; }
  paintCluster(0, 0); paintInfo(0, 0);

  const pickMeshes = []; car.traverse(o => { if (o.isMesh && o.userData.part) pickMeshes.push(o); });

  /* ---------- per-frame update ---------- */
  const anim = { crankA: 0, wheelA: 0, gearA: 0, roadX: 0, frame: 0, lastGear: 0 };
  let shellParts = parts.filter(pt => pt.group === 'shell');           // swapped for GLB parts when a model is loaded
  const mechParts = parts.filter(pt => pt.group === 'mech'); let intParts = parts.filter(pt => pt.group === 'int'); let steerParts = [];

  /** s = evaluated track values for this frame (see tracks.js); camera = THREE camera; returns events */
  function update(s, dt, t, camera, asmOf) {
    anim.frame++;
    const { solid, fade, edge, mech, intVis, cut, rpm, transCut, flow, flowOn, susp, brake, spin, road, dash, steerX, seat: seatA, safety, airbag, cell, head, hero, gear: g } = s;
    const shellOp = lerp(0.03, 1, solid) * fade, shellEdge = clamp((1 - solid) * 0.85 + edge * 0.7, 0, 1) * fade;
    const camOut = smooth(Math.abs(camera.position.z), 0.72, 0.95) * intVis;   // outside the car while the cabin chapter is on
    for (const pt of shellParts) { pt.set(asmOf(pt.key), shellOp, shellEdge); if (camOut > 0.01 && /door/i.test(pt.name)) { const k = 1 - 0.8 * camOut; pt.mats.forEach(m => m.opacity *= k); pt.edges.forEach(e => e.material.opacity *= k * 0.5); } }
    for (const pt of mechParts) pt.set(asmOf(pt.key), mech * fade, (0.35 * mech + edge * 0.5) * fade);
    for (const pt of intParts) pt.set(asmOf(pt.key), intVis * fade, edge * 0.5 * fade);
    for (const pt of steerParts) pt.obj.position.x -= 0.22 * steerX;
    const doorMul = 1 - smooth(Math.abs(camera.position.z), 0.72, 0.95); for (const m of doorPanelMats) m.opacity *= doorMul;
    /* engine */
    casingMats.forEach(m => m.opacity *= 1 - 0.94 * cut); shroudMats.forEach(m => m.opacity *= 1 - 0.8 * cut); internalMats.forEach(m => m.opacity *= cut);
    casingEdges.forEach(e => { if (cut > 0.02) { e.visible = true; e.material.opacity = Math.max(e.material.opacity, cut * 0.8 * mech * fade); } });
    anim.crankA += dt * (4 + rpm * 40); const ph = [0, Math.PI, Math.PI, 0];
    pistons.forEach((pm, i) => { const a = anim.crankA + ph[i]; const pinY = -0.06 + 0.035 * Math.cos(a), pinX = 0.035 * Math.sin(a); pm.position.y = 0.10 + 0.035 * Math.cos(a);
      const r = rods[i]; const dx = 0 - pinX, dy = (pm.position.y - 0.03) - pinY; const len = Math.hypot(dx, dy); r.position.set(pinX + dx / 2, pinY + dy / 2, EZ[i]); r.rotation.z = -Math.atan2(dx, dy); r.scale.y = len / 0.16; throws[i].rotation.z = a; });
    valves.forEach((v, i) => { v.position.y = 0.33 + 0.012 * Math.max(0, Math.sin(anim.crankA / 2 + i * 0.8)); }); camshaft.rotation.z = anim.crankA / 2;
    impeller.rotation.z -= dt * (5 + rpm * 90); turbine2.rotation.z -= dt * (5 + rpm * 90); fan.rotation.x += dt * (2 + rpm * 20);
    /* transmission */
    const gearChanged = g !== anim.lastGear; anim.lastGear = g; anim.gearA += dt * (1 + rpm * 6);
    gearMeshes.forEach(([ga, gb], i) => { const [ra, rb] = gearR[i]; ga.rotation.z = anim.gearA; gb.rotation.z = -anim.gearA * ra / rb + Math.PI / Math.round(rb * 160); const on = i === g - 1; ga.material.emissive.setHex(on ? 0x3d7bff : 0); gb.material.emissive.setHex(on ? 0x3d7bff : 0); ga.material.emissiveIntensity = gb.material.emissiveIntensity = on ? 0.9 : 0; });
    clutchA.material.emissive.setHex(g % 2 === 1 ? 0x3d7bff : 0); clutchA.material.emissiveIntensity = 0.8; clutchB.material.emissive.setHex(g > 0 && g % 2 === 0 ? 0x3d7bff : 0); clutchB.material.emissiveIntensity = 0.8;
    trCase.material.opacity *= 1 - 0.94 * transCut; trInternals.forEach(m => m.opacity *= transCut); if (transCut > 0.02) { trCaseEdge.visible = true; trCaseEdge.material.opacity = Math.max(trCaseEdge.material.opacity, transCut * 0.8 * mech * fade); }
    /* power flow */
    flowLine.material.opacity = flowOn * 0.45; flowPts.material.opacity = flowOn;
    if (flowOn > 0.01) { const arr = fGeo.attributes.position.array; for (let i = 0; i < FN; i++) { let u = flow * 1.15 - (i / FN) * 0.4 + 0.01 * Math.sin(t * 4 + i); const right = i % 2 === 1; let pnt;
        if (u < 0 || u > 1.0) { arr[i * 3] = 0; arr[i * 3 + 1] = -9; arr[i * 3 + 2] = 0; continue; }
        if (right) { if (u < 0.3) { arr[i * 3 + 1] = -9; continue; } pnt = flowCurveR.getPoint(clamp((u - 0.3) / 0.7, 0, 1)); } else pnt = flowCurve.getPoint(u);
        arr[i * 3] = pnt.x; arr[i * 3 + 1] = pnt.y + 0.01; arr[i * 3 + 2] = pnt.z; } fGeo.attributes.position.needsUpdate = true; }
    /* suspension, brakes, wheels, road */
    springs.forEach((sp, i) => { sp.scale.y = 1 - 0.2 * susp * (0.5 + 0.5 * Math.sin(t * 2.6 + i * 1.4)); });
    calipers.forEach(m => { m.material.emissive.setHex(0xff3b1f); m.material.emissiveIntensity = brake * 0.9 * (0.6 + 0.4 * Math.sin(t * 8)); });
    const flowSpin = flowOn * smooth(flow, 0.55, 0.85);
    anim.wheelA -= dt * (spin * 14 + flowSpin * 9 + road * 22 + susp * 3 * (1 - brake) + (s.p > 92 ? rpm * 20 : 0)) * (1 - brake * 0.95);
    for (const w of shellWheels()) w.rotation.z = anim.wheelA; discs.forEach(d => d.rotation.set(Math.PI / 2, 0, anim.wheelA));
    anim.roadX -= dt * road * 6; roadG.children.forEach((m, i) => { m.material.opacity = road * 0.45; m.position.x = ((i * 0.8 + anim.roadX) % 19.2 + 19.2) % 19.2 - 9.6; });
    grid.material.opacity = s.grid * fade;
    /* lights */
    lampMats.forEach(m => m.emissiveIntensity = head * 2.6); tailMats.forEach(m => m.emissiveIntensity = head * 1.6); cones.forEach(cn => cn.material.opacity = head * 0.07 * solid);
    for (const fn of lampHooks) fn(head);
    /* particles */
    const pOp = s.pOp; pMat.opacity = pOp * 0.9; particles.visible = pOp > 0.01;
    if (particles.visible) { const e = hero * hero * (3 - 2 * hero); const jit = 0.02 * (1 - e); for (let i = 0; i < PN * 3; i++) pos[i] = rnd[i] + (tgt[i] - rnd[i]) * e + Math.sin(t * 2 + i) * jit; pGeo.attributes.position.needsUpdate = true; particles.rotation.y = (1 - e) * t * 0.05; }
    /* interior */
    ambient.material.opacity = dash * 0.9 * intVis;
    if (dash > 0.01 && anim.frame % 2 === 0) { const spd = 62 + 22 * Math.sin(t * 0.35), rv = 1900 + 900 * Math.sin(t * 0.5); paintCluster(t, dash, spd, rv, 'D' + (3 + Math.round(Math.sin(t * 0.5)))); paintInfo(t, dash); }
    else if (dash <= 0.01 && anim.frame % 30 === 0) { paintCluster(t, 0); paintInfo(t, 0); }
    swParts.forEach(([o, off]) => { o.position.copy(o.userData.home).addScaledVector(swAxis, off * steerX); });
    const q = seatA * 4; seatD.position.x = -0.25 - 0.08 * Math.sin(clamp(q, 0, 1) * Math.PI); seatD.position.y = 0.42 + 0.04 * Math.sin(clamp(q - 1, 0, 1) * Math.PI); seatD.userData.back.rotation.z = 0.3 + 0.2 * Math.sin(clamp(q - 2, 0, 1) * Math.PI); seatD.userData.hr.position.y = 0.68 + 0.05 * Math.sin(clamp(q - 3, 0, 1) * Math.PI);
    const ra = s.rearArm; rearArm.rotation.z = 1.2 - 1.2 * ra; rearArm.position.set(lerp(-1.28, -1.05, ra), lerp(0.62, 0.5, ra), 0);
    /* safety */
    const abe = airbag < 1 ? 1.7 * airbag * airbag - 0.7 * airbag * airbag * airbag : 1;
    airbags.forEach((m, i) => { const sc = m.userData.s; const br = 1 + 0.03 * Math.sin(t * 3 + i); m.scale.set(Math.max(0.001, sc.x * abe * br), Math.max(0.001, sc.y * abe * br), Math.max(0.001, sc.z * abe * br)); m.material.opacity = 0.65 * airbag * fade; m.visible = airbag > 0.01; });
    rings.forEach(r => { const phz = (t * 0.6 + r.userData.t) % 1; r.scale.setScalar(1 + phz * 9); r.material.opacity = safety * (1 - phz) * 0.8; r.visible = safety > 0.01; });
    wheelRings.forEach((r, i) => { r.material.opacity = safety * 0.55 * (0.5 + 0.5 * Math.sin(t * 5 + i)); r.visible = safety > 0.01; r.rotation.y = Math.PI / 2; });
    cellBox.material.opacity = cell * 0.9; crumpleF.material.opacity = cell * 0.6; crumpleR.material.opacity = cell * 0.6; camCone.material.opacity = safety * 0.5; camCone.rotation.x = t * 0.5;
    /* dimensions */
    for (const k in dims) { const v = s['dim' + k]; dims[k].userData.m.opacity = v; dims[k].visible = v > 0.01; }
    bootVol.material.opacity = Math.max(api.bootHighlight ? 0.35 : 0, s.dimB * 0.3 * (s.p < 86 ? 1 : 0));
    return { gearChanged };
  }
  const lampHooks = [];
  function shellWheels() { return api.glbWheels || wheels; }

  const api = { car, grid, roadG, parts, pickMeshes, update, mat, Part, edges, bootHighlight: false, glbWheels: null, lampHooks,
    /** Replace the procedural shell with parts built from a loaded model. */
    useShell(newParts, wheelSpinGroups, cabinParts, newSteerParts) { shell.visible = false; shellParts = newParts; api.glbWheels = wheelSpinGroups; if (cabinParts && cabinParts.length) { intG.visible = false; intParts = cabinParts; steerParts = newSteerParts || []; } pickMeshes.length = 0; car.traverse(o => { if (o.isMesh && o.userData.part) pickMeshes.push(o); }); },
    restoreShell() { shell.visible = true; intG.visible = true; shellParts = parts.filter(pt => pt.group === 'shell'); intParts = parts.filter(pt => pt.group === 'int'); steerParts = []; api.glbWheels = null; } };
  return api;
}
