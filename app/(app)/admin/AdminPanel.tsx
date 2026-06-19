'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useToast } from '@/lib/toast'
import { Plus, Trash2, Mail, ShieldCheck } from 'lucide-react'

type AuthEmail = { id: string; email: string; created_at: string }

const SUPERADMIN = 'mauriciolima1998@gmail.com'

export default function AdminPanel({ emails }: { emails: AuthEmail[] }) {
  const [newEmail, setNewEmail] = useState('')
  const [adding, setAdding] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const router = useRouter()
  const toast = useToast()

  async function handleAdd() {
    const email = newEmail.trim().toLowerCase()
    if (!email || !email.includes('@')) return
    setAdding(true)
    const supabase = createClient()
    const { error } = await supabase.from('authorized_emails').insert({ email })
    setAdding(false)
    if (error) {
      toast(error.message.includes('unique') ? 'Ese correo ya está autorizado' : 'Error al agregar', 'error')
    } else {
      setNewEmail('')
      toast(`${email} autorizado`)
      router.refresh()
    }
  }

  async function handleRemove(id: string, email: string) {
    if (email === SUPERADMIN) {
      toast('No podés eliminar al superadmin', 'error')
      return
    }
    setRemovingId(id)
    const supabase = createClient()
    await supabase.from('authorized_emails').delete().eq('id', id)
    setRemovingId(null)
    toast(`${email} eliminado`, 'info')
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-4">

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Plus size={15} className="text-slate-400" />
          <h2 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Agregar acceso</h2>
        </div>
        <div className="flex gap-2">
          <input
            type="email"
            value={newEmail}
            onChange={e => setNewEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="correo@ejemplo.com"
            className="flex-1 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleAdd}
            disabled={adding || !newEmail.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium disabled:opacity-40 transition-colors"
          >
            {adding ? '...' : 'Agregar'}
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Mail size={15} className="text-slate-400" />
          <h2 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Correos autorizados</h2>
          <span className="ml-auto text-xs text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">{emails.length}</span>
        </div>

        {emails.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">No hay correos autorizados</p>
        ) : (
          <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-700">
            {emails.map(e => (
              <div key={e.id} className="flex items-center justify-between py-2.5 gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  {e.email === SUPERADMIN && (
                    <ShieldCheck size={14} className="text-blue-500 shrink-0" />
                  )}
                  <span className="text-sm text-slate-700 dark:text-slate-200 truncate">{e.email}</span>
                </div>
                {e.email !== SUPERADMIN && (
                  <button
                    onClick={() => handleRemove(e.id, e.email)}
                    disabled={removingId === e.id}
                    className="text-red-400 hover:text-red-600 dark:hover:text-red-300 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors disabled:opacity-40 shrink-0"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
