import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  Armchair,
  Bell,
  Calendar,
  CheckCircle2,
  ChefHat,
  ChevronRight,
  ClipboardList,
  Clock3,
  Filter,
  Flame,
  Minus,
  Plus,
  RotateCcw,
  Search,
  Send,
  Sparkle,
  Sparkles,
  TimerReset,
  Trash2,
  Utensils,
  UtensilsCrossed,
  X,
  XCircle
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { HOTEL_TABLES, TABLE_CATEGORIES } from '../data/tableData';

export default function StaffDashboard({
  activeView,
  setActiveView,
  staffCategory = 'waiter',
  accounts = [],
  menuItems = [],
  customers = [],
  orders = [],
  tables = HOTEL_TABLES,
  tableCleanStatus = {},
  onCleanTable,
  onMarkTableNeedsCleaning,
  bartanStock = [],
  onCleanBartan,
  onCleanAllBartan,
  messages = [],
  selectedOrder,
  onSelectOrder,
  onSaveOrder,
  onUpdateOrderStatus,
  onDeleteOrder,
  onSendMessage,
  onPaymentCompleted
}) {
  const [draftOrder, setDraftOrder] = useState({ customerName: '', tableNumber: '', items: [] });
  const [recipientId, setRecipientId] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [cleaningNotice, setCleaningNotice] = useState('');
  const [tableSearch, setTableSearch] = useState('');
  const [selectedTableCategory, setSelectedTableCategory] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [ordersTab, setOrdersTab] = useState('active');
  const [orderNotice, setOrderNotice] = useState('');
  const [recordYearFilter, setRecordYearFilter] = useState('all');
  const [recordMonthFilter, setRecordMonthFilter] = useState('all');
  const [recordSearch, setRecordSearch] = useState('');
  const [orderToDelete, setOrderToDelete] = useState(null);

  const isChef = staffCategory === 'chef';
  const isWaiter = staffCategory === 'waiter';
  const isCleaningStaff = staffCategory === 'cleaning';
  const canHandleFoodOrders = ['chef', 'waiter'].includes(staffCategory);

  const activeOrders = useMemo(() => {
    return orders.filter((o) => {
      const s = String(o.status || '').toLowerCase();
      return s !== 'completed' && s !== 'cancelled';
    });
  }, [orders]);

  const completedRecords = useMemo(() => {
    return orders.filter((o) => {
      const s = String(o.status || '').toLowerCase();
      return s === 'completed';
    });
  }, [orders]);

  const readyOrders = useMemo(() => orders.filter((o) => String(o.status || '').toLowerCase() === 'ready'), [orders]);
  const preparingOrders = useMemo(() => orders.filter((o) => String(o.status || '').toLowerCase() === 'preparing'), [orders]);
  const waiterStaff = useMemo(() => accounts.filter((a) => a.role === 'staff' && (a.staffCategory === 'waiter' || !a.staffCategory)), [accounts]);
  const readyCount = readyOrders.length;

  const waiterServiceMetrics = useMemo(() => {
    const totalHandled = readyOrders.length + completedRecords.length;
    // Strictly depend on completed orders; when no orders completed or in progress, return 0
    const completionRate = (totalHandled > 0 && completedRecords.length > 0)
      ? Math.round((completedRecords.length / totalHandled) * 100)
      : 0;

    let totalServeMin = 0;
    let serveCount = 0;
    completedRecords.forEach((o) => {
      if (typeof o.serveTimeMinutes === 'number' && o.serveTimeMinutes > 0) {
        totalServeMin += o.serveTimeMinutes;
        serveCount++;
      } else if (o.completedAt && o.readyAt) {
        totalServeMin += Math.max(0.5, (new Date(o.completedAt).getTime() - new Date(o.readyAt).getTime()) / 60000);
        serveCount++;
      }
    });

    const avgServe = serveCount > 0 ? (totalServeMin / serveCount) : 0;
    const formatServe = (m) => {
      if (!m || m <= 0) return '0 min';
      const whole = Math.floor(m);
      const secs = Math.round((m - whole) * 60);
      if (secs === 0) return `${whole} min`;
      return `${whole}m ${secs}s`;
    };

    return {
      completionRate,
      pendingReadyCount: readyOrders.length,
      completedCount: completedRecords.length,
      totalHandled,
      avgServeFormatted: formatServe(avgServe),
      activeWaitersCount: Math.max(1, waiterStaff.length)
    };
  }, [readyOrders, completedRecords, waiterStaff]);

  const liveCompletionRate = `${waiterServiceMetrics.completionRate}%`;

  const liveAvgTurnaround = useMemo(() => {
    let totalMin = 0;
    let count = 0;
    completedRecords.forEach((o) => {
      if (typeof o.totalResponseTimeMinutes === 'number' && o.totalResponseTimeMinutes > 0) {
        totalMin += o.totalResponseTimeMinutes;
        count++;
      } else if (o.completedAt && o.createdAt) {
        totalMin += Math.max(0.5, (new Date(o.completedAt).getTime() - new Date(o.createdAt).getTime()) / 60000);
        count++;
      }
    });
    // When no orders completed, keep 0 value
    if (count === 0) return '0 min';
    const avg = totalMin / count;
    return `${Math.round(avg)} min`;
  }, [completedRecords]);

  // Year and Month wise grouping for previous order records
  const { availableYears, availableMonths, filteredRecords, recordsStats } = useMemo(() => {
    const yearsSet = new Set();
    const monthsSet = new Set();

    completedRecords.forEach((order) => {
      const dateStr = order.completedAt || order.createdAt || order.updatedAt;
      if (dateStr) {
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) {
          yearsSet.add(String(d.getFullYear()));
          const monthNum = String(d.getMonth() + 1).padStart(2, '0');
          monthsSet.add(monthNum);
        }
      }
    });

    if (yearsSet.size === 0) yearsSet.add(String(new Date().getFullYear()));

    const years = Array.from(yearsSet).sort((a, b) => b.localeCompare(a));
    const allMonths = [
      { num: '01', name: 'Jan' },
      { num: '02', name: 'Feb' },
      { num: '03', name: 'Mar' },
      { num: '04', name: 'Apr' },
      { num: '05', name: 'May' },
      { num: '06', name: 'Jun' },
      { num: '07', name: 'Jul' },
      { num: '08', name: 'Aug' },
      { num: '09', name: 'Sep' },
      { num: '10', name: 'Oct' },
      { num: '11', name: 'Nov' },
      { num: '12', name: 'Dec' }
    ];

    const filtered = completedRecords.filter((order) => {
      const dateStr = order.completedAt || order.createdAt || order.updatedAt;
      const d = dateStr ? new Date(dateStr) : null;
      const validDate = d && !isNaN(d.getTime());

      if (recordYearFilter !== 'all' && validDate) {
        if (String(d.getFullYear()) !== recordYearFilter) return false;
      }
      if (recordMonthFilter !== 'all' && validDate) {
        const monthNum = String(d.getMonth() + 1).padStart(2, '0');
        if (monthNum !== recordMonthFilter) return false;
      }
      if (recordSearch.trim()) {
        const q = recordSearch.trim().toLowerCase();
        const matchesName = (order.customerName || '').toLowerCase().includes(q);
        const matchesTable = String(order.tableNumber || '').includes(q);
        const matchesId = String(order.id || order._id || '').toLowerCase().includes(q);
        const matchesItem = (order.items || []).some((it) => (it.name || '').toLowerCase().includes(q));
        if (!matchesName && !matchesTable && !matchesId && !matchesItem) return false;
      }
      return true;
    });

    const totalRevenue = filtered.reduce((sum, o) => sum + Number(o.total || 0), 0);
    const totalItems = filtered.reduce((sum, o) => sum + (o.items?.reduce((s, it) => s + (it.qty || 1), 0) || 0), 0);

    return {
      availableYears: years,
      availableMonths: allMonths,
      filteredRecords: filtered,
      recordsStats: {
        count: filtered.length,
        totalRevenue,
        avgItems: filtered.length > 0 ? (totalItems / filtered.length).toFixed(1) : 0
      }
    };
  }, [completedRecords, recordYearFilter, recordMonthFilter, recordSearch]);

  const handleWaiterCompleteOrder = (orderId, tableNumber) => {
    if (onUpdateOrderStatus) {
      onUpdateOrderStatus(orderId, 'Completed');
    }
    setOrderNotice(`Table #${tableNumber} order marked complete and moved to Records ✓`);
    setTimeout(() => setOrderNotice(''), 4500);
  };

  const handleDeleteOrderAction = (orderId) => {
    if (onDeleteOrder) {
      onDeleteOrder(orderId);
      setOrderNotice(`Order #${String(orderId).slice(-6)} record permanently deleted ✓`);
      setTimeout(() => setOrderNotice(''), 4500);
      setOrderToDelete(null);
    }
  };

  // For Chef, raw material stock report goes exclusively to the Owner
  const recipientOptions = accounts.filter((account) =>
    isChef ? account.role === 'owner' : ['owner', 'manager'].includes(account.role)
  );

  useEffect(() => {
    if (isChef && recipientOptions.length > 0 && !recipientId) {
      setRecipientId(String(recipientOptions[0].id));
    }
  }, [isChef, recipientOptions, recipientId]);

  const staffMessages = useMemo(() => messages.slice(0, 6), [messages]);

  // Compute live occupancy and cleanliness status for all tables
  const tableStatusList = useMemo(() => {
    return tables.map((table) => {
      const tableNumber = Number(table.number);
      const tableOrders = orders.filter((o) => Number(o.tableNumber) === tableNumber);

      const paidOrders = tableOrders.filter((o) => String(o.paymentStatus || '').toLowerCase() === 'paid');
      const hasCompletedPaymentOrder = paidOrders.length > 0;
      const latestPaidOrder = paidOrders[0] || null;

      // Active dining orders: an order is active only if not cancelled and unpaid.
      // If a completed payment order exists and no newer unpaid order was placed after that payment,
      // the dining session is concluded (guests have paid and vacated).
      const activeDiningOrders = tableOrders.filter((o) => {
        const s = String(o.status || '').toLowerCase();
        const p = String(o.paymentStatus || '').toLowerCase();
        if (s === 'cancelled' || p === 'paid') return false;
        if (latestPaidOrder) {
          const oTime = new Date(o.createdAt || o.updatedAt || 0).getTime();
          const paidTime = new Date(latestPaidOrder.paidAt || latestPaidOrder.createdAt || 0).getTime();
          if (oTime <= paidTime) return false;
        }
        return true;
      });

      const explicitCleanStatus = tableCleanStatus[tableNumber];
      const isExplicitlyVacated = explicitCleanStatus === 'needs_cleaning' || explicitCleanStatus === 'unclean';

      const isFull = !isExplicitlyVacated && activeDiningOrders.length > 0;
      const needsCleaning = isExplicitlyVacated || (!isFull && (hasCompletedPaymentOrder || explicitCleanStatus === 'needs_cleaning') && explicitCleanStatus !== 'clean');

      let status = 'Empty';
      if (isFull) status = 'Full';
      else if (needsCleaning) status = 'Unclean';
      else status = 'Clean';

      return {
        ...table,
        isFull,
        needsCleaning,
        status,
        cleanState: needsCleaning ? 'needs_cleaning' : isFull ? 'occupied' : 'clean',
        assignedCustomer: isFull ? (customers.find((c) => Number(c.tableNumber) === tableNumber) || null) : null,
        activeOrder: activeDiningOrders[0] || null,
        lastPaidOrder: latestPaidOrder
      };
    });
  }, [tables, customers, orders, tableCleanStatus]);

  const fullTablesCount = useMemo(() => tableStatusList.filter((t) => t.isFull).length, [tableStatusList]);
  const needsCleaningCount = useMemo(() => tableStatusList.filter((t) => t.needsCleaning).length, [tableStatusList]);
  const cleanTablesCount = useMemo(() => tableStatusList.filter((t) => !t.isFull && !t.needsCleaning).length, [tableStatusList]);

  // Filtered tables for the cleaning floor view
  const filteredTables = useMemo(() => {
    return tableStatusList.filter((table) => {
      if (selectedTableCategory === '2p' && table.capacity !== 2) return false;
      if (selectedTableCategory === '4p' && table.capacity !== 4) return false;
      if (selectedTableCategory === '6p' && table.capacity !== 6) return false;
      if (selectedTableCategory === '12p' && table.capacity !== 12) return false;
      if (selectedTableCategory === '16p' && table.capacity !== 16) return false;

      if (statusFilter === 'cleaning' && !table.needsCleaning) return false;
      if (statusFilter === 'clean' && (table.isFull || table.needsCleaning)) return false;
      if (statusFilter === 'full' && !table.isFull) return false;

      if (tableSearch.trim()) {
        const q = tableSearch.toLowerCase().trim();
        const matchNum = String(table.number).includes(q) || `table ${table.number}`.includes(q);
        const matchCust =
          table.assignedCustomer?.name?.toLowerCase().includes(q) ||
          table.lastPaidOrder?.customerName?.toLowerCase().includes(q);
        if (!matchNum && !matchCust) return false;
      }

      return true;
    });
  }, [tableStatusList, selectedTableCategory, statusFilter, tableSearch]);

  const totalCleanBartan = useMemo(() => bartanStock.reduce((sum, item) => sum + (item.clean || 0), 0), [bartanStock]);
  const totalInUseBartan = useMemo(() => bartanStock.reduce((sum, item) => sum + (item.inUse || 0), 0), [bartanStock]);
  const totalDirtyBartan = useMemo(() => bartanStock.reduce((sum, item) => sum + (item.dirty || 0), 0), [bartanStock]);
  const totalBartanCount = useMemo(
    () => bartanStock.reduce((sum, item) => sum + (item.total || 0), 0),
    [bartanStock]
  );

  const handleCleanTableAction = (tableNumber) => {
    if (onCleanTable) onCleanTable(tableNumber);
    setCleaningNotice(`Table #${tableNumber} cleaned successfully! Sanitized and ready for seating.`);
    setTimeout(() => setCleaningNotice(''), 4000);
  };

  const handleCleanBartanAction = (itemId, name) => {
    if (onCleanBartan) onCleanBartan(itemId);
    setCleaningNotice(`Washed and sanitized all ${name}! Restocked in kitchen.`);
    setTimeout(() => setCleaningNotice(''), 4000);
  };

  const handleCleanAllBartanAction = () => {
    if (onCleanAllBartan) onCleanAllBartan();
    setCleaningNotice('All dirty kitchen utensils & dishware washed, dried, and restocked!');
    setTimeout(() => setCleaningNotice(''), 4000);
  };

  const addItemToOrder = (item) => {
    setDraftOrder((prev) => {
      const existing = prev.items.find((entry) => entry.name === item.name);
      if (existing) {
        return { ...prev, items: prev.items.map((entry) => (entry.name === item.name ? { ...entry, qty: entry.qty + 1 } : entry)) };
      }
      return { ...prev, items: [...prev.items, { name: item.name, category: item.category, qty: 1, price: item.price }] };
    });
  };

  const removeItemFromOrder = (itemName) => {
    setDraftOrder((prev) => ({
      ...prev,
      items: prev.items.filter((entry) => entry.name !== itemName)
    }));
  };

  const updateDraftItemQty = (itemName, delta) => {
    setDraftOrder((prev) => ({
      ...prev,
      items: prev.items.flatMap((entry) => {
        if (entry.name !== itemName) return [entry];
        const nextQty = entry.qty + delta;
        return nextQty > 0 ? [{ ...entry, qty: nextQty }] : [];
      })
    }));
  };

  const clearDraftOrder = () => {
    setDraftOrder({ customerName: '', tableNumber: '', items: [] });
  };

  const total = draftOrder.items.reduce((sum, item) => sum + item.qty * item.price, 0);

  const saveOrder = () => {
    if (!draftOrder.customerName || !draftOrder.tableNumber || draftOrder.items.length === 0) return;
    onSaveOrder({
      customerName: draftOrder.customerName,
      tableNumber: Number(draftOrder.tableNumber),
      items: draftOrder.items,
      total
    });
    setDraftOrder({ customerName: '', tableNumber: '', items: [] });
  };

  const handleMessageSubmit = (event) => {
    event.preventDefault();
    if (!recipientId || !messageContent.trim() || !onSendMessage) return;
    const recipient = recipientOptions.find((member) => String(member.id) === String(recipientId));
    if (!recipient) return;
    onSendMessage(recipient.id, recipient.name, recipient.role, messageContent.trim());
    setMessageContent('');
  };

  // Tables Cleaning View for Housekeeping Staff
  const renderTables = () => (
    <div className="space-y-6">
      {cleaningNotice && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3.5 text-sm font-semibold text-emerald-800 shadow-sm flex items-center justify-between"
        >
          <span className="flex items-center gap-2">
            <Sparkles size={17} className="text-emerald-600" />
            {cleaningNotice}
          </span>
          <button onClick={() => setCleaningNotice('')} className="text-emerald-600 hover:text-emerald-800 text-xs font-bold uppercase tracking-wider">
            Dismiss
          </button>
        </motion.div>
      )}

      {/* Top Header Card */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-amber-100 p-3 text-amber-800 border border-amber-200">
              <Armchair size={24} />
            </div>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-amber-600">Hygiene & Housekeeping Ops</p>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight font-display">Dining Floor Sanitization</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time hygiene tracking across {tables.length} dining sets. Tables vacated after billing require sanitization before new guests are seated.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-50 px-4 py-1.5 text-xs font-bold text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" /> Live Floor Status
            </span>
          </div>
        </div>

        {/* 4 Metric Cards */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-amber-800">Awaiting Cleaning</p>
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse" />
            </div>
            <p className="mt-2 text-3xl font-black text-amber-800 font-display">{needsCleaningCount}</p>
            <p className="mt-1 text-[11px] text-slate-500">Vacated tables · Ready for sanitizing</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Clean & Ready</p>
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </div>
            <p className="mt-2 text-3xl font-black text-emerald-700 font-display">{cleanTablesCount}</p>
            <p className="mt-1 text-[11px] text-slate-500">Sanitized & available for guests</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-rose-700">Occupied (Dining)</p>
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
            </div>
            <p className="mt-2 text-3xl font-black text-rose-700 font-display">{fullTablesCount}</p>
            <p className="mt-1 text-[11px] text-slate-500">Active guests seated currently</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-600">Total Sets</p>
              <Armchair size={18} className="text-amber-600" />
            </div>
            <p className="mt-2 text-3xl font-black text-slate-900 font-display">{tables.length}</p>
            <p className="mt-1 text-[11px] text-slate-500">Full dining hall capacity</p>
          </div>
        </div>
      </section>

      {/* Filter and Search Bar */}
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Capacity Categories */}
          <div className="flex flex-wrap items-center gap-1.5">
            {TABLE_CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                type="button"
                onClick={() => setSelectedTableCategory(cat.key)}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                  selectedTableCategory === cat.key
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                {cat.key === 'all' ? `All Tables (${tables.length})` : cat.label}
              </button>
            ))}
          </div>

          {/* Status Filter Toggle */}
          <div className="flex items-center gap-1 rounded-2xl border border-slate-200 bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`rounded-xl px-3 py-1 text-xs font-bold transition ${
                statusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              All ({tables.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('cleaning')}
              className={`rounded-xl px-3 py-1 text-xs font-bold transition ${
                statusFilter === 'cleaning' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-500 hover:text-amber-800'
              }`}
            >
              Unclean ({needsCleaningCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('clean')}
              className={`rounded-xl px-3 py-1 text-xs font-bold transition ${
                statusFilter === 'clean' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-500 hover:text-emerald-700'
              }`}
            >
              Clean ({cleanTablesCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('full')}
              className={`rounded-xl px-3 py-1 text-xs font-bold transition ${
                statusFilter === 'full' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-500 hover:text-rose-700'
              }`}
            >
              Occupied ({fullTablesCount})
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={tableSearch}
            onChange={(e) => setTableSearch(e.target.value)}
            placeholder="Search table number (e.g. 5, 12) or guest name..."
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-xs text-slate-800 outline-none focus:border-amber-400 focus:bg-white transition"
          />
          {tableSearch && (
            <button
              type="button"
              onClick={() => setTableSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      </section>

      {/* Tables Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
        {filteredTables.length === 0 ? (
          <div className="col-span-full rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
            No tables match the selected filter.
          </div>
        ) : (
          filteredTables.map((table) => {
            const isFull = table.isFull;
            const needsCleaning = table.needsCleaning;

            return (
              <motion.div
                key={table.number}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`relative flex flex-col justify-between rounded-2xl border p-4 shadow-sm transition hover:shadow-md ${
                  isFull
                    ? 'border-rose-300 bg-white ring-1 ring-rose-200'
                    : needsCleaning
                      ? 'border-amber-400 bg-white ring-1 ring-amber-300'
                      : 'border-slate-200 bg-white hover:border-emerald-400'
                }`}
              >
                <div>
                  {/* Top Bar: Table Number & Status Pill */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Armchair
                        size={16}
                        className={isFull ? 'text-rose-600' : needsCleaning ? 'text-amber-700' : 'text-emerald-600'}
                      />
                      <span className="font-extrabold text-slate-900 text-sm">Table #{table.number}</span>
                      {table.isExtra && (
                        <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-800">
                          EXTRA
                        </span>
                      )}
                    </div>
                    <div>
                      {isFull ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-rose-300 bg-rose-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-800">
                          <span className="h-1.5 w-1.5 rounded-full bg-rose-600" /> FULL
                        </span>
                      ) : needsCleaning ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" /> UNCLEAN
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" /> CLEAN
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Capacity Tag */}
                  <div className="mt-1.5">
                    <span className="inline-block rounded-lg bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                      {table.category}
                    </span>
                  </div>

                  {/* Customer / Order / Cleaning Status Details */}
                  <div className="mt-3 border-t border-slate-100 pt-2.5">
                    {isFull ? (
                      <div>
                        <p className="text-[10px] uppercase font-bold text-rose-700 tracking-wider">Seated Guest Dining:</p>
                        <p className="font-bold text-xs text-slate-900 truncate">
                          {table.assignedCustomer?.name || table.activeOrder?.customerName || 'Registered Customer'}
                        </p>
                        {table.activeOrder && (
                          <div className="mt-1.5 rounded-lg bg-rose-100 px-2 py-1 text-[10px] font-semibold text-rose-900 border border-rose-200 truncate">
                            Order #{table.activeOrder.id || table.activeOrder._id?.slice(-4)} · ₹{table.activeOrder.total}
                          </div>
                        )}
                        <div className="mt-2.5 flex flex-col gap-1.5">
                          {onPaymentCompleted && table.activeOrder && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onPaymentCompleted(table.activeOrder);
                                setCleaningNotice(`Table #${table.number} bill marked as paid. Table moved to cleaning queue.`);
                                setTimeout(() => setCleaningNotice(''), 4000);
                              }}
                              className="w-full inline-flex items-center justify-center gap-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-2.5 py-1.5 text-[10px] font-bold text-white shadow-xs transition cursor-pointer"
                              title="Mark customer bill as paid and vacate table"
                            >
                              <CheckCircle2 size={12} />
                              <span>Complete Bill Payment (Vacate Table)</span>
                            </button>
                          )}
                          {onMarkTableNeedsCleaning && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onPaymentCompleted && table.activeOrder) {
                                  onPaymentCompleted(table.activeOrder);
                                }
                                onMarkTableNeedsCleaning(table.number);
                                setCleaningNotice(`Table #${table.number} vacated and marked for cleaning.`);
                                setTimeout(() => setCleaningNotice(''), 4000);
                              }}
                              className="w-full inline-flex items-center justify-center gap-1 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 text-[10px] font-semibold text-amber-800 transition cursor-pointer"
                              title="Vacate table and mark for cleaning"
                            >
                              <Sparkles size={11} />
                              <span>Guest Left (Move to Cleaning Queue)</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ) : needsCleaning ? (
                      <div>
                        <p className="text-[10px] uppercase font-bold text-amber-800 tracking-wider">Status: Vacated</p>
                        <p className="text-[11px] text-amber-700 font-medium mt-0.5">Needs sanitizing & resetting</p>
                        {table.lastPaidOrder && (
                          <p className="text-[10px] text-slate-400 truncate mt-0.5">
                            Last guest: {table.lastPaidOrder.customerName}
                          </p>
                        )}
                        <button
                          type="button"
                          onClick={() => handleCleanTableAction(table.number)}
                          className="mt-2.5 w-full flex items-center justify-center gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 px-3 py-2 text-xs font-bold text-white shadow-sm transition cursor-pointer"
                        >
                          <Sparkles size={14} />
                          <span>Sanitize Table</span>
                        </button>
                      </div>
                    ) : (
                      <div className="py-1 flex flex-col justify-between">
                        <div>
                          <p className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 size={13} /> Sanitized & Ready
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">Ready for new guest seating</p>
                        </div>
                        {onMarkTableNeedsCleaning && (
                          <button
                            type="button"
                            onClick={() => {
                              onMarkTableNeedsCleaning(table.number);
                              setCleaningNotice(`Table #${table.number} marked as Unclean.`);
                              setTimeout(() => setCleaningNotice(''), 4000);
                            }}
                            className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-semibold text-slate-600 transition hover:bg-amber-50 hover:text-amber-800 hover:border-amber-300"
                          >
                            Mark as Unclean
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Indicator */}
                <div className="mt-3 border-t border-slate-100 pt-1.5 text-[10px] text-slate-400 flex items-center justify-between">
                  <span>Capacity: {table.capacity} Seats</span>
                  <span
                    className={
                      isFull ? 'text-rose-600 font-bold' : needsCleaning ? 'text-amber-700 font-bold' : 'text-emerald-600 font-bold'
                    }
                  >
                    {isFull ? 'Occupied' : needsCleaning ? 'Unclean' : 'Clean'}
                  </span>
                </div>
              </motion.div>
            );
          })
        )}
      </section>
    </div>
  );

  // Helper to render distinctive dishware icons
  const renderDishwareIcon = (id) => {
    switch (id) {
      case 'plates':
        return <UtensilsCrossed size={18} />;
      case 'glasses':
        return <RotateCcw size={18} />;
      case 'bowls':
        return <ChefHat size={18} />;
      case 'spoons':
        return <Utensils size={18} />;
      case 'pots':
        return <Flame size={18} />;
      default:
        return <UtensilsCrossed size={18} />;
    }
  };

  // Kitchen Bartan (Utensils) Stock Cleaning View
  const renderBartan = () => {
    // Identify active dining tables that are currently utilizing utensils
    const activeDiningTables = Array.from(
      new Set(
        orders
          .filter((o) => {
            const s = String(o.status || '').toLowerCase();
            const p = String(o.paymentStatus || '').toLowerCase();
            return s !== 'cancelled' && p !== 'paid';
          })
          .map((o) => Number(o.tableNumber))
          .filter(Boolean)
      )
    ).sort((a, b) => a - b);

    return (
      <div className="space-y-6">
        {cleaningNotice && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 shadow-sm flex items-center justify-between"
          >
            <span className="flex items-center gap-2">
              <Sparkles size={16} className="text-emerald-600" />
              {cleaningNotice}
            </span>
            <button onClick={() => setCleaningNotice('')} className="text-emerald-600 hover:text-emerald-800 text-xs font-bold">
              Dismiss
            </button>
          </motion.div>
        )}

        {/* Header */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-amber-100 p-3 text-amber-800 border border-amber-200">
                <UtensilsCrossed size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-xs font-extrabold uppercase tracking-wider text-amber-600">Kitchen Hygiene Station</p>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live Order Sync
                  </span>
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight font-display">Kitchen Utensils & Dishware Stock</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Real-time stock synchronized with customer orders (In Use), dishwashing sink (Dirty / To Wash), and clean chef shelves.
                </p>
              </div>
            </div>
            <button
              type="button"
              disabled={totalDirtyBartan === 0}
              onClick={handleCleanAllBartanAction}
              className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 px-5 py-2.5 text-xs font-bold text-white transition shadow-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <Sparkles size={16} />
              <span>Wash All Dirty Utensils ({totalDirtyBartan})</span>
            </button>
          </div>

          {/* 4 Metric Summary Cards */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-800">Clean on Shelf</p>
                <CheckCircle2 size={18} className="text-emerald-600" />
              </div>
              <p className="mt-2 text-3xl font-black text-emerald-700 font-display">{totalCleanBartan}</p>
              <p className="mt-1 text-[11px] text-emerald-700/80">Sanitized & ready for immediate table service</p>
            </div>

            <div className="rounded-2xl border border-blue-200 bg-blue-50/40 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-blue-800">In Use / Dining</p>
                <span className="h-2.5 w-2.5 rounded-full bg-blue-500 animate-pulse" />
              </div>
              <p className="mt-2 text-3xl font-black text-blue-700 font-display">{totalInUseBartan}</p>
              <p className="mt-1 text-[11px] text-blue-700/80">
                {activeDiningTables.length > 0 ? `Active at ${activeDiningTables.length} dining table(s)` : 'No tables currently dining'}
              </p>
            </div>

            <div className="rounded-2xl border border-rose-200 bg-rose-50/40 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-rose-800">Dirty / In Sink</p>
                <RotateCcw size={18} className="text-rose-600" />
              </div>
              <p className="mt-2 text-3xl font-black text-rose-700 font-display">{totalDirtyBartan}</p>
              <p className="mt-1 text-[11px] text-rose-700/80">Awaiting cleaning staff sanitization in sink</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-600">Total Asset Base</p>
                <Utensils size={18} className="text-amber-600" />
              </div>
              <p className="mt-2 text-3xl font-black text-slate-900 font-display">{totalBartanCount}</p>
              <p className="mt-1 text-[11px] text-slate-500">Total hotel kitchen inventory assets</p>
            </div>
          </div>

          {/* Active Dining Orders Utensil Pipeline Banner */}
          {activeDiningTables.length > 0 && (
            <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50/70 p-3.5 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 text-xs text-blue-900 font-medium">
                <span className="h-2 w-2 rounded-full bg-blue-600 animate-ping" />
                <span>
                  <strong>Active Orders Detected:</strong> Tables <strong>#{activeDiningTables.join(', #')}</strong> are currently dining and using clean dishware. Upon bill payment or order completion, used utensils will move to the wash sink.
                </span>
              </div>
              <span className="text-[11px] font-bold text-blue-700 bg-blue-100 border border-blue-300 rounded-full px-2.5 py-0.5">
                {totalInUseBartan} Utensils In Use
              </span>
            </div>
          )}
        </section>

        {/* Utensils Stock Cards Grid */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {bartanStock.map((item) => {
            const clean = item.clean || 0;
            const inUse = item.inUse || 0;
            const dirty = item.dirty || 0;
            const total = item.total || clean + inUse + dirty || 1;
            const cleanPercent = Math.round((clean / total) * 100);
            const inUsePercent = Math.round((inUse / total) * 100);
            const dirtyPercent = Math.round((dirty / total) * 100);

            return (
              <div
                key={item.id}
                className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar: Icon, Name & Status Pill */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="rounded-xl bg-amber-100 p-2.5 text-amber-800 border border-amber-200">
                        {renderDishwareIcon(item.id)}
                      </span>
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-sm">{item.name}</h4>
                        <p className="text-[11px] text-slate-500">
                          Total: {total} {item.unit || 'pcs'}
                        </p>
                      </div>
                    </div>
                    {dirty > 0 ? (
                      <span className="rounded-full bg-rose-100 border border-rose-300 px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-rose-800">
                        {dirty} To Wash
                      </span>
                    ) : inUse > 0 ? (
                      <span className="rounded-full bg-blue-100 border border-blue-300 px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-blue-800">
                        {inUse} In Use
                      </span>
                    ) : (
                      <span className="rounded-full bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-emerald-800">
                        100% Clean
                      </span>
                    )}
                  </div>

                  {/* 3-Column Quick Status Tally */}
                  <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                    <div className="rounded-xl bg-emerald-50/70 border border-emerald-100 py-2 px-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Clean</p>
                      <p className="text-base font-black text-emerald-800 font-display mt-0.5">{clean}</p>
                      <p className="text-[9px] text-emerald-600/80">Available</p>
                    </div>
                    <div className="rounded-xl bg-blue-50/70 border border-blue-100 py-2 px-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-blue-700">In Use</p>
                      <p className="text-base font-black text-blue-800 font-display mt-0.5">{inUse}</p>
                      <p className="text-[9px] text-blue-600/80">Dining</p>
                    </div>
                    <div className="rounded-xl bg-rose-50/70 border border-rose-100 py-2 px-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-rose-700">To Wash</p>
                      <p className="text-base font-black text-rose-800 font-display mt-0.5">{dirty}</p>
                      <p className="text-[9px] text-rose-600/80">In Sink</p>
                    </div>
                  </div>

                  {/* Multi-Segment Color Progress Bar */}
                  <div className="mt-4 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                      <span className="flex items-center gap-1.5 text-emerald-700 font-bold">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        {cleanPercent}% Sanitized & Ready
                      </span>
                      <span className="text-slate-400 font-medium">
                        {total} {item.unit || 'pcs'} total
                      </span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 flex shadow-inner">
                      <div
                        className="h-full bg-emerald-500 transition-all duration-500"
                        style={{ width: `${(clean / total) * 100}%` }}
                        title={`Clean: ${clean}`}
                      />
                      <div
                        className="h-full bg-blue-500 transition-all duration-500"
                        style={{ width: `${(inUse / total) * 100}%` }}
                        title={`In Use: ${inUse}`}
                      />
                      <div
                        className="h-full bg-rose-500 transition-all duration-500"
                        style={{ width: `${(dirty / total) * 100}%` }}
                        title={`Dirty: ${dirty}`}
                      />
                    </div>
                  </div>

                  {/* Table Use Pill */}
                  {item.activeTables && item.activeTables.length > 0 ? (
                    <div className="mt-3 flex items-center gap-2 rounded-xl bg-blue-50/90 border border-blue-200/90 px-3 py-1.5 text-xs text-blue-800">
                      <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse shrink-0" />
                      <span className="truncate">
                        In active use at <strong>Table #{item.activeTables.join(', #')}</strong>
                      </span>
                    </div>
                  ) : (
                    <div className="mt-3 flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-200/70 px-3 py-1.5 text-xs text-slate-500">
                      <span className="h-2 w-2 rounded-full bg-slate-300 shrink-0" />
                      <span>No active tables using this item</span>
                    </div>
                  )}
                </div>

                {/* Footer Action */}
                <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between gap-3">
                  <div className="text-[11px] leading-tight">
                    {dirty > 0 ? (
                      <span className="font-bold text-rose-700 flex items-center gap-1">
                        <RotateCcw size={12} />
                        Hot-water sanitization needed
                      </span>
                    ) : inUse > 0 ? (
                      <span className="font-bold text-blue-700">In customer dining service</span>
                    ) : (
                      <span className="font-bold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 size={12} />
                        Restocked on shelf
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    disabled={dirty === 0}
                    onClick={() => handleCleanBartanAction(item.id, item.name)}
                    className="rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-xs transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5"
                  >
                    <Sparkles size={13} />
                    <span>Wash ({dirty})</span>
                  </button>
                </div>
              </div>
            );
          })}
        </section>
      </div>
    );
  };

  // Overview View
  const renderOverview = () => {
    if (isCleaningStaff) {
      return (
        <div className="space-y-6">
          {/* Cleaning Operations KPI Cards */}
          <section className="grid gap-4 lg:grid-cols-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-amber-800">Unclean Tables</p>
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse" />
              </div>
              <p className="text-3xl font-black text-amber-800 font-display">{needsCleaningCount}</p>
              <p className="mt-1 text-xs text-slate-500">Vacated · Needs sanitizing to seat new guests</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Clean Tables</p>
                <CheckCircle2 size={18} className="text-emerald-600" />
              </div>
              <p className="text-3xl font-black text-emerald-700 font-display">{cleanTablesCount}</p>
              <p className="mt-1 text-xs text-slate-500">Available for guest seating immediately</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-600">Dirty Bartan To Wash</p>
                <UtensilsCrossed size={18} className="text-amber-700" />
              </div>
              <p className="text-3xl font-black text-slate-900 font-display">{totalDirtyBartan}</p>
              <p className="mt-1 text-xs text-slate-500">Dishes & utensils in washing sink</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-rose-700">Guests Dining</p>
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
              </div>
              <p className="text-3xl font-black text-rose-700 font-display">{fullTablesCount}</p>
              <p className="mt-1 text-xs text-slate-500">Currently active dining tables</p>
            </motion.div>
          </section>

          {/* Quick Action Navigation Buttons */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-black text-slate-900 font-display">Housekeeping Workstations</h3>
            <p className="text-xs text-slate-500 mt-0.5">Quick jump to table floor sanitization or kitchen bartan wash station.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setActiveView && setActiveView('tables')}
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:bg-white hover:border-amber-400 shadow-xs cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="rounded-xl bg-amber-100 p-2.5 text-amber-800">
                    <Armchair size={20} />
                  </span>
                  <div>
                    <p className="font-extrabold text-slate-900 text-sm">Dining Tables Floor ({tables.length})</p>
                    <p className="text-xs text-amber-700 font-bold">
                      {needsCleaningCount > 0 ? `${needsCleaningCount} tables require immediate clean` : 'All vacated tables clean'}
                    </p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => setActiveView && setActiveView('bartan')}
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:bg-white hover:border-emerald-400 shadow-xs cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="rounded-xl bg-emerald-100 p-2.5 text-emerald-800">
                    <UtensilsCrossed size={20} />
                  </span>
                  <div>
                    <p className="font-extrabold text-slate-900 text-sm">Kitchen Bartan Stock ({totalBartanCount})</p>
                    <p className="text-xs text-emerald-700 font-bold">
                      {totalDirtyBartan > 0
                        ? `${totalDirtyBartan} dirty utensils in sink to wash`
                        : totalInUseBartan > 0
                        ? `${totalInUseBartan} in dining use • shelf stocked`
                        : 'All kitchen inventory sanitized & ready'}
                    </p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-slate-400" />
              </button>
            </div>
          </section>

          {/* Urgent Tables to Clean */}
          {needsCleaningCount > 0 && (
            <section className="rounded-3xl border border-amber-300 bg-amber-50 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse" />
                  <h3 className="text-lg font-black text-slate-900 font-display">Vacated Tables Requiring Sanitizing ({needsCleaningCount})</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveView && setActiveView('tables')}
                  className="text-xs font-bold text-amber-700 hover:text-amber-900"
                >
                  View all in floor matrix →
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                {tableStatusList
                  .filter((t) => t.needsCleaning)
                  .map((table) => (
                    <div
                      key={table.number}
                      className="rounded-2xl border border-amber-300 bg-white p-4 shadow-xs flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <Armchair size={15} className="text-amber-700" />
                          <span className="font-extrabold text-slate-900 text-sm">Table #{table.number}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{table.category}</p>
                        <p className="text-[10px] font-bold text-amber-700 mt-1">Status: Unclean</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCleanTableAction(table.number)}
                        className="rounded-xl bg-amber-600 hover:bg-amber-700 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs cursor-pointer transition"
                      >
                        Sanitize
                      </button>
                    </div>
                  ))}
              </div>
            </section>
          )}

          {/* Messages from Leadership */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-wider text-amber-600">Hotel Dispatch Channel</p>
                <h3 className="text-xl font-black text-slate-900 tracking-tight font-display">Communication with Leadership</h3>
              </div>
              <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-700">Direct Line</span>
            </div>

            <form onSubmit={handleMessageSubmit} className="mb-4 grid gap-3 md:grid-cols-[1fr_1.5fr_auto]">
              <select
                value={recipientId}
                onChange={(event) => setRecipientId(event.target.value)}
                className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-amber-500"
              >
                <option value="">Select recipient</option>
                {recipientOptions.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name} — {member.role}
                  </option>
                ))}
              </select>
              <input
                value={messageContent}
                onChange={(event) => setMessageContent(event.target.value)}
                className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-amber-500"
                placeholder="Reply or report to owner/manager..."
              />
              <button
                type="submit"
                className="flex items-center justify-center gap-1.5 rounded-2xl bg-amber-600 hover:bg-amber-700 px-5 py-3 text-sm font-bold text-white shadow-sm transition cursor-pointer"
              >
                <Send size={15} />
                <span>Send</span>
              </button>
            </form>

            <div className="space-y-3 max-h-64 overflow-y-auto">
              {staffMessages.length === 0 ? (
                <p className="text-sm text-slate-500">No new messages.</p>
              ) : (
                staffMessages.map((message) => (
                  <div
                    key={message._id || message.id}
                    className={`rounded-2xl border p-4 ${
                      String(message.recipientId) === String(window.localStorage.getItem('userId') || '')
                        ? 'border-emerald-200 bg-emerald-50'
                        : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <p className="font-bold text-slate-900 text-sm">
                        {String(message.recipientId) === String(window.localStorage.getItem('userId') || '')
                          ? `From ${message.senderName || 'Owner'}`
                          : `To ${message.recipientName || 'Staff'}`}
                      </p>
                      <span className="rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700">
                        {message.senderRole || 'owner'}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700">{message.content}</p>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      );
    }

    // Dedicated overview for Waiter vs Chef
    if (isWaiter) {
      return (
        <div className="space-y-6">
          {/* Waiter Category Service Operations Facility Banner */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-md shadow-amber-500/30">
                  <Utensils size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-800 border border-amber-200">
                      Staff Category Waiter
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Live Floor Service
                    </span>
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight font-display mt-0.5">
                    Waiter Category Service Operations Facility
                  </h2>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Real-time table dining dispatch, ready food pickup, turnaround metrics & table service monitoring
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveView('orders');
                    setOrdersTab('active');
                  }}
                  className="flex items-center gap-2 rounded-2xl bg-amber-600 hover:bg-amber-700 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition cursor-pointer"
                >
                  <UtensilsCrossed size={14} />
                  <span>+ Take Dining Order</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveView('orders');
                    setOrdersTab('records');
                  }}
                  className="flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 cursor-pointer"
                >
                  <Calendar size={14} className="text-emerald-600" />
                  <span>Order Records Archive</span>
                </button>
              </div>
            </div>

            {/* 4 Waiter Category Service KPIs */}
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Orders Today</p>
                  <CheckCircle2 size={18} className="text-amber-600" />
                </div>
                <p className="mt-2 text-2xl font-black text-slate-900 font-display">{orders.length}</p>
                <p className="mt-1 text-[11px] text-slate-500">Total dining orders in system</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800">Waiter Completion Rate</p>
                  <Sparkles size={18} className="text-emerald-600" />
                </div>
                <p className="mt-2 text-2xl font-black text-emerald-900 font-display">{waiterServiceMetrics.completionRate}%</p>
                <p className="mt-1 text-[11px] text-emerald-700">Ready ➔ Completed transition</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-extrabold uppercase tracking-wider text-amber-800">Awaiting Service (Ready)</p>
                  <Flame size={18} className="text-amber-600" />
                </div>
                <p className="mt-2 text-2xl font-black text-amber-900 font-display">{waiterServiceMetrics.pendingReadyCount}</p>
                <p className="mt-1 text-[11px] text-amber-700">Cooked food ready in kitchen</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-extrabold uppercase tracking-wider text-sky-800">Avg. Serve Speed</p>
                  <TimerReset size={18} className="text-sky-600" />
                </div>
                <p className="mt-2 text-2xl font-black text-sky-900 font-display">{waiterServiceMetrics.avgServeFormatted}</p>
                <p className="mt-1 text-[11px] text-sky-700">Kitchen pickup to table delivery</p>
              </motion.div>
            </div>
          </section>

          {/* Live Kitchen Pickup Station */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <p className="text-xs font-extrabold uppercase tracking-wider text-emerald-700">Live Kitchen Pickup Station</p>
                </div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight font-display mt-0.5">
                  Ready Food Orders Waiting for Table Delivery ({readyOrders.length})
                </h3>
              </div>
              <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-800">
                {readyOrders.length > 0 ? `${readyOrders.length} Ready for Pickup` : 'All Food Served'}
              </span>
            </div>

            {readyOrders.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                <CheckCircle2 size={32} className="mx-auto text-emerald-600 opacity-60 mb-2" />
                <p className="font-bold text-slate-800 text-sm">No food orders currently waiting for pickup</p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  When the chef marks dishes cooked and Ready, they will appear here instantly with 1-click table delivery confirmation.
                </p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {readyOrders.map((order) => (
                  <div
                    key={order.id || order._id}
                    className="rounded-2xl border-2 border-emerald-300 bg-emerald-50 p-4 shadow-2xs hover:shadow-xs transition"
                  >
                    <div className="flex items-center justify-between border-b border-emerald-200/80 pb-2.5">
                      <div>
                        <span className="rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-800 shadow-2xs">
                          Table #{order.tableNumber}
                        </span>
                        <p className="font-extrabold text-slate-900 text-sm mt-1">{order.customerName}</p>
                      </div>
                      <div className="text-right">
                        <span className="rounded-full bg-emerald-600 text-white px-2.5 py-0.5 text-[11px] font-bold">
                          Food Cooked 🍳
                        </span>
                        <p className="text-xs font-black text-slate-900 mt-1">₹{order.total}</p>
                      </div>
                    </div>

                    <div className="my-2.5 space-y-1 text-xs text-slate-700 max-h-24 overflow-y-auto">
                      {order.items?.map((it, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span className="font-medium">{it.qty} × {it.name}</span>
                          <span className="text-slate-500">₹{it.qty * it.price}</span>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleWaiterCompleteOrder(order.id || order._id, order.tableNumber)}
                      className="w-full mt-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2.5 text-xs font-black text-white shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 size={14} />
                      <span>Deliver to Table & Mark Served 🍽️</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Executive Updates / Direct Messages */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-wider text-amber-600">Executive Updates</p>
                <h3 className="text-xl font-black text-slate-900 tracking-tight font-display">
                  Direct Messages from Leadership
                </h3>
              </div>
              <span className="rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-bold text-amber-800">
                Inbox
              </span>
            </div>

            <form onSubmit={handleMessageSubmit} className="mb-4 grid gap-3 md:grid-cols-[1fr_1.5fr_auto]">
              <select
                value={recipientId}
                onChange={(event) => setRecipientId(event.target.value)}
                className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-amber-500"
              >
                <option value="">Select recipient</option>
                {recipientOptions.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name} — {member.role}
                  </option>
                ))}
              </select>
              <input
                value={messageContent}
                onChange={(event) => setMessageContent(event.target.value)}
                className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-amber-500"
                placeholder="Reply to leadership or report shift status"
              />
              <button
                type="submit"
                className="flex items-center justify-center gap-2 rounded-2xl bg-amber-600 hover:bg-amber-700 px-5 py-3 text-sm font-bold text-white shadow-sm transition cursor-pointer"
              >
                <Send size={15} />
                <span>Send</span>
              </button>
            </form>

            <div className="space-y-3 max-h-64 overflow-y-auto">
              {staffMessages.length === 0 ? (
                <p className="text-sm text-slate-500">No new messages.</p>
              ) : (
                staffMessages.map((message) => {
                  const isReadyAlert = message.content?.includes('READY TO SERVE') || message.content?.includes('Ready');
                    return (
                      <div
                        key={message._id || message.id}
                        className={`rounded-2xl border p-4 transition-all ${
                          isReadyAlert
                            ? 'border-emerald-300 bg-emerald-50/90 shadow-xs ring-1 ring-emerald-400/20'
                            : String(message.recipientId) === String(window.localStorage.getItem('userId') || '')
                            ? 'border-emerald-200 bg-emerald-50'
                            : 'border-slate-200 bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            {isReadyAlert ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-0.5 text-[10px] font-black tracking-wide text-white shadow-2xs">
                                🍳 KITCHEN DISPATCH
                              </span>
                            ) : null}
                            <p className="font-bold text-slate-900 text-sm">
                              {String(message.recipientId) === String(window.localStorage.getItem('userId') || '')
                                ? `From ${message.senderName || 'Leadership'}`
                                : `To ${message.recipientName || 'Staff'}`}
                            </p>
                          </div>
                          <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            isReadyAlert ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-white border-slate-200 text-amber-700'
                          }`}>
                            {isReadyAlert ? 'FOOD READY' : message.senderRole || 'staff'}
                          </span>
                        </div>
                        <p className={`text-sm ${isReadyAlert ? 'text-emerald-950 font-semibold' : 'text-slate-700'}`}>
                          {message.content}
                        </p>
                      </div>
                    );
                  })
              )}
            </div>
          </section>
        </div>
      );
    }

    // Default overview for Chef
    return (
      <div className="space-y-6">
        <section className="grid gap-4 lg:grid-cols-3">
          {[
            { title: 'Orders Today', value: `${orders.length}`, icon: CheckCircle2, color: 'text-amber-600' },
            { title: 'Completion Rate', value: liveCompletionRate, icon: Sparkles, color: 'text-emerald-600' },
            { title: 'Avg. Turnaround', value: liveAvgTurnaround, icon: TimerReset, color: 'text-sky-600' }
          ].map((item) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs font-extrabold uppercase tracking-wider text-slate-500">{item.title}</p>
                  <Icon size={18} className={item.color} />
                </div>
                <p className="text-3xl font-black text-slate-900 font-display">{item.value}</p>
              </motion.div>
            );
          })}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-amber-600">
                {isChef ? 'Kitchen Inventory & Stock Dispatch' : 'Executive Updates'}
              </p>
              <h3 className="text-xl font-black text-slate-900 tracking-tight font-display">
                {isChef ? 'Raw Material Stock Requisition to Owner' : 'Direct Messages from Leadership'}
              </h3>
            </div>
            <span className="rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-bold text-amber-800">
              {isChef ? 'Direct to Owner' : 'Inbox'}
            </span>
          </div>

          {isChef && (
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Quick ingredient tags:</span>
              {[
                'Fresh Vegetables low',
                'Paneer & Dairy needed',
                'Cooking oil 15L required',
                'Spices & Garam Masala low',
                'Atta / Flour restock'
              ].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setMessageContent((prev) => (prev ? `${prev}, ${tag}` : tag))}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-amber-400 hover:bg-amber-50"
                >
                  + {tag}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={handleMessageSubmit} className="mb-4 grid gap-3 md:grid-cols-[1fr_1.5fr_auto]">
            <select
              value={recipientId}
              onChange={(event) => setRecipientId(event.target.value)}
              className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-amber-500"
            >
              <option value="">{isChef ? 'Select Owner' : 'Select recipient'}</option>
              {recipientOptions.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name} — {member.role}
                </option>
              ))}
            </select>
            <input
              value={messageContent}
              onChange={(event) => setMessageContent(event.target.value)}
              className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-amber-500"
              placeholder={
                isChef
                  ? 'Report raw material shortage to Owner (e.g. Tomato 10kg, Amul Butter 5kg, Oil low...)'
                  : 'Reply to leadership or report shift status'
              }
            />
            <button
              type="submit"
              className="flex items-center justify-center gap-2 rounded-2xl bg-amber-600 hover:bg-amber-700 px-5 py-3 text-sm font-bold text-white shadow-sm transition cursor-pointer"
            >
              <Send size={15} />
              <span>{isChef ? 'Send Requisition' : 'Send'}</span>
            </button>
          </form>

          <div className="space-y-3 max-h-64 overflow-y-auto">
            {staffMessages.length === 0 ? (
              <p className="text-sm text-slate-500">No new messages.</p>
            ) : (
              staffMessages.map((message) => (
                <div
                  key={message._id || message.id}
                  className={`rounded-2xl border p-4 ${
                    String(message.recipientId) === String(window.localStorage.getItem('userId') || '')
                      ? 'border-emerald-200 bg-emerald-50'
                      : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <p className="font-bold text-slate-900 text-sm">
                      {String(message.recipientId) === String(window.localStorage.getItem('userId') || '')
                        ? `From ${message.senderName || 'Owner'}`
                        : `To ${message.recipientName || 'Staff'}`}
                    </p>
                    <span className="rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700">
                      {message.senderRole || 'owner'}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700">{message.content}</p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    );
  };

  const renderOrders = () => (
    <div className="space-y-4">
      {orderNotice && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 shadow-sm flex items-center justify-between"
        >
          <span className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600" />
            {orderNotice}
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setOrdersTab('records');
                setOrderNotice('');
              }}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-900 underline"
            >
              View in Records →
            </button>
            <button
              type="button"
              onClick={() => setOrderNotice('')}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-800"
            >
              Dismiss
            </button>
          </div>
        </motion.div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr] items-start">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-6 self-start max-h-[calc(100vh-3rem)] overflow-y-auto pr-1">
          {isChef ? (
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-wider text-amber-600">Kitchen Display System (KDS)</p>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight font-display">Live Order Preparation (KOT)</h3>
                </div>
                <span className="rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-bold text-amber-800">
                  Chef Station
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Incoming guest dining orders. Inspect dishes, prepare food, and mark status to Ready when cooked.
              </p>

              {selectedOrder ? (
                <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-xs">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div>
                      <p className="text-xs font-medium text-slate-500">Order #{selectedOrder.id || selectedOrder._id}</p>
                      <p className="text-lg font-black text-slate-900 font-display">{selectedOrder.customerName}</p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block rounded-xl border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-800 shadow-2xs">
                        Table {selectedOrder.tableNumber}
                      </span>
                      <p className="mt-1 text-xs font-extrabold text-amber-700">Total: ₹{selectedOrder.total}</p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Dishes to Cook / Prepare:</p>
                    <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
                      {selectedOrder.items && selectedOrder.items.length > 0 ? (
                        selectedOrder.items.map((item, idx) => (
                          <div
                            key={`${item.name}-${idx}`}
                            className="flex items-center justify-between rounded-xl bg-white border border-slate-200 px-4 py-2.5 shadow-2xs"
                          >
                            <div className="flex items-center gap-3">
                              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-xs font-extrabold text-amber-900">
                                {item.qty}×
                              </span>
                              <div>
                                <p className="font-bold text-sm text-slate-900">{item.name}</p>
                                {item.category && <p className="text-[11px] text-slate-400">{item.category}</p>}
                              </div>
                            </div>
                            <span className="text-xs font-bold text-slate-700">₹{item.qty * item.price}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-slate-500">No items specified for this order.</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 border-t border-slate-200 pt-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-slate-500">Status:</span>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          selectedOrder.status === 'Ready'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : selectedOrder.status === 'Completed'
                            ? 'bg-slate-100 text-slate-700 border border-slate-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}
                      >
                        {selectedOrder.status}
                      </span>
                    </div>

                    {selectedOrder.status === 'Preparing' ? (
                      <button
                        type="button"
                        onClick={() => onUpdateOrderStatus(selectedOrder.id || selectedOrder._id, 'Ready')}
                        className="rounded-2xl bg-amber-600 hover:bg-amber-700 px-5 py-2 text-sm font-bold text-white shadow-sm transition cursor-pointer"
                      >
                        Mark Order as Ready 🍳
                      </button>
                    ) : selectedOrder.status === 'Ready' ? (
                      <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-700">
                        ✓ Food Ready (Waiter serving)
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-100 border border-slate-200 px-3 py-1 text-xs font-bold text-slate-600">
                        ✓ Served to Guest
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                  <UtensilsCrossed size={36} className="mx-auto text-amber-600 opacity-60 mb-2" />
                  <p className="font-bold text-slate-800">Select an incoming order</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Click any active ticket from the live queue on the right to inspect cooking instructions and mark Ready.
                  </p>
                  {orders.filter((o) => o.status === 'Preparing').length > 0 && (
                    <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-amber-100 px-3.5 py-1 text-xs font-bold text-amber-800">
                      <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
                      {orders.filter((o) => o.status === 'Preparing').length} order(s) currently cooking
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : isWaiter ? (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-wider text-amber-600">Table Order Entry</p>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight font-display">Create Dining Order</h3>
                </div>
                <span className="rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-bold text-amber-800">
                  Waiter Station
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">Take table order directly from guests and instantly transmit to kitchen.</p>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <input
                  value={draftOrder.customerName}
                  onChange={(event) => setDraftOrder({ ...draftOrder, customerName: event.target.value })}
                  className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-amber-500"
                  placeholder="Customer name"
                />
                <input
                  value={draftOrder.tableNumber}
                  onChange={(event) => setDraftOrder({ ...draftOrder, tableNumber: event.target.value })}
                  className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-amber-500"
                  placeholder="Table number (1-50)"
                />
              </div>

              <div className="mt-4 grid gap-2.5 md:grid-cols-2 max-h-72 overflow-y-auto">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => addItemToOrder(item)}
                    className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-2.5 text-left text-sm text-slate-700 shadow-2xs transition hover:border-amber-400 cursor-pointer"
                  >
                    <img
                      src={item.image || 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=200&auto=format&fit=crop&q=80'}
                      alt={item.name}
                      className="h-11 w-11 rounded-xl object-cover border border-slate-200 shrink-0 shadow-2xs"
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=200&auto=format&fit=crop&q=80';
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-slate-900 truncate text-xs">{item.name}</p>
                      <p className="text-[10px] text-slate-400">{item.category}</p>
                      <p className="mt-0.5 font-extrabold text-amber-700 text-xs">₹{item.price}</p>
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Selected Items ({draftOrder.items.length})
                  </p>
                  {draftOrder.items.length > 0 && (
                    <button
                      type="button"
                      onClick={clearDraftOrder}
                      className="rounded-lg px-2 py-0.5 text-[11px] font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 transition cursor-pointer flex items-center gap-1"
                    >
                      <Trash2 size={12} />
                      <span>Cancel All</span>
                    </button>
                  )}
                </div>

                {draftOrder.items.length === 0 ? (
                  <p className="mt-3 text-xs text-slate-400 py-3 text-center">Click dishes above to add them to this order.</p>
                ) : (
                  <div className="mt-2.5 space-y-2 max-h-56 overflow-y-auto pr-0.5">
                    {draftOrder.items.map((item, index) => (
                      <div
                        key={`${item.name}-${index}`}
                        className="flex items-center justify-between gap-2.5 rounded-xl border border-slate-200/80 bg-white p-2.5 text-xs text-slate-800 shadow-2xs transition hover:border-amber-300"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-extrabold text-slate-900 truncate">{item.name}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">₹{item.price} each</p>
                        </div>

                        {/* Quantity controls */}
                        <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-1.5 py-0.5 shadow-2xs">
                          <button
                            type="button"
                            onClick={() => updateDraftItemQty(item.name, -1)}
                            className="rounded p-1 text-slate-600 hover:bg-slate-200 transition cursor-pointer"
                            title="Decrease quantity"
                          >
                            <Minus size={11} />
                          </button>
                          <span className="min-w-4 text-center text-xs font-black text-slate-900">{item.qty}</span>
                          <button
                            type="button"
                            onClick={() => updateDraftItemQty(item.name, 1)}
                            className="rounded p-1 text-amber-700 hover:bg-amber-100 transition cursor-pointer"
                            title="Increase quantity"
                          >
                            <Plus size={11} />
                          </button>
                        </div>

                        {/* Subtotal */}
                        <span className="min-w-[50px] text-right font-black text-slate-900 text-xs">
                          ₹{item.qty * item.price}
                        </span>

                        {/* Cancel / Remove Item */}
                        <button
                          type="button"
                          onClick={() => removeItemFromOrder(item.name)}
                          className="rounded-lg p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          title={`Cancel and remove ${item.name}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-4 border-t border-slate-200 pt-3 text-right text-base font-black text-slate-900 font-display">
                  Order Total: ₹{total}
                </div>
              </div>

              <button
                onClick={saveOrder}
                disabled={draftOrder.items.length === 0 || !draftOrder.customerName.trim() || !draftOrder.tableNumber}
                className="mt-4 w-full rounded-2xl bg-amber-600 hover:bg-amber-700 px-5 py-3 text-sm font-bold text-white transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Send Order to Kitchen 🍳
              </button>
            </>
          ) : (
            <>
              <h3 className="text-xl font-black text-slate-900 font-display">Food Orders Status</h3>
              <p className="mt-2 text-xs text-slate-500">
                Housekeeping staff can monitor active orders to know which tables will be ready for cleaning once vacated.
              </p>
            </>
          )}
        </div>

        <div className="space-y-3">
          {/* Tab switcher: Active Orders Queue vs Order Records */}
          <div className="rounded-3xl border border-slate-200 bg-white p-3 shadow-xs">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setOrdersTab('active')}
                  className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition cursor-pointer ${
                    ordersTab === 'active'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span>{isChef ? 'Active KOT Queue' : 'Active Orders Queue'}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-extrabold ${
                      ordersTab === 'active' ? 'bg-white text-amber-800' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {activeOrders.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setOrdersTab('records')}
                  className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                    ordersTab === 'records'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span>Order Records</span>
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-extrabold ${
                      ordersTab === 'records' ? 'bg-white text-emerald-800' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {completedRecords.length}
                  </span>
                </button>
              </div>

              <span className="text-[11px] font-medium text-slate-400 hidden sm:inline">
                {ordersTab === 'active'
                  ? `${activeOrders.length} pending`
                  : `${completedRecords.length} archived`}
              </span>
            </div>
          </div>

          {ordersTab === 'active' ? (
            activeOrders.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-xs">
                <CheckCircle2 size={36} className="mx-auto text-emerald-600 opacity-70 mb-2" />
                <p className="font-bold text-slate-800">Queue is clear! No active orders</p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  All table orders have been completed and moved to Records.
                </p>
                {completedRecords.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setOrdersTab('records')}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-4 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition shadow-2xs"
                  >
                    View {completedRecords.length} completed order record{completedRecords.length > 1 ? 's' : ''} →
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[620px] overflow-y-auto pr-1">
                {activeOrders.map((order) => {
                  const isSelected = selectedOrder && (String(selectedOrder.id) === String(order.id) || String(selectedOrder._id) === String(order.id) || String(selectedOrder.id) === String(order._id));
                  return (
                    <div
                      key={order.id || order._id}
                      onClick={() => onSelectOrder(order.id || order._id)}
                      className={`w-full cursor-pointer rounded-2xl border p-4 text-left shadow-xs transition hover:border-amber-400 ${
                        isSelected
                          ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-400'
                          : 'border-slate-200 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-extrabold text-slate-900 text-sm">{order.customerName}</p>
                          <p className="text-xs text-slate-500">Table {order.tableNumber}</p>
                        </div>
                        <div className="text-right">
                          <span className="rounded-xl border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-900">
                            ₹{order.total}
                          </span>
                          {order.items && order.items.length > 0 && (
                            <p className="text-[11px] text-slate-400 mt-1">
                              {order.items.reduce((sum, it) => sum + (it.qty || 1), 0)} item(s)
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-100 pt-2.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-slate-500">Status:</span>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                              order.status === 'Ready'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-amber-100 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {order.status}
                          </span>
                        </div>

                        {/* Role-specific status actions */}
                        {isChef ? (
                          order.status === 'Preparing' ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onUpdateOrderStatus(order.id || order._id, 'Ready');
                              }}
                              className="rounded-xl bg-amber-600 hover:bg-amber-700 px-3 py-1.5 text-xs font-bold text-white shadow-xs transition"
                            >
                              Mark Ready 🍳
                            </button>
                          ) : (
                            <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                              Ready for Waiter ✓
                            </span>
                          )
                        ) : isWaiter ? (
                          order.status === 'Ready' ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleWaiterCompleteOrder(order.id || order._id, order.tableNumber);
                              }}
                              className="rounded-xl bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white shadow-xs transition flex items-center gap-1"
                            >
                              Mark Served 🍽️
                            </button>
                          ) : (
                            <span className="rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-xs font-semibold text-amber-700 flex items-center gap-1">
                              Cooking ⏳
                            </span>
                          )
                        ) : (
                          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-500">
                            {order.paymentStatus === 'paid' ? 'Bill Paid' : order.status}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            <div className="space-y-3">
              {/* Month and Year Filter Bar & Search */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-800">
                    <Calendar size={14} className="text-emerald-600" />
                    <span>Month & Year Wise Order Records</span>
                  </div>
                  {(recordYearFilter !== 'all' || recordMonthFilter !== 'all' || recordSearch.trim()) && (
                    <button
                      type="button"
                      onClick={() => {
                        setRecordYearFilter('all');
                        setRecordMonthFilter('all');
                        setRecordSearch('');
                      }}
                      className="text-[11px] font-bold text-amber-700 hover:text-amber-900 underline cursor-pointer"
                    >
                      Reset Filters
                    </button>
                  )}
                </div>

                {/* Filter selectors: Year & Month */}
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="flex items-center gap-2">
                    <label className="text-[11px] font-bold text-slate-500 whitespace-nowrap">Year:</label>
                    <select
                      value={recordYearFilter}
                      onChange={(e) => setRecordYearFilter(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-emerald-400 cursor-pointer"
                    >
                      <option value="all">All Years ({completedRecords.length})</option>
                      {availableYears.map((yr) => (
                        <option key={yr} value={yr}>
                          Year {yr}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-[11px] font-bold text-slate-500 whitespace-nowrap">Month:</label>
                    <select
                      value={recordMonthFilter}
                      onChange={(e) => setRecordMonthFilter(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-emerald-400 cursor-pointer"
                    >
                      <option value="all">All Months</option>
                      {availableMonths.map((m) => (
                        <option key={m.num} value={m.num}>
                          {m.name} ({m.num})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Search bar within records */}
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                  <input
                    value={recordSearch}
                    onChange={(e) => setRecordSearch(e.target.value)}
                    placeholder="Search records by guest, table #, dish, order ID..."
                    className="w-full rounded-xl border border-slate-200 bg-white pl-8 pr-8 py-1.5 text-xs text-slate-800 outline-none focus:border-emerald-400"
                  />
                  {recordSearch && (
                    <button
                      type="button"
                      onClick={() => setRecordSearch('')}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                {/* Summary KPI Bar */}
                <div className="flex flex-wrap items-center justify-between border-t border-slate-200/80 pt-2 text-[11px] font-bold text-slate-600 gap-2">
                  <span>Filtered: {recordsStats.count} order{recordsStats.count !== 1 ? 's' : ''}</span>
                  <span className="text-emerald-700">Total Sales: ₹{recordsStats.totalRevenue.toLocaleString()}</span>
                  <span>Avg Items: {recordsStats.avgItems}/order</span>
                </div>
              </div>

              {filteredRecords.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-xs">
                  <ClipboardList size={36} className="mx-auto text-amber-600 opacity-60 mb-2" />
                  <p className="font-bold text-slate-800">No records match selected filter</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Try adjusting the Month, Year, or Search keyword to view archived orders.
                  </p>
                  {(recordYearFilter !== 'all' || recordMonthFilter !== 'all' || recordSearch.trim()) && (
                    <button
                      type="button"
                      onClick={() => {
                        setRecordYearFilter('all');
                        setRecordMonthFilter('all');
                        setRecordSearch('');
                      }}
                      className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-slate-100 border border-slate-300 px-3 py-1 text-xs font-bold text-slate-700 hover:bg-slate-200 cursor-pointer"
                    >
                      Clear All Filters
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[620px] overflow-y-auto pr-1">
                  {filteredRecords.map((order) => {
                    const isSelected =
                      selectedOrder &&
                      (String(selectedOrder.id) === String(order.id) ||
                        String(selectedOrder._id) === String(order.id) ||
                        String(selectedOrder.id) === String(order._id));
                    const dateStr = order.completedAt || order.createdAt || order.updatedAt;
                    const formattedDate = dateStr
                      ? new Date(dateStr).toLocaleString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : 'Completed';

                    return (
                      <div
                        key={order.id || order._id}
                        onClick={() => onSelectOrder(order.id || order._id)}
                        className={`w-full cursor-pointer rounded-2xl border p-4 text-left shadow-xs transition hover:border-emerald-400 ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-400'
                            : 'border-slate-200 bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="rounded-xl border border-slate-200 bg-white px-2.5 py-0.5 text-xs font-bold text-slate-800 shadow-2xs">
                                Table #{order.tableNumber}
                              </span>
                              <p className="font-extrabold text-slate-900 text-sm">{order.customerName}</p>
                              <span className="rounded-md bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                                ARCHIVE
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                              <Calendar size={12} className="text-slate-400" />
                              <span>{formattedDate}</span>
                              <span>•</span>
                              <span>ID: #{String(order.id || order._id).slice(-6)}</span>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="rounded-xl border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-800">
                              ₹{order.total}
                            </span>
                            {order.items && order.items.length > 0 && (
                              <p className="text-[11px] text-slate-400 mt-1">
                                {order.items.reduce((sum, it) => sum + (it.qty || 1), 0)} items served
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Timings and Staff attribution if available */}
                        {(order.servedBy || order.preparedBy || order.prepTimeMinutes || order.serveTimeMinutes) && (
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-500 border-t border-slate-100 pt-2">
                            {order.servedBy && (
                              <span className="rounded bg-slate-100 px-1.5 py-0.5 font-medium text-slate-700">
                                Served by: {order.servedBy}
                              </span>
                            )}
                            {order.preparedBy && (
                              <span className="rounded bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 font-medium">
                                Chef: {order.preparedBy}
                              </span>
                            )}
                            {order.serveTimeMinutes && (
                              <span className="rounded bg-sky-50 text-sky-800 border border-sky-200 px-1.5 py-0.5 font-medium">
                                Serve speed: {order.serveTimeMinutes}m
                              </span>
                            )}
                          </div>
                        )}

                        {/* Items breakdown list */}
                        {order.items && order.items.length > 0 && (
                          <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap gap-1.5">
                            {order.items.map((it, idx) => (
                              <span
                                key={idx}
                                className="rounded-md bg-slate-100 border border-slate-200/60 px-2 py-0.5 text-[11px] font-medium text-slate-700"
                              >
                                {it.qty}× {it.name} <span className="text-slate-400">(₹{it.qty * it.price})</span>
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Bottom actions: Status and Delete Order Option */}
                        <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-100 pt-2.5">
                          <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-bold text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 size={12} className="text-emerald-600" /> Served & Closed
                          </span>

                          {/* Delete Order Record Option */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOrderToDelete(order.id || order._id);
                            }}
                            className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 hover:border-rose-300 transition shadow-2xs cursor-pointer"
                            title="Permanently delete this order record"
                          >
                            <Trash2 size={13} />
                            <span>Delete Order</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {orderToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/25 backdrop-blur-xs p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-3xl border border-rose-200 bg-white p-6 shadow-2xl"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 mb-4">
                <Trash2 size={24} />
              </div>
              <h4 className="text-lg font-black text-slate-900 font-display">Permanently Delete Order Record?</h4>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Are you sure you want to delete Order #{String(orderToDelete).slice(-6)}? This will remove this record from previous orders and sales archives permanently.
              </p>
              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setOrderToDelete(null)}
                  className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteOrderAction(orderToDelete)}
                  className="rounded-xl bg-rose-600 hover:bg-rose-700 px-4 py-2 text-xs font-bold text-white shadow-sm transition cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 size={13} />
                  <span>Yes, Delete Order</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  const renderCustomers = () => (
    <div className="space-y-3">
      {customers.map((customer) => (
        <div key={customer.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex items-center justify-between">
          <div>
            <p className="font-extrabold text-slate-900 text-sm">{customer.name}</p>
            <p className="text-xs text-slate-500">{customer.email}</p>
          </div>
          <span className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-800">
            Table #{customer.tableNumber}
          </span>
        </div>
      ))}
    </div>
  );

  const renderBilling = () => (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-xl font-black text-slate-900 font-display">Guest Bill Summary</h3>
      {selectedOrder ? (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <div className="flex items-center justify-between text-xs text-slate-500 border-b border-slate-200 pb-3">
            <span>Order #{selectedOrder.id}</span>
            <span className="font-bold text-emerald-700">{selectedOrder.status}</span>
          </div>
          <p className="mt-3 font-extrabold text-slate-900 text-base">Guest: {selectedOrder.customerName}</p>
          <p className="text-xs text-slate-500">Assigned Table: #{selectedOrder.tableNumber}</p>
          <div className="mt-4 space-y-2 text-xs text-slate-700">
            {selectedOrder.items.map((item, index) => (
              <div key={`${item.name}-${index}`} className="flex items-center justify-between py-1 border-b border-slate-100">
                <span>
                  {item.qty} × {item.name}
                </span>
                <span className="font-bold">₹{item.qty * item.price}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 border-t border-slate-200 pt-3 text-right text-lg font-black text-slate-900 font-display">
            Total Payable: ₹{selectedOrder.total}
          </div>
        </div>
      ) : (
        <p className="mt-4 text-xs text-slate-500">Select an order from the active queue to view billing breakdown.</p>
      )}
    </div>
  );

  const contentMap = {
    overview: renderOverview(),
    tables: renderTables(),
    bartan: renderBartan(),
    orders: isCleaningStaff ? renderTables() : renderOrders(),
    customers: isCleaningStaff ? renderTables() : renderCustomers(),
    billing: (isCleaningStaff || isChef) ? renderOrders() : renderBilling()
  };

  return contentMap[activeView] || (isCleaningStaff ? renderTables() : renderOverview());
}
