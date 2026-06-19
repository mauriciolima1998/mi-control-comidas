import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import SettingsForm from './SettingsForm'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, daily_calorie_goal, current_weight, target_weight, age')
    .eq('id', user.id)
    .single()

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard" className="text-gray-400 hover:text-gray-700 transition text-xl leading-none">‹</Link>
        <h1 className="text-xl font-semibold text-gray-800">Ajustes</h1>
      </div>
      <SettingsForm profile={profile} />
    </div>
  )
}
