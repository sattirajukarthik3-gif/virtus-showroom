/* Wraps public/models/virtus.glb as JSON { b64 } for hosts that only serve web media types. */
import fs from 'node:fs';
for (const name of ['virtus', 'virtus.holo', 'engine', 'engine-rig']) { const glb = fs.readFileSync(`public/models/${name}.glb`); fs.writeFileSync(`public/models/${name}.json`, JSON.stringify({ b64: glb.toString('base64') })); }
console.log('wrote public/models/virtus.json', (fs.statSync('public/models/virtus.json').size / 1e6).toFixed(1), 'MB');
