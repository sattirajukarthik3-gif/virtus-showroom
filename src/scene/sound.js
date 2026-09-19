/* Synthesised showroom audio — nothing is loaded from disk. Off until the user toggles it.
   Engine model: a turbo inline-four. Pitch follows the firing frequency (2 combustion events per crank turn:
   idle ~1,000 rpm ≈ 33 Hz, redline ~6,500 rpm ≈ 217 Hz), with detuned growl, half-order rumble, a bright
   harmonic that opens up under load, and soft-clipping for exhaust rasp. */
export function createSound() {
  let ctx, master, on = false;
  let eng = null;   // engine voice
  const RPM_IDLE = 1000, RPM_MAX = 6600;
  const firingHz = rpm01 => (RPM_IDLE + (RPM_MAX - RPM_IDLE) * rpm01) / 60 * 2;

  function shaper(amount) { const n = 1024, curve = new Float32Array(n); for (let i = 0; i < n; i++) { const x = i / (n - 1) * 2 - 1; curve[i] = Math.tanh(x * amount) / Math.tanh(amount); } const ws = ctx.createWaveShaper(); ws.curve = curve; ws.oversample = '2x'; return ws; }
  function noiseSource() { const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate); const d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; const s = ctx.createBufferSource(); s.buffer = buf; s.loop = true; s.start(); return s; }
  function osc(type, freq, dest, gain) { const o = ctx.createOscillator(); o.type = type; o.frequency.value = freq; const g = ctx.createGain(); g.gain.value = gain; o.connect(g).connect(dest); o.start(); return { o, g }; }

  function init() {
    ctx = new (window.AudioContext || window.webkitAudioContext)(); master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
    /* engine bus: voices → drive → body filter → master */
    const bus = ctx.createGain(); bus.gain.value = 0.0;
    const drive = shaper(2.6); const body = ctx.createBiquadFilter(); body.type = 'lowpass'; body.frequency.value = 1800; body.Q.value = 1.2;
    const presence = ctx.createBiquadFilter(); presence.type = 'peaking'; presence.frequency.value = 420; presence.gain.value = 5; presence.Q.value = 1;
    bus.connect(drive).connect(presence).connect(body).connect(master);
    const f0 = firingHz(0.05);
    const v1 = osc('sawtooth', f0, bus, 0.55);          // firing order fundamental
    const v2 = osc('sawtooth', f0 * 1.012, bus, 0.35);  // detuned twin → growl/beat
    const v3 = osc('square', f0 / 2, bus, 0.18);        // crank-order rumble
    const v4 = osc('sawtooth', f0 * 2, bus, 0.0);       // bright harmonic, opens with load
    /* exhaust rasp: noise through a bandpass that tracks the engine */
    const rasp = noiseSource(); const raspF = ctx.createBiquadFilter(); raspF.type = 'bandpass'; raspF.Q.value = 2.5; raspF.frequency.value = f0 * 6; const raspG = ctx.createGain(); raspG.gain.value = 0; rasp.connect(raspF).connect(raspG).connect(bus);
    /* turbo: whine (sine) + spool hiss (bandpass noise) */
    const whine = osc('sine', 900, master, 0);
    const hiss = noiseSource(); const hissF = ctx.createBiquadFilter(); hissF.type = 'bandpass'; hissF.Q.value = 5; hissF.frequency.value = 1200; const hissG = ctx.createGain(); hissG.gain.value = 0; hiss.connect(hissF).connect(hissG).connect(master);
    eng = { bus, body, v1, v2, v3, v4, raspF, raspG, whine, hissF, hissG };
  }
  function burst(freq, dur, type = 'sine', vol = 0.3) { if (!on) return; const o = ctx.createOscillator(); o.type = type; o.frequency.value = freq; const g = ctx.createGain(); g.gain.setValueAtTime(vol, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur); o.connect(g).connect(master); o.start(); o.stop(ctx.currentTime + dur); }
  function noiseBurst(fLo, fHi, dur, vol) { if (!on) return; const s = noiseSource(); const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 1.2; f.frequency.setValueAtTime(fHi, ctx.currentTime); f.frequency.exponentialRampToValueAtTime(fLo, ctx.currentTime + dur); const g = ctx.createGain(); g.gain.setValueAtTime(vol, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur); s.connect(f).connect(g).connect(master); s.stop(ctx.currentTime + dur); }

  return {
    toggle() { if (!ctx) init(); on = !on; if (on && ctx.state === 'suspended') ctx.resume(); master.gain.setTargetAtTime(on ? 1 : 0, ctx.currentTime, 0.1); return on; },
    /** rpm 0..1 (idle→redline), spool 0..1 turbo, load 0..1 throttle/load (gear-change beat). */
    update(rpm, spool, load = 0) {
      if (!on || !eng) return; const t = ctx.currentTime, tc = load > 0 ? 0.03 : 0.08;
      const f = firingHz(rpm), e = eng;
      e.v1.o.frequency.setTargetAtTime(f, t, tc); e.v2.o.frequency.setTargetAtTime(f * 1.012, t, tc); e.v3.o.frequency.setTargetAtTime(f / 2, t, tc); e.v4.o.frequency.setTargetAtTime(f * 2, t, tc);
      e.v4.g.gain.setTargetAtTime(0.08 + 0.3 * load, t, 0.1);
      e.bus.gain.setTargetAtTime(rpm > 0.02 ? 0.05 + 0.09 * rpm + 0.12 * load : 0, t, 0.12);
      e.body.frequency.setTargetAtTime(900 + rpm * 2600 + load * 1500, t, 0.1);          // opens up as it revs
      e.raspF.frequency.setTargetAtTime(f * 6, t, tc); e.raspG.gain.setTargetAtTime(0.05 * rpm + 0.25 * load * rpm, t, 0.08);
      const sp = Math.max(spool, load * rpm * 0.7);
      e.whine.o.frequency.setTargetAtTime(700 + sp * 5200, t, 0.06); e.whine.g.gain.setTargetAtTime(sp * 0.012, t, 0.1);
      e.hissF.frequency.setTargetAtTime(800 + sp * 3500, t, 0.08); e.hissG.gain.setTargetAtTime(sp * 0.035, t, 0.15);
    },
    /** Upshift: mechanical clack + turbo blow-off "pssh". */
    shift() { burst(2200, 0.04, 'square', 0.06); burst(160, 0.06, 'triangle', 0.12); noiseBurst(900, 5000, 0.28, 0.16); },
    click() { burst(1800, 0.05, 'square', 0.08); burst(220, 0.08, 'triangle', 0.15); },
    blip() { burst(880, 0.12, 'sine', 0.1); },
    thud() { burst(70, 0.35, 'sine', 0.5); burst(140, 0.1, 'triangle', 0.2); },
    get on() { return on; },
  };
}
