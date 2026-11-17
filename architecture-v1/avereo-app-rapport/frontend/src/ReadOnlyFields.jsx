import React, { createContext, useContext, useLayoutEffect, useRef } from 'react';

const ReadOnlyMode = createContext(false);
export const useReadOnlyMode = () => useContext(ReadOnlyMode);

/** Keep navigation/disclosures usable while fields and mutation controls are disabled. */
export default function ReadOnlyFields({ readOnly, children }) {
  const root = useRef(null);
  useLayoutEffect(() => {
    if (!readOnly || !root.current) return;
    const apply = () => {
      const container = root.current;
      if (!container) return;
      for (const control of container.querySelectorAll('input,select,textarea,button')) {
        if (control.matches('[data-readonly-view],.disclosure-toggle,.disclosure-tools button')) continue;
        if (!control.disabled) control.disabled = true;
      }
      for (const canvas of container.querySelectorAll('canvas')) canvas.style.pointerEvents = 'none';
    };
    apply();
    const observer = new MutationObserver(apply);
    observer.observe(root.current, { subtree: true, childList: true, attributes: true, attributeFilter: ['disabled'] });
    return () => observer.disconnect();
  }, [readOnly]);
  return <ReadOnlyMode.Provider value={Boolean(readOnly)}>
    <div key={readOnly ? 'read-only' : 'editable'} ref={root}>{children}</div>
  </ReadOnlyMode.Provider>;
}
