import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Settings } from 'lucide-react'
import SignOutButton from './SignOutButton'
import Providers from './Providers'
import ThemeToggle from './ThemeToggle'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, avatar_url')
    .eq('id', user.id)
    .single()

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : user.email?.[0].toUpperCase() ?? 'U'

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900 transition-colors">
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <Link href="/dashboard" className="font-bold text-slate-900 dark:text-white text-base tracking-tight">
            Mi Control
          </Link>

          <div className="flex items-center gap-1">
            <ThemeToggle />

            <Link
              href="/settings"
              className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
              aria-label="Ajustes"
            >
              <Settings size={17} />
            </Link>

            <SignOutButton />

            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.full_name ?? 'Avatar'}
                className="w-8 h-8 rounded-full object-cover ml-1 ring-2 ring-slate-200 dark:ring-slate-700"
              />
            ) : (
              <div className="w-8 h-8 rounded-full ml-1 flex items-center justify-center text-xs font-bold text-white bg-gradient-to-br from-blue-500 to-blue-700 ring-2 ring-slate-200 dark:ring-slate-700">
                {initials}
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-2xl w-full mx-auto px-4 py-5">
        <Providers>
          {children}
        </Providers>
      </div>
    </div>
  )
}
