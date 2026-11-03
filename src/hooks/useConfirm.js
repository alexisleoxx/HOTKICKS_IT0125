import { useContext } from 'react';
import { ConfirmContext } from '../context/ConfirmContext.jsx';

// Returns confirm(options) → Promise<boolean>. Options: title, message, details [[label, value]],
// tip, confirmLabel, cancelLabel, tone ('danger' | 'warning' | 'success' | 'default'), icon
export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used inside <ConfirmProvider>');
  return ctx;
}
