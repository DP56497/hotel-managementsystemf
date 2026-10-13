import { useState } from 'react';
import { Check, Copy, ExternalLink, QrCode, ShieldCheck, Smartphone } from 'lucide-react';
import { getUpiQrData } from '../utils/upi';

export default function UpiQrCard({
  amount = 0,
  orderId = '',
  onPaymentConfirmed,
  isConfirming = false,
  showDirectPayLink = true,
  compact = false,
  title = 'Scan & Pay via UPI'
}) {
  const [copied, setCopied] = useState(false);
  const upiData = getUpiQrData(amount, orderId);

  const handleCopy = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(upiData.upiId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  return (
    <div className={`rounded-2xl border border-emerald-300 bg-white p-5 shadow-sm text-center ${compact ? 'max-w-sm mx-auto' : ''}`}>
      <div className="flex items-center justify-center gap-1.5 text-emerald-800 font-extrabold text-xs uppercase tracking-wider">
        <ShieldCheck size={16} className="text-emerald-600" />
        <span>{title}</span>
      </div>

      <p className="mt-1 font-display text-lg font-black text-slate-900">
        ₹{upiData.amount}
      </p>
      <p className="text-[11px] text-slate-500">Payee: <strong className="text-slate-800">{upiData.payeeName}</strong></p>

      {/* QR Code Frame */}
      <div className="relative mx-auto mt-3.5 inline-block rounded-2xl border-2 border-emerald-500/30 bg-gradient-to-b from-white to-slate-50 p-3 shadow-md">
        <img
          src={upiData.qrUrl}
          alt={`UPI Payment QR Code for ${upiData.upiId}`}
          className="h-48 w-48 rounded-xl object-contain bg-white"
          loading="lazy"
        />
        <div className="mt-1 flex items-center justify-center gap-1 text-[10px] font-bold text-emerald-700">
          <QrCode size={12} />
          <span>Instant UPI Settlement</span>
        </div>
      </div>

      {/* UPI ID Pill & Copy Button */}
      <div className="mt-3 flex items-center justify-center gap-2">
        <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-mono font-bold text-slate-800">
          <span className="text-slate-400 font-sans font-normal text-[11px]">UPI ID:</span>
          <span className="select-all text-emerald-800">{upiData.upiId}</span>
          <button
            type="button"
            onClick={handleCopy}
            title="Copy UPI ID"
            className="rounded-md p-1 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition cursor-pointer"
          >
            {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
          </button>
        </div>
      </div>
      {copied && (
        <p className="mt-1 text-[10px] font-bold text-emerald-600">UPI ID copied to clipboard!</p>
      )}

      {/* Accepted apps */}
      <div className="mt-3 border-t border-slate-100 pt-2.5">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Supported UPI Applications</p>
        <div className="mt-1.5 flex flex-wrap items-center justify-center gap-1.5 text-[11px] font-semibold text-slate-600">
          <span className="rounded-lg bg-slate-100 px-2 py-0.5">Google Pay</span>
          <span className="rounded-lg bg-slate-100 px-2 py-0.5">PhonePe</span>
          <span className="rounded-lg bg-slate-100 px-2 py-0.5">Paytm</span>
          <span className="rounded-lg bg-slate-100 px-2 py-0.5">BHIM UPI</span>
        </div>
      </div>

      {/* Direct Mobile Intent Link */}
      {showDirectPayLink && (
        <div className="mt-3 flex flex-col gap-2">
          <a
            href={upiData.upiUrl}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition shadow-xs"
          >
            <Smartphone size={14} />
            <span>Open in Installed UPI App</span>
            <ExternalLink size={12} className="opacity-70" />
          </a>

          {onPaymentConfirmed && (
            <button
              type="button"
              onClick={onPaymentConfirmed}
              disabled={isConfirming}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition disabled:opacity-60 cursor-pointer"
            >
              <Check size={14} />
              <span>{isConfirming ? 'Verifying Payment...' : 'Confirm UPI Payment Received ✓'}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
