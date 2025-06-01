import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { AuthButton } from '@/components/auth-button';
import { ThemeSwitcher } from '@/components/theme-switcher';
import ExpensesPageClient from '@/components/expenses-page-client';

export default async function Home() {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  return (
    <main className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
        <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
          <div className="flex gap-5 items-center font-semibold">
            <span>Expense Tracker</span>
          </div>
          <div className="flex items-center gap-4">
            <AuthButton />
            <ThemeSwitcher />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1">
        <ExpensesPageClient />
      </div>
    </main>
  );
}