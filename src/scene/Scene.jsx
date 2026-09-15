import React, { useEffect, useMemo, useRef, Suspense } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer, MeshReflectorMaterial, ContactShadows } from '@react-three/drei';
import { useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

/* GLTFLoader that also accepts a JSON wrapper { b64: "<glb>" } so the model can live on hosts that refuse binary files. */
class ModelLoader extends THREE.Loader {
  load(url, onLoad, onProgress, onError) {
    const draco = new DRACOLoader().setDecoderPath('draco/');
    const gltf = new GLTFLoader(this.manager).setDRACOLoader(draco);
    if (!url.endsWith('.json')) return gltf.load(url, onLoad, onProgress, onError);
    fetch(url).then(r => r.json()).then(j => { const bin = Uint8Array.from(atob(j.b64), c => c.charCodeAt(0)); gltf.parse(bin.buffer, '', onLoad, onError); }).catch(onError);
  }
}
import { EffectComposer, Bloom, Vignette, Noise, SMAA } from '@react-three/postprocessing';
import { createShowroom, clamp, lerp, smooth } from './builders.js';
import { buildShellFromGLTF } from './glbShell.js';
import { camTrack, evalTracks, asmOf, navRanges } from '../data/tracks.js';
import { hotspots, dimLabels } from '../data/hotspots.js';
import { MODEL, ENGINE } from '../data/modelConfig.js';
import { store, isMobile, reduced } from '../store.js';

function Studio() {
  return (
    <Environment resolution={256} frames={1}>
      <color attach="background" args={['#0a0d14']} />
      <Lightformer intensity={2.2} rotation-x={Math.PI / 2} position={[0, 5, 0]} scale={[7, 1.4, 1]} color="#ffffff" />
      <Lightformer intensity={1.2} rotation-y={Math.PI / 2} position={[-7, 2, 0]} scale={[7, 3, 1]} color="#9fc0ff" />
      <Lightformer intensity={0.9} rotation-y={-Math.PI / 2} position={[7, 2, 0]} scale={[7, 3, 1]} color="#ffffff" />
      <Lightformer intensity={0.6} position={[0, 1.5, -8]} scale={[10, 2, 1]} color="#3d7bff" />
      <Lightformer intensity={0.4} position={[0, 1.2, 8]} scale={[10, 1.5, 1]} color="#ffffff" />
    </Environment>
  );
}

function Floor({ fadeRef }) {
  const mat = useRef();
  useFrame(() => { if (mat.current) mat.current.opacity = fadeRef.current; });
  return (
    <mesh rotation-x={-Math.PI / 2} receiveShadow>
      <planeGeometry args={[60, 60]} />
      {isMobile
        ? <meshStandardMaterial ref={mat} color="#0c0f16" roughness={0.6} metalness={0.15} transparent />
        : <MeshReflectorMaterial ref={mat} blur={[400, 120]} resolution={1024} mixBlur={1} mixStrength={18} roughness={0.9} depthScale={1.1} minDepthThreshold={0.4} maxDepthThreshold={1.4} color="#0a0d13" metalness={0.5} mirror={0.35} transparent />}
    </mesh>
  );
}

/** Loads the real Virtus GLB and swaps it in for the procedural shell. Rendered only once the file is known to exist. */
function ModelShell({ api }) {
  const gltf = useLoader(ModelLoader, MODEL.url);
  const holo = useLoader(ModelLoader, MODEL.holoUrl);
  const built = useMemo(() => buildShellFromGLTF(gltf, api, holo), [gltf, holo, api]);
  useEffect(() => {
    api.car.add(built.root); api.useShell(built.parts, built.wheelSpins, built.cabinParts, built.steerParts);
    const hook = head => { built.lampMats.forEach(m => m.emissiveIntensity = head * 2.4); built.tailMats.forEach(m => m.emissiveIntensity = head * 1.5); };
    api.lampHooks.push(hook); store.setUI({ model: 'glb' });
    return () => { api.car.remove(built.root); api.restoreShell(); const i = api.lampHooks.indexOf(hook); if (i >= 0) api.lampHooks.splice(i, 1); };
  }, [built, api]);
  return null;
}

/** Animated crank/rod/piston assembly placed inside the procedural block. */
const rigCache = new WeakMap();
function EngineRig({ api }) {
  const gltf = useLoader(ModelLoader, ENGINE.url);
  const built = useMemo(() => {
    if (rigCache.has(gltf)) return rigCache.get(gltf);
    const root = new THREE.Group(); const src = gltf.scene; root.add(src);
    src.scale.setScalar(ENGINE.scale); src.rotation.set(...ENGINE.rotation); src.updateMatrixWorld(true);
    /* put the crank axis on the procedural crank position */
    const c = new THREE.Vector3(...ENGINE.crankCentre).multiplyScalar(ENGINE.scale).applyEuler(new THREE.Euler(...ENGINE.rotation));
    src.position.set(ENGINE.crankLocal[0] - c.x, ENGINE.crankLocal[1] - c.y, ENGINE.crankLocal[2] - c.z);
    const mats = []; src.traverse(o => { if (o.isMesh) { o.material = new THREE.MeshStandardMaterial({ color: 0xc9ced6, metalness: 0.9, roughness: 0.28, envMapIntensity: 0.7, transparent: true }); o.castShadow = true; o.userData.part = api.parts.find(p => p.name === 'Engine'); mats.push(o.material); } });
    let mixer = null; if (gltf.animations && gltf.animations.length) { mixer = new THREE.AnimationMixer(src); const a = mixer.clipAction(gltf.animations[0]); a.setLoop(THREE.LoopRepeat, Infinity); a.play(); }
    const out = { root, mixer, mats }; rigCache.set(gltf, out); return out;
  }, [gltf, api]);
  useEffect(() => { api.useEngineRig(built.root, built.mixer, built.mats); return () => api.dropEngineRig(); }, [built, api]);
  return null;
}

export default function Scene({ modelReady }) {
  const api = useMemo(() => createShowroom({ isMobile }), []);
  const fadeRef = useRef(1);
  const { camera, scene, gl } = useThree();
  useEffect(() => { store.api = api; store.gl = gl; store.scene = scene; scene.fog = new THREE.FogExp2('#050609', 0.035); gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 0.95; }, [api, scene, gl]);
  const key = useRef(), sweep = useRef(), sweepT = useRef(), cabin = useRef();
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const pointer = useMemo(() => new THREE.Vector2(9, 9), []);
  const hovered = useRef(null), pointerMoved = useRef(false), doorDone = useRef(false), frame = useRef(0), hoverAt = useRef({ p: 0, t: 0 });
  const tmp = useMemo(() => new THREE.Vector3(), []);
  useEffect(() => { const h = e => { pointer.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); pointerMoved.current = true; hoverAt.current.t = performance.now(); }; const leave = () => { pointer.set(9, 9); pointerMoved.current = true; }; addEventListener('pointermove', h); document.addEventListener('pointerleave', leave); return () => { removeEventListener('pointermove', h); document.removeEventListener('pointerleave', leave); }; }, [pointer]);
  const clearHover = () => { if (!hovered.current) return; hovered.current.mats.forEach(mm => { if (mm.userData.hov) { mm.emissive.setHex(0); mm.userData.hov = false; } }); hovered.current = null; store.setUI({ hoverName: '' }); };

  useFrame((state, dtRaw) => {
    const dt = Math.min(0.05, dtRaw); const t = state.clock.elapsedTime; frame.current++;
    const k = reduced ? 1 : 1 - Math.pow(0.0005, dt); store.p += (store.target - store.p) * k; if (Math.abs(store.target - store.p) < 0.0005) store.p = store.target;
    const p = store.p; store.t = t;
    /* camera */
    const c = camTrack(p).slice(); const m = store.mouse, ms = store.mSm; ms.x += (m.x - ms.x) * 0.05; ms.y += (m.y - ms.y) * 0.05;
    /* narrow / portrait viewports: pull exterior shots back so the car (and its labels) still fit the width */
    const aspect = innerWidth / innerHeight; const dx = c[0] - c[3], dy = c[1] - c[4], dz = c[2] - c[5]; const dist = Math.hypot(dx, dy, dz);
    if (aspect < 1.5 && dist > 2) { const k = Math.pow(1.5 / aspect, 0.55) * smooth(dist, 2, 3.5) + (1 - smooth(dist, 2, 3.5)); c[0] = c[3] + dx * k; c[1] = c[4] + dy * k; c[2] = c[5] + dz * k; }
    camera.position.set(c[0], c[1], c[2]); camera.fov = c[6]; camera.updateProjectionMatrix(); camera.lookAt(c[3], c[4], c[5]);
    const par = (c[6] > 45 ? 0.03 : 0.09) * (reduced ? 0 : 1); camera.translateX(ms.x * par); camera.translateY(-ms.y * par * 0.6); camera.lookAt(c[3], c[4], c[5]);
    /* scene state */
    const s = evalTracks(p); fadeRef.current = s.fade;
    const ev = api.update(s, dt, t, camera, asmOf(p));
    if (sweep.current) { sweep.current.intensity = s.sweep * 40; sweep.current.position.set(lerp(-7, 7, s.hero), 4.5, 5); sweepT.current.position.set(lerp(-3, 3, s.hero), 0.5, 0); }
    if (cabin.current) cabin.current.intensity = s.dash * 1.2;
    if (ev.gearChanged && store.sound) store.sound.click();
    if (!doorDone.current && p > 59.6 && p < 62) { doorDone.current = true; store.sound?.thud(); } if (p < 58) doorDone.current = false;
    store.sound?.update(s.rpm, (p > 8 && p < 22) ? s.rpm : 0);
    /* DOM: chapters, progress, nav, gears, hotspots, dims */
    const dom = store.dom; if (dom.fade[0] && !dom.fade[0].el.isConnected && dom.recollect) dom.recollect();
    for (const f of dom.fade) { const w = Math.min(0.7, (f.b - f.a) * 0.28); const fi = f.a <= 0 ? 1 : smooth(p, f.a, f.a + w), fo = f.b >= 100 ? 1 : 1 - smooth(p, f.b - w, f.b); const o = fi * fo; f.el.style.opacity = o; f.el.style.visibility = o > 0.01 ? '' : 'hidden'; if (f.move) f.el.style.transform = 'translateY(' + ((1 - o) * 24) + 'px)'; }
    if (dom.prog) dom.prog.style.width = p + '%';
    let ni = 0; for (let i = 0; i < navRanges.length; i++) if (p >= navRanges[i] - 0.2) ni = i; dom.nav.forEach((b, i) => b && b.classList.toggle('on', i === ni));
    dom.gears.forEach((el, i) => el && el.classList.toggle('on', i === s.gear - 1));
    const project = (x, y, z) => { tmp.set(x, y, z).project(camera); return { x: (tmp.x + 1) / 2 * innerWidth, y: (1 - tmp.y) / 2 * innerHeight, z: tmp.z }; };
    for (const h of hotspots) { const el = dom.hs[h.id]; if (!el) continue; const vis = smooth(p, h.r[0], h.r[0] + 0.5) * (1 - smooth(p, h.r[1] - 0.5, h.r[1])); let on = vis > 0.02;
      if (on) { const sc = project(...h.pos); if (sc.z > 1 || sc.x < -40 || sc.x > innerWidth + 40 || sc.y < -40 || sc.y > innerHeight + 40) on = false; else { el.style.left = sc.x + 'px'; el.style.top = sc.y + 'px'; } }
      el.style.opacity = on ? vis * 0.95 : 0; el.classList.toggle('on', on); }
    for (const k2 in dimLabels) { const el = dom.dims[k2]; if (!el) continue; const v = s['dim' + k2]; el.style.opacity = v; if (v > 0.01) { const sc = project(...dimLabels[k2][3]); el.style.left = sc.x + 'px'; el.style.top = sc.y + 'px'; } }
    /* hover */
    if (hovered.current && (Math.abs(p - hoverAt.current.p) > 0.4 || performance.now() - hoverAt.current.t > 2500)) clearHover();
    if (pointerMoved.current && frame.current % 3 === 0 && !isMobile) { pointerMoved.current = false; raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(api.pickMeshes, false).filter(h => h.object.visible && h.object.material.opacity > 0.25 && h.object.parent.visible);
      const hit = hits[0] ? hits[0].object.userData.part : null;
      if (hit !== hovered.current) { clearHover(); hovered.current = hit; hoverAt.current.p = p;
        if (hit) hit.mats.forEach(mm => { if (mm.emissive && !mm.userData.keep && mm.emissive.getHex() === 0) { mm.emissive.setHex(0x3d7bff); mm.emissiveIntensity = 0.3; mm.userData.hov = true; } });
        store.setUI({ hoverName: hit ? hit.name : '' }); }
      if (dom.hover) { dom.hover.style.left = ((pointer.x + 1) / 2 * innerWidth) + 'px'; dom.hover.style.top = ((1 - pointer.y) / 2 * innerHeight) + 'px'; } }
  });

  return (
    <>
      <color attach="background" args={['#050609']} />
      <hemisphereLight args={['#2a3a5a', '#000000', 0.45]} />
      <spotLight ref={key} position={[4, 9, 3]} intensity={isMobile ? 40 : 60} angle={0.55} penumbra={0.7} decay={1.2} distance={40} castShadow={!isMobile} shadow-mapSize={[2048, 2048]} shadow-bias={-0.0005} />
      <directionalLight position={[-6, 3, -5]} intensity={1.1} color="#3d7bff" />
      <directionalLight position={[5, 2, 7]} intensity={0.35} color="#dfe8ff" />
      <spotLight ref={sweep} position={[6, 5, 6]} intensity={0} angle={0.35} penumbra={0.9} decay={1.5} distance={30} target={sweepT.current || undefined} />
      <object3D ref={sweepT} position={[0, 0.5, 0]} />
      <pointLight ref={cabin} position={[-0.3, 1.25, 0]} intensity={0} distance={3} decay={2} color="#a9c4ff" />
      <Studio />
      <Floor fadeRef={fadeRef} />
      {!isMobile && <ContactShadows position={[0, 0.001, 0]} opacity={0.6} scale={14} blur={2.4} far={2} resolution={1024} frames={1} />}
      <primitive object={api.car} />
      <primitive object={api.grid} />
      <primitive object={api.roadG} />
      {modelReady && <Suspense fallback={null}><ModelShell api={api} /></Suspense>}
      {modelReady && <Suspense fallback={null}><EngineRig api={api} /></Suspense>}
      {!isMobile && !reduced && (
        <EffectComposer multisampling={0}>
          <Bloom luminanceThreshold={0.85} luminanceSmoothing={0.3} intensity={0.55} mipmapBlur />
          <Noise opacity={0.05} />
          <Vignette eskil={false} offset={0.2} darkness={0.75} />
          <SMAA />
        </EffectComposer>
      )}
    </>
  );
}
