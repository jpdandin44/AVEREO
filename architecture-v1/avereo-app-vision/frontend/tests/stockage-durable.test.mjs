// Stockage durable de l'appareil (R04) : demande de persistance et espace disponible.
import test from "node:test";
import assert from "node:assert/strict";
import { decrireStockage, verifierStockage } from "../src/sync/stockage-durable.js";

const navigateur = ({ dejaPersistant = false, accorde = true, usage = 10e6, quota = 1000e6, erreur = false } = {}) => ({
  storage: {
    persisted: async () => dejaPersistant,
    persist: async () => {
      if (erreur) throw new Error("refus");
      return accorde;
    },
    estimate: async () => ({ usage, quota }),
  },
});

test("stockage déjà persistant : aucune alerte, la persistance n'est pas redemandée", async () => {
  let demande = false;
  const nav = navigateur({ dejaPersistant: true });
  nav.storage.persist = async () => {
    demande = true;
    return true;
  };
  const etat = await verifierStockage(nav);
  assert.equal(etat.persistant, true);
  assert.equal(etat.alerte, null);
  assert.equal(demande, false);
  assert.equal(decrireStockage(etat), null);
});

test("persistance refusée (cas fréquent sur iPhone hors application installée) : alerte « non garanti »", async () => {
  const etat = await verifierStockage(navigateur({ accorde: false }));
  assert.equal(etat.persistant, false);
  assert.equal(etat.alerte, "non-garanti");
  assert.match(decrireStockage(etat).titre, /non garanti/);
});

test("espace presque plein (80 % ou plus) : alerte prioritaire, chiffres en Mo", async () => {
  const etat = await verifierStockage(navigateur({ usage: 850e6, quota: 1000e6 }));
  assert.equal(etat.alerte, "presque-plein");
  const texte = decrireStockage(etat);
  assert.match(texte.titre, /presque plein/);
  assert.match(texte.message, /850 Mo sur 1\s000 Mo/, "séparateur de milliers français (espace insécable)");
});

test("navigateur sans API de stockage ou en erreur : aucune conclusion, aucune alerte", async () => {
  assert.deepEqual(await verifierStockage({}), { persistant: null, utilise: null, quota: null, alerte: null });
  const etat = await verifierStockage(navigateur({ erreur: true }));
  assert.equal(etat.persistant, null);
  assert.equal(etat.alerte, null);
});
