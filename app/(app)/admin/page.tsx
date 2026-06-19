import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminPanel from './AdminPanel'

const SUPERADMIN = 'mauriciolima1998@gmail.com'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email !== SUPERADMIN) redirect('/dashboard')

  const { data: emails } = await supabase
    .from('authorized_emails')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Panel de administración</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Gestioná los correos autorizados a ingresar</p>
      </div>
      <AdminPanel emails={emails ?? []} />
    </div>
  )
}
