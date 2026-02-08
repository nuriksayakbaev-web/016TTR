"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { createPortal } from "react-dom";

type ToastType = "success" | "error" | "info";

interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const add = useCallback((message: string, type: ToastType = "info") => {
    const id = Date.now();
    setItems((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);
  const toast = useCallback(
    (message: string, type?: ToastType) => add(message, type ?? "info"),
    [add]
  );
  const success = useCallback((message: string) => add(message, "success"), [add]);
  const error = useCallback((message: string) => add(message, "error"), [add]);

  const value: ToastContextValue = { toast, success, error };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {mounted &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2"
            aria-live="polite"
          >
            {items.map((t) => (
              <div
                key={t.id}
                className={`rounded-md border px-4 py-2 text-sm shadow-lg ${
                  t.type === "error"
                    ? "border-red-500 bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200"
                    : t.type === "success"
                      ? "border-green-500 bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200"
                      : "border-border bg-background"
                }`}
              >
                {t.message}
              </div>
            ))}
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  );
}
