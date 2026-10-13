import { useState, useRef, useEffect } from 'react';
import { Armchair, Bell, CheckCircle2, ChevronRight, CircleDollarSign, ClipboardList, Crown, LayoutGrid, LogOut, MapPin, RotateCw, Search, Sparkles, UtensilsCrossed, Users2, X } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SharedLayout({ role, userName, staffCategory = 'waiter', activeView, setActiveView, tablesCount = 50, onLogout, onRefresh, isRefreshing, messages = [], children }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    if (showNotifications) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [showNotifications]);

  const unreadCount = messages.filter((m) => !m.read).length;
  const menuItems =
    role === 'owner'
      ? [
          { key: 'overview', label: 'Executive Overview', icon: LayoutGrid },
          { key: 'expenses', label: 'Hotel Costs & Expenses', icon: CircleDollarSign },
          { key: 'menu', label: 'Menu & Dishes', icon: ClipboardList },
          { key: 'team', label: 'Staff & Team', icon: Users2 },
          { key: 'billing', label: 'Billing & Invoices', icon: Sparkles }
        ]
      : role === 'manager'
        ? [
            { key: 'overview', label: 'Overview', icon: LayoutGrid },
            { key: 'tables', label: `Tables Floor (${tablesCount || 50})`, icon: Armchair },
            { key: 'team', label: 'Team Members', icon: Users2 },
            { key: 'customers', label: 'Guest Roster', icon: Users2 },
            { key: 'billing', label: 'Billing & Desk', icon: Sparkles }
          ]
        : role === 'customer'
          ? [
              { key: 'overview', label: 'Dining Menu', icon: ClipboardList },
              { key: 'orders', label: 'My Orders', icon: ClipboardList },
              { key: 'feedback', label: 'Guest Feedback', icon: Sparkles },
              { key: 'billing', label: 'Digital Invoice', icon: Sparkles }
            ]
          : staffCategory === 'cleaning'
            ? [
                { key: 'overview', label: 'Cleaning Overview', icon: LayoutGrid },
                { key: 'tables', label: `Tables Floor (${tablesCount || 50})`, icon: Armchair },
                { key: 'bartan', label: 'Kitchen Bartan Stock', icon: Sparkles }
              ]
            : staffCategory === 'chef'
              ? [
                  { key: 'overview', label: 'Kitchen Overview', icon: LayoutGrid },
                  { key: 'orders', label: 'Live KDS Orders', icon: ClipboardList },
                  { key: 'bartan', label: 'Dishware Stock', icon: Sparkles }
                ]
              : [
                  { key: 'overview', label: 'Service Overview', icon: LayoutGrid },
                  { key: 'orders', label: 'Guest Orders', icon: ClipboardList },
                  { key: 'billing', label: 'Table Billing', icon: Sparkles }
                ];

  const getRoleBadgeColor = () => {
    switch (role) {
      case 'owner':
        return 'from-amber-500 to-amber-600 text-white';
      case 'manager':
        return 'from-indigo-600 to-blue-600 text-white';
      case 'staff':
        return 'from-emerald-600 to-teal-600 text-white';
      default:
        return 'from-amber-600 to-orange-500 text-white';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-2 sm:p-4 lg:p-6 transition-colors duration-300">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-4 lg:flex-row lg:gap-6">
        {/* Normal Solid Sidebar */}
        <aside className="w-full lg:sticky lg:top-6 lg:w-72 lg:shrink-0 lg:self-start">
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition-all">
            
            {/* Hotel Brand Crest */}
            <Link
              to="/dashboard/overview"
              onClick={() => setActiveView && setActiveView('overview')}
              className="mb-5 block rounded-2xl border border-amber-200 bg-amber-50/50 p-4 shadow-xs transition hover:bg-amber-100/50"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-500 to-gold-400 text-white shadow-md shadow-amber-500/25">
                  <Crown size={22} className="text-amber-100" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-display text-sm font-bold tracking-wider text-slate-900 uppercase">Royal Plaza</span>
                    <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">5★</span>
                  </div>
                  <p className="text-[11px] font-medium text-slate-500">Hospitality Suite • Surat</p>
                </div>
              </div>
            </Link>

            {/* Navigation Menu */}
            <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-widest text-slate-400">Navigation</p>
            <nav className="space-y-1.5">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const active = item.key === activeView;
                return (
                  <Link
                    key={item.key}
                    to={`/dashboard/${item.key}`}
                    onClick={() => setActiveView && setActiveView(item.key)}
                    className={`group flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-left text-sm font-semibold transition-all duration-200 cursor-pointer ${
                      active
                        ? 'bg-gradient-to-r from-amber-500/15 via-amber-500/8 to-transparent text-amber-900 border-l-[3.5px] border-amber-500 shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                        active
                          ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/30'
                          : 'bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-slate-700'
                      }`}>
                        <Icon size={16} />
                      </span>
                      {item.label}
                    </span>
                    <ChevronRight size={15} className={`transition-transform duration-200 ${active ? 'text-amber-600 translate-x-0.5' : 'text-slate-400 opacity-0 group-hover:opacity-100'}`} />
                  </Link>
                );
              })}
            </nav>

            {/* User Profile Card & Role Footer */}
            <div className="mt-5 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-medium text-slate-500">Access Tier</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="font-display text-sm font-bold capitalize text-slate-900">{role}</p>
                    {role === 'staff' && (
                      <span className="rounded-md bg-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700 capitalize">
                        {staffCategory}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                  Live Ops
                </div>
              </div>

              <div className="mt-3.5 pt-3 border-t border-slate-200/70 flex items-center justify-between">
                <div className="truncate pr-2">
                  <p className="truncate text-xs font-semibold text-slate-800">{userName}</p>
                  <p className="text-[10px] text-slate-500 truncate">Connected Session</p>
                </div>
                <button
                  onClick={onLogout}
                  title="Sign out of console"
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 cursor-pointer"
                >
                  <LogOut size={13} />
                  <span>Exit</span>
                </button>
              </div>
            </div>

          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 space-y-5 min-w-0">
          
          {/* Executive Top Header */}
          <header className="rounded-3xl border border-slate-200 bg-white p-3.5 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              
              {/* Search Bar */}
              <div className="flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 transition-all focus-within:border-amber-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-amber-500/20 md:w-80">
                <Search size={16} className="text-slate-400 shrink-0" />
                <input
                  className="w-full bg-transparent text-sm text-slate-800 placeholder:text-slate-400 outline-none"
                  placeholder="Search orders, dishes, tables..."
                />
              </div>

              {/* Header Right Actions */}
              <div className="flex items-center gap-2.5 sm:gap-3">
                
                {/* Location indicator */}
                <div className="hidden xl:flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600">
                  <MapPin size={13} className="text-amber-600" />
                  <span>Surat, Gujarat</span>
                </div>

                {/* Refresh Live Data */}
                {onRefresh && (
                  <button
                    type="button"
                    onClick={onRefresh}
                    disabled={isRefreshing}
                    title="Refresh live hotel data"
                    className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-amber-400 hover:bg-amber-50 hover:text-amber-800 disabled:opacity-50 cursor-pointer"
                  >
                    <RotateCw size={14} className={`text-amber-600 transition-transform ${isRefreshing ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline">{isRefreshing ? 'Syncing...' : 'Sync'}</span>
                  </button>
                )}

                {/* User Avatar Pill */}
                <div className="flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-slate-50 p-1.5 pr-3 shadow-xs">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr ${getRoleBadgeColor()} font-display text-xs font-bold shadow-sm`}>
                    {userName ? userName.charAt(0).toUpperCase() : 'G'}
                  </div>
                  <div className="text-left hidden sm:block">
                    <p className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[120px]">{userName}</p>
                    <p className="text-[10px] font-medium capitalize text-amber-700 leading-tight">{role}</p>
                  </div>
                </div>

                {/* Notification Bell with Dropdown */}
                <div className="relative" ref={notifRef}>
                  <button
                    type="button"
                    onClick={() => setShowNotifications((prev) => !prev)}
                    title="View live alerts & messages"
                    className="relative rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 cursor-pointer shadow-sm flex items-center justify-center"
                  >
                    <Bell size={16} />
                    {unreadCount > 0 ? (
                      <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-black text-white ring-2 ring-white shadow-xs">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    ) : (
                      <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white" />
                    )}
                  </button>

                  {/* Dropdown Menu */}
                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-3xl border border-slate-200 bg-white p-4 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-500/10 text-amber-700">
                            <Bell size={14} />
                          </span>
                          <h4 className="font-display text-sm font-bold text-slate-900">Live Team Notifications</h4>
                        </div>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                          {messages.length} Total
                        </span>
                      </div>

                      <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                        {messages.length === 0 ? (
                          <div className="py-8 text-center text-xs text-slate-400">
                            <UtensilsCrossed size={28} className="mx-auto text-slate-300 mb-2 opacity-60" />
                            No active notifications right now.
                          </div>
                        ) : (
                          messages.slice(0, 8).map((msg, i) => {
                            const isReadyAlert = msg.content?.includes('READY TO SERVE') || msg.content?.includes('Ready');
                            return (
                              <div
                                key={msg._id || msg.id || i}
                                className={`rounded-2xl p-3 text-xs transition border ${
                                  isReadyAlert
                                    ? 'border-emerald-200 bg-emerald-50/70'
                                    : 'border-slate-100 bg-slate-50'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-1 mb-1">
                                  <span className={`inline-flex items-center gap-1 font-bold ${
                                    isReadyAlert ? 'text-emerald-800' : 'text-slate-800'
                                  }`}>
                                    {isReadyAlert ? '🍳 Kitchen Dispatch' : msg.senderName || 'Team Message'}
                                  </span>
                                  <span className="text-[10px] text-slate-400">
                                    {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                                  </span>
                                </div>
                                <p className={`line-clamp-3 ${isReadyAlert ? 'text-emerald-950 font-medium' : 'text-slate-600'}`}>
                                  {msg.content}
                                </p>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>
          </header>

          {/* Render Active View / Dashboard */}
          <main>{children}</main>
        </div>
      </div>
    </div>
  );
}
