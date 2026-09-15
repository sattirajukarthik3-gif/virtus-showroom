import React from 'react';
import { navItems } from '../data/tracks.js';
import { store, useUI, goTo } from '../store.js';
import { createSound } from '../scene/sound.js';

export function Nav() {
  return (
    <>
      <div id="prog"><i ref={el => { store.dom.prog = el; }} /></div>
      <nav id="nav" aria-label="Chapters"><ul>
        {navItems.map(([label, p], i) => <li key={label}><button ref={el => { store.dom.nav[i] = el; }} onClick={() => goTo(p)}>{label}</button></li>)}
      </ul></nav>
    </>
  );
}

export function Tools() {
  const ui = useUI();
  const toggleSound = () => { if (!store.sound) store.sound = createSound(); const on = store.sound.toggle(); store.setUI({ soundOn: on }); };
  const reset = () => { store.mouse.x = store.mouse.y = 0; store.setUI({ selected: null }); };
  const full = () => { const el = document.documentElement; if (document.fullscreenElement) document.exitFullscreen(); else (el.requestFullscreen || el.webkitRequestFullscreen)?.call(el)?.catch?.(() => {}); };
  return (
    <>
      <div id="tools">
        <button onClick={toggleSound} className={ui.soundOn ? 'on' : ''} aria-pressed={ui.soundOn}>{ui.soundOn ? '🔊 Sound on' : '🔇 Sound off'}</button>
        <button onClick={reset} title="Reset camera">Reset view</button>
        <button onClick={full} title="Fullscreen">Fullscreen</button>
      </div>
      <div id="hint"><b>Scroll</b> to move the camera · click a <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: 'var(--blue-2)' }} /> hotspot</div>
      {ui.model !== 'glb' && <div id="modelnote">{ui.model === 'checking' ? 'Checking for model…' : <>Procedural stand-in · drop <b>public/models/virtus.glb</b> for the real car</>}</div>}
    </>
  );
}
