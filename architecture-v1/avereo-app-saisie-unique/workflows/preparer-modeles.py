"""Prépare un pack privé depuis les modèles remis. Aucun modèle source n'est versé au dépôt."""
import argparse, base64, hashlib, io, json, re
from pathlib import Path
from docx import Document
from docx.shared import Pt, RGBColor
from pypdf import PdfReader, PdfWriter

def token(k): return '{{'+k+'}}'
def set_p(p,text):
    # Conserve les propriétés du paragraphe et le premier style de caractère.
    runs=p.runs
    if runs:
        runs[0].text=text
        for r in runs[1:]: r.text=''
    else: p.add_run(text)
def set_cell(cell,text):
    set_p(cell.paragraphs[0],text)
    for p in cell.paragraphs[1:]: set_p(p,'')
def pack_doc(doc,original):
    header=doc.sections[0].header.paragraphs[0]
    header.add_run('  DÉMONSTRATION — DONNÉES FICTIVES — NON SIGNÉ').font.size=Pt(8)
    b=io.BytesIO();doc.save(b)
    return {'extension':'docx','base64':base64.b64encode(b.getvalue()).decode(),'sourceSha256':hashlib.sha256(original).hexdigest()}
def find(root,pattern):
    matches=list(root.glob(pattern))
    if len(matches)!=1: raise ValueError('Un modèle unique attendu : '+pattern)
    return matches[0]
