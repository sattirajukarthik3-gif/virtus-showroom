/* Showroom audio. Engine sounds are recordings (Pixabay Content Licence, see credits.js):
     idle.mp3    — "Rally Car Idle Loop 05" (freesound_community): loops under the engine chapters, pitch nudged by rpm
     dyno.mp3    — "Import car revs on Chassis Dyno with Turbo" (freesound_community): scrubbed by scroll through the gearbox chapter
     flutter.mp3 — "Turbo flutter" (spinopel): blow-off on each upshift
   UI blips, the door thud and the shift clack stay synthesised. Everything is off until the user toggles it. */
const BASE = (import.meta.env.BASE_URL || './');
const FILES = { idle: 'audio/idle.mp3', dyno: 'audio/dyno.mp3', flutter: 'audio/flutter.mp3' };
export const DYNO = { pStart: 22, pEnd: 29.5, tStart: 4.5, tEnd: 27 };   // scroll % → seconds in the recording

export function createSound() {
  let ctx, master, on = false, ready = false;
  const buf = {}; let idle = null, dyno = null;
  const tFor = p => DYNO.tStart + (p - DYNO.pStart) / (DYNO.pEnd - DYNO.pStart) * (DYNO.tEnd - DYNO.tStart);

  async function init() {
    ctx = new (window.AudioContext || window.webkitAudioContext)(); master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
    await Promise.all(Object.entries(FILES).map(async ([k, f]) => { const r = await fetch(BASE + f); buf[k] = await ctx.decodeAudioData(await r.arrayBuffer()); }));
    /* idle loop → lowpass (distance) → gain */
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2200; const g = ctx.createGain(); g.gain.value = 0; lp.connect(g).connect(master);
    const src = ctx.createBufferSource(); src.buffer = buf.idle; src.loop = true; src.connect(lp); src.start(); idle = { src, lp, g };
    const dg = ctx.createGain(); dg.gain.value = 0; dg.connect(master); dyno = { g: dg, src: null, t0: 0, off: 0, moving: 0 };
    ready = true;
  }
  function burst(freq, dur, type = 'sine', vol = 0.3) { if (!on || !ready) return; const o = ctx.createOscillator(); o.type = type; o.frequency.value = freq; const g = ctx.createGain(); g.gain.setValueAtTime(vol, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur); o.connect(g).connect(master); o.start(); o.stop(ctx.currentTime + dur); }
  function play(name, vol, offset = 0, dur) { if (!on || !ready) return; const s = ctx.createBufferSource(); s.buffer = buf[name]; const g = ctx.createGain(); g.gain.value = vol; s.connect(g).connect(master); s.start(0, offset, dur); return s; }
  function dynoSeek(p) { if (dyno.src) { try { dyno.src.stop(); } catch (e) {} } const s = ctx.createBufferSource(); s.buffer = buf.dyno; s.connect(dyno.g); const off = Math.min(buf.dyno.duration - 0.2, Math.max(0, tFor(p))); s.start(0, off); dyno.src = s; dyno.t0 = ctx.currentTime; dyno.off = off; }
  function dynoPos() { return dyno.src ? dyno.off + (ctx.currentTime - dyno.t0) : -1; }

  return {
    toggle() { if (!ctx) init(); on = !on; if (on && ctx.state === 'suspended') ctx.resume(); master.gain.setTargetAtTime(on ? 1 : 0, ctx.currentTime, 0.1); return on; },
    /** rpm 0..1, spool 0..1, load 0..1 (gear beat), p = scroll %, dt = frame seconds. */
    update(rpm, spool, load = 0, p = 0, dt = 0.016) {
      if (!on || !ready) return; const t = ctx.currentTime;
      const inGear = p > DYNO.pStart && p < DYNO.pEnd;
      /* idle loop: present whenever the engine is on screen; quieter under the dyno recording */
      idle.src.playbackRate.setTargetAtTime(0.85 + rpm * 0.75, t, 0.12);
      idle.lp.frequency.setTargetAtTime(1200 + rpm * 4000 + load * 1500, t, 0.1);
      idle.g.gain.setTargetAtTime(rpm > 0.02 ? (inGear ? 0.12 : 0.5) : 0, t, 0.25);
      /* dyno: scrub by scroll — plays while the reader is moving through the chapter, tracks the mapped position */
      if (inGear) {
        const want = tFor(p); const pos = dynoPos(); const moving = Math.abs(this._lastP - p) > 0.0004; this._lastP = p;
        dyno.moving = moving ? 1 : Math.max(0, dyno.moving - dt * 2.5);           // hold ~0.4 s after the last movement
        if (dyno.moving > 0 && (pos < 0 || Math.abs(pos - want) > 0.7)) dynoSeek(p);
        dyno.g.gain.setTargetAtTime(dyno.moving > 0 ? 0.9 : 0, t, dyno.moving > 0 ? 0.08 : 0.2);
        if (dyno.moving <= 0 && dyno.src && ctx.currentTime - dyno.t0 > 30) { try { dyno.src.stop(); } catch (e) {} dyno.src = null; }
      } else { dyno.g.gain.setTargetAtTime(0, t, 0.15); if (dyno.src && dyno.g.gain.value < 0.01) { try { dyno.src.stop(); } catch (e) {} dyno.src = null; } this._lastP = p; }
    },
    /** Upshift: clack + turbo blow-off from the flutter recording. */
    shift() { burst(2200, 0.04, 'square', 0.05); burst(160, 0.06, 'triangle', 0.1); play('flutter', 0.55, 0.05, 1.4); },
    click() { burst(1800, 0.05, 'square', 0.08); burst(220, 0.08, 'triangle', 0.15); },
    blip() { burst(880, 0.12, 'sine', 0.1); },
    thud() { burst(70, 0.35, 'sine', 0.5); burst(140, 0.1, 'triangle', 0.2); },
    _lastP: 0,
    get on() { return on; },
    /** QA probe */
    get state() { return ready ? { idleGain: +idle.g.gain.value.toFixed(3), idleRate: +idle.src.playbackRate.value.toFixed(2), dynoGain: +dyno.g.gain.value.toFixed(3), dynoPos: +dynoPos().toFixed(2), moving: +dyno.moving.toFixed(2) } : { ready: false }; },
  };
}
