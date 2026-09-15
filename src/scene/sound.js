/* Synthesised showroom audio — nothing is loaded from disk. Off until the user toggles it. */
export function createSound() {
  let ctx, master, osc, oscG, noiseF, noiseG, on = false;
  function init() {
    ctx = new (window.AudioContext || window.webkitAudioContext)(); master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
    osc = ctx.createOscillator(); osc.type = 'sawtooth'; osc.frequency.value = 45; const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 220; oscG = ctx.createGain(); oscG.gain.value = 0.12; osc.connect(lp).connect(oscG).connect(master); osc.start();
    const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate); const d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource(); noise.buffer = buf; noise.loop = true; noiseF = ctx.createBiquadFilter(); noiseF.type = 'bandpass'; noiseF.Q.value = 6; noiseF.frequency.value = 800; noiseG = ctx.createGain(); noiseG.gain.value = 0; noise.connect(noiseF).connect(noiseG).connect(master); noise.start();
  }
  function burst(freq, dur, type = 'sine', vol = 0.3) { if (!on) return; const o = ctx.createOscillator(); o.type = type; o.frequency.value = freq; const g = ctx.createGain(); g.gain.setValueAtTime(vol, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur); o.connect(g).connect(master); o.start(); o.stop(ctx.currentTime + dur); }
  return {
    toggle() { if (!ctx) init(); on = !on; if (on && ctx.state === 'suspended') ctx.resume(); master.gain.setTargetAtTime(on ? 1 : 0, ctx.currentTime, 0.1); return on; },
    update(rpm, spool) { if (!on) return; osc.frequency.setTargetAtTime(40 + rpm * 120, ctx.currentTime, 0.1); oscG.gain.setTargetAtTime(rpm > 0.02 ? 0.12 : 0, ctx.currentTime, 0.2); noiseF.frequency.setTargetAtTime(600 + spool * 3000, ctx.currentTime, 0.1); noiseG.gain.setTargetAtTime(spool * 0.05, ctx.currentTime, 0.2); },
    click() { burst(1800, 0.05, 'square', 0.08); burst(220, 0.08, 'triangle', 0.15); }, blip() { burst(880, 0.12, 'sine', 0.1); }, thud() { burst(70, 0.35, 'sine', 0.5); burst(140, 0.1, 'triangle', 0.2); },
    get on() { return on; },
  };
}
