/* Lists node and material names in the GLB so modelConfig.js patterns can be tuned. */
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.read(process.argv[2] || 'public/models/virtus.glb');
const root = doc.getRoot();
console.log('--- nodes ---'); root.listNodes().forEach(n => { const m = n.getMesh(); if (m) console.log(n.getName(), '→', m.listPrimitives().map(p => p.getMaterial()?.getName()).join(', ')); });
console.log('--- materials ---'); root.listMaterials().forEach(m => console.log(m.getName()));
console.log('--- textures ---', root.listTextures().length);