def prep_docx(root):
    output={}
    src=find(root,'attestation*devis.docx');d=Document(src)
    set_cell(d.tables[0].cell(0,0),'NOM, Prénom(s) du demandeur : '+token('IDENTITE'))
    set_cell(d.tables[1].cell(0,0),'Numéro et voie : '+token('log_adresse'))
    set_cell(d.tables[1].cell(1,0),'Code postal / Ville : '+token('log_cp')+' '+token('log_commune'))
    for col,key in [(1,'fin_eligibles_ht'),(2,'fin_eligibles_ttc')]:set_cell(d.tables[2].cell(0,col),token(key)+(' € HT' if col==1 else ' € TTC'))
    for idx,key in [(15,'ene_audit_date'),(16,'ene_audit_id')]:set_p(d.paragraphs[idx],d.paragraphs[idx].text.split(':')[0]+': '+token(key))
    for idx in (18,80):set_p(d.paragraphs[idx],'Raison sociale : '+token('org_raison_sociale')+'  SIRET : '+token('org_siret'))
    set_p(d.paragraphs[24],'Référence du scénario retenu : '+token('ene_scenario_ref'))
    for table,phase in [(3,'avant'),(4,'apres')]:
        for row,key in enumerate(['ene_prim_'+phase,'ene_fin_'+phase,'ene_ges_'+phase,'CLASSE_'+phase,'ene_surface_ref_'+phase]):set_cell(d.tables[table].rows[row].cells[-1],token(key))
    for row in range(2,len(d.tables[5].rows)):
        for col,key in enumerate(['description','ht','ttc']):set_cell(d.tables[5].cell(row,col),token(f'P{row-1}_{key}'))
    for row in range(1,4):
        for col,key in enumerate(['paroi','motif']):set_cell(d.tables[6].cell(row,col),token(f'D{row}_{key}'))
    for table in (7,8):
        set_cell(d.tables[table].cell(0,0),'Fait à '+token('doc_lieu' if table==7 else 'org_lieu'))
        set_cell(d.tables[table].cell(0,1),'le '+token('DATE'))
    set_p(d.paragraphs[65],'NOM, Prénom du demandeur : '+token('IDENTITE')+' — Signature :')
    set_p(d.paragraphs[78],'NOM, Prénom de l’accompagnateur : '+token('etp_conseiller')+' — Signature :')
    output['ATD']=pack_doc(d,src.read_bytes());output['ATD']['maxPostes']=14
    src=find(root,'attestation*factures.docx');d=Document(src)
    mapping={7:'NOM, Prénom(s) du demandeur : {{IDENTITE}}',10:'Numéro et voie : {{log_adresse}}\nCode postal : {{log_cp}}  Ville : {{log_commune}}',14:'Coût total des travaux éligibles : {{fin_eligibles_ht}} € HT / {{fin_eligibles_ttc}} € TTC',18:'Date de réalisation de l’audit énergétique : {{ene_audit_date}}',19:'Identifiant de l’audit énergétique : {{ene_audit_id}}',21:'Raison sociale : {{org_raison_sociale}}  SIRET : {{org_siret}}',32:'Référence du scénario retenu : {{ene_scenario_ref}}',75:'Fait à {{doc_lieu}} le {{DATE}}',77:'NOM, Prénom du demandeur : {{IDENTITE}} — Signature :',84:'Fait à {{org_lieu}} le {{DATE}}',86:'NOM, Prénom de l’accompagnateur : {{etp_conseiller}} — Signature :',88:'Raison sociale : {{org_raison_sociale}}  SIRET : {{org_siret}}'}
    for start,phase in [(25,'avant'),(34,'apres')]:
        for offset,key in enumerate(['ene_prim_'+phase,'ene_fin_'+phase,'ene_ges_'+phase,'CLASSE_'+phase,'ene_surface_ref_'+phase]):mapping[start+offset]=d.paragraphs[start+offset].text.split(':')[0]+': '+token(key)
    for i,text in mapping.items():set_p(d.paragraphs[i],text)
    for row in range(1,len(d.tables[0].rows)):
        set_cell(d.tables[0].cell(row,0),token(f'P{row}_description'))
        set_cell(d.tables[0].cell(row,1),token(f'P{row}_ht')+' € HT / '+token(f'P{row}_ttc')+' € TTC')
    for row in range(1,len(d.tables[1].rows)):
        for col,key in enumerate(['paroi','motif']):set_cell(d.tables[1].cell(row,col),token(f'D{row}_{key}'))
    output['ATF']=pack_doc(d,src.read_bytes());output['ATF']['maxPostes']=min(len(d.tables[0].rows)-1,14)
    src=find(root,'*Rapport Fin*.docx');d=Document(src)
    set_cell(d.tables[0].cell(0,0),'Propriétaire : {{IDENTITE}}\nAdresse logement rénové : {{ADRESSE_BIEN}}\nRéf. demande Anah : {{dos_num_anah}}')
    set_cell(d.tables[0].cell(1,0),'Date visite initiale : {{dos_date_visite1}}\nDate visite fin de travaux : {{dos_date_visite_fin}}\nDate du rapport : {{rfa_date}}')
    for row in range(1,len(d.tables[1].rows)):set_cell(d.tables[1].cell(row,2),'')
    for row in range(1,len(d.tables[2].rows)-1):
        for col,key in enumerate(['description','surface','materiau','entreprise','ttc']):set_cell(d.tables[2].cell(row,col),token(f'P{row}_{key}'))
    set_cell(d.tables[2].rows[-1].cells[-1],'{{fin_travaux_ttc}} €')
    for row,key in enumerate(['fin_travaux_ttc','fin_aide_anah','fin_aides','fin_reste_charge','fin_ecoptz','fin_apport','fin_total_ressources'],1):set_cell(d.tables[3].cell(row,1),token(key)+' €')
    for row in d.tables[4].rows:
        for cell in row.cells:set_cell(cell,'Photo à joindre après validation')
    for i in (34,50):set_p(d.paragraphs[i],'Date : {{DATE}}')
    set_p(d.paragraphs[51],'Nom-prénom du demandeur : {{IDENTITE}} — Signature :')
    output['RFA']=pack_doc(d,src.read_bytes());output['RFA']['maxPostes']=len(d.tables[2].rows)-2
    src=find(root,'*Dossier par*.docx');d=Document(src)
    # Ne reprend pas les zones de mots de passe du modèle source.
    for p in d.element.iter():
        if p.tag.endswith('}t') and p.text and ('Mot de passe' in p.text or 'Identifiant' in p.text):p.text='Accès personnel : ne pas consigner les identifiants ici.'
    d.paragraphs[0].insert_paragraph_before('Dossier : {{IDENTITE}} — {{ADRESSE_BIEN}} — Réf. {{dos_num_anah}}')
    output['DPE']=pack_doc(d,src.read_bytes())
    return output

