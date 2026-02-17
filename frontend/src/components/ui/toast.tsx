"use client";

/**
 * Toast notification component using @radix-ui/react-toast
 * Provides toast notifications with variants: default, success, error, warning
 */

import * as React from "react";
import * as ToastPrimitives from "@radix-ui/react-toast";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

// ==========================================
// Types
// ==========================================

type ToastVariant = "default" | "success" | "error" | "warning";

interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
}

// ==========================================
// Context
// ==========================================

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined);

// ==========================================
// Variant Styles
// ==========================================

const variantStyles: Record<ToastVariant, string> = {
  default: "bg-white border-gray-200 text-gray-900",
  success: "bg-green-50 border-green-200 text-green-900",
  error: "bg-red-50 border-red-200 text-red-900",
  warning: "bg-amber-50 border-amber-200 text-amber-900",
};

const variantIconColors: Record<ToastVariant, string> = {
  default: "text-gray-500",
  success: "text-green-600",
  error: "text-red-600",
  warning: "text-amber-600",
};

// ==========================================
// Provider Component
// ==========================================

interface ToastProviderProps {
  children: React.ReactNode;
  duration?: number;
}

export function ToastProvider({ children, duration = 5000 }: ToastProviderProps) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const addToast = React.useCallback((toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
  }, []);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      <ToastPrimitives.Provider duration={duration}>
        {children}
        {toasts.map((toast) => (
          <ToastPrimitives.Root
            key={toast.id}
            className={cn(
              "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-lg border p-4 shadow-lg transition-all",
              "data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none",
              "data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full",
              variantStyles[toast.variant || "default"]
            )}
            duration={toast.duration}
            onOpenChange={(open) => {
              if (!open) removeToast(toast.id);
            }}
          >
            <div className="grid gap-1">
              {toast.title && (
                <ToastPrimitives.Title className="text-sm font-semibold">
                  {toast.title}
                </ToastPrimitives.Title>
              )}
              {toast.description && (
                <ToastPrimitives.Description className="text-sm opacity-90">
                  {toast.description}
                </ToastPrimitives.Description>
              )}
            </div>
            <ToastPrimitives.Close
              className={cn(
                "absolute right-2 top-2 rounded-md p-1 opacity-0 transition-opacity",
                "hover:bg-black/5 focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100",
                variantIconColors[toast.variant || "default"]
              )}
            >
              <X className="h-4 w-4" />
            </ToastPrimitives.Close>
          </ToastPrimitives.Root>
        ))}
        <ToastViewport />
      </ToastPrimitives.Provider>
    </ToastContext.Provider>
  );
}

// ==========================================
// Viewport Component
// ==========================================

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      "fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse gap-2 p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col sm:max-w-[420px]",
      className
    )}
    {...props}
  />
));
ToastViewport.displayName = "ToastViewport";

// ==========================================
// Hook
// ==========================================

export function useToast() {
  const context = React.useContext(ToastContext);

  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }

  return context;
}

// ==========================================
// Convenience Function
// ==========================================

let toastFn: ((toast: Omit<Toast, "id">) => void) | null = null;

export function setToastFunction(fn: (toast: Omit<Toast, "id">) => void) {
  toastFn = fn;
}

/**
 * Show a toast notification
 * Note: This function requires ToastProvider to be mounted and initialized
 */
export function toast(options: Omit<Toast, "id">) {
  if (toastFn) {
    toastFn(options);
  } else {
    console.warn("Toast function not initialized. Make sure ToastProvider is mounted.");
  }
}

// Convenience methods
toast.success = (title: string, description?: string) => {
  toast({ title, description, variant: "success" });
};

toast.error = (title: string, description?: string) => {
  toast({ title, description, variant: "error" });
};

toast.warning = (title: string, description?: string) => {
  toast({ title, description, variant: "warning" });
};

toast.default = (title: string, description?: string) => {
  toast({ title, description, variant: "default" });
};

// ==========================================
// Toast Initializer Component
// ==========================================

/**
 * Component to initialize the toast function
 * Place this inside ToastProvider
 */
export function ToastInitializer() {
  const { addToast } = useToast();

  React.useEffect(() => {
    setToastFunction(addToast);
    return () => {
      setToastFunction(() => {});
    };
  }, [addToast]);

  return null;
}

// ==========================================
// Export Primitives for custom usage
// ==========================================

export {
  ToastPrimitives,
  ToastViewport,
};

export type { Toast, ToastVariant };
