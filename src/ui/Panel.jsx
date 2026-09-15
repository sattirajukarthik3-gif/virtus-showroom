import React, { useEffect } from 'react';
import { store, useUI } from '../store.js';

export default function Panel() {
  const ui = useUI(); const h = ui.selected;
  const close = () => { store.setUI({ selected: null }); if (store.api) store.api.bootHighlight = false; };
  useEffect(() => { const k = e => { if (e.key === 'Escape') close(); }; addEventListener('keydown', k); return () => removeEventListener('keydown', k); }, []);
  return (
    <aside id="panel" className={h ? 'open' : ''} aria-live="polite">
      <button className="close" aria-label="Close" onClick={close}>×</button>
      {h && <>
        <div className="eyebrow">{h.eyebrow}</div>
        <h3>{h.title}</h3>
        <p>{h.desc}</p>
        <dl className="data">{h.data.map(([k, v]) => <React.Fragment key={k}><dt>{k}</dt><dd>{v}</dd></React.Fragment>)}</dl>
        {h.note && <div className="note">{h.note}</div>}
      </>}
    </aside>
  );
}
