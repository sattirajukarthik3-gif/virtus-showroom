/* Builds public/models/engine.glb from the klaxoneer "Car Engine" source: heavy meshes (timing chain, valves) are
   decimated harder than the rest, everything is welded and Draco-compressed. Node names are kept for the animation rig. */
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { simplifyPrimitive, weld, prune, dedup, draco } from '@gltf-transform/functions';
import { MeshoptSimplifier } from 'meshoptimizer';
import draco3d from 'draco3d';
import fs from 'node:fs';
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'draco3d.encoder': await draco3d.createEncoderModule(), 'draco3d.decoder': await draco3d.createDecoderModule() });
const doc = await io.read('model-source/engine2.source.glb');
await doc.transform(dedup(), weld());
await MeshoptSimplifier.ready;
let before = 0, after = 0;
for (const mesh of doc.getRoot().listMeshes()) for (const prim of mesh.listPrimitives()) {
  const n = prim.getIndices() ? prim.getIndices().getCount() / 3 : 0; before += n;
  const ratio = n > 60000 ? 0.12 : n > 20000 ? 0.2 : n > 5000 ? 0.4 : 0.7;
  if (n > 2000) simplifyPrimitive(prim, { simplifier: MeshoptSimplifier, ratio, error: n > 20000 ? 0.02 : 0.005 });
  after += prim.getIndices() ? prim.getIndices().getCount() / 3 : 0;
}
await doc.transform(prune(), draco({ method: 'edgebreaker' }));
await io.write('public/models/engine.glb', doc);
console.log(`tris ${Math.round(before / 1000)}k → ${Math.round(after / 1000)}k, file ${(fs.statSync('public/models/engine.glb').size / 1e6).toFixed(2)} MB`);
