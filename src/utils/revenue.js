export const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

export const getRevenueSummary = (orders = [], period = 'today', referenceDate = new Date()) => {
  const safeOrders = Array.isArray(orders) ? orders : [];
  const now = new Date(referenceDate);
  const refYear = now.getUTCFullYear();
  const refMonth = now.getUTCMonth();
  const refDay = now.getUTCDate();

  const filtered = safeOrders.filter((order) => {
    if (order?.paymentStatus !== 'paid') return false;
    const createdAt = order?.createdAt ? new Date(order.createdAt) : null;
    if (!createdAt || Number.isNaN(createdAt.getTime())) return false;

    if (period === 'month') {
      return createdAt.getUTCFullYear() === refYear && createdAt.getUTCMonth() === refMonth;
    }

    if (period === 'year') {
      return createdAt.getUTCFullYear() === refYear;
    }

    return createdAt.getUTCFullYear() === refYear && createdAt.getUTCMonth() === refMonth && createdAt.getUTCDate() === refDay;
  });

  const total = filtered.reduce((sum, order) => sum + Number(order?.total || 0), 0);

  return {
    total,
    count: filtered.length,
    label: period === 'month' ? 'This month' : period === 'year' ? 'This year' : 'Today'
  };
};
