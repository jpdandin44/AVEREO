import { useStore } from '../hooks/useStore.js';

export default function Toast() {
  const toast = useStore(s => s.toast);
  if (!toast) return null;
  return <div className="toast" role="status" aria-live="polite">{toast}</div>;
}
