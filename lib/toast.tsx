'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

type ToastType = 'success' | 'error' | 'info'
type Toast = { id: number; message: string; type: ToastType }

const ToastCtx = createContext<(message: string, type?: ToastType) => void>(() => {})

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const show = useCallback((message: string, type: ToastType = 'success') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000)
  }, [])

  return (
    <ToastCtx.Provider value={show}>
      {children}
      {toasts.length > 0 && (
        <div className="fixed top-16 inset-x-0 flex flex-col items-center gap-2 z-[200] pointer-events-none px-4">
          {toasts.map(t => (
            <div key={t.id} className={`px-4 py-2.5 rounded-xl shadow-lg text-sm font-medium text-white max-w-sm w-full text-center ${
              t.type === 'success' ? 'bg-green-600' :
              t.type === 'error'   ? 'bg-red-600'   : 'bg-gray-700'
            }`}>
              {t.message}
            </div>
          ))}
        </div>
      )}
    </ToastCtx.Provider>
  )
}

export function useToast() {
  return useContext(ToastCtx)
}
