import React, { useEffect, useRef, useState } from 'react';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

export default function PdfPreview({ url, title }) {
  const [pdf, setPdf] = useState(null), [pageNumber, setPageNumber] = useState(1), [width, setWidth] = useState(600), [error, setError] = useState(''), [rendering, setRendering] = useState(true);
  const canvasRef = useRef(), containerRef = useRef();
  useEffect(() => {
    let active = true, task;
    setPdf(null); setPageNumber(1); setError('');
    import('pdfjs-dist').then(async library => {
      if (!active) return;
      library.GlobalWorkerOptions.workerSrc = workerUrl;
      task = library.getDocument({ url, isEvalSupported: false, useWasm: false });
      const document = await task.promise;
      if (active) setPdf(document);
    }).catch(() => { if (active) setError('Ce PDF ne peut pas être affiché. Téléchargez sa copie pour le consulter.'); });
    return () => { active = false; task?.destroy().catch(() => {}); };
  }, [url]);
  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const resize = () => setWidth(Math.max(180, element.clientWidth-32));
    resize(); const observer = new ResizeObserver(resize); observer.observe(element);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!pdf) return;
    let active = true, task;
    setRendering(true); setError('');
    pdf.getPage(pageNumber).then(async page => {
      if (!active) return;
      const canvas = canvasRef.current;
      const original = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({ scale: Math.min(width / original.width, 1.6) });
      const density = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(viewport.width*density); canvas.height = Math.floor(viewport.height*density);
      canvas.style.width = `${Math.floor(viewport.width)}px`; canvas.style.height = `${Math.floor(viewport.height)}px`;
      task = page.render({ canvasContext: canvas.getContext('2d'), viewport, transform: density === 1 ? null : [density,0,0,density,0,0] });
      await task.promise;
      if (active) setRendering(false);
    }).catch(error => { if (active && error.name !== 'RenderingCancelledException') { setError('Affichage de cette page impossible. La copie reste disponible au téléchargement.'); setRendering(false); } });
    return () => { active = false; task?.cancel(); };
  }, [pdf, pageNumber, width]);
  return <div className="pdf-preview">
    <nav aria-label="Navigation dans le PDF" className="pdf-controls"><button className="doc-secondary" disabled={!pdf || pageNumber === 1} onClick={() => setPageNumber(n => n-1)}>Page précédente</button><span aria-live="polite">{pdf ? `Page ${pageNumber} sur ${pdf.numPages}` : 'Ouverture du PDF…'}</span><button className="doc-secondary" disabled={!pdf || pageNumber === pdf.numPages} onClick={() => setPageNumber(n => n+1)}>Page suivante</button></nav>
    <div className="pdf-page" ref={containerRef}>
      {error ? <p role="alert">{error}</p> : <>{rendering && <p role="status" className="pdf-loading">Affichage de la page…</p>}<canvas ref={canvasRef} role="img" aria-label={`${title}, page ${pageNumber}`} /></>}
    </div>
  </div>;
}
