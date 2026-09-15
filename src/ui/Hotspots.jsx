import React from 'react';
import { hotspots } from '../data/hotspots.js';
import { store, useUI } from '../store.js';

export default function Hotspots() {
  const ui = useUI();
  const select = h => { store.setUI({ selected: h }); if (store.api) store.api.bootHighlight = h.id === 'i-boot'; store.sound?.blip(); };
  return (
    <>
      <div id="hs">
        {hotspots.map(h => (
          <div key={h.id} className={'hs' + (ui.selected?.id === h.id ? ' sel' : '')} ref={el => { store.dom.hs[h.id] = el; }} onClick={() => select(h)} role="button" tabIndex={-1}>
            <span className="dot" /><span className="lbl">{h.title}</span>
          </div>
        ))}
      </div>
      <div id="hover" ref={el => { store.dom.hover = el; }} style={{ opacity: ui.hoverName ? 1 : 0 }}>{ui.hoverName}</div>
    </>
  );
}
