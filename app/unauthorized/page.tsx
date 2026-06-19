'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ShieldOff } from 'lucide-react'

export default function UnauthorizedPage() {
  useEffect(() => {
    createClient().auth.signOut()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-4">
          <ShieldOff size={28} className="text-red-500" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 mb-2">Acceso no autorizado</h1>
        <p className="text-sm text-slate-500 mb-6">
          Tu cuenta no tiene permiso para acceder a esta aplicación. Contactá al administrador.
        </p>
        <a
          href="/"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
        >
          Intentar con otra cuenta
        </a>
      </div>
    </div>
  )
}
