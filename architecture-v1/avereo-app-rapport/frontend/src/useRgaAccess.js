import { useEffect, useState } from 'react';

// A Rapport session never substitutes for a distinct RGA authorization.
export default function useRgaAccess() {
  const [allowed, setAllowed] = useState(false);
  useEffect(() => {
    let active = true, controller;
    const check = async () => {
      controller?.abort();
      controller = new AbortController();
      const current = controller;
      const timeout = setTimeout(() => current.abort(), 5000);
      try {
        const response = await fetch('/rga/access.php', { signal: current.signal, cache: 'no-store' });
        const data = response.ok ? await response.json() : null;
        if (active && current === controller) setAllowed(data?.authorized === true);
      } catch { if (active && current === controller) setAllowed(false); }
      finally { clearTimeout(timeout); }
    };
    check();
    window.addEventListener('focus', check);
    return () => { active = false; controller?.abort(); window.removeEventListener('focus', check); };
  }, []);
  return allowed;
}
