/* Optional integration; hidden until the server confirms the exact owner and global role. */
(() => {
  let current = 0;
  async function update() {
    const version = ++current;
    document.getElementById('private-development-link')?.remove();
    try {
      const response = await fetch('/developpements/api.php?route=capability', {credentials:'same-origin',cache:'no-store',redirect:'error'});
      if (!response.ok) return;
      const data = await response.json();
      if (version !== current || data.available !== true || data.scope !== 'single_global_administrator'
          || data.identity?.connectRoleVerified !== true || data.identity?.connectSsoVerified !== true) return;
      const menu = document.getElementById('account-menu'); if (!menu) return;
      const link = document.createElement('a'); link.id='private-development-link';link.slot='items';
      link.href='/developpements/';link.target='_top';link.textContent='Développements';menu.append(link);
    } catch { /* No fallback menu or browser-provided role. */ }
  }
  document.addEventListener('DOMContentLoaded',update);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')void update();});
  window.addEventListener('pagehide',()=>{++current;document.getElementById('private-development-link')?.remove();});
})();
