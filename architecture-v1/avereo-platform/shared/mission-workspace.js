// The private Word templates are supplied by the user. Nothing is uploaded.
function installMissionWorkspace({JSZip, company, offers}) {
  const wordNs = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
  const models = new Map();
  const fields = [
    ['referenceDossier','Référence du dossier'], ['referenceLettre','Référence de mission'],
    ['client','Nom ou raison sociale du client'], ['email','E-mail du client','email'],
    ['telephone','Téléphone du client','tel'], ['adresseClient','Adresse du client'],
    ['adresseBien','Adresse d’intervention'], ['date','Date d’intervention','date'], ['dateLettre','Date du document','date'],
    ['objet','Objet de la mission','textarea'], ['perimetre','Périmètre convenu','textarea'],
    ['livrable','Livrable attendu','textarea'],
  ];
  const required = new Set(['client','adresseBien','referenceLettre','objet']);
  const escape = text => String(text ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const cleanFilename = text => text.replace(/[^a-z0-9-]+/gi,'-').slice(0,80) || 'mission';
  function save(blob, filename) {
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }
  async function order(values, offer) {
    const zip = new JSZip(), relationships = 'http://schemas.openxmlformats.org/package/2006/relationships';
    const office = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
    const main = 'http://schemas.openxmlformats.org/drawingml/2006/main';
    const picture = 'http://schemas.openxmlformats.org/drawingml/2006/picture';
    const drawing = 'http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing';
    const rel = (type,target) => '<Relationships xmlns="'+relationships+'"><Relationship Id="rId1" Type="'+office+'/'+type+'" Target="'+target+'"/></Relationships>';
    zip.file('[Content_Types].xml','<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
    zip.file('_rels/.rels',rel('officeDocument','word/document.xml'));
    zip.file('word/_rels/document.xml.rels',rel('image','media/logo.png'));
    zip.file('word/media/logo.png',company.logo.split(',')[1],{base64:true});
    const image='<w:p><w:r><w:drawing><wp:inline><wp:extent cx="1714500" cy="537440"/><wp:docPr id="1" name="Logo AVEREO"/><a:graphic><a:graphicData uri="'+picture+'"><pic:pic><pic:nvPicPr><pic:cNvPr id="0" name="AVEREO"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="rId1"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="1714500" cy="537440"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>';
    const paragraph=(value,size,bold=false)=>'<w:p><w:pPr><w:spacing w:after="65"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:color w:val="16374C"/><w:sz w:val="'+size+'"/>'+(bold?'<w:b/>':'')+'</w:rPr><w:t xml:space="preserve">'+escape(value).replace(/\n/g,'</w:t><w:br/><w:t xml:space="preserve">')+'</w:t></w:r></w:p>';
    const rows=fields.filter(([key])=>values[key]).map(([key,label])=>'<w:tr><w:trPr><w:cantSplit/></w:trPr><w:tc><w:tcPr><w:tcW w:w="3000" w:type="dxa"/></w:tcPr>'+paragraph(label,20,true)+'</w:tc><w:tc><w:tcPr><w:tcW w:w="6500" w:type="dxa"/></w:tcPr>'+paragraph(values[key],22)+'</w:tc></w:tr>').join('');
    const content=image+company.lines.map(line=>paragraph(line,18)).join('')+paragraph('Ordre de mission',42,true)+paragraph(offer.nom+' · Document de travail',23)+
      '<w:tbl><w:tblPr><w:tblW w:w="9500" w:type="dxa"/></w:tblPr><w:tblGrid><w:gridCol w:w="3000"/><w:gridCol w:w="6500"/></w:tblGrid>'+rows+'</w:tbl>';
    zip.file('word/document.xml','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="'+wordNs+'" xmlns:r="'+office+'" xmlns:wp="'+drawing+'" xmlns:a="'+main+'" xmlns:pic="'+picture+'"><w:body>'+content+'<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134"/></w:sectPr></w:body></w:document>');
    const blob=await zip.generateAsync({type:'blob',compression:'DEFLATE',mimeType:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'});
    save(blob,'ordre-'+cleanFilename(values.referenceLettre)+'.docx');
  }
  async function letter(bytes, values, offer) {
    const zip = await JSZip.loadAsync(bytes);
    const path = 'word/document.xml';
    const xml = new DOMParser().parseFromString(await zip.file(path).async('string'),'application/xml');
    if (xml.querySelector('parsererror')) throw Error('Le modèle Word est illisible.');
    const body = xml.getElementsByTagNameNS(wordNs,'body')[0];
    const blocks = Array.from(body.children);
    const starts = blocks.filter(p => p.localName==='p' && p.textContent==='LETTRE DE MISSION');
    const checklist = blocks.find(p => p.localName==='tbl' && p.textContent.startsWith('FIN DU TEMPLATE'));
    if (starts.length!==2 || !checklist) throw Error('Structure du modèle métier inattendue.');
    for (const block of blocks.slice(0,blocks.indexOf(starts[1]))) {
      if (!block.getElementsByTagNameNS(wordNs,'drawing').length) block.remove();
    }
    checklist.remove();
    const text = {
      '[LDM_REFERENCE]':values.referenceLettre, '[LDM_DATE]':values.dateLettre, '[LDM_VERSION]':'Projet',
      '[CLIENT_NOM / RAISON_SOCIALE]':values.client, '[ADRESSE_CLIENT]':values.adresseClient,
      '[EMAIL]':values.email,'[TÉLÉPHONE]':values.telephone,'[BIEN_ADRESSE]':values.adresseBien,
      '[DOSSIER_REFERENCE]':values.referenceDossier,'[BIEN_PERIMETRE]':values.perimetre,
      '[CONTEXTE_CLIENT]':values.objet,
    };
    const applied = new Set();
    for (const run of xml.getElementsByTagNameNS(wordNs,'t')) {
      run.textContent = run.textContent.replace(/\[[^\]]+\]/g, token => {
        if (!Object.hasOwn(text,token) || !text[token]) return token;
        applied.add(token);
        return text[token];
      });
    }
    for (const key of ['[LDM_REFERENCE]','[CLIENT_NOM / RAISON_SOCIALE]','[BIEN_ADRESSE]']) {
      if (!applied.has(key)) throw Error('Champ attendu absent du modèle Word.');
    }
    // The detailed offer clauses stay in their source template. Add the mission-specific deliverable to section 13.
    if (values.livrable) {
      const heading = Array.from(xml.getElementsByTagNameNS(wordNs,'p')).find(p => /^13\. Livrable/.test(p.textContent));
      if (!heading) throw Error('Section des livrables introuvable dans le modèle.');
      const p = xml.createElementNS(wordNs,'w:p'), r = xml.createElementNS(wordNs,'w:r'), t = xml.createElementNS(wordNs,'w:t');
      t.textContent = 'Livrable convenu : '+values.livrable;
      r.append(t); p.append(r); heading.parentNode.insertBefore(p,heading.nextSibling);
    }
    zip.file(path,new XMLSerializer().serializeToString(xml));
    const blob = await zip.generateAsync({type:'blob',compression:'DEFLATE',mimeType:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'});
    save(blob,'lettre-'+offer.id+'-'+cleanFilename(values.referenceLettre)+'.docx');
  }
  async function recognize(file) {
    if (file.size > 3*1024*1024) throw Error('Choisissez un modèle Word AVEREO du pack.');
    const bytes = await file.arrayBuffer();
    const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)), b => b.toString(16).padStart(2,'0')).join('');
    const offer = offers.find(item => item.modelePrepareSha256===hash);
    if (!offer) throw Error('Ce fichier ne correspond pas à un modèle AVEREO préparé.');
    models.set(offer.id,bytes);
    return offer.nom;
  }
  async function open(menu) {
    if (document.querySelector('avereo-mission-workspace')) return;
    const host = document.createElement('avereo-mission-workspace'), shadow = host.attachShadow({mode:'open'});
    document.body.append(host);
    const context = {fields:{},label:'Mission autonome'};
    const request = new CustomEvent('avereo-mission-context',{composed:true,bubbles:true,detail:{provide:provided=>Object.assign(context,provided)}});
    menu.dispatchEvent(request);
    shadow.innerHTML = '<style>:host{font:15px/1.4 system-ui,sans-serif;color:#192d3c}dialog{width:min(660px,calc(100vw - 32px));max-height:88dvh;box-sizing:border-box;overflow:auto;border:1px solid #b8c4cc;border-radius:14px;padding:24px;color:#192d3c}dialog::backdrop{background:#15283c85}h2{margin:0;font-size:23px}p{margin:5px 0 15px}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}label{display:grid;gap:4px;font-weight:600}.wide{grid-column:1/-1}input,select,textarea{font:inherit;color:inherit;width:100%;box-sizing:border-box;border:1px solid #98a9b7;border-radius:6px;padding:8px}textarea{min-height:54px}footer{display:flex;gap:8px;flex-wrap:wrap;margin-top:16px}button{font:inherit;cursor:pointer;padding:8px 12px;border:1px solid #8798a6;border-radius:6px;background:white;color:#192d3c}button.primary{color:white;background:#174b74;border-color:#174b74}button:focus-visible,input:focus-visible{outline:3px solid #4c89df}summary{cursor:pointer;margin-top:12px}small{display:block;margin:5px 0;color:#536979}.msg{margin:7px 0;color:#914623}@media(max-width:530px){.grid{grid-template-columns:1fr}dialog{padding:16px}}</style>'+
      '<dialog aria-labelledby="mission-title"><h2 id="mission-title">Préparer une mission</h2><p class="context"></p><form><div class="grid"></div><details><summary>Modèles Word de lettre de mission</summary><label>Choisir les modèles AVEREO<input type="file" multiple accept=".docx"></label><small>Les modèles choisis restent dans cet onglet.</small></details><p role="status" class="msg"></p><footer><button type="submit" value="order" class="primary">Générer l’ordre Word</button><button type="submit" value="letter">Générer la lettre Word</button><button type="button" class="apply">Reporter au dossier</button><button type="button" class="close">Fermer</button></footer></form></dialog>';
    const dialog=shadow.querySelector('dialog'), form=shadow.querySelector('form'), grid=shadow.querySelector('.grid'), status=shadow.querySelector('[role=status]');
    shadow.querySelector('.context').textContent=context.label;
    function input(key,label,type) {
      const row=document.createElement('label');row.textContent=label;
      const control=document.createElement(type==='select'?'select':type==='textarea'?'textarea':'input');
      if (control.tagName==='INPUT') control.type=type || 'text';
      if(control.tagName!=='SELECT') control.maxLength=type==='textarea'?2000:250;
      control.name=key;control.required=required.has(key)||key==='offre';
      if(type==='textarea'||type==='select') row.className='wide';
      row.append(control);grid.append(row);return control;
    }
    const select=input('offre','Offre AVEREO','select');
    select.add(new Option('Choisir l’offre',''));
    for(const offer of offers) select.add(new Option(offer.nom,offer.id));
    select.value=context.fields.offre || '';
    const today = new Date();
    const localDate = new Date(today.getTime()-today.getTimezoneOffset()*60000).toISOString().slice(0,10);
    for(const [key,label,type] of fields) {
      const control=input(key,label,type);
      control.value=context.fields[key] || (key==='dateLettre' ? localDate : '');
    }
    const values=()=>Object.fromEntries([...fields.map(([key])=>key),'offre'].map(key=>[key,form.elements.namedItem(key).value.trim()]));
    const apply=shadow.querySelector('.apply');
    apply.hidden=typeof context.apply!=='function';
    apply.addEventListener('click',async()=>{ if(!form.reportValidity()) return; try{await context.apply(values()); status.textContent='Coordonnées reprises dans le dossier ouvert.';}catch{status.textContent='Impossible de reporter les coordonnées dans ce dossier.';}});
    const chooser=shadow.querySelector('input[type=file]');
    chooser.addEventListener('change',async()=>{try{
      const names=[];for(const file of chooser.files) names.push(await recognize(file));
      status.textContent='Modèles disponibles : '+names.join(', ')+'.';
    }catch(e){status.textContent=e.message;}finally{chooser.value='';}});
    form.addEventListener('submit',async e=>{
      e.preventDefault();
      const v=values(), offer=offers.find(item=>item.id===v.offre);
      if(!offer || [...required].some(key=>!v[key])) {status.textContent='Renseignez le client, l’offre, la référence, l’adresse d’intervention et l’objet.';return;}
      const button=e.submitter;button.disabled=true;
      try {
        if(button.value==='letter') {
          if(!models.has(offer.id)){shadow.querySelector('details').open=true;chooser.focus();throw Error('Choisissez le modèle Word préparé pour '+offer.nom+'.');}
          await letter(models.get(offer.id),v,offer);
        }else await order(v,offer);
        status.textContent='Document de travail généré.';
      }catch(err){status.textContent=err.message;}finally{button.disabled=false;}
    });
    dialog.addEventListener('close',()=>{host.remove();menu.shadowRoot?.querySelector('.trigger')?.focus();},{once:true});
    shadow.querySelector('.close').addEventListener('click',()=>dialog.close());
    dialog.showModal();
  }
  window.avereoOpenMission=open;
}
