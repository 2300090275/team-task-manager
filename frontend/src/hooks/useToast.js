import { useState, useEffect, useCallback } from 'react';

let toastId = 0;
let listeners = [];

function emitToast(toast) {
  listeners.forEach((fn) => fn(toast));
}

export function toast({ title, description, variant = 'default', duration = 4000 }) {
  emitToast({ id: ++toastId, title, description, variant, duration });
}

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((t) => {
    setToasts((prev) => [...prev, t]);
    if (t.duration !== Infinity) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.id !== t.id));
      }, t.duration || 4000);
    }
  }, []);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((x) => x.id !== id));
  }, []);

  // subscribe to global toasts — useEffect, not useState
  useEffect(() => {
    listeners.push(addToast);
    return () => {
      listeners = listeners.filter((fn) => fn !== addToast);
    };
  }, [addToast]);

  return { toasts, dismiss };
}
