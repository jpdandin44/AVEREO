/* Hook adapter without a second React dependency. Business fields belong to each app. */
export function useAppPreferences(app, fields, { useState, useEffect }) {
  const [values, setValues] = useState(() => Object.fromEntries(fields.map(field => [field.key, field.default])));
  useEffect(() => {
    let active = true;
    const read = () => {
      const Menu = customElements.get('avereo-account-menu');
      if (active && Menu) setValues(Menu.readSettings(app, fields));
    };
    const changed = event => { if (event.detail?.app === app) read(); };
    const stored = event => { if (event.key === `avereo.${app}.preferences.v1`) read(); };
    customElements.whenDefined('avereo-account-menu').then(read);
    document.addEventListener('avereo-preferences-change', changed);
    window.addEventListener('storage', stored);
    return () => { active = false; document.removeEventListener('avereo-preferences-change', changed); window.removeEventListener('storage', stored); };
  }, [app, fields]);
  return values;
}
