// Pictogrammes filaires homogènes (charte : simples, géométriques, trait de 2 px). Couleurs héritées du CSS.
const CHEMINS = {
  alerte: (
    <>
      <path d="M12 3 2.5 20h19L12 3Z" />
      <path d="M12 10v4.5M12 17.5v.01" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5.5M12 7.5v.01" />
    </>
  ),
  annuler: (
    <>
      <path d="M9 7 4 12l5 5" />
      <path d="M4 12h10a6 6 0 0 1 6 6" />
    </>
  ),
  retablir: (
    <>
      <path d="m15 7 5 5-5 5" />
      <path d="M20 12H10a6 6 0 0 0-6 6" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  supprimer: (
    <>
      <path d="M4 7h16M10 7V4h4v3M6 7l1 13h10l1-13" />
      <path d="M10 11v6M14 11v6" />
    </>
  ),
  recentrer: (
    <>
      <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
      <circle cx="12" cy="12" r="2" />
    </>
  ),
  tracer: (
    <>
      <path d="m4 20 1-4L16 5l3 3L8 19l-4 1Z" />
      <path d="m14 7 3 3" />
    </>
  ),
};

/** @param {{nom: keyof typeof CHEMINS, className?: string}} props */
export default function Icone({ nom, className = "encadre__icone" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      {CHEMINS[nom]}
    </svg>
  );
}
