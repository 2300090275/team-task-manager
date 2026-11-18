import React from 'react';
import {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
} from './ui/toast';
import { useToast } from '../hooks/useToast';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

export default function Toaster() {
  const { toasts, dismiss } = useToast();

  const getIcon = (variant) => {
    switch (variant) {
      case 'success': return <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />;
      case 'destructive': return <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />;
      default: return <Info className="h-4 w-4 text-blue-500 shrink-0" />;
    }
  };

  return (
    <ToastProvider>
      {toasts.map((t) => (
        <Toast key={t.id} variant={t.variant} onOpenChange={(open) => !open && dismiss(t.id)}>
          <div className="flex items-start gap-3">
            {getIcon(t.variant)}
            <div className="grid gap-1">
              {t.title && <ToastTitle>{t.title}</ToastTitle>}
              {t.description && <ToastDescription>{t.description}</ToastDescription>}
            </div>
          </div>
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  );
}
