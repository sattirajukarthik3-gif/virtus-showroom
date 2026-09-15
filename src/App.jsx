import React, { useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import Lenis from 'lenis';
import Scene from './scene/Scene.jsx';
import Overlay from './ui/Overlay.jsx';
import Hotspots from './ui/Hotspots.jsx';
import Panel from './ui/Panel.jsx';
import { Nav, Tools } from './ui/Chrome.jsx';
import { store, isMobile, reduced } from './store.js';
import { MODEL } from './data/modelConfig.js';

export default function App() {
  const [ready, setReady] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  useEffect(() => {
    /* smooth scroll → target progress */
    const lenis = new Lenis({ lerp: reduced ? 1 : 0.09, smoothWheel: !reduced }); store.lenis = lenis;
    const read = () => { store.target = Math.max(0, Math.min(100, scrollY / (document.documentElement.scrollHeight - innerHeight) * 100)); };
    lenis.on('scroll', read); read(); if (scrollY > 0) store.p = store.target;
    let raf; const loop = t => { lenis.raf(t); raf = requestAnimationFrame(loop); }; raf = requestAnimationFrame(loop);
    const pm = e => { store.mouse.x = (e.clientX / innerWidth - 0.5) * 2; store.mouse.y = (e.clientY / innerHeight - 0.5) * 2; };
    addEventListener('pointermove', pm); addEventListener('resize', read);
    /* does the real model exist? (Vite dev answers HTML for missing files) */
    fetch(MODEL.url, { method: 'HEAD' }).then(r => { const ct = r.headers.get('content-type') || ''; const ok = r.ok && !ct.includes('text/html'); setModelReady(ok); store.setUI({ model: ok ? 'loading' : 'none' }); }).catch(() => store.setUI({ model: 'none' }));
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => setTimeout(() => setReady(true), 300));
    return () => { cancelAnimationFrame(raf); lenis.destroy(); removeEventListener('pointermove', pm); removeEventListener('resize', read); };
  }, []);
  return (
    <>
      <div id="loader" className={ready ? 'off' : ''}>ASSEMBLING VIRTUS<small>loading fonts and geometry</small></div>
      <div id="stage">
        <Canvas dpr={[1, isMobile ? 1.5 : 2]} shadows={!isMobile} camera={{ fov: 34, near: 0.05, far: 80, position: [7.5, 1.3, 9.5] }} gl={{ antialias: isMobile, powerPreference: 'high-performance' }}>
          <Scene modelReady={modelReady} />
        </Canvas>
      </div>
      <div id="vignette" />
      <svg id="grain" aria-hidden="true"><filter id="nz"><feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="2" stitchTiles="stitch"><animate attributeName="seed" values="1;2;3;4;5;6;7;8;9" dur=".6s" repeatCount="indefinite" /></feTurbulence><feColorMatrix type="saturate" values="0" /></filter><rect width="100%" height="100%" filter="url(#nz)" /></svg>
      <Nav />
      <Tools />
      <Overlay />
      <Hotspots />
      <Panel />
      <div id="scroll-space" />
    </>
  );
}
