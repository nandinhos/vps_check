"use client"

import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

type ToastVariant = "default" | "success" | "destructive" | "warning"

interface ToastItem {
  id: string
  variant?: ToastVariant
  title?: string
  description?: string
}

const variantStyles: Record<ToastVariant, string> = {
  default: "bg-secondary border-border text-secondary-foreground",
  success: "bg-green-900/50 border-green-800 text-green-100",
  destructive: "bg-destructive/90 border-destructive text-destructive-foreground",
  warning: "bg-yellow-900/50 border-yellow-800 text-yellow-100",
}

function Toast({ variant = "default", title, description, onDismiss, id }: ToastItem & { onDismiss: (id: string) => void }) {
  React.useEffect(() => {
    const timer = setTimeout(() => onDismiss(id), 5000)
    return () => clearTimeout(timer)
  }, [onDismiss, id])

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 p-4 rounded-lg border shadow-lg animate-in slide-in-from-right-full",
        variantStyles[variant]
      )}
    >
      <div className="flex-1">
        {title && <p className="font-medium">{title}</p>}
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      <button onClick={() => onDismiss(id)} className="text-muted-foreground hover:text-foreground">
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

interface ToastContextValue {
  toast: (props: { title: string; description?: string; variant?: ToastVariant }) => void
  dismiss: (id?: string) => void
}

const ToastContext = React.createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([])

  const addToast = React.useCallback((props: { title: string; description?: string; variant?: ToastVariant }) => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts(prev => [...prev, { ...props, id }])
  }, [])

  const dismiss = React.useCallback((id?: string) => {
    if (id) {
      setToasts(prev => prev.filter(t => t.id !== id))
    } else {
      setToasts([])
    }
  }, [])

  return (
    <ToastContext.Provider value={{ toast: addToast, dismiss }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
        {toasts.map((t) => (
          <Toast key={t.id} {...t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}
