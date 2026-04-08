import { useState, useEffect, useCallback } from 'react';

let addToastFn = null;

export function showToast(message) {
  addToastFn?.(message);
}

export default function Toast() {
  const [toasts, setToasts] = useState([]);

  addToastFn = useCallback((message) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }, []);

  if (!toasts.length) return null;

  return (
    <div className="fixed top-3 left-3 right-3 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className="glass rounded-xl px-4 py-3 text-sm font-semibold text-text-primary animate-fade-up">
          ⚠️ {t.message}
        </div>
      ))}
    </div>
  );
}
