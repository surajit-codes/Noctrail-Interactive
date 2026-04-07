"use client";

import { useData } from "@/context/DataContext";

export default function ToastStack() {
  const { toasts } = useData();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast toast-${t.type}`}
          role="status"
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
