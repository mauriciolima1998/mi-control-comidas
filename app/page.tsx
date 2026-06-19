'use client'

import { createClient } from '@/lib/supabase/client'
import { Flame, Camera, Sparkles, TrendingDown } from 'lucide-react'

export default function LoginPage() {
  async function signInWithGoogle() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-4 py-12">

      {/* Logo */}
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center mb-6 shadow-lg shadow-blue-900/40">
        <Flame size={30} className="text-white" />
      </div>

      {/* Headline */}
      <h1 className="text-3xl font-bold text-white text-center mb-2 tracking-tight">
        Mi Control de Comidas
      </h1>
      <p className="text-slate-400 text-sm text-center mb-10 max-w-xs">
        Registrá tus comidas y seguí tus macros diarios con ayuda de IA.
      </p>

      {/* Features */}
      <div className="flex flex-col gap-3 w-full max-w-xs mb-10">
        {[
          { icon: Camera, label: 'Analizá fotos con IA', desc: 'Sacá una foto y obtené los macros al instante' },
          { icon: Sparkles, label: 'Recomendaciones personalizadas', desc: 'Actividad física adaptada a tu déficit' },
          { icon: TrendingDown, label: 'Seguimiento de peso', desc: 'Historial y estimado de días al objetivo' },
        ].map(({ icon: Icon, label, desc }) => (
          <div key={label} className="flex items-start gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 flex items-center justify-center shrink-0 mt-0.5">
              <Icon size={15} className="text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">{label}</p>
              <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Google button */}
      <button
        onClick={signInWithGoogle}
        className="flex items-center gap-3 bg-white hover:bg-slate-50 text-slate-800 font-semibold px-6 py-3.5 rounded-2xl shadow-lg shadow-black/30 transition-all hover:scale-[1.02] active:scale-[0.98] w-full max-w-xs justify-center"
      >
        <svg width="18" height="18" viewBox="0 0 48 48">
          <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.1-4z"/>
          <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16 19 13 24 13c3 0 5.8 1.1 7.9 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
          <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.2C29.4 35.5 26.8 36 24 36c-5.3 0-9.6-3.1-11.3-7.5l-6.6 5.1C9.5 39.6 16.3 44 24 44z"/>
          <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.9 2.4-2.5 4.4-4.6 5.8l6.2 5.2C40.9 35.7 44 30.3 44 24c0-1.3-.1-2.7-.4-4z"/>
        </svg>
        Continuar con Google
      </button>

      <p className="text-xs text-slate-600 mt-6 text-center">
        Acceso solo por invitación
      </p>
    </main>
  )
}
