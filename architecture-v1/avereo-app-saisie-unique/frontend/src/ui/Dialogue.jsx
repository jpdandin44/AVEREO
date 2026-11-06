import { useStore } from './contexte.js';
import { Confirmation } from './Vues.jsx';

export function ConfirmationDialogue() {
  const confirmation = useStore((s) => s.ui.confirmation);
  const donnees = useStore((s) => s.donnees);
  return <Confirmation confirmation={confirmation} donnees={donnees} />;
}
