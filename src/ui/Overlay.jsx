import React, { useEffect, useMemo, useRef } from 'react';
import { overlayHtml } from './overlayHtml.js';
import { store, goTo } from '../store.js';
import { dimLabels } from '../data/hotspots.js';

export default function Overlay() {
  const ref = useRef();
  const html = useMemo(() => ({ __html: overlayHtml }), []);
  useEffect(() => {
    const root = ref.current;
    const collect = () => {
      store.dom.fade = [...root.querySelectorAll('[data-r]')].map(el => { const [a, b] = el.dataset.r.split(',').map(Number); return { el, a, b, move: (el.classList.contains('block') || el.classList.contains('step')) && !el.classList.contains('center') }; });
    for (const k in dimLabels) store.dom.dims[k] = root.querySelector('#d' + k);
    store.dom.gears = [...root.querySelectorAll('#gears span')];
    };
    collect(); store.dom.recollect = collect;
    const onClick = e => { const b = e.target.closest('[data-go]'); if (b) goTo(+b.dataset.go); };
    root.addEventListener('click', onClick); return () => root.removeEventListener('click', onClick);
  }, []);
  return <div id="ui" ref={ref} dangerouslySetInnerHTML={html} />;
}
