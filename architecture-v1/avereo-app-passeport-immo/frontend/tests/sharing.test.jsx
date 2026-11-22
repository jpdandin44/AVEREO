import React from 'react';
import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { SharingDialog, SharedDocuments } from '../src/documents/Sharing.jsx';
import DocumentsPanel from '../src/documents/DocumentsPanel.jsx';

afterEach(cleanup);
const bien={id:'fixture',address:'Bien fictif de recette',dossier:{}};
const fixture={client:null,clients:[],documents:[{id:'document',name:'preuve.txt',title:'Preuve fictive',category:'plans',mime:'text/plain',size:10,addedAt:'2026-11-13T12:00:00Z',archivedAt:null,trashedAt:null}],settings:null};

test('la version locale explique la limite et ne lance pas le partage Windows',()=>{
  const share=vi.fn();Object.defineProperty(navigator,'share',{value:share,configurable:true});
  render(<SharingDialog bien={bien} onClose={()=>{}} online={false}/>);
  expect(screen.getByText(/Un lien vers cette version locale/)).toBeTruthy();expect(share).not.toHaveBeenCalled();
});

test('vérifie le compte puis exige une confirmation liée à son identité',async()=>{
  const repository={shares:vi.fn().mockResolvedValue({revision:2,grants:[]}),resolveRecipient:vi.fn().mockResolvedValue({recipient:'avereo_connect:43',label:'Expert fictif',ready:true}),grantShare:vi.fn().mockResolvedValue({revision:3,grants:[{id:'share',label:'Expert fictif',ready:true}]})};
  render(<SharingDialog bien={bien} onClose={()=>{}} online repository={repository}/>);
  fireEvent.change(screen.getByLabelText('Compte CONNECT du destinataire'),{target:{value:'expert-fictif'}});
  fireEvent.click(screen.getByRole('button',{name:'Vérifier le destinataire'}));
  await screen.findByText('Destinataire : Expert fictif');expect(repository.grantShare).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button',{name:'Confirmer le partage en lecture seule'}));
  await waitFor(()=>expect(repository.grantShare).toHaveBeenCalledWith('fixture','expert-fictif',2,'avereo_connect:43'));
  expect(await screen.findByText(/Partage enregistré/)).toBeTruthy();
});

test('explique une activation CONNECT encore en attente',async()=>{
  const repository={shares:vi.fn().mockResolvedValue({revision:0,grants:[]}),resolveRecipient:vi.fn().mockResolvedValue({recipient:'avereo_connect:45',label:'Expert en attente',ready:false})};
  render(<SharingDialog bien={bien} onClose={()=>{}} online repository={repository}/>);
  fireEvent.change(screen.getByLabelText('Compte CONNECT du destinataire'),{target:{value:'attente'}});fireEvent.click(screen.getByRole('button',{name:'Vérifier le destinataire'}));
  expect(await screen.findByText(/Activation CONNECT en attente/)).toBeTruthy();
});

test('une autre saisie annule la confirmation du destinataire précédent',async()=>{
  const repository={shares:vi.fn().mockResolvedValue({revision:0,grants:[]}),resolveRecipient:vi.fn().mockResolvedValue({recipient:'avereo_connect:43',label:'Expert fictif',ready:true})};
  render(<SharingDialog bien={bien} onClose={()=>{}} online repository={repository}/>);
  const input=screen.getByLabelText('Compte CONNECT du destinataire');fireEvent.change(input,{target:{value:'expert'}});fireEvent.click(screen.getByRole('button',{name:'Vérifier le destinataire'}));await screen.findByText('Destinataire : Expert fictif');
  await waitFor(()=>expect(input.disabled).toBe(false));fireEvent.change(input,{target:{value:'autre'}});expect(screen.queryByRole('button',{name:'Confirmer le partage en lecture seule'})).toBeNull();
});

test('révoque un accès avec la révision courante',async()=>{
  const repository={shares:vi.fn().mockResolvedValue({revision:4,grants:[{id:'share',label:'Expert fictif',ready:true}]}),revokeShare:vi.fn().mockResolvedValue({revision:5,grants:[]})};
  render(<SharingDialog bien={bien} onClose={()=>{}} online repository={repository}/>);
  fireEvent.click(await screen.findByRole('button',{name:'Révoquer l’accès à Expert fictif'}));await waitFor(()=>expect(repository.revokeShare).toHaveBeenCalledWith('fixture','share',4));expect(await screen.findByText(/Accès révoqué/)).toBeTruthy();
});

test('le dossier reçu ne propose aucune commande d’écriture',async()=>{
  render(<DocumentsPanel bien={bien} repository={{server:true,load:vi.fn().mockResolvedValue(fixture)}} readOnly/>);
  await screen.findByText('Preuve fictive');expect(screen.getByRole('button',{name:'Consulter'})).toBeTruthy();
  for(const name of ['Renommer ou classer','Archiver','Mettre à la corbeille','Ajouter des fichiers','Personnaliser les catégories'])expect(screen.queryByRole('button',{name})).toBeNull();
  expect(screen.queryByRole('button',{name:/Monter/})).toBeNull();expect(screen.queryByRole('button',{name:/Corbeille/})).toBeNull();
});

test('le destinataire ouvre un dossier sans modifier son propre espace',async()=>{
  const repository={incomingShares:vi.fn().mockResolvedValue({shares:[{id:'share',address:bien.address,ownerLabel:'Propriétaire fictif'}]}),sharedDocuments:vi.fn().mockResolvedValue({...fixture,bien}),sharedFile:vi.fn()};
  render(<SharedDocuments online repository={repository}/>);fireEvent.click(await screen.findByRole('button',{name:`Ouvrir les documents de ${bien.address}`}));
  expect(await screen.findByText('Preuve fictive')).toBeTruthy();expect(repository.sharedDocuments).toHaveBeenCalledWith('share');
});

test('une révocation ou panne retire le dossier affiché lors de l’actualisation',async()=>{
  const repository={incomingShares:vi.fn().mockResolvedValue({shares:[{id:'share',address:bien.address,ownerLabel:'Propriétaire'}]}),sharedDocuments:vi.fn().mockResolvedValue({...fixture,bien}),sharedFile:vi.fn()};
  render(<SharedDocuments online repository={repository}/>);fireEvent.click(await screen.findByRole('button',{name:`Ouvrir les documents de ${bien.address}`}));await screen.findByText('Preuve fictive');
  repository.sharedDocuments.mockRejectedValue(new Error('Partage indisponible ou révoqué.'));fireEvent.click(screen.getByRole('button',{name:'Actualiser les partages'}));
  expect(await screen.findByRole('alert')).toHaveProperty('textContent','Partage indisponible ou révoqué.');expect(screen.queryByText('Preuve fictive')).toBeNull();
});
