/* Real engine: klaxoneer "Car Engine" (block, head, valvetrain, timing chain, crank pulley/flywheel) with the
   david.gnzlv rigged crank/rod/piston assembly slotted into its bores. Both CC BY 4.0 (Sketchfab). */
import * as THREE from 'three';
import { ENGINE } from '../data/modelConfig.js';

const K = ENGINE.klax;   // measurements of the klaxoneer file, in its own units

function bbox(o) { return new THREE.Box3().setFromObject(o); }

export function buildEngine(gltf, rigGltf, api) {
  const root = new THREE.Group(); root.name = 'EngineModel';
  const src = gltf.scene; root.add(src);
  src.scale.setScalar(K.scale); src.updateMatrixWorld(true);
  /* crank axis → procedural crank position (engine-local), bores centred on z=0 */
  src.position.set(ENGINE.crankLocal[0] - K.crank[0] * K.scale, ENGINE.crankLocal[1] - K.crank[1] * K.scale, ENGINE.crankLocal[2] - K.boreMidZ * K.scale);
  src.updateMatrixWorld(true);

  /* classify meshes by material + bounding box (the file has no meaningful node names) */
  const blockMats = [], hidden = [], spinners = [], allMats = [];
  const meshes = []; src.traverse(o => { if (o.isMesh) meshes.push(o); });   // collect first: attach() below re-parents
  for (const o of meshes) {
    const b = bbox(o); const size = b.getSize(new THREE.Vector3()).divideScalar(K.scale); const c = b.getCenter(new THREE.Vector3());
    c.sub(src.position).divideScalar(K.scale);            // back to file units (src has no rotation)
    const mname = o.material.name || '';
    o.material = o.material.clone(); o.material.transparent = true; o.material.envMapIntensity = 0.8; o.castShadow = true; o.receiveShadow = true;
    if (o.material.roughness !== undefined && o.material.metalness === 0) { o.material.metalness = 0.6; o.material.roughness = 0.45; }
    allMats.push(o.material); o.userData.part = api.parts.find(p => p.name === 'Engine');
    const nearCrankY = Math.abs(c.y - K.crank[1]) < 0.8, onCrankAxis = Math.abs(c.x - K.crank[0]) < 0.3;
    const isPiston = /^Material\.00[12]$/.test(mname) && size.x > 1.9 && size.x < 2.2 && size.z > 1.9 && size.z < 2.2 && size.y < 2.2 && c.y > -1.5 && c.y < 0.5;
    const isPin = mname === 'Material.001' && size.z > 1.4 && size.z < 1.8 && size.x < 0.5 && c.y > -1.2 && c.y < -0.6;
    const isRod = mname === 'Material.001' && size.y > 4.8 && size.y < 6.2 && size.z < 0.7;
    const isWeb = mname === 'Material.003' && nearCrankY;
    const isShaft = mname === 'Material.001' && size.z > 12 && size.x < 1.2;
    const isBolt = mname === 'Material.001' && size.x < 0.7 && size.y < 0.7 && Math.abs(c.y + 5.07) < 0.15;
    if (isPiston || isPin || isRod || isWeb || isShaft || isBolt) { hidden.push(o); o.visible = false; continue; }
    if (mname === 'Frame') blockMats.push(o.material);
    /* things on the crank axis that just spin: pulley, sprockets, flywheel */
    if (nearCrankY && onCrankAxis && size.x > 1 && size.x < 8 && Math.abs(size.x - size.y) < 0.2) {
      const pivot = new THREE.Group(); pivot.position.set(K.crank[0], K.crank[1], c.z); src.add(pivot); pivot.attach(o); spinners.push(pivot);
    }
  }

  /* rigged reciprocating assembly, stretched to this block's bore spacing / stroke */
  let mixer = null, rigMats = [];
  if (rigGltf) {
    const R = ENGINE.rig; const holder = new THREE.Group(); const rig = rigGltf.scene; holder.add(rig);
    rig.rotation.set(...R.rotation); holder.scale.set(R.stretch[0], R.stretch[1], R.stretch[2]);
    const pistonMid = new THREE.Vector3(R.pistonMidX, 0, 0).applyEuler(new THREE.Euler(...R.rotation));      // rig-space → rotated
    const crank = new THREE.Vector3(...R.crankCentre).applyEuler(new THREE.Euler(...R.rotation));
    holder.position.set(K.crank[0] + K.boreX - crank.x * R.stretch[0], K.crank[1] - crank.y * R.stretch[1], K.boreMidZ - pistonMid.z * R.stretch[2]);
    src.add(holder);
    rig.traverse(o => { if (o.isMesh) { o.material = new THREE.MeshStandardMaterial({ color: 0xd2d6dc, metalness: 0.9, roughness: 0.26, envMapIntensity: 0.8, transparent: true }); o.castShadow = true; o.userData.part = api.parts.find(p => p.name === 'Engine'); rigMats.push(o.material); } });
    if (rigGltf.animations?.length) { mixer = new THREE.AnimationMixer(rig); const a = mixer.clipAction(rigGltf.animations[0]); a.setLoop(THREE.LoopRepeat, Infinity); a.play(); }
  }
  return { root, blockMats, allMats, rigMats, spinners, mixer, hidden };
}
