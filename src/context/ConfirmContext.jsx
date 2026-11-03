import { createContext, useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, HelpCircle, PackagePlus, Trash2, X } from 'lucide-react';

export const ConfirmContext = createContext(null);

const ICONS = { danger: Trash2, warning: AlertTriangle, success: PackagePlus, default: HelpCircle };

// Global replacement for window.confirm():
//   const confirm = useConfirm();
//   if (await confirm({ title, message, confirmLabel, tone: 'danger' })) { ... }
export function ConfirmProvider({ children }) {
  const [dialog, setDialog] = useState(null);
  const resolver = useRef(null);
  const confirmBtn = useRef(null);

  const confirm = useCallback((options) => new Promise((resolve) => {
    resolver.current = resolve;
    setDialog({ tone: 'default', confirmLabel: 'Confirm', cancelLabel: 'Cancel', ...options });
  }), []);

  const close = useCallback((result) => {
    resolver.current?.(result);
    resolver.current = null;
    setDialog(null);
  }, []);

  useEffect(() => {
    if (!dialog) return;
    const t = setTimeout(() => confirmBtn.current?.focus(), 50);
    const onKey = (e) => { if (e.key === 'Escape') close(false); };
    window.addEventListener('keydown', onKey);
    return () => { clearTimeout(t); window.removeEventListener('keydown', onKey); };
  }, [dialog, close]);

  const Icon = dialog ? dialog.icon || ICONS[dialog.tone] || ICONS.default : null;

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <AnimatePresence>
        {dialog && (
          <motion.div className="cdlg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} onClick={() => close(false)}>
            <motion.div
              className={`cdlg__card cdlg--${dialog.tone}`}
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="cdlg-title"
              aria-describedby="cdlg-msg"
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.97 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              <button className="cdlg__x" onClick={() => close(false)} aria-label="Close"><X size={18} /></button>
              <div className="cdlg__icon"><Icon size={24} /></div>
              <h3 id="cdlg-title">{dialog.title}</h3>
              {dialog.message && <p id="cdlg-msg">{dialog.message}</p>}
              {dialog.details && (
                <div className="cdlg__details">
                  {dialog.details.map(([label, value]) => (
                    <div key={label}><span>{label}</span><strong>{value}</strong></div>
                  ))}
                </div>
              )}
              {dialog.tip && <p className="cdlg__tip">{dialog.tip}</p>}
              <div className="cdlg__actions">
                <button className="btn btn--sm abtn" onClick={() => close(false)}>{dialog.cancelLabel}</button>
                <button ref={confirmBtn} className={`btn btn--sm cdlg__ok cdlg__ok--${dialog.tone}`} onClick={() => close(true)}>{dialog.confirmLabel}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ConfirmContext.Provider>
  );
}
