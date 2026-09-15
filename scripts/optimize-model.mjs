/* Compresses public/models/virtus.glb in place: dedup, prune, weld, resize textures, Draco geometry.
   Usage: npm run model:optimize   (keeps a copy at public/models/virtus.source.glb) */
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, prune, weld, draco, textureCompress, flatten, join } from '@gltf-transform/functions';
import draco3d from 'draco3d';
import fs from 'node:fs';
import sharp from 'sharp';
const src = 'public/models/virtus.glb', bak = 'model-source/virtus.source.glb';
if (!fs.existsSync(src) && !fs.existsSync(bak)) { console.error('No model at', src); process.exit(1); }
if (!fs.existsSync(bak)) fs.copyFileSync(src, bak);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'draco3d.encoder': await draco3d.createEncoderModule(), 'draco3d.decoder': await draco3d.createDecoderModule() });
const doc = await io.read(bak);
await doc.transform(dedup(), prune(), weld(), textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [2048, 2048] }), draco({ method: 'edgebreaker' }));
await io.write(src, doc);
console.log('written', src, (fs.statSync(src).size / 1e6).toFixed(1), 'MB (source', (fs.statSync(bak).size / 1e6).toFixed(1), 'MB)');
