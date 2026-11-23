import test from 'node:test';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import { PDFDocument } from 'pdf-lib';
import { genererFormulaire, remplirXml, valeursFormulaire, verifierPack } from '../../src/lib/formulaires.js';
import { dossierDemonstration } from '../../src/lib/demonstration.js';
import { DOCUMENTS } from '../../src/config/documents.js';
import { readFileSync } from 'node:fs';
test('la correspondance lit le bon plan et sépare les aides publiques des autres aides',()=>{
 const d=dossierDemonstration('demo');d.plans.factures=structuredClone(d.plans.devis);d.plans.factures.postes[0].valeurs.pst_ttc='4000';
 assert.equal(valeursFormulaire(d,{},'devis').fin_travaux_ttc,'13 082,00');
 assert.equal(valeursFormulaire(d,{},'factures').fin_travaux_ttc,'13 706,00');
 assert.equal(valeursFormulaire(d).AUTRES_AIDES,'0,00');
 assert.equal(valeursFormulaire(d).IDENTITE,'EXEMPLE Camille');
 assert.equal(valeursFormulaire(d).CLASSE_avant,'E');
});
test('échappement XML et refus des packs invalides',()=>{
 assert.equal(remplirXml('<w:t>{{prop_nom}}</w:t>',{prop_nom:'A & <B>'}),'<w:t>A &amp; &lt;B&gt;</w:t>');
 assert.throws(()=>verifierPack({version:1}));
 assert.throws(()=>valeursFormulaire(dossierDemonstration('a'),{},'factures'),/Factures/);
});
test('le PDF exporté conserve ses champs et met à jour la valeur du formulaire',async()=>{
 const pdf=await PDFDocument.create();const page=pdf.addPage();pdf.getForm().createTextField('Nom').addToPage(page,{x:50,y:400,width:200,height:20});
 const pack={format:'avereo-uni-modeles',version:1,documents:{AVA:{extension:'pdf',base64:Buffer.from(await pdf.save()).toString('base64'),fields:{Nom:'IDENTITE'}}}};
 const result=await genererFormulaire({pack,docId:'AVA',dossier:dossierDemonstration('a')});
 const out=await PDFDocument.load(result.bytes);assert.equal(out.getForm().getTextField('Nom').getText(),'EXEMPLE Camille');
});
test('le Word exporté échappe les valeurs et ne perd pas ses fichiers internes',async()=>{
 const z=new JSZip();z.file('word/document.xml','<w:t>{{IDENTITE}}</w:t>');z.file('word/styles.xml','styles-preserves');
 const pack={format:'avereo-uni-modeles',version:1,documents:{ATD:{extension:'docx',base64:await z.generateAsync({type:'base64'}),maxPostes:3}}};
 const d=dossierDemonstration('a');const result=await genererFormulaire({pack,docId:'ATD',dossier:d});const out=await JSZip.loadAsync(result.bytes);
 assert.equal(await out.file('word/document.xml').async('string'),'<w:t>EXEMPLE Camille</w:t>');assert.equal(await out.file('word/styles.xml').async('string'),'styles-preserves');
 d.plans.devis.postes.push(structuredClone(d.plans.devis.postes[0]));await assert.rejects(()=>genererFormulaire({pack,docId:'ATD',dossier:d}),/maximum/);
});
test('les codes du pack de modèles correspondent aux identifiants des documents',()=>{
 const source=readFileSync(new URL('../../../workflows/preparer-modeles.py',import.meta.url),'utf8');
 const codes=new Set([...source.matchAll(/output\['([A-Z]+)'\]=|'([A-Z]+)':\('|\('([A-Z]+)',\[/g)].map((m)=>m[1]||m[2]||m[3]));
 const ids=new Set(DOCUMENTS.map((d)=>d.id));
 assert.ok(codes.size>=12,'codes du pack relevés : '+[...codes]);
 for(const code of codes)assert.ok(ids.has(code),'code de pack sans document : '+code);
});
