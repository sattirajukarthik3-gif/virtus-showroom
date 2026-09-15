/* Builds public/models/virtus.holo.glb: a decimated, texture-free copy of the car used only for the wireframe hologram. */
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { simplify, weld, prune, dedup, draco } from '@gltf-transform/functions';
import { MeshoptSimplifier } from 'meshoptimizer';
import draco3d from 'draco3d';
import fs from 'node:fs';
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'draco3d.encoder': await draco3d.createEncoderModule(), 'draco3d.decoder': await draco3d.createDecoderModule() });
const doc = await io.read('model-source/virtus.source.glb');
for (const m of doc.getRoot().listMaterials()) { m.setBaseColorTexture(null).setNormalTexture(null).setMetallicRoughnessTexture(null).setEmissiveTexture(null).setOcclusionTexture(null); }
await doc.transform(dedup(), weld(), simplify({ simplifier: MeshoptSimplifier, ratio: 0.22, error: 0.002 }), prune(), draco({ method: 'edgebreaker' }));
let tris = 0; for (const m of doc.getRoot().listMeshes()) for (const p of m.listPrimitives()) tris += p.getIndices() ? p.getIndices().getCount() / 3 : 0;
await io.write('public/models/virtus.holo.glb', doc);
console.log('virtus.holo.glb', (fs.statSync('public/models/virtus.holo.glb').size / 1e6).toFixed(2), 'MB,', Math.round(tris / 1000) + 'k tris');
