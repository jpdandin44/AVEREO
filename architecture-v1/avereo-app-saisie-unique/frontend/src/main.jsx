import { createRoot } from 'react-dom/client';
import '../../../avereo-platform/shared/account-menu.js';
import { App } from './ui/App.jsx';
import { StoreContext } from './ui/contexte.js';
import { createStore } from './lib/store.js';
import { valeursLocales } from './config/listes.js';
import './styles.css';

function stockageNavigateur() {
  try {
    const s = window.localStorage;
    const essai = '__avereo_uni_essai__';
    s.setItem(essai, '1');
    s.removeItem(essai);
    return s;
  } catch {
    return null;
  }
}

const storage = stockageNavigateur();
const store = createStore({ storage, parametresParDefaut: valeursLocales().parametres || {} });
store.actions.initialiser();
if (!storage) store.actions.signalerErreur('Le navigateur refuse le stockage local : les dossiers ne seront pas conservés à la fermeture de la page.');

createRoot(document.getElementById('app')).render(
  <StoreContext.Provider value={store}>
    <App />
  </StoreContext.Provider>,
);
