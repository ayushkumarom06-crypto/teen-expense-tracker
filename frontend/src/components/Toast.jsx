import { createContext, useContext, useState } from 'react';
import { Check, CircleAlert, X } from 'lucide-react';

const ToastContext = createContext(() => {});

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  function notify(message, type = 'success') {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 3200);
  }
  return <ToastContext.Provider value={notify}>{children}{toast && <div className={`toast toast-${toast.type}`} role="status"><span className="toast-icon">{toast.type === 'error' ? <CircleAlert size={17} /> : <Check size={17} />}</span>{toast.message}<button aria-label="Dismiss notification" onClick={() => setToast(null)}><X size={15} /></button></div>}</ToastContext.Provider>;
}

export const useToast = () => useContext(ToastContext);