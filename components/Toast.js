'use client';

import React, { useEffect, useRef } from 'react';
import { CheckCircle, AlertTriangle, X as CloseIcon } from 'lucide-react';

const DURATION = { success: 3500, error: 6000 };

function ToastItem({ type, message, onClose }) {
  // Callers pass inline handlers; keep the latest in a ref so re-renders don't restart the timer
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!message) return undefined;
    const timer = setTimeout(() => closeRef.current?.(), DURATION[type]);
    return () => clearTimeout(timer);
  }, [message, type]);

  if (!message) return null;
  const isError = type === 'error';

  return (
    <div
      role={isError ? 'alert' : 'status'}
      className={`pointer-events-auto w-full flex items-start gap-2.5 px-4 py-3 rounded-2xl shadow-xl text-white animate-in slide-in-from-bottom duration-200 ${
        isError ? 'bg-red-600' : 'bg-green-600'
      }`}
    >
      {isError
        ? <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
        : <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />}
      <p className="flex-1 min-w-0 text-sm font-medium break-words">{message}</p>
      <button onClick={onClose} className="p-0.5 rounded-full hover:bg-white/20 flex-shrink-0" aria-label="Close">
        <CloseIcon className="w-4 h-4" />
      </button>
    </div>
  );
}

// Floating messages, fixed near the bottom of the screen (above the bottom navigation),
// so they're seen wherever the page is scrolled to.
export default function Toasts({ error, success, onCloseError, onCloseSuccess }) {
  if (!error && !success) return null;
  return (
    <div className="fixed inset-x-0 bottom-24 z-[60] flex justify-center px-4 pointer-events-none">
      <div className="w-full max-w-sm flex flex-col gap-2">
        <ToastItem type="error" message={error} onClose={onCloseError} />
        <ToastItem type="success" message={success} onClose={onCloseSuccess} />
      </div>
    </div>
  );
}
