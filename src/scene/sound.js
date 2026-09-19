/* Synthesised showroom audio — nothing is loaded from disk. Off until the user toggles it. */
export function createSound() {
  let ctx, master, osc, osc2, oscG, noiseF, noiseG, roarF, roarG, on = false;
  function init() {
    ctx = new (window.AudioContext || window.webkitAudioContext)(); master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
    osc = ctx.createOscillator(); osc.type = 'sawtooth'; osc.frequency.value = 45; const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 220; oscG = ctx.createGain(); oscG.gain.value = 0.12; osc.connect(lp).connect(oscG).connect(master); osc.start();
    osc2 = ctx.createOscillator(); osc2.type = 'square'; osc2.frequency.value = 90; const lp2 = ctx.createBiquadFilter(); lp2.type = 'lowpass'; lp2.frequency.value = 500; osc2.connect(lp2).connect(oscG); osc2.start();   // second harmonic — the "bark" under load
    const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate); const d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource(); noise.buffer = buf; noise.loop = true; noiseF = ctx.createBiquadFilter(); noiseF.type = 'bandpass'; noiseF.Q.value = 6; noiseF.frequency.value = 800; noiseG = ctx.createGain(); noiseG.gain.value = 0; noise.connect(noiseF).connect(noiseG).connect(master); noise.start();
    const roar = ctx.createBufferSource(); roar.buffer = buf; roar.loop = true; roarF = ctx.createBiquadFilter(); roarF.type = 'lowpass'; roarF.frequency.value = 350; roarG = ctx.createGain(); roarG.gain.value = 0; roar.connect(roarF).connect(roarG).connect(master); roar.start();   // exhaust roar under load
  }
  function burst(freq, dur, type = 'sine', vol = 0.3) { if (!on) return; const o = ctx.createOscillator(); o.type = type; o.frequency.value = freq; const g = ctx.createGain(); g.gain.setValueAtTime(vol, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur); o.connect(g).connect(master); o.start(); o.stop(ctx.currentTime + dur); }
  return {
    toggle() { if (!ctx) init(); on = !on; if (on && ctx.state === 'suspended') ctx.resume(); master.gain.setTargetAtTime(on ? 1 : 0, ctx.currentTime, 0.1); return on; },
    /** rpm 0..1 sets pitch; spool 0..1 the turbo whistle; load 0..1 (gear-change beat) makes it louder and adds roar. Shifts drop pitch quickly (short time constant). */
    update(rpm, spool, load = 0) { if (!on) return; const t = ctx.currentTime, tc = load > 0 ? 0.04 : 0.1;
      const f = 40 + rpm * (120 + 60 * load); osc.frequency.setTargetAtTime(f, t, tc); osc2.frequency.setTargetAtTime(f * 2, t, tc);
      oscG.gain.setTargetAtTime(rpm > 0.02 ? 0.12 + 0.16 * load : 0, t, 0.15);
      noiseF.frequency.setTargetAtTime(600 + spool * 3000, t, 0.1); noiseG.gain.setTargetAtTime(spool * 0.05, t, 0.2);
      roarF.frequency.setTargetAtTime(250 + rpm * 500, t, tc); roarG.gain.setTargetAtTime(load * rpm * 0.09, t, 0.1); },
    click() { burst(1800, 0.05, 'square', 0.08); burst(220, 0.08, 'triangle', 0.15); }, blip() { burst(880, 0.12, 'sine', 0.1); }, thud() { burst(70, 0.35, 'sine', 0.5); burst(140, 0.1, 'triangle', 0.2); },
    get on() { return on; },
  };
}
