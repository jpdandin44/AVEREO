// Shared labels keep the interview and document export aligned.
export const LISTENING_SECTIONS = [
  {
    title: '1. Comprendre son histoire',
    help: 'Commencez par une question ouverte, puis laissez le client raconter avec ses mots.',
    fields: [
      { key: 'motif_visite', label: 'Motif de la visite', prompt: "Qu'est-ce qui vous amène à demander cette visite maintenant ?" },
      { key: 'histoire_acquisition', label: "Choix du logement et projet de vie", prompt: "Qu'est-ce qui vous a donné envie d'acquérir ou d'habiter ce bien ? Qu'y appréciez-vous ? Quel était votre projet ?" },
      { key: 'travaux_realises', label: 'Travaux déjà réalisés et résultats', prompt: 'Quels travaux, à quelle période et pour quelle raison ? Le résultat vous satisfait-il ? Des documents sont-ils disponibles ?' },
    ],
  },
  {
    title: '2. Explorer le vécu quotidien',
    help: "Distinguez ce que le client rapporte de ce qui reste à observer. Ne concluez pas trop vite sur la cause.",
    fields: [
      { key: 'preoccupations', label: 'Préoccupations et situations concrètes', prompt: "Pouvez-vous raconter un exemple récent ? Dans quelle pièce, à quel moment, depuis quand ? Quel impact sur votre quotidien ?" },
      { key: 'usages_logement', label: 'Usages du logement et habitudes', prompt: "Comment vivez-vous dans les pièces ? Chauffage, aération, activités, périodes d'absence… Qu'avez-vous déjà essayé ?" },
      { key: 'contexte_occupation', label: "Occupants et contexte d'occupation", prompt: "Qui utilise le logement et à quels moments ? Notez uniquement les informations utiles que le client souhaite partager." },
    ],
  },
  {
    title: '3. Reformuler et prioriser ensemble',
    help: "Une solution demandée n'est pas forcément le besoin : « changer les fenêtres » peut viser le confort, le calme ou les économies.",
    fields: [
      { key: 'attentes_client', label: 'Attentes et priorités du client', prompt: "Qu'aimeriez-vous pouvoir faire ou améliorer ? S'il ne fallait retenir qu'une priorité, laquelle choisiriez-vous ?" },
      { key: 'besoin_reformule', label: 'Besoin reformulé avec le client', prompt: "Si je résume, vous souhaitez… afin de… Est-ce bien cela ? Y a-t-il un autre besoin important ?" },
      { key: 'criteres_reussite', label: 'Comment reconnaître une amélioration ?', prompt: 'Que faudrait-il constater dans votre quotidien pour dire que la situation est améliorée ?' },
      { key: 'contraintes_projet', label: 'Contraintes et horizon du projet', prompt: 'Quelles contraintes faut-il respecter : calendrier, occupation pendant les travaux, budget si vous souhaitez en parler, décisions partagées… ?' },
    ],
  },
];

export const emptyClientListening = () => ({
  ...Object.fromEntries(LISTENING_SECTIONS.flatMap((section) => section.fields.map((field) => [field.key, '']))),
  sujets_identifies: [],
  besoin_confirme: false,
  consentement_photos: false,
  consentement_dictee: false,
});
