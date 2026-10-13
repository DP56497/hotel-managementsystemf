import { LogOut, Sparkles, UserCircle2 } from 'lucide-react';

export default function RoleShell({ role, userName, onLogout, children }) {
  return (
    <div className="min-h-screen bg-transparent p-4 text-slate-700 md:p-6 lg:p-8">
      <div className="mx-auto w-full max-w-8xl rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:p-6 lg:p-8">
        <header className="mb-6 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-800">
              <Sparkles size={16} /> {role.toUpperCase()} CONSOLE
            </p>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 font-display sm:text-4xl">Welcome back, {userName}</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">A calm, reliable workspace with streamlined operations for every role.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-xs">
              <UserCircle2 size={16} className="text-amber-700" /> {role.charAt(0).toUpperCase() + role.slice(1)} access
            </div>
            <button onClick={onLogout} className="rounded-full border border-slate-200 bg-white p-2 text-slate-700 transition hover:bg-slate-100 cursor-pointer shadow-xs">
              <LogOut size={18} className="text-slate-700" />
            </button>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}
