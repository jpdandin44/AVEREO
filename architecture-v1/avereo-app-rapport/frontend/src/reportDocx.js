import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, ImageRun,
  Header, Footer, PageNumber, ExternalHyperlink, WidthType, BorderStyle } from 'docx';

// Translate only our generated report markup. No external HTML or image fetching.
export async function createWordBlob(html, report, parse = text => new DOMParser().parseFromString(text, 'text/html')) {
  const dom = parse(html);
  async function imageRun(element) {
    const src = element.getAttribute('src') || '';
    if (!/^data:image\/(png|jpe?g|gif|webp);base64,/i.test(src)) return null;
    let image = new Image();
    image.src = src;
    await image.decode();
    const logo = element.classList.contains('brand-logo');
    const signature = element.classList.contains('signature');
    const maxWidth = logo ? 210 : signature ? 170 : 570;
    const photo = element.parentElement?.classList.contains('photo-block');
    const maxHeight = logo ? 110 : signature ? 130 : photo ? (report.livrable?.audience === 'client' ? 320 : 280) : 510;
    const ratio = Math.min(maxWidth / image.naturalWidth, maxHeight / image.naturalHeight, 1);
    // Canvas only converts unsupported WebP input to a Word-compatible PNG, without editing its content.
    let source = src;
    if (src.startsWith('data:image/webp')) {
      const canvas = document.createElement('canvas'); canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
      canvas.getContext('2d').drawImage(image,0,0); source = canvas.toDataURL('image/png');
    }
    const type = source.match(/^data:image\/(\w+);/)[1].replace('jpeg','jpg');
    return new ImageRun({ type, data: Uint8Array.from(atob(source.split(',')[1]), c => c.charCodeAt(0)),
      transformation: { width: Math.round(image.naturalWidth * ratio), height: Math.round(image.naturalHeight * ratio) },
      altText: { title: element.getAttribute('alt') || 'Illustration', description: element.getAttribute('alt') || '', name: 'Illustration' } });
  }
  async function runs(element, inherited = {}) {
    const result = [];
    for (const node of element.childNodes) {
      if (node.nodeType === 3) { result.push(new TextRun({ text: node.textContent.replace(/\s+/g,' '), ...inherited })); continue; }
      if (node.nodeType !== 1) continue;
      if (node.tagName === 'BR') { result.push(new TextRun({ break: 1 })); continue; }
      if (node.tagName === 'IMG') { const image = await imageRun(node); if(image) result.push(image); continue; }
      const children = await runs(node, { ...inherited, ...(['STRONG','B'].includes(node.tagName) ? {bold:true} : {}), ...(['EM','I'].includes(node.tagName) ? {italics:true} : {}) });
      const href = node.getAttribute('href') || '';
      result.push(...(node.tagName === 'A' && /^https:\/\//i.test(href) ? [new ExternalHyperlink({ link:href, children })] : children));
    }
    return result;
  }
  async function blocks(parent) {
    const output = [];
    for (const node of parent.children) {
      const tag = node.tagName;
      const breakBefore = node.classList.contains('client-page') || (node.classList.contains('observation') && node.previousElementSibling?.tagName !== 'H2') || (node.classList.contains('illustration') && !node.classList.contains('client-illustration'));
      if (tag === 'TABLE') {
        const rows = [];
        for(const row of node.querySelectorAll('tr')) {
          const cells = [];
          const header = row.parentElement.tagName === 'THEAD';
          for(const cell of row.children) cells.push(new TableCell({ children:[new Paragraph({children:await runs(cell),keepNext:header})],
            shading: cells.length === 0 ? {fill:'EEF4F6'} : undefined,
            margins:{top:100,bottom:100,left:100,right:100} }));
          rows.push(new TableRow({children:cells, cantSplit:true,tableHeader:header}));
        }
        if(rows.length) output.push(new Table({ rows, width:{size:100,type:WidthType.PERCENTAGE} }));
      } else if (/^H[1-4]$/.test(tag)) {
        const size = {H1:52,H2:34,H3:26,H4:23}[tag];
        output.push(new Paragraph({ children:await runs(node, {bold:true,color:'002B45',size}),
          keepNext:true, pageBreakBefore:tag==='H2' && /^\d+\.\s/.test(node.textContent), spacing:{before:tag==='H1'?500:240,after:160},
          border:tag==='H2'?{bottom:{color:'FF6600',space:6,style:BorderStyle.SINGLE,size:12}}:undefined }));
      } else if (tag === 'IMG') {
        const image = await imageRun(node); if(image) output.push(new Paragraph({children:[image], spacing:{before:140,after:140}}));
      } else if (tag === 'P' || tag === 'LI') {
        output.push(new Paragraph({children:await runs(node), bullet:tag==='LI'?{level:0}:undefined,
          spacing:{after:160}, shading:node.classList.contains('status')?{fill:'FFF1E7'}:undefined }));
      } else if(tag === 'BR') {
        if(node.getAttribute('style')?.includes('page-break')) output.push(new Paragraph({pageBreakBefore:true}));
      } else {
        const children = await blocks(node);
        if(breakBefore && children.length) output.push(new Paragraph({pageBreakBefore:true,spacing:{after:0,before:0}}));
        output.push(...children);
      }
    }
    return output;
  }
  const children = await blocks(dom.body);
  const label = report.livrable?.audience === 'client' ? 'Synthèse client' : 'Rapport expert';
  return Packer.toBlob(new Document({ creator:'AVEREO',title:`${report.titre} — ${label}`,description:'Document de travail soumis à validation professionnelle',
    styles:{default:{document:{run:{font:'Calibri',size:22,color:'002B45'},paragraph:{spacing:{line:285}}}}},
    sections:[{properties:{page:{size:{width:11906,height:16838},margin:{top:1134,bottom:1134,left:1134,right:1134}}},
      headers:{default:new Header({children:[new Paragraph({children:[new TextRun({text:`AVEREO  |  ${label}`,size:18,color:'506573'})]})]})},
      footers:{default:new Footer({children:[new Paragraph({children:[new TextRun({text:`${report.reference_dossier || ''} · Document de travail · `,size:16}),new TextRun({children:[PageNumber.CURRENT],size:16})]})]})},
      children}]}));
}
