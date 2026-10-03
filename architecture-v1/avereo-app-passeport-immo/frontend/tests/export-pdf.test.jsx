import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import App from '../src/App.jsx';

afterEach(() => {
  const logout = screen.queryByRole('button', { name: 'Déconnexion', exact: true });
  if (logout) fireEvent.click(logout);
  cleanup(); localStorage.clear(); delete window.jspdf; delete window.html2canvas;
});

describe('pagination PDF du parcours réel', () => {
  async function exportCanvas(height, tailColor = 255) {
    localStorage.clear();
    const addPage = vi.fn(); const addImage = vi.fn(); const save = vi.fn();
    window.jspdf = { jsPDF: vi.fn(function () {
      return { internal: { pageSize: { getWidth: () => 210, getHeight: () => 297 } }, addPage, addImage, save };
    }) };
    // Gabarit mesuré : 793.6875 × 1122.515625 px, capture scale=2 arrondie.
    // 210 × 2245 / 1587 = 297.069943 mm : débord de moins d'un pixel canvas.
    window.html2canvas = vi.fn().mockResolvedValue({
      width: 1587, height, toDataURL: () => 'data:image/png;base64,fictif',
      getContext: () => ({ getImageData: () => ({ data: new Uint8ClampedArray([tailColor, tailColor, tailColor, 255]) }) }),
    });
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Se connecter', exact: true }));
    fireEvent.click(screen.getByRole('heading', { name: '123 Rue de la République, 75001 Paris', exact: true }));
    fireEvent.click(screen.getByRole('button', { name: 'Exporter en PDF', exact: true }));
    await waitFor(() => expect(save).toHaveBeenCalledOnce());
    return { addPage, addImage };
  }

  it('ne crée pas une page pour un débord blanc inférieur à un pixel', async () => {
    const { addPage, addImage } = await exportCanvas(2245);
    expect(addPage).not.toHaveBeenCalled();
    expect(addImage).toHaveBeenCalledTimes(1);
  });
  it('conserve le pixel final quand il porte du contenu', async () => {
    expect((await exportCanvas(2245, 0)).addPage).toHaveBeenCalledTimes(1);
  });
  it('conserve un document qui nécessite réellement deux pages', async () => {
    const { addPage, addImage } = await exportCanvas(3200);
    expect(addPage).toHaveBeenCalledTimes(1);
    expect(addImage).toHaveBeenCalledTimes(2);
    expect(addImage.mock.calls[1][3]).toBe(-297);
  });
  it('conserve un document qui nécessite trois pages', async () => {
    expect((await exportCanvas(6000)).addPage).toHaveBeenCalledTimes(2);
  });
});
