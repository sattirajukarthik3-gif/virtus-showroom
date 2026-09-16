/* Compresses the accessory models (turbo, transaxle, brake, exhaust) from model-source/*.source.glb into public/models/. */
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, weld, prune, draco, textureCompress, simplifyPrimitive } from '@gltf-transform/functions';
import { MeshoptSimplifier } from 'meshoptimizer';
import draco3d from 'draco3d';
import sharp from 'sharp';
import fs from 'node:fs';
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'draco3d.encoder': await draco3d.createEncoderModule(), 'draco3d.decoder': await draco3d.createDecoderModule() });
await MeshoptSimplifier.ready;
for (const name of ['turbo', 'gearbox', 'brake', 'exhaust']) {
  const doc = await io.read(`model-source/${name}.source.glb`);
  await doc.transform(dedup(), weld(), textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [1024, 1024] }));
  let before = 0, after = 0;
  for (const mesh of doc.getRoot().listMeshes()) for (const prim of mesh.listPrimitives()) { const n = prim.getIndices() ? prim.getIndices().getCount() / 3 : 0; before += n; if (n > 8000) simplifyPrimitive(prim, { simplifier: MeshoptSimplifier, ratio: 0.45, error: 0.003 }); after += prim.getIndices() ? prim.getIndices().getCount() / 3 : 0; }
  await doc.transform(prune(), draco({ method: 'edgebreaker' }));
  await io.write(`public/models/${name}.glb`, doc);
  console.log(`${name}: ${Math.round(before / 1000)}k → ${Math.round(after / 1000)}k tris, ${(fs.statSync(`public/models/${name}.glb`).size / 1e6).toFixed(2)} MB`);
}
