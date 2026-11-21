import JSZip from 'jszip';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { CHAMPS } from '../config/champs.js';
import { valeur, nomComplet, adresseDemandeur } from './modele.js';
import { calculerDossier, valeurCalculee } from './calculs.js';
import { fmtDate, lireNombre } from './nombres.js';

const montant=v=>v==null?'':Number(v).toLocaleString('fr-FR',{minimumFractionDigits:2,maximumFractionDigits:2}).replace(/[\u202f\u00a0]/g,' ');
const propre=v=>String(v??'').replace(/[\u202f\u00a0]/g,' ').replace(/\u2011/g,'-');
export function valeursFormulaire(dossier,parametres={},planId='devis') {
 if(!dossier.plans[planId])throw Error('Ce document nécessite le plan Factures. Figez d’abord le devis.');
 const calc=calculerDossier(dossier,parametres); const result={};
 for(const c of CHAMPS){
  let v=c.onglet==='parametres'?parametres[c.id]:c.saisie==='calcule'?valeurCalculee(calc,c.id,planId):valeur(dossier,c.id,planId);
  if(v==null)v='';
  if(c.saisie==='date')v=fmtDate(v);
  if(Array.isArray(v))v=v.join(' ; ');
  result[c.id]=propre(v);
 }
 for(const [k,v] of Object.entries({...calc.valeurs,...calc[planId].valeurs}))if(typeof v==='number')result[k]=montant(v);
 result.IDENTITE=nomComplet(dossier); result.ADRESSE=adresseDemandeur(dossier);
 result.ADRESSE_BIEN=[dossier.valeurs.log_adresse,dossier.valeurs.log_cp,dossier.valeurs.log_commune].filter(Boolean).join(', ');
 result.DATE=fmtDate(dossier.valeurs.doc_date); result.ANNEE=String(dossier.valeurs.doc_date||'').slice(0,4);
 result.MOIS=String(dossier.valeurs.doc_date||'').slice(5,7);result.JOUR=String(dossier.valeurs.doc_date||'').slice(8,10);
 const depot=String(dossier.valeurs.dos_date_depot||'');
 result.DEPOT_J=depot.slice(8,10);result.DEPOT_M=depot.slice(5,7);result.DEPOT_A=depot.slice(0,4);
 for(const phase of ['avant','apres'])result['CLASSE_'+phase]=(result['ene_classe_'+phase].match(/[A-G]$/)||[])[0]||result['ene_classe_'+phase];
 result.TRAVAUX=dossier.plans[planId].postes.map(p=>p.valeurs.pst_intitule).join(' ; ');
 result.AUTRES_AIDES=montant(calc[planId].valeurs.fin_aides-calc[planId].valeurs.fin_total_aides_publiques);
 for(let i=0;i<14;i++){
  const p=dossier.plans[planId].postes[i]?.valeurs||{};const n=i+1;
  result[`P${n}_description`]=[p.pst_intitule,p.pst_materiau,p.pst_marque,p.pst_reference,p.pst_resistance_r&&`R = ${p.pst_resistance_r} m².K/W`,p.pst_uw&&`Uw = ${p.pst_uw}`,p.pst_sw&&`Sw = ${p.pst_sw}`].filter(Boolean).join(' ; ');
  result[`P${n}_surface`]=p.pst_surface||''; result[`P${n}_materiau`]=p.pst_materiau||'';
  result[`P${n}_entreprise`]=p.pst_intitule?(dossier.valeurs.ent_nom||''):'';
  result[`P${n}_ht`]=p.pst_intitule?montant(lireNombre(p.pst_ht)):''; result[`P${n}_ttc`]=p.pst_intitule?montant(lireNombre(p.pst_ttc)):'';
 }
 for(let i=0;i<3;i++){const d=dossier.plans[planId].derogations[i]?.valeurs||{};result[`D${i+1}_paroi`]=d.ene_derogation_paroi||'';result[`D${i+1}_motif`]=d.ene_derogation_motif||'';}
 return result;
}
const xml=v=>propre(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
export function remplirXml(source,values) {
 return source.replace(/\{\{([A-Za-z0-9_]+)\}\}/g,(_,k)=>xml(values[k]??''));
}
export function verifierPack(pack) {
 if(pack?.format!=='avereo-uni-modeles'||pack.version!==1||!pack.documents||typeof pack.documents!=='object')throw Error('Pack de modèles UNI invalide.');
 for(const [id,t] of Object.entries(pack.documents)){
  if(!/^[A-Z]{2,3}$/.test(id)||!['pdf','docx','xlsx'].includes(t.extension)||typeof t.base64!=='string'||t.base64.length>15000000||!/^[A-Za-z0-9+/=\s]+$/.test(t.base64))throw Error('Modèle invalide : '+id);
 }
 return pack;
}
export async function genererFormulaire({pack,docId,dossier,parametres={},planId='devis'}) {
 verifierPack(pack); const t=pack.documents[docId];if(!t)throw Error('Le modèle original de ce document n’est pas chargé.');
 if(t.maxPostes && dossier.plans[planId]?.postes.length>t.maxPostes)throw Error(`Ce modèle prend en charge ${t.maxPostes} postes maximum. Préparez une annexe pour ne perdre aucun poste.`);
 const values=valeursFormulaire(dossier,parametres,planId);
 const bytes=Uint8Array.from(atob(t.base64),c=>c.charCodeAt(0));
 let output;
 if(t.extension==='pdf'){
  const pdf=await PDFDocument.load(bytes);const font=await pdf.embedFont(StandardFonts.Helvetica);
  const form=pdf.getForm();
  for(const [name,key] of Object.entries(t.fields||{})){
   const f=form.getField(name);if(typeof f.setText!=='function')throw Error('Champ PDF non textuel : '+name);
   f.setText(propre(values[key]));f.setFontSize(9);
  }
  if(Object.keys(t.fields||{}).length)form.updateFieldAppearances(font);
  for(const p of t.placements||[]){
   const page=pdf.getPage(p.page||0),w=page.getWidth(),h=page.getHeight();
   const text=propre(values[p.key]);if(!text)continue;
   const max=w*p.width;let size=p.size||9;
   while(font.widthOfTextAtSize(text,size)>max&&size>6)size-=.25;
   if(font.widthOfTextAtSize(text,size)>max)throw Error('Texte trop long pour le modèle : '+p.key);
   page.drawText(text,{x:w*p.x,y:h*(1-p.y),size,font,color:rgb(.04,.18,.27)});
  }
  // Bande ajoutée au-dessus de la page : ne recouvre ni logo ni texte source.
  for(const page of pdf.getPages()){
   const height=page.getHeight();page.setSize(page.getWidth(),height+20);
   page.drawText('DEMONSTRATION - DONNEES FICTIVES - NON SIGNE',{x:20,y:height+7,size:7,font,color:rgb(.75,.15,.08)});
  }
  output=await pdf.save();
 }else{
  const zip=await JSZip.loadAsync(bytes);
  for(const file of Object.keys(zip.files).filter(n=>/^(word|xl)\/.*\.xml$/.test(n)))zip.file(file,remplirXml(await zip.file(file).async('string'),values));
  output=await zip.generateAsync({type:'uint8array',compression:'DEFLATE'});
 }
 return {bytes:output,filename:`UNI-DEMO-${docId}-${planId}.${t.extension}`,mime:t.extension==='pdf'?'application/pdf':t.extension==='docx'?'application/vnd.openxmlformats-officedocument.wordprocessingml.document':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'};
}
export function telecharger({bytes,filename,mime}) {
 const url=URL.createObjectURL(new Blob([bytes],{type:mime}));const a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
}
