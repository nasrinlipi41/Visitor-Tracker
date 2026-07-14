// Simplified useToast hook implementation
import * as React from "react"

export interface ToastProps {
  id: string
  title?: string
  description?: string
  action?: React.ReactNode
}

type ToastActionElement = React.ReactElement

export function useToast() {
  const [toasts, setToasts] = React.useState<ToastProps[]>([])

  const toast = React.useCallback(
    ({ ...props }: Omit<ToastProps, "id">) => {
      const id = Math.random().toString(36).substr(2, 9)
      setToasts((prev) => [...prev, { id, ...props }])
      return { id }
    },
    []
  )

  const dismiss = React.useCallback((toastId?: string) => {
    setToasts((prev) =>
      toastId ? prev.filter((t) => t.id !== toastId) : []
    )
  }, [])

  return {
    toast,
    dismiss,
    toasts,
  }
}
