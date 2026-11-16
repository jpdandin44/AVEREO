import React, { createContext, useCallback, useContext, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import './screenDisclosure.css';

const Presentation = createContext(null);

// Presentation belongs to the current wizard session, never to the report payload.
export function ScreenPresentation({ initiallyNew = false, children }) {
  const [opened, setOpened] = useState({});
  const [notice, setNotice] = useState(null);
  const firstVisit = useRef(initiallyNew);
  const sections = useRef(new Map());
  const register = useCallback((key, value) => {
    sections.current.set(key, value);
    return () => sections.current.delete(key);
  }, []);
  const setMany = useCallback((keys, open) => {
    const allowed = keys.filter(key => {
      const section = sections.current.get(key);
      return open || !(section?.busy || section?.element?.querySelector(
        '[aria-label="Arreter la dictee"][aria-pressed="true"], dialog[open], [role="dialog"], [data-disclosure-busy="true"]',
      ));
    });
    setOpened(previous => ({ ...previous, ...Object.fromEntries(allowed.map(key => [key, open])) }));
    setNotice(allowed.length === keys.length ? null : {
      key: keys.find(key => !allowed.includes(key)),
      text: 'Terminez la dictée ou le traitement en cours avant de replier cette section.',
    });
  }, []);
  const setOpen = useCallback((key, open) => setMany([key], open), [setMany]);
  const value = useMemo(() => ({ opened, initiallyNew: firstVisit.current, register, setMany, setOpen, notice }),
    [opened, register, setMany, setOpen, notice]);
  return <Presentation.Provider value={value}>{children}</Presentation.Provider>;
}

export function useScreenPresentation() {
  return useContext(Presentation);
}

export function excerpt(value, max = 140) {
  const text = typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

export function DisclosureControls({ ids, label }) {
  const { setMany } = useScreenPresentation();
  return <div className="disclosure-tools" role="group" aria-label={label}>
    <button type="button" className="button secondary" onClick={() => setMany(ids, false)}>Tout replier</button>
    <button type="button" className="button secondary" onClick={() => setMany(ids, true)}>Tout déplier</button>
  </div>;
}

export default function ScreenDisclosure({ name, title, summary, status, defaultOpen = false,
  leading, actions, toolbar, busy = false, className = '', children }) {
  const { opened, register, setOpen, notice } = useScreenPresentation();
  const contentId = useId();
  const body = useRef(null);
  const initialDefault = useRef(defaultOpen);
  const open = opened[name] ?? initialDefault.current;
  useLayoutEffect(() => register(name, { element: body.current, busy }), [name, busy, register]);
  return <section className={`screen-disclosure ${className}`} data-screen-disclosure={name}>
    <div className="disclosure-header">
      {leading}
      <h3 className="disclosure-heading"><button type="button" className="disclosure-toggle"
        aria-expanded={open} aria-controls={contentId} onClick={() => setOpen(name, !open)}>
        {open ? <ChevronDown size={18} aria-hidden="true" /> : <ChevronRight size={18} aria-hidden="true" />}
        <span className="disclosure-labels"><span className="disclosure-title">{title}</span>
          {summary && <span className="disclosure-summary">{summary}</span>}
          {status && <span className="disclosure-status">{status}</span>}
        </span>
      </button></h3>
      {actions}
    </div>
    {toolbar}
    {notice?.key === name && <p role="status" className="disclosure-notice">{notice.text}</p>}
    <div id={contentId} ref={body} className="screen-disclosure-body" hidden={!open}>{children}</div>
  </section>;
}

export function revealScreenField(id) {
  const field = document.getElementById(id);
  const parents = [];
  for (let parent = field?.parentElement; parent; parent = parent.parentElement) {
    if (parent.hasAttribute('data-screen-disclosure')) parents.unshift(parent);
  }
  for (const parent of parents) parent.querySelector('.disclosure-toggle[aria-expanded="false"]')?.click();
  requestAnimationFrame(() => field?.focus());
}
