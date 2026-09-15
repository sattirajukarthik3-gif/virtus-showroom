import { useSyncExternalStore } from 'react';
/* Mutable per-frame state lives here (no React re-renders); the few UI-facing fields notify subscribers. */
export const store = {
  p: 0, target: 0, t: 0, mouse: { x: 0, y: 0 }, mSm: { x: 0, y: 0 }, api: null, sound: null, lenis: null,
  dom: { fade: [], hs: {}, dims: {}, nav: [], prog: null, gears: [], hover: null },
  ui: { selected: null, soundOn: false, model: 'checking', hoverName: '' },
  listeners: new Set(),
  setUI(partial) { Object.assign(store.ui, partial); store.ui = { ...store.ui }; store.listeners.forEach(l => l()); },
};
export const useUI = () => useSyncExternalStore(l => { store.listeners.add(l); return () => store.listeners.delete(l); }, () => store.ui);
export const isMobile = typeof window !== 'undefined' && (matchMedia('(max-width:760px)').matches || navigator.maxTouchPoints > 1);
export const reduced = typeof window !== 'undefined' && matchMedia('(prefers-reduced-motion:reduce)').matches;
export function goTo(pct) { const max = document.documentElement.scrollHeight - innerHeight; const y = pct / 100 * max; if (store.lenis) store.lenis.scrollTo(y, { duration: Math.min(2.6, Math.max(0.8, Math.abs(y - scrollY) / 2500)) }); else scrollTo({ top: y, behavior: 'smooth' }); }
