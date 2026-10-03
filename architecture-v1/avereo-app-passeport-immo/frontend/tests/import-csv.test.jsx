import React from 'react';
import { it, expect, vi, afterEach } from 'vitest';
import { render, fireEvent, screen, waitFor, cleanup } from '@testing-library/react';
import Papa from 'papaparse';
import App from '../src/App.jsx';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });
it('R11 : importe un vrai CSV fictif et sauvegarde le catalogue via l’interface', async () => {
  localStorage.clear();
  window.Papa = Papa;
  vi.spyOn(window, 'alert').mockImplementation(() => {});
  const { container } = render(<App />);
  fireEvent.click(screen.getByRole('button', { name: /Se connecter/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Admin', exact: true }));
  const csv = 'Corps de métier;Prestation;Fourchette basse (€ TTC);Prix Moyen (€ TTC);Fourchette haute (€ TTC);Unité\nPeintre;Intervention fictive;12,50;18,75;24,00;m²\n';
  fireEvent.change(container.querySelector('input[type=file]'), { target: { files: [new File([csv], 'tarifs-example.test.csv', { type: 'text/csv' })] } });
  await waitFor(() => expect(screen.getByDisplayValue('Peintre - Intervention fictive')).toBeTruthy());
  fireEvent.click(screen.getByRole('button', { name: 'Sauvegarder & Quitter' }));
  const saved = Object.values(JSON.parse(localStorage.getItem('avereo-passeport-immo-tarifs')));
  expect(saved).toHaveLength(1);
  expect(saved[0]).toMatchObject({ nom: 'Peintre - Intervention fictive', unite: 'm²', prix_eco: 12.5, prix_std: 18.75, prix_premium: 24 });
  expect(window.alert).toHaveBeenCalledWith('1 interventions importées. ');
});