def placement(key,x,y,width=200,page=0,size=9):return {'key':key,'x':x/778,'y':y/1100,'width':width/778,'page':page,'size':size}
def prep_pdf(root):
    specs={
      'PF':('*13460*.pdf',{},[
        ('dos_delegation',458,152,235),('dos_num_anah',458,179,135),('dos_date_depot',458,208,135),
        ('prop_nom',195,341,185),('prop_prenom',464,341,260),('ADRESSE',212,358,505),('log_cp',203,393,65),('log_commune',365,393,355),('prop_telephone',155,411,135),('prop_email',342,411,375),
        ('fin_travaux_ht',627,490,68),('fin_honoraires_amo',627,507,68),('fin_honoraires_moe',627,524,68),('fin_depenses_ht',627,542,68),('fin_depenses_ttc',627,555,68),('fin_pret',627,591,68),('fin_apport',627,608,68),('fin_aide_anah',627,642,68),('fin_total_aides_publiques',627,833,68),('AUTRES_AIDES',627,852,68),('fin_total_ressources',627,878,68),('IDENTITE',268,916,340),('doc_lieu',150,952,85),('DATE',261,952,106)]),
      'AVA':('*DEMANDE AVANCE*.pdf',{'Délégation':'dos_delegation','N de dossier':'dos_num_anah','Date du dépôt JJ':'DEPOT_J','Date du dépôt MM':'DEPOT_M','Date du dépôt AAAA':'DEPOT_A','Nom Prénom':'IDENTITE','Adresse':'log_adresse','Code postal':'log_cp','Commune':'log_commune','Numéro dossier Anah':'dos_num_anah','Fait à':'doc_lieu','Date jj':'JOUR','Date MM':'MOIS','Date AAAA':'ANNEE','JJ':'DEPOT_J','MM':'DEPOT_M','AAAA':'DEPOT_A'},[]),
      'CEE':('Engagements*.pdf',{'M. Mme':'IDENTITE','numéro du dossier':'dos_num_anah','Adresse du logement':'ADRESSE_BIEN','Fait à':'doc_lieu','Jour':'JOUR','Mois':'MOIS','Année':'ANNEE'},[]),
      'ACO':('*ACOMPTE PO.pdf',{},[('dos_delegation',458,174,235),('dos_num_anah',459,202,135),('dos_date_depot',458,230,135),('log_adresse',378,343,343),('log_cp',203,385,65),('log_commune',357,385,362),('IDENTITE',435,421,300),('ADRESSE',140,441,580),('prop_telephone',140,461,210),('acp_contact_verification',140,541,580),('doc_lieu',157,605,93),('DATE',270,605,116),('ent_nom',127,736,163),('ent_siren',307,752,90),('ent_devis_ht',411,752,78),('ent_travaux_executes_ht',499,752,80),('ent_pct_executes',591,752,32)]),
      'EXC':('*EXCLUSIVITE*.pdf',{},[('dos_delegation',488,264,200),('dos_num_anah',500,282,110),('ent_representant',156,624,560),('ent_nom',221,647,495),('ent_siren',128,670,109),('IDENTITE',94,746,620),('ADRESSE_BIEN',94,793,620),('doc_lieu',116,958,460),('DATE',599,958,117)]),
      'PRS':('*13462*.pdf',{},[]),'PRP':('*13463*.pdf',{},[]),
      'DAP':('FORMULAIRE_PO.pdf',{},[('dos_delegation',468,68,240),('dos_num_anah',469,94,140),('dos_date_depot',474,120,130)])
    }
    for code,ys in [('PRS',[425,446,465,484,583,622,807]),('PRP',[444,464,484,502,599,640,766])]:
        specs[code][2].extend([('dos_delegation',457,157,240),('dos_num_anah',457,185,130),('dos_date_depot',457,215,133),('prop_nom',170,ys[0],560),('prop_prenom',180,ys[1],550),('ADRESSE',185,ys[2],545),('log_cp',195,ys[3],65),('log_commune',438,ys[3],290),('ADRESSE_BIEN',140,ys[4]+20,580),('mand_identite',140,ys[5]+20,580),('mand_lieu',158,ys[6],85),('mand_date',267,ys[6],115),('doc_lieu',483,ys[6],85),('DATE',591,ys[6],116)])
    specs['DAP'][2].extend([(key,x,y,width,1) for key,x,y,width in [
        ('prop_nom',90,97,278),('prop_prenom',420,97,280),('log_adresse',205,136,510),('log_cp',114,173,70),('log_commune',253,173,150),('prop_telephone',82,193,141),('prop_email',450,193,260),('foy_personnes_toit',533,219,26),('foy_rfr',130,574,64),('foy_rfr_annee',390,574,43),('log_annee',445,865,53),('ene_prim_avant',130,937,53),('ene_prim_apres',290,937,54)]])
    specs['DAP'][2].extend([('doc_lieu',465,727,110,2),('DATE',595,727,124,2)])
    result={}
    for code,(pattern,fields,placements) in specs.items():
        src=find(root,pattern);data=src.read_bytes();reader=PdfReader(io.BytesIO(data))
        if reader.is_encrypted:
            if not reader.decrypt(''):raise ValueError('Mot de passe requis pour '+code)
            writer=PdfWriter();writer.clone_document_from_reader(reader);buf=io.BytesIO();writer.write(buf);data=buf.getvalue()
        result[code]={'extension':'pdf','base64':base64.b64encode(data).decode(),'sourceSha256':hashlib.sha256(src.read_bytes()).hexdigest(),'fields':fields,'placements':[placement(*p) for p in placements]}
    return result

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('sources');p.add_argument('output');a=p.parse_args()
    root=Path(a.sources);out=Path(a.output);out.parent.mkdir(parents=True,exist_ok=True)
    docs={**prep_docx(root),**prep_pdf(root)}
    out.write_text(json.dumps({'format':'avereo-uni-modeles','version':1,'usage':'demonstration-fictive','documents':docs},ensure_ascii=False),encoding='utf8')
    print(json.dumps({'documents':list(docs),'bytes':out.stat().st_size}))
