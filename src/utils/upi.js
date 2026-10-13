export const DEFAULT_UPI_ID = '9712071875@ptsbi';
export const DEFAULT_PAYEE_NAME = 'Royal Plaza Hotel';

/**
 * Generates UPI payment URI and high-res QR code image URL for scanning
 * @param {number|string} amount - Total amount in INR
 * @param {string|number} orderId - Optional order identifier
 * @param {string} upiId - UPI ID (default: 9712071875@ptsbi)
 * @param {string} payeeName - Merchant/Payee name (default: Royal Plaza Hotel)
 */
export const getUpiQrData = (amount = 0, orderId = '', upiId = DEFAULT_UPI_ID, payeeName = DEFAULT_PAYEE_NAME) => {
  const formattedAmount = Number(amount || 0).toFixed(2);
  const note = orderId ? `Royal Plaza Order ${String(orderId).slice(-6)}` : 'Royal Plaza Hotel Bill';
  const effectiveUpiId = (import.meta.env.VITE_UPI_ID || upiId || DEFAULT_UPI_ID).trim();
  const effectivePayee = (import.meta.env.VITE_UPI_PAYEE_NAME || payeeName || DEFAULT_PAYEE_NAME).trim();

  const upiParams = new URLSearchParams({
    pa: effectiveUpiId,
    pn: effectivePayee,
    am: formattedAmount,
    cu: 'INR',
    tn: note
  });

  const upiUrl = `upi://pay?${upiParams.toString()}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=10&data=${encodeURIComponent(upiUrl)}`;

  return {
    upiId: effectiveUpiId,
    payeeName: effectivePayee,
    amount: formattedAmount,
    note,
    upiUrl,
    qrUrl
  };
};
