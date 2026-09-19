/* Showroom audio: a single engine recording — "Import car revs on Chassis Dyno with Turbo" (freesound_community,
   Pixabay Content Licence) — scrubbed by scroll through the gearbox chapter, louder with each gear. No other sounds.
   Off until the user toggles it. */
const BASE = (import.meta.env.BASE_URL || './');
export const DYNO = { pStart: 22, pEnd: 29.5, tStart: 4.5, tEnd: 27 };   // scroll % → seconds in the recording

export function createSound() {
  let ctx, master, on = false, ready = false, buffer = null;
  const dyno = { g: null, src: null, t0: 0, off: 0, moving: 0 };
  const tFor = p => DYNO.tStart + (p - DYNO.pStart) / (DYNO.pEnd - DYNO.pStart) * (DYNO.tEnd - DYNO.tStart);
  async function init() {
    ctx = new (window.AudioContext || window.webkitAudioContext)(); master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
    const r = await fetch(BASE + 'audio/dyno.mp3'); buffer = await ctx.decodeAudioData(await r.arrayBuffer());
    dyno.g = ctx.createGain(); dyno.g.gain.value = 0; dyno.g.connect(master); ready = true;
  }
  function seek(p) { stop(); const s = ctx.createBufferSource(); s.buffer = buffer; s.connect(dyno.g); const off = Math.min(buffer.duration - 0.2, Math.max(0, tFor(p))); s.start(0, off); dyno.src = s; dyno.t0 = ctx.currentTime; dyno.off = off; }
  function stop() { if (dyno.src) { try { dyno.src.stop(); } catch (e) {} dyno.src = null; } }
  function pos() { return dyno.src ? dyno.off + (ctx.currentTime - dyno.t0) : -1; }
  let lastP = 0;
  return {
    toggle() { if (!ctx) init(); on = !on; if (on && ctx.state === 'suspended') ctx.resume(); master.gain.setTargetAtTime(on ? 1 : 0, ctx.currentTime, 0.1); return on; },
    /** load 0..1 grows with the gear; p = scroll %, dt = frame seconds. Plays only while the reader moves through the chapter. */
    update(rpm, spool, load = 0, p = 0, dt = 0.016) {
      if (!on || !ready) return; const t = ctx.currentTime;
      const inGear = p > DYNO.pStart && p < DYNO.pEnd;
      if (inGear) {
        const moving = Math.abs(lastP - p) > 0.0004; dyno.moving = moving ? 1 : Math.max(0, dyno.moving - dt * 2.5);
        const want = tFor(p), cur = pos();
        if (dyno.moving > 0 && (cur < 0 || Math.abs(cur - want) > 0.7)) seek(p);
        const vol = 0.4 + 0.6 * load;                                           // 1st gear ≈ 0.6 → 6th gear 1.0
        dyno.g.gain.setTargetAtTime(dyno.moving > 0 ? vol : 0, t, dyno.moving > 0 ? 0.08 : 0.25);
        if (dyno.moving <= 0 && dyno.src && dyno.g.gain.value < 0.005) stop();
      } else { dyno.g.gain.setTargetAtTime(0, t, 0.15); if (dyno.src && dyno.g.gain.value < 0.01) stop(); }
      lastP = p;
    },
    shift() {}, click() {}, blip() {}, thud() {},
    get on() { return on; },
    get state() { return ready ? { gain: +dyno.g.gain.value.toFixed(3), pos: +pos().toFixed(2), moving: +dyno.moving.toFixed(2) } : { ready: false }; },
  };
}
