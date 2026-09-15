/* Wraps public/models/virtus.glb as JSON { b64 } for hosts that only serve web media types. */
import fs from 'node:fs';
const glb = fs.readFileSync('public/models/virtus.glb');
fs.writeFileSync('public/models/virtus.json', JSON.stringify({ b64: glb.toString('base64') }));
console.log('wrote public/models/virtus.json', (fs.statSync('public/models/virtus.json').size / 1e6).toFixed(1), 'MB');
