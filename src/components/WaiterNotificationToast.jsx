import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCircle2, UtensilsCrossed, X } from 'lucide-react';

// Gentle 2-tone pleasant kitchen chime using Web Audio API (D5 -> A5)
export const playKitchenChime = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const now = ctx.currentTime;

    // First tone (D5 - 587.33 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.18, now + 0.04);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.36);

    // Second higher tone (A5 - 880 Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(880, now + 0.12);
    gain2.gain.setValueAtTime(0, now + 0.12);
    gain2.gain.linearRampToValueAtTime(0.22, now + 0.16);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.62);
  } catch {
    // Audio context may be restricted by autoplay policy until user gesture
  }
};

export default function WaiterNotificationToast({ notifications = [], onDismiss, onDeliverOrder }) {
  if (!notifications || notifications.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-md w-full pointer-events-none px-4 sm:px-0">
      <AnimatePresence>
        {notifications.map((notif) => (
          <ToastCard
            key={notif.id}
            notif={notif}
            onDismiss={() => onDismiss(notif.id)}
            onDeliverOrder={onDeliverOrder}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastCard({ notif, onDismiss, onDeliverOrder }) {
  useEffect(() => {
    playKitchenChime();
    const timer = setTimeout(() => {
      onDismiss();
    }, 14000);
    return () => clearTimeout(timer);
  }, []);

  const itemsList = Array.isArray(notif.items)
    ? notif.items.map((i) => `${i.qty || 1}× ${i.name}`).join(', ')
    : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="pointer-events-auto overflow-hidden rounded-3xl border-2 border-emerald-400/80 bg-white/95 backdrop-blur-md p-4.5 shadow-2xl shadow-emerald-500/20"
    >
      {/* Top Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 text-white shadow-md shadow-emerald-500/30">
            <UtensilsCrossed size={20} />
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500" />
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-800 border border-emerald-200">
                Ready to Serve 🍳
              </span>
              <span className="text-[11px] font-bold text-slate-400">Live Kitchen Alert</span>
            </div>
            <h4 className="font-display text-base font-black text-slate-900 mt-0.5 leading-tight">
              Table #{notif.tableNumber} Order Ready!
            </h4>
          </div>
        </div>

        <button
          type="button"
          onClick={onDismiss}
          className="rounded-xl p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
          title="Dismiss notification"
        >
          <X size={16} />
        </button>
      </div>

      {/* Dishes preview */}
      <div className="mt-3 rounded-2xl bg-slate-50 border border-slate-200/80 p-3 text-xs">
        {itemsList ? (
          <p className="font-semibold text-slate-800 line-clamp-2">
            Dishes: <span className="text-slate-600 font-normal">{itemsList}</span>
          </p>
        ) : (
          <p className="text-slate-600">{notif.message || 'Dishes are hot and packed for pickup'}</p>
        )}
        {notif.customerName && (
          <p className="text-[11px] text-slate-400 mt-1">Guest: {notif.customerName}</p>
        )}
      </div>

      {/* Action CTA */}
      <div className="mt-3 flex items-center gap-2">
        {onDeliverOrder && notif.orderId && (
          <button
            type="button"
            onClick={() => {
              onDeliverOrder(notif.orderId, notif.tableNumber);
              onDismiss();
            }}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 py-2.5 px-3 text-xs font-black text-white shadow-sm shadow-emerald-600/25 transition cursor-pointer"
          >
            <CheckCircle2 size={14} />
            <span>Deliver to Table & Mark Served 🍽️</span>
          </button>
        )}
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 py-2.5 px-3 text-xs font-bold text-slate-700 transition cursor-pointer"
        >
          Got it
        </button>
      </div>

      {/* Animated auto-dismiss indicator bar */}
      <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-slate-100">
        <motion.div
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: 14, ease: 'linear' }}
          className="h-full bg-gradient-to-r from-emerald-500 to-amber-500"
        />
      </div>
    </motion.div>
  );
}
