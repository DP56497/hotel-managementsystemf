import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  Armchair,
  ArrowUpRight,
  Check,
  CheckCircle2,
  ChefHat,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  Filter,
  Flame,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Timer,
  Trash2,
  TrendingUp,
  Users,
  Utensils,
  UtensilsCrossed,
  Printer,
  XCircle,
  Zap
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { HOTEL_TABLES, TABLE_CATEGORIES } from '../data/tableData';

export default function ManagerDashboard({
  activeView,
  setActiveView,
  accounts = [],
  menuItems = [],
  customers = [],
  orders = [],
  messages = [],
  tables = HOTEL_TABLES,
  tableCleanStatus = {},
  onCleanTable,
  onMarkTableNeedsCleaning,
  onAddTable,
  onDeleteTable,
  bartanStock = [],
  selectedOrder,
  onCreateCustomer,
  onSelectOrder,
  onSaveOrder,
  onUpdateOrderStatus,
  onDeleteOrder,
  onSendMessage,
  onPaymentCompleted
}) {
  const [newCustomer, setNewCustomer] = useState({ name: '', email: '', tableNumber: '1', category: 'Customer' });
  const [isAddingTable, setIsAddingTable] = useState(false);
  const [newTableForm, setNewTableForm] = useState({
    number: '',
    capacity: '4',
    category: '4 Persons (Extra)'
  });
  const [recipientId, setRecipientId] = useState('');
  const [messageContent, setMessageContent] = useState('');

  // Table filter states
  const [selectedTableCategory, setSelectedTableCategory] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [tableSearch, setTableSearch] = useState('');
  const [teamCategoryFilter, setTeamCategoryFilter] = useState('all');

  const teamMembers = useMemo(() => accounts.filter((account) => account.role !== 'owner'), [accounts]);
  const ownerRecipients = useMemo(() => accounts.filter((account) => account.role === 'owner'), [accounts]);
  const recipientOptions = useMemo(() => [...ownerRecipients, ...teamMembers], [ownerRecipients, teamMembers]);

  // Staff segmentation by operational category
  const chefStaff = useMemo(() => accounts.filter((a) => a.role === 'staff' && a.staffCategory === 'chef'), [accounts]);
  const waiterStaff = useMemo(() => accounts.filter((a) => a.role === 'staff' && (a.staffCategory === 'waiter' || !a.staffCategory)), [accounts]);
  const cleaningStaff = useMemo(() => accounts.filter((a) => a.role === 'staff' && a.staffCategory === 'cleaning'), [accounts]);

  // Order status segregation
  const activeOrders = useMemo(() => orders.filter((order) => {
    const s = String(order.status || '').toLowerCase();
    return s !== 'completed' && s !== 'cancelled';
  }), [orders]);

  const preparingOrders = useMemo(() => orders.filter((o) => String(o.status || '').toLowerCase() === 'preparing'), [orders]);
  const readyOrders = useMemo(() => orders.filter((o) => String(o.status || '').toLowerCase() === 'ready'), [orders]);
  const completedOrders = useMemo(() => orders.filter((o) => String(o.status || '').toLowerCase() === 'completed'), [orders]);

  const managerMessages = useMemo(() => messages.slice(0, 6), [messages]);

  // 1. LIVE TEAM LOAD (Live data dependent on orders and staff order preparations)
  // Standard benchmark: 1 chef handles 3 preparations concurrently; 1 waiter handles 2 ready deliveries concurrently
  const teamLoadMetrics = useMemo(() => {
    const activeChefsCount = Math.max(1, chefStaff.length);
    const activeWaitersCount = Math.max(1, waiterStaff.length);

    const chefCapacity = activeChefsCount * 3;
    const waiterCapacity = activeWaitersCount * 2;

    const kitchenLoadPercent = Math.min(100, Math.round((preparingOrders.length / chefCapacity) * 100));
    const waiterLoadPercent = Math.min(100, Math.round((readyOrders.length / waiterCapacity) * 100));

    let compositeLoadPercent = 0;
    if (activeOrders.length > 0) {
      compositeLoadPercent = Math.min(100, Math.round((kitchenLoadPercent * 0.6) + (waiterLoadPercent * 0.4)));
      compositeLoadPercent = Math.max(15, compositeLoadPercent);
    }

    let loadSeverity = 'low';
    let loadLabel = 'Optimal Load';
    let loadBadgeColor = 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20';
    let loadBarGradient = 'from-emerald-500 to-teal-500';

    if (compositeLoadPercent >= 85) {
      loadSeverity = 'critical';
      loadLabel = 'Peak Load';
      loadBadgeColor = 'bg-rose-500/10 text-rose-700 border-rose-500/20';
      loadBarGradient = 'from-rose-500 to-red-600';
    } else if (compositeLoadPercent >= 60) {
      loadSeverity = 'high';
      loadLabel = 'High Activity';
      loadBadgeColor = 'bg-amber-500/10 text-amber-700 border-amber-500/20';
      loadBarGradient = 'from-amber-500 to-orange-500';
    } else if (compositeLoadPercent >= 25) {
      loadSeverity = 'moderate';
      loadLabel = 'Steady Flow';
      loadBadgeColor = 'bg-blue-500/10 text-blue-700 border-blue-500/20';
      loadBarGradient = 'from-blue-500 to-indigo-500';
    }

    return {
      kitchenLoadPercent,
      waiterLoadPercent,
      compositeLoadPercent,
      loadSeverity,
      loadLabel,
      loadBadgeColor,
      loadBarGradient,
      activeChefsCount,
      activeWaitersCount,
      chefCapacity,
      waiterCapacity
    };
  }, [chefStaff, waiterStaff, preparingOrders, readyOrders, activeOrders]);

  // 2. LIVE AVERAGE RESPONSE TIME (Based on staff updating order status to Ready and Completed)
  const responseTimeMetrics = useMemo(() => {
    let totalPrepMin = 0;
    let prepCount = 0;
    let totalServeMin = 0;
    let serveCount = 0;
    let totalTurnaroundMin = 0;
    let turnaroundCount = 0;

    completedOrders.forEach((o) => {
      // Total response time: created -> completed
      if (typeof o.totalResponseTimeMinutes === 'number' && o.totalResponseTimeMinutes > 0) {
        totalTurnaroundMin += o.totalResponseTimeMinutes;
        turnaroundCount++;
      } else if (o.completedAt && o.createdAt) {
        const diff = Math.max(0.5, (new Date(o.completedAt).getTime() - new Date(o.createdAt).getTime()) / 60000);
        totalTurnaroundMin += diff;
        turnaroundCount++;
      } else if (o.updatedAt && o.createdAt && o.updatedAt !== o.createdAt) {
        const diff = Math.max(0.5, (new Date(o.updatedAt).getTime() - new Date(o.createdAt).getTime()) / 60000);
        if (diff <= 180) {
          totalTurnaroundMin += diff;
          turnaroundCount++;
        }
      }

      // Kitchen prep time: created -> ready
      if (typeof o.prepTimeMinutes === 'number' && o.prepTimeMinutes > 0) {
        totalPrepMin += o.prepTimeMinutes;
        prepCount++;
      } else if (o.readyAt && o.createdAt) {
        const diff = Math.max(0.5, (new Date(o.readyAt).getTime() - new Date(o.createdAt).getTime()) / 60000);
        totalPrepMin += diff;
        prepCount++;
      }

      // Waiter serving time: ready -> completed
      if (typeof o.serveTimeMinutes === 'number' && o.serveTimeMinutes > 0) {
        totalServeMin += o.serveTimeMinutes;
        serveCount++;
      } else if (o.completedAt && o.readyAt) {
        const diff = Math.max(0.5, (new Date(o.completedAt).getTime() - new Date(o.readyAt).getTime()) / 60000);
        totalServeMin += diff;
        serveCount++;
      }
    });

    // Also include ready orders for chef prep time
    readyOrders.forEach((o) => {
      if (typeof o.prepTimeMinutes === 'number' && o.prepTimeMinutes > 0) {
        totalPrepMin += o.prepTimeMinutes;
        prepCount++;
      } else if (o.readyAt && o.createdAt) {
        const diff = Math.max(0.5, (new Date(o.readyAt).getTime() - new Date(o.createdAt).getTime()) / 60000);
        totalPrepMin += diff;
        prepCount++;
      }
    });

    const avgTotal = turnaroundCount > 0 ? (totalTurnaroundMin / turnaroundCount) : 0;
    const avgPrep = prepCount > 0 ? (totalPrepMin / prepCount) : 0;
    const avgServe = serveCount > 0 ? (totalServeMin / serveCount) : 0;

    const formatMinutes = (m) => {
      if (!m || m <= 0) return '0 min';
      const whole = Math.floor(m);
      const secs = Math.round((m - whole) * 60);
      if (secs === 0 || whole >= 15) return `${whole} min`;
      return `${whole}m ${secs}s`;
    };

    return {
      avgTotalMinutes: Number(avgTotal.toFixed(1)),
      avgKitchenPrepMinutes: Number(avgPrep.toFixed(1)),
      avgWaiterServeMinutes: Number(avgServe.toFixed(1)),
      formattedTotal: formatMinutes(avgTotal),
      formattedPrep: formatMinutes(avgPrep),
      formattedServe: formatMinutes(avgServe),
      sampleCount: turnaroundCount
    };
  }, [completedOrders, readyOrders]);

  // 3. LIVE WAITER CATEGORY ORDER COMPLETION RATE (Ready -> Completed live transitions)
  const waiterMetrics = useMemo(() => {
    const pendingReadyCount = readyOrders.length;
    const completedCount = completedOrders.length;
    const totalHandled = pendingReadyCount + completedCount;

    const completionRate = (totalHandled > 0 && completedCount > 0)
      ? Math.round((completedCount / totalHandled) * 100)
      : 0;

    // Per-waiter delivery contribution
    const waiterStats = waiterStaff.map((waiter) => {
      const waiterNameLower = (waiter.name || '').toLowerCase();
      const delivered = completedOrders.filter((o) => {
        const servedLower = (o.servedBy || '').toLowerCase();
        return servedLower && (servedLower.includes(waiterNameLower) || waiterNameLower.includes(servedLower));
      });
      return {
        ...waiter,
        ordersServedCount: delivered.length,
        status: pendingReadyCount > 0 ? 'Delivering' : 'Ready on Floor'
      };
    });

    return {
      completionRate,
      pendingReadyCount,
      completedCount,
      totalHandled,
      waiterStats
    };
  }, [readyOrders, completedOrders, waiterStaff]);

  // Compute live occupancy status for all tables
  const tableStatusList = useMemo(() => {
    return tables.map((table) => {
      const tableNumber = Number(table.number);
      const tableOrders = orders.filter(
        (o) => Number(o.tableNumber) === tableNumber
      );
      // Has any order where customer bill payment is completed
      const paidOrders = tableOrders.filter((o) => String(o.paymentStatus || '').toLowerCase() === 'paid');
      const hasCompletedPaymentOrder = paidOrders.length > 0;
      const latestPaidOrder = paidOrders[0] || null;

      // Active dining order occupying table:
      // A table stays FULL only while guests have an active unpaid order.
      // If a completed payment order exists and no newer order has been placed since payment,
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

      // Table is FULL only when dining guests have an unpaid order and have not vacated
      const isFull = !isExplicitlyVacated && activeDiningOrders.length > 0;

      // Cleanliness status: table needs cleaning once vacated after payment, or if explicitly flagged
      const needsCleaning = isExplicitlyVacated || (!isFull && (hasCompletedPaymentOrder || explicitCleanStatus === 'needs_cleaning') && explicitCleanStatus !== 'clean');

      let status = isFull ? 'Full' : 'Empty';

      return {
        ...table,
        isFull,
        needsCleaning,
        status,
        cleanState: needsCleaning ? 'needs_cleaning' : isFull ? 'occupied' : 'clean',
        activeOrder: activeDiningOrders[0] || null,
        lastPaidOrder: latestPaidOrder,
        assignedCustomer: customers.find((c) => Number(c.tableNumber) === tableNumber) || null
      };
    });
  }, [tables, orders, customers, tableCleanStatus]);

  const fullTablesCount = tableStatusList.filter((t) => t.isFull).length;
  const needsCleaningCount = tableStatusList.filter((t) => t.needsCleaning).length;
  const emptyTablesCount = tableStatusList.filter((t) => !t.isFull).length;
  const occupancyPercentage = `${Math.round((fullTablesCount / (tables.length || 1)) * 100)}%`;

  // Per-capacity full counts
  const capacityStats = useMemo(() => {
    return {
      p2: tableStatusList.filter((t) => t.capacity === 2 && t.isFull).length,
      p4: tableStatusList.filter((t) => t.capacity === 4 && t.isFull).length,
      p6: tableStatusList.filter((t) => t.capacity === 6 && t.isFull).length,
      p12: tableStatusList.filter((t) => t.capacity === 12 && t.isFull).length,
      p16: tableStatusList.filter((t) => t.capacity === 16 && t.isFull).length
    };
  }, [tableStatusList]);

  // Filtered tables for the grid
  const filteredTables = useMemo(() => {
    return tableStatusList.filter((table) => {
      // Capacity category filter
      if (selectedTableCategory === '2p' && table.capacity !== 2) return false;
      if (selectedTableCategory === '4p' && table.capacity !== 4) return false;
      if (selectedTableCategory === '6p' && table.capacity !== 6) return false;
      if (selectedTableCategory === '12p' && table.capacity !== 12) return false;
      if (selectedTableCategory === '16p' && table.capacity !== 16) return false;

      // Status filter
      if (statusFilter === 'full' && !table.isFull) return false;
      if (statusFilter === 'empty' && table.isFull) return false;
      if (statusFilter === 'cleaning' && !table.needsCleaning) return false;

      // Search query filter
      if (tableSearch.trim()) {
        const query = tableSearch.toLowerCase().trim();
        const matchNumber =
          String(table.number).includes(query) ||
          `table ${table.number}`.includes(query) ||
          `table #${table.number}`.includes(query);
        const matchCustomer =
          table.assignedCustomer?.name?.toLowerCase().includes(query) ||
          table.assignedCustomer?.email?.toLowerCase().includes(query);
        const matchOrder = table.activeOrder?.customerName?.toLowerCase().includes(query);
        if (!matchNumber && !matchCustomer && !matchOrder) return false;
      }

      return true;
    });
  }, [tableStatusList, selectedTableCategory, statusFilter, tableSearch]);

  const handleCustomerSubmit = (event) => {
    event.preventDefault();
    onCreateCustomer({ ...newCustomer, tableNumber: Number(newCustomer.tableNumber) || 1 });
    setNewCustomer({ name: '', email: '', tableNumber: '1', category: 'Customer' });
  };

  const handleMessageSubmit = (event) => {
    event.preventDefault();
    if (!recipientId || !messageContent.trim() || !onSendMessage) return;
    const recipient = recipientOptions.find((member) => String(member.id) === String(recipientId));
    if (!recipient) return;
    onSendMessage(recipient.id, recipient.name, recipient.role, messageContent.trim());
    setMessageContent('');
  };

  const handleNewTableSubmit = (event) => {
    event.preventDefault();
    if (!onAddTable) return;
    const success = onAddTable(newTableForm);
    if (success) {
      setIsAddingTable(false);
      const nextNum = Number(newTableForm.number) + 1;
      setNewTableForm({ number: String(nextNum), capacity: '4', category: '4 Persons (Extra)' });
    }
  };

  const renderTables = () => (
    <div className="space-y-6">
      {/* Top Header */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600 border border-indigo-500/20">
                <Armchair size={20} />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Dining Operations</span>
                <h2 className="font-display text-xl font-bold text-slate-900">{tables.length} Hotel Dining Tables Matrix</h2>
              </div>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Live floor turnover status for all {tables.length} tables based on guest account registrations and active dining orders.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Live Floor Sync
            </span>
            <button
              type="button"
              onClick={() => {
                const nextNum = Math.max(...tables.map((t) => Number(t.number) || 0), 0) + 1;
                setNewTableForm({ number: String(nextNum), capacity: '4', category: '4 Persons (Extra)' });
                setIsAddingTable((prev) => !prev);
              }}
              className="flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-amber-500/20 transition hover:brightness-105 cursor-pointer active:scale-[0.99]"
            >
              <Plus size={15} />
              <span>Add Extra Table</span>
            </button>
          </div>
        </div>

        {/* Add Extra Table Collapsible Form */}
        <AnimatePresence>
          {isAddingTable && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-5 rounded-2xl border border-amber-300 bg-amber-50/40 p-5 shadow-sm"
            >
              <div className="flex items-center justify-between pb-3 border-b border-amber-200/70">
                <div className="flex items-center gap-2">
                  <span className="rounded-xl bg-amber-500/20 p-1.5 text-amber-800">
                    <Plus size={16} />
                  </span>
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs">Add Extra Floor Table</h4>
                    <p className="text-[11px] text-slate-500">Configure an extra dining table for banquet events or high overflow.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddingTable(false)}
                  className="rounded-full p-1 text-slate-400 hover:bg-amber-100 hover:text-slate-600 transition cursor-pointer"
                >
                  <XCircle size={17} />
                </button>
              </div>

              <form onSubmit={handleNewTableSubmit} className="mt-4 grid gap-3 sm:grid-cols-3 items-end">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Table Number</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newTableForm.number}
                    onChange={(e) => setNewTableForm({ ...newTableForm, number: e.target.value })}
                    placeholder="e.g. 51"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Seating Capacity</label>
                  <select
                    value={newTableForm.capacity}
                    onChange={(e) => {
                      const cap = e.target.value;
                      setNewTableForm({
                        ...newTableForm,
                        capacity: cap,
                        category: `${cap} Persons (Extra)`
                      });
                    }}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="2">2 Persons</option>
                    <option value="4">4 Persons</option>
                    <option value="6">6 Persons</option>
                    <option value="12">12 Persons</option>
                    <option value="16">16 Persons</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full rounded-2xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 py-2 text-xs font-bold text-white shadow-md shadow-amber-500/20 transition hover:brightness-105 active:scale-[0.99] cursor-pointer"
                >
                  Confirm & Place Table
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Occupancy Stats 4-Grid */}
        <div className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Total Setup</span>
            <p className="font-display text-3xl font-extrabold text-slate-900 mt-1">{tables.length}</p>
            <p className="mt-1 text-[11px] text-slate-500">Configured dining tables</p>
          </div>

          <div className="rounded-2xl border border-rose-200/80 bg-rose-50/50 p-4">
            <span className="text-[10px] uppercase font-bold tracking-wider text-rose-700">Full (Occupied)</span>
            <p className="font-display text-3xl font-extrabold text-rose-700 mt-1">{fullTablesCount}</p>
            <p className="mt-1 text-[11px] text-slate-500">Currently dining & active orders</p>
          </div>

          <div className="rounded-2xl border border-amber-300/80 bg-amber-50/50 p-4">
            <span className="text-[10px] uppercase font-bold tracking-wider text-amber-800">Unclean (Cleaning Staff)</span>
            <p className="font-display text-3xl font-extrabold text-amber-800 mt-1">{needsCleaningCount}</p>
            <p className="mt-1 text-[11px] text-slate-500">Vacated tables · Cleaning in progress</p>
          </div>

          <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/50 p-4">
            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-700">Empty Tables</span>
            <p className="font-display text-3xl font-extrabold text-emerald-700 mt-1">{emptyTablesCount}</p>
            <p className="mt-1 text-[11px] text-slate-500">Vacant tables (Ready for seating)</p>
          </div>
        </div>

        {/* Capacity Breakdown Pills */}
        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3.5 text-xs">
          <span className="font-semibold text-slate-500 mr-1">Capacity Overview:</span>
          <span className={`rounded-xl border px-3 py-1 ${capacityStats.p2 > 0 ? 'border-rose-200 bg-rose-50 text-rose-700 font-semibold' : 'border-slate-200 bg-slate-50 text-slate-600'}`}>
            <strong>2P:</strong> {capacityStats.p2}/10 Full
          </span>
          <span className={`rounded-xl border px-3 py-1 ${capacityStats.p4 > 0 ? 'border-rose-200 bg-rose-50 text-rose-700 font-semibold' : 'border-slate-200 bg-slate-50 text-slate-600'}`}>
            <strong>4P:</strong> {capacityStats.p4}/10 Full
          </span>
          <span className={`rounded-xl border px-3 py-1 ${capacityStats.p6 > 0 ? 'border-rose-200 bg-rose-50 text-rose-700 font-semibold' : 'border-slate-200 bg-slate-50 text-slate-600'}`}>
            <strong>6P:</strong> {capacityStats.p6}/10 Full
          </span>
          <span className={`rounded-xl border px-3 py-1 ${capacityStats.p12 > 0 ? 'border-rose-200 bg-rose-50 text-rose-700 font-semibold' : 'border-slate-200 bg-slate-50 text-slate-600'}`}>
            <strong>12P:</strong> {capacityStats.p12}/10 Full
          </span>
          <span className={`rounded-xl border px-3 py-1 ${capacityStats.p16 > 0 ? 'border-rose-200 bg-rose-50 text-rose-700 font-semibold' : 'border-slate-200 bg-slate-50 text-slate-600'}`}>
            <strong>16P:</strong> {capacityStats.p16}/10 Full
          </span>
        </div>
      </section>

      {/* Filter and Search Bar */}
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Capacity Categories */}
          <div className="flex flex-wrap items-center gap-1.5">
            {TABLE_CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                type="button"
                onClick={() => setSelectedTableCategory(cat.key)}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                  selectedTableCategory === cat.key
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Status Filter Toggle */}
          <div className="flex items-center gap-1 rounded-2xl border border-slate-200 bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`rounded-xl px-3 py-1 text-xs font-bold transition cursor-pointer ${
                statusFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              All ({tables.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('full')}
              className={`rounded-xl px-3 py-1 text-xs font-bold transition cursor-pointer ${
                statusFilter === 'full' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-500 hover:text-rose-700'
              }`}
            >
              Full ({fullTablesCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('empty')}
              className={`rounded-xl px-3 py-1 text-xs font-bold transition cursor-pointer ${
                statusFilter === 'empty' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:text-emerald-700'
              }`}
            >
              Empty ({emptyTablesCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('cleaning')}
              className={`rounded-xl px-3 py-1 text-xs font-bold transition cursor-pointer ${
                statusFilter === 'cleaning' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-500 hover:text-amber-800'
              }`}
            >
              Unclean ({needsCleaningCount})
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={tableSearch}
            onChange={(e) => setTableSearch(e.target.value)}
            placeholder="Search table number (e.g. 5, 12, 45) or guest name..."
            className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 pl-10 pr-4 py-2 text-xs text-slate-800 outline-none transition focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20"
          />
          {tableSearch && (
            <button
              type="button"
              onClick={() => setTableSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      </section>

      {/* 50 Tables Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
        {filteredTables.length === 0 ? (
          <div className="col-span-full rounded-3xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-400">
            No tables match the selected filter or search query.
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
                className={`relative flex flex-col justify-between rounded-3xl border p-4 shadow-sm transition hover:shadow-md ${
                  isFull
                    ? 'border-rose-200 bg-rose-50/30 ring-1 ring-rose-300/30'
                    : needsCleaning
                      ? 'border-amber-300 bg-amber-50/40 ring-2 ring-amber-400/20'
                      : 'border-slate-200/90 bg-white hover:border-emerald-400'
                }`}
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Armchair size={16} className={isFull ? 'text-rose-600' : needsCleaning ? 'text-amber-600' : 'text-emerald-600'} />
                      <span className="font-bold text-slate-900 text-sm">Table #{table.number}</span>
                      {table.isExtra && (
                        <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-800">
                          EXTRA
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {isFull ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-rose-300 bg-rose-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-800">
                          <span className="h-1.5 w-1.5 rounded-full bg-rose-600" /> FULL
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" /> EMPTY
                        </span>
                      )}
                      {table.isExtra && !isFull && !needsCleaning && onDeleteTable && (
                        <button
                          type="button"
                          title="Remove extra table"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`Remove extra Table #${table.number}?`)) {
                              onDeleteTable(table.number);
                            }
                          }}
                          className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Capacity Tag */}
                  <div className="mt-1.5">
                    <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                      {table.category}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="mt-3 border-t border-slate-100 pt-2.5">
                    {isFull ? (
                      <div>
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-[10px] uppercase font-bold text-rose-700 tracking-wider">Status: Full (Occupied)</p>
                          <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[9px] font-bold text-amber-800">
                            Bill Pending
                          </span>
                        </div>
                        <p className="font-semibold text-xs text-slate-900 truncate mt-0.5">
                          {table.activeOrder?.customerName || table.assignedCustomer?.name || 'Registered Customer'}
                        </p>
                        {table.activeOrder && (
                          <div className="mt-1.5 flex items-center justify-between rounded-lg bg-rose-100/80 px-2 py-1 text-[10px] font-semibold text-rose-800">
                            <span className="truncate">Order #{table.activeOrder.id || table.activeOrder._id?.slice(-4)} • ₹{table.activeOrder.total}</span>
                            <span className="rounded bg-rose-200/80 px-1 py-0.5 text-[9px] font-bold text-rose-900">
                              {table.activeOrder.status || 'Active'}
                            </span>
                          </div>
                        )}
                        {table.activeOrder && onPaymentCompleted && (
                          <div className="mt-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onPaymentCompleted(table.activeOrder);
                              }}
                              className="w-full inline-flex items-center justify-center gap-1 rounded-xl bg-emerald-600 px-2.5 py-1.5 text-[10px] font-bold text-white shadow-xs hover:bg-emerald-700 transition cursor-pointer"
                              title="Mark customer bill as paid and update table status to empty"
                            >
                              <CheckCircle2 size={12} />
                              <span>Complete Bill Payment (Vacate Table)</span>
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="py-0.5">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 size={13} /> Status: Empty
                          </p>
                          {needsCleaning && onCleanTable && (
                            <button
                              type="button"
                              onClick={() => onCleanTable(table.number)}
                              className="rounded-full bg-emerald-600 px-2.5 py-0.5 text-[9px] font-bold text-white shadow-sm hover:bg-emerald-700 transition cursor-pointer"
                            >
                              Clean Table
                            </button>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">
                          {table.lastPaidOrder ? 'Bill paid • Table vacated' : 'Vacant table • Ready for guests'}
                        </p>
                        {needsCleaning ? (
                          <p className="text-[10px] text-amber-700 font-semibold mt-1 flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                            Cleaning staff: Unclean (Awaiting clean)
                          </p>
                        ) : (
                          <p className="text-[10px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
                            <CheckCircle2 size={11} />
                            Cleaning staff: Clean & Ready
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-3 border-t border-slate-100 pt-1.5 text-[10px] text-slate-400 flex items-center justify-between">
                  <span>Capacity: {table.capacity} Seats</span>
                  <span className={isFull ? 'text-rose-600 font-bold uppercase tracking-wider' : 'text-emerald-600 font-bold uppercase tracking-wider'}>
                    {isFull ? 'Full' : 'Empty'}
                  </span>
                </div>
              </motion.div>
            );
          })
        )}
      </section>
    </div>
  );

  const renderOverview = () => (
    <div className="space-y-6">
      {/* 4 Operations KPI Cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* 1. Pending & Active Orders */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Orders Queue</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-600">
              <ClipboardCheck size={18} />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <p className="font-display text-3xl font-extrabold text-slate-900">{activeOrders.length}</p>
            <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
              {preparingOrders.length} Cooking
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] font-medium text-slate-500 border-t border-slate-100 pt-2">
            <span>{readyOrders.length} Ready for Waiter</span>
            <span>{completedOrders.length} Completed Today</span>
          </div>
        </motion.div>

        {/* 2. Team Load (Live Data) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Live Team Load</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-600">
              <Users size={18} />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <p className="font-display text-3xl font-extrabold text-slate-900">{teamLoadMetrics.compositeLoadPercent}%</p>
            <span className={`text-xs font-bold border px-2 py-0.5 rounded-full ${teamLoadMetrics.loadBadgeColor}`}>
              {teamLoadMetrics.loadLabel}
            </span>
          </div>
          <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-2">
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${teamLoadMetrics.loadBarGradient} transition-all duration-500`}
                style={{ width: `${teamLoadMetrics.compositeLoadPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] font-medium text-slate-500">
              <span>Chef Prep: {teamLoadMetrics.kitchenLoadPercent}%</span>
              <span>Waiter Service: {teamLoadMetrics.waiterLoadPercent}%</span>
            </div>
          </div>
        </motion.div>

        {/* 3. Avg. Response Time (Live Transitions) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Avg. Response Time</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-indigo-500/20 bg-indigo-500/10 text-indigo-600">
              <Clock3 size={18} />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <p className="font-display text-3xl font-extrabold text-slate-900">{responseTimeMetrics.formattedTotal}</p>
            <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Activity size={10} /> Live
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] font-medium text-slate-500 border-t border-slate-100 pt-2">
            <span>Kitchen Prep: <strong className="text-slate-800">{responseTimeMetrics.formattedPrep}</strong></span>
            <span>Waiter Delivery: <strong className="text-slate-800">{responseTimeMetrics.formattedServe}</strong></span>
          </div>
        </motion.div>

        {/* 4. Staff Waiter Category Completion Rate */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Waiter Completion Rate</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-600">
              <Sparkles size={18} />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <p className="font-display text-3xl font-extrabold text-emerald-700">{waiterMetrics.completionRate}%</p>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
              waiterMetrics.pendingReadyCount > 0
                ? 'bg-amber-50 text-amber-800 border-amber-200 animate-pulse'
                : waiterMetrics.completedCount > 0
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}>
              {waiterMetrics.pendingReadyCount > 0
                ? `${waiterMetrics.pendingReadyCount} To Serve`
                : waiterMetrics.completedCount > 0
                  ? '100% Cleared'
                  : '0 In Progress'}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] font-medium text-slate-500 border-t border-slate-100 pt-2">
            <span>Ready → Completed Flow</span>
            <span>{waiterMetrics.completedCount} / {waiterMetrics.totalHandled} Handled</span>
          </div>
        </motion.div>
      </section>

      {/* Ready Orders Live Waiter Dispatch Alert Bar */}
      {readyOrders.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-amber-300 bg-gradient-to-r from-amber-500/15 via-white to-amber-500/10 p-5 shadow-sm"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-800 animate-bounce">
                <Flame size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-display font-extrabold text-slate-900 text-sm">
                    {readyOrders.length} Order{readyOrders.length > 1 ? 's' : ''} Ready for Waiter Table Delivery
                  </h4>
                  <span className="rounded-full bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 animate-pulse">
                    Action Required
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  Food prepared by kitchen is ready on the counter. Waiters should collect and serve to tables now.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {readyOrders.slice(0, 3).map((ro) => (
                <div key={ro.id || ro._id} className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-amber-200 shadow-xs text-xs">
                  <span className="font-bold text-slate-900">Table #{ro.tableNumber}</span>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-600 truncate max-w-[120px]">{ro.customerName}</span>
                  {onUpdateOrderStatus && (
                    <button
                      type="button"
                      onClick={() => onUpdateOrderStatus(ro.id || ro._id, 'Completed')}
                      className="ml-1 rounded-lg bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white hover:bg-emerald-700 transition cursor-pointer"
                    >
                      Serve ✓
                    </button>
                  )}
                </div>
              ))}
              {readyOrders.length > 3 && (
                <span className="text-xs font-semibold text-slate-500">+{readyOrders.length - 3} more</span>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Live Operations & Staff Dispatch Hub */}
      <section className="grid gap-6 lg:grid-cols-2">
        {/* Card 1: Kitchen & Chef Order Preparation Workload */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-700 border border-amber-500/20">
                <ChefHat size={20} />
              </div>
              <div>
                <h3 className="font-display text-base font-bold text-slate-900">Kitchen & Chef Preparation Load</h3>
                <p className="text-xs text-slate-500">Live cooking queue & chef stations</p>
              </div>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full border bg-slate-50 text-slate-700 border-slate-200">
              {chefStaff.length} Chef{chefStaff.length === 1 ? '' : 's'} Active
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-500">Cooking Now</span>
              <p className="font-display text-2xl font-black text-amber-700 mt-0.5">{preparingOrders.length}</p>
              <p className="text-[10px] text-slate-400">Order tickets</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-500">Kitchen Load</span>
              <p className="font-display text-2xl font-black text-slate-900 mt-0.5">{teamLoadMetrics.kitchenLoadPercent}%</p>
              <p className="text-[10px] text-slate-400">Of chef capacity</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3 text-center col-span-2 sm:col-span-1">
              <span className="text-[10px] uppercase font-bold text-slate-500">Avg Prep Speed</span>
              <p className="font-display text-2xl font-black text-indigo-700 mt-0.5">{responseTimeMetrics.formattedPrep}</p>
              <p className="text-[10px] text-slate-400">From order entry</p>
            </div>
          </div>

          {/* Kitchen active orders ticker */}
          <div className="mt-4">
            <span className="text-xs font-bold text-slate-700 block mb-2">Current Orders in Preparation:</span>
            {preparingOrders.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-4 text-center text-xs text-slate-400">
                Kitchen queue is clear. All meals prepared!
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {preparingOrders.map((o) => (
                  <div key={o.id || o._id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-2.5 text-xs">
                    <div>
                      <div className="flex items-center gap-1.5 font-bold text-slate-900">
                        <span>Table #{o.tableNumber}</span>
                        <span className="text-slate-300">•</span>
                        <span className="font-normal text-slate-600">{o.customerName}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {o.items?.map((it) => `${it.qty}x ${it.name}`).join(', ') || 'Custom meal'}
                      </p>
                    </div>
                    {onUpdateOrderStatus && (
                      <button
                        type="button"
                        onClick={() => onUpdateOrderStatus(o.id || o._id, 'Ready')}
                        className="rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-xs hover:brightness-105 transition cursor-pointer"
                      >
                        Mark Ready 🍳
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Card 2: Waiter Service & Delivery Hub */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
                <UtensilsCrossed size={20} />
              </div>
              <div>
                <h3 className="font-display text-base font-bold text-slate-900">Waiter Category Service Operations</h3>
                <p className="text-xs text-slate-500">Live order delivery & completion rate</p>
              </div>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full border bg-emerald-50 text-emerald-800 border-emerald-200">
              {waiterStaff.length} Waiter{waiterStaff.length === 1 ? '' : 's'} Active
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-500">Completion Rate</span>
              <p className="font-display text-2xl font-black text-emerald-700 mt-0.5">{waiterMetrics.completionRate}%</p>
              <p className="text-[10px] text-slate-400">Ready → Completed</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-500">Awaiting Service</span>
              <p className="font-display text-2xl font-black text-amber-700 mt-0.5">{waiterMetrics.pendingReadyCount}</p>
              <p className="text-[10px] text-slate-400">Ready on counter</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3 text-center col-span-2 sm:col-span-1">
              <span className="text-[10px] uppercase font-bold text-slate-500">Avg Serve Time</span>
              <p className="font-display text-2xl font-black text-indigo-700 mt-0.5">{responseTimeMetrics.formattedServe}</p>
              <p className="text-[10px] text-slate-400">To table delivery</p>
            </div>
          </div>

          {/* Waiter roster live stats */}
          <div className="mt-4">
            <span className="text-xs font-bold text-slate-700 block mb-2">Floor Waiter Fleet Roster:</span>
            {waiterStaff.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-4 text-center text-xs text-slate-400">
                No staff categorized as waiter. Assign in team roster.
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {waiterMetrics.waiterStats.map((w) => (
                  <div key={w.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-2.5 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
                        {w.name?.[0] || 'W'}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{w.name}</p>
                        <p className="text-[10px] text-slate-400">{w.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">
                        {w.ordersServedCount} Served
                      </span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                        {w.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Tables Overview Banner */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-500/20">
              <Armchair size={20} />
            </div>
            <div>
              <h3 className="font-display text-lg font-bold text-slate-900">{tables.length} Dining Tables Live Status</h3>
              <p className="text-xs text-slate-500">
                10 × 2P • 10 × 4P • 10 × 6P • 10 × 12P • 10 × 16P{tables.length > 50 ? ` + ${tables.length - 50} Extra Table Sets` : ''}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveView && setActiveView('tables')}
            className="flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-amber-500/20 transition hover:brightness-105 cursor-pointer active:scale-[0.99]"
          >
            <span>View All {tables.length} Tables Floor</span>
            <ChevronRight size={14} />
          </button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-center">
            <span className="text-xs text-slate-500 uppercase font-semibold">Total Tables</span>
            <p className="font-display mt-1 text-2xl font-bold text-slate-900">{tables.length}</p>
          </div>
          <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-4 text-center">
            <span className="text-xs text-rose-600 uppercase font-semibold">Full (Occupied)</span>
            <p className="font-display mt-1 text-2xl font-bold text-rose-700">{fullTablesCount}</p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 text-center">
            <span className="text-xs text-emerald-600 uppercase font-semibold">Empty (Available)</span>
            <p className="font-display mt-1 text-2xl font-bold text-emerald-700">{emptyTablesCount}</p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 text-center">
            <span className="text-xs text-amber-700 uppercase font-semibold">Occupancy Rate</span>
            <p className="font-display mt-1 text-2xl font-bold text-slate-900">{occupancyPercentage}</p>
          </div>
        </div>
      </section>

      {/* Team Messages */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Communications</span>
            <h3 className="font-display text-lg font-bold text-slate-900">Owner and Team Updates</h3>
          </div>
          <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            Live
          </span>
        </div>

        <form onSubmit={handleMessageSubmit} className="mb-4 grid gap-3 md:grid-cols-[1fr_1.5fr_auto]">
          <select
            value={recipientId}
            onChange={(event) => setRecipientId(event.target.value)}
            className="rounded-2xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-none transition focus:border-amber-500 focus:bg-white cursor-pointer"
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
            className="rounded-2xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-none transition focus:border-amber-500 focus:bg-white"
            placeholder="Send a quick update to your team"
          />
          <button
            type="submit"
            className="rounded-2xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-amber-500/20 transition hover:brightness-105 active:scale-[0.99] cursor-pointer"
          >
            Send
          </button>
        </form>

        <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
          {managerMessages.length === 0 ? (
            <p className="py-4 text-center text-xs text-slate-400">No team messages yet.</p>
          ) : (
            managerMessages.map((message) => (
              <div key={message._id || message.id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-bold text-slate-900">
                    {message.senderName || 'System'} → {message.recipientName || 'Team'}
                  </p>
                  <span className="rounded-md bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-600 border border-slate-200">
                    {message.senderRole || 'team'}
                  </span>
                </div>
                <p className="mt-1 text-slate-600">{message.content}</p>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );

  const renderTeam = () => {
    const filteredTeam = teamMembers.filter((m) => {
      if (teamCategoryFilter === 'all') return true;
      if (teamCategoryFilter === 'chef') return m.staffCategory === 'chef';
      if (teamCategoryFilter === 'waiter') return m.staffCategory === 'waiter' || (!m.staffCategory && m.role === 'staff');
      if (teamCategoryFilter === 'cleaning') return m.staffCategory === 'cleaning';
      return true;
    });

    return (
      <div className="space-y-6">
        {/* Team Operations Summary Cards */}
        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800">Kitchen Chef Unit</span>
              <ChefHat size={18} className="text-amber-700" />
            </div>
            <p className="font-display text-3xl font-black text-slate-900">{chefStaff.length}</p>
            <p className="text-xs text-slate-500 mt-1">
              {preparingOrders.length} order{preparingOrders.length === 1 ? '' : 's'} cooking • {teamLoadMetrics.kitchenLoadPercent}% load
            </p>
          </div>

          <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">Service Waiter Unit</span>
              <UtensilsCrossed size={18} className="text-emerald-700" />
            </div>
            <p className="font-display text-3xl font-black text-slate-900">{waiterStaff.length}</p>
            <p className="text-xs text-slate-500 mt-1">
              {waiterMetrics.completionRate}% completion rate • {readyOrders.length} awaiting serve
            </p>
          </div>

          <div className="rounded-3xl border border-sky-200 bg-sky-50 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-800">Housekeeping Unit</span>
              <Sparkles size={18} className="text-sky-700" />
            </div>
            <p className="font-display text-3xl font-black text-slate-900">{cleaningStaff.length}</p>
            <p className="text-xs text-slate-500 mt-1">
              {needsCleaningCount} table{needsCleaningCount === 1 ? '' : 's'} need sanitization
            </p>
          </div>
        </section>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Filter Category:</span>
            {[
              { id: 'all', label: `All Staff (${teamMembers.length})` },
              { id: 'chef', label: `Chefs (${chefStaff.length})` },
              { id: 'waiter', label: `Waiters (${waiterStaff.length})` },
              { id: 'cleaning', label: `Cleaning (${cleaningStaff.length})` }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTeamCategoryFilter(tab.id)}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                  teamCategoryFilter === tab.id
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Staff Roster Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTeam.map((member) => {
            const isChef = member.staffCategory === 'chef';
            const isWaiter = member.staffCategory === 'waiter' || (!member.staffCategory && member.role === 'staff');
            const isCleaning = member.staffCategory === 'cleaning';

            const deliveredByMember = isWaiter
              ? completedOrders.filter((o) => (o.servedBy || '').toLowerCase().includes(member.name.toLowerCase())).length
              : 0;

            const preparedByMember = isChef
              ? orders.filter((o) => (o.preparedBy || '').toLowerCase().includes(member.name.toLowerCase())).length
              : 0;

            return (
              <div key={member.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs transition hover:shadow-md hover:border-amber-400">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-11 w-11 rounded-2xl flex items-center justify-center font-black text-sm ${
                      isChef
                        ? 'bg-amber-100 text-amber-800'
                        : isWaiter
                        ? 'bg-emerald-100 text-emerald-800'
                        : isCleaning
                        ? 'bg-sky-100 text-sky-800'
                        : 'bg-slate-100 text-slate-800'
                    }`}>
                      {member.name?.[0] || 'S'}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{member.name}</p>
                      <p className="text-[11px] text-slate-400 truncate max-w-[160px]">{member.email}</p>
                    </div>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
                    isChef
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : isWaiter
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : isCleaning
                      ? 'bg-sky-50 text-sky-800 border-sky-200'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}>
                    {member.staffCategory || member.role}
                  </span>
                </div>

                <div className="mt-4 border-t border-slate-100 pt-3 space-y-1.5 text-xs">
                  {isChef && (
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Kitchen Responsibilities:</span>
                      <strong className="text-amber-700">{preparedByMember} Prepared</strong>
                    </div>
                  )}
                  {isWaiter && (
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Orders Served to Tables:</span>
                      <strong className="text-emerald-700">{deliveredByMember} Completed</strong>
                    </div>
                  )}
                  {isCleaning && (
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Sanitization Station:</span>
                      <strong className="text-sky-700">Floors & Bartan</strong>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Joined: {member.joiningDate || 'Active'}</span>
                    <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> On Duty
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderCustomers = () => (
    <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      <form onSubmit={handleCustomerSubmit} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="font-display text-lg font-bold text-slate-900 mb-1">Create Guest & Assign Table</h3>
        <p className="text-xs text-slate-500 mb-4">Assign guest name, email, and choose from 50 hotel tables.</p>
        <div className="space-y-3">
          <input
            required
            value={newCustomer.name}
            onChange={(event) => setNewCustomer({ ...newCustomer, name: event.target.value })}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-amber-500 focus:bg-white"
            placeholder="Customer name"
          />
          <input
            required
            type="email"
            value={newCustomer.email}
            onChange={(event) => setNewCustomer({ ...newCustomer, email: event.target.value })}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-amber-500 focus:bg-white"
            placeholder="Customer email"
          />
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">Select Table (1 - 50)</label>
            <select
              value={newCustomer.tableNumber}
              onChange={(event) => setNewCustomer({ ...newCustomer, tableNumber: event.target.value })}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-amber-500 focus:bg-white cursor-pointer"
            >
              <optgroup label="2 Persons (Tables 1 - 10)">
                {HOTEL_TABLES.filter((t) => t.capacity === 2).map((t) => {
                  const occupied = tableStatusList.find((st) => st.number === t.number)?.isFull;
                  return (
                    <option key={t.number} value={t.number}>
                      Table #{t.number} ({t.category}) {occupied ? '— [FULL]' : '— [EMPTY]'}
                    </option>
                  );
                })}
              </optgroup>
              <optgroup label="4 Persons (Tables 11 - 20)">
                {HOTEL_TABLES.filter((t) => t.capacity === 4).map((t) => {
                  const occupied = tableStatusList.find((st) => st.number === t.number)?.isFull;
                  return (
                    <option key={t.number} value={t.number}>
                      Table #{t.number} ({t.category}) {occupied ? '— [FULL]' : '— [EMPTY]'}
                    </option>
                  );
                })}
              </optgroup>
              <optgroup label="6 Persons (Tables 21 - 30)">
                {HOTEL_TABLES.filter((t) => t.capacity === 6).map((t) => {
                  const occupied = tableStatusList.find((st) => st.number === t.number)?.isFull;
                  return (
                    <option key={t.number} value={t.number}>
                      Table #{t.number} ({t.category}) {occupied ? '— [FULL]' : '— [EMPTY]'}
                    </option>
                  );
                })}
              </optgroup>
              <optgroup label="12 Persons (Tables 31 - 40)">
                {HOTEL_TABLES.filter((t) => t.capacity === 12).map((t) => {
                  const occupied = tableStatusList.find((st) => st.number === t.number)?.isFull;
                  return (
                    <option key={t.number} value={t.number}>
                      Table #{t.number} ({t.category}) {occupied ? '— [FULL]' : '— [EMPTY]'}
                    </option>
                  );
                })}
              </optgroup>
              <optgroup label="16 Persons (Tables 41 - 50)">
                {tables.filter((t) => t.capacity === 16 && !t.isExtra && t.number <= 50).map((t) => {
                  const occupied = tableStatusList.find((st) => st.number === t.number)?.isFull;
                  return (
                    <option key={t.number} value={t.number}>
                      Table #{t.number} ({t.category}) {occupied ? '— [FULL]' : '— [EMPTY]'}
                    </option>
                  );
                })}
              </optgroup>
              {tables.filter((t) => t.isExtra || t.number > 50).length > 0 && (
                <optgroup label="Extra Tables (Set by Manager)">
                  {tables.filter((t) => t.isExtra || t.number > 50).map((t) => {
                    const occupied = tableStatusList.find((st) => st.number === t.number)?.isFull;
                    return (
                      <option key={t.number} value={t.number}>
                        Table #{t.number} ({t.category}) {occupied ? '— [FULL]' : '— [EMPTY]'}
                      </option>
                    );
                  })}
                </optgroup>
              )}
            </select>
          </div>
        </div>
        <button
          type="submit"
          className="mt-5 w-full rounded-2xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 py-3 text-sm font-bold text-white shadow-md shadow-amber-500/20 transition hover:brightness-105 active:scale-[0.99] cursor-pointer"
        >
          Create Account & Assign Table
        </button>
      </form>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h4 className="font-display font-bold text-slate-900 text-sm mb-3">Registered Guests Roster ({customers.length})</h4>
        <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
          {customers.map((customer) => (
            <div key={customer.id} className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-3.5 transition hover:bg-white hover:shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900 text-sm">{customer.name}</p>
                  <p className="text-xs text-slate-500">{customer.email}</p>
                </div>
                <span className="rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                  Table #{customer.tableNumber}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderBilling = () => (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="font-display text-lg font-bold text-slate-900 mb-2">Billing & Order Overview</h3>
        {selectedOrder ? (
          <div className="invoice-print-area mt-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            {/* Header */}
            <div className="flex flex-col gap-2 border-b border-slate-200 pb-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 text-white font-extrabold text-xs">
                    RP
                  </span>
                  <p className="text-base font-black text-slate-900 font-display">Royal Plaza Hotel Surat</p>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">Ring Road, Surat, Gujarat 395002 · GSTIN: 24AAACR1234F1Z9</p>
              </div>
              <div className="text-xs text-slate-600 sm:text-right space-y-0.5">
                <div className="flex items-center sm:justify-end gap-2">
                  <span className="font-extrabold text-slate-900 text-sm">Tax Invoice</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                    String(selectedOrder.paymentStatus || '').toLowerCase() === 'paid'
                      ? 'border border-emerald-500/20 bg-emerald-50 text-emerald-700'
                      : 'border border-amber-200 bg-amber-50 text-amber-700'
                  }`}>
                    {String(selectedOrder.paymentStatus || '').toLowerCase() === 'paid' ? 'PAID' : 'PENDING'}
                  </span>
                </div>
                <p><strong className="text-slate-700">Order ID:</strong> #{String(selectedOrder.id || selectedOrder._id || '').slice(-6)}</p>
                <p><strong className="text-slate-700">Table:</strong> Table #{selectedOrder.tableNumber}</p>
              </div>
            </div>

            {(() => {
              const customerEmail = selectedOrder.userEmail || customers?.find((c) => (c.name && c.name.toLowerCase() === (selectedOrder.customerName || '').toLowerCase()) || Number(c.tableNumber) === Number(selectedOrder.tableNumber))?.email || 'customer@guest.com';
              return (
                <div className="my-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                  <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Customer</span>
                    <span className="font-bold text-slate-900 truncate block">{selectedOrder.customerName || 'Guest'}</span>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Customer Email ID</span>
                    <span className="font-bold text-slate-900 truncate block" title={customerEmail}>{customerEmail}</span>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Table No.</span>
                    <span className="font-bold text-slate-900 block">Table #{selectedOrder.tableNumber || 'N/A'}</span>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Payment Status</span>
                    <span className={`font-bold block ${String(selectedOrder.paymentStatus || '').toLowerCase() === 'paid' ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {String(selectedOrder.paymentStatus || '').toLowerCase() === 'paid' ? 'Paid & Settled' : 'Payment Due'}
                    </span>
                  </div>
                </div>
              );
            })()}

            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="min-w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase">
                  <tr>
                    <th className="px-4 py-2">Dish Item</th>
                    <th className="px-4 py-2 text-center">Qty</th>
                    <th className="px-4 py-2 text-right">Price</th>
                    <th className="px-4 py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100 text-slate-700">
                  {(selectedOrder.items || []).map((item, index) => (
                    <tr key={`${item.name}-${index}`}>
                      <td className="px-4 py-2 font-medium">{item.name}</td>
                      <td className="px-4 py-2 text-center">{item.qty}</td>
                      <td className="px-4 py-2 text-right">₹{item.price}</td>
                      <td className="px-4 py-2 text-right font-bold">₹{item.qty * item.price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 border-t border-slate-200 pt-3 flex items-center justify-between text-base font-black text-slate-900 font-display">
              <span className="text-sm font-bold text-slate-700">Grand Total:</span>
              <span className="text-xl text-amber-700 font-extrabold">₹{selectedOrder.total}</span>
            </div>

            {/* Official Hotel UPI QR Settlement (Scan to Pay with GPay/PhonePe/Paytm/BHIM) */}
            <div className="mt-4 rounded-2xl border border-emerald-300/80 bg-emerald-50/50 p-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=${encodeURIComponent(`upi://pay?pa=9712071875@ptsbi&pn=Royal%20Plaza%20Hotel&am=${Number(selectedOrder.total || 0).toFixed(2)}&cu=INR&tn=Order%20${String(selectedOrder.id || selectedOrder._id || '').slice(-6)}`)}`}
                    alt="UPI Payment QR Code"
                    className="h-24 w-24 rounded-xl border border-emerald-300 bg-white p-1.5 shadow-xs shrink-0"
                  />
                  <div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                      ★ Official UPI QR Payment
                    </span>
                    <p className="mt-1 font-mono text-xs font-bold text-slate-800 select-all">
                      9712071875@ptsbi
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Royal Plaza Hotel • Scan with Google Pay, PhonePe, Paytm, BHIM
                    </p>
                    <p className="mt-0.5 text-xs font-bold text-emerald-700">
                      Bill Amount: ₹{selectedOrder.total}
                    </p>
                  </div>
                </div>
                <div className="print:hidden flex flex-col gap-1.5 w-full sm:w-auto">
                  <a
                    href={`upi://pay?pa=9712071875@ptsbi&pn=Royal%20Plaza%20Hotel&am=${Number(selectedOrder.total || 0).toFixed(2)}&cu=INR&tn=Order%20${String(selectedOrder.id || selectedOrder._id || '').slice(-6)}`}
                    className="inline-flex items-center justify-center gap-1 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-xs text-center"
                  >
                    Open in UPI App
                  </a>
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 print:hidden">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-slate-100 px-3.5 py-2 text-xs font-bold text-slate-800 hover:bg-slate-200 transition cursor-pointer"
              >
                <Printer size={14} />
                <span>Print Official Bill (Single Page)</span>
              </button>

              {String(selectedOrder.paymentStatus || '').toLowerCase() !== 'paid' && onPaymentCompleted && (
                <button
                  type="button"
                  onClick={() => onPaymentCompleted(selectedOrder)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition cursor-pointer"
                >
                  <CheckCircle2 size={14} />
                  <span>Mark Paid & Vacate Table ✓</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <p className="py-12 text-center text-xs text-slate-400">Select an order on the right to inspect bill details.</p>
        )}
      </div>

      <div className="space-y-3">
        <h4 className="font-display font-bold text-slate-900 text-sm px-1">Orders List ({orders.length})</h4>
        <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
          {(orders || []).map((order) => (
            <button
              key={order.id || order._id}
              onClick={() => onSelectOrder && onSelectOrder(order.id || order._id)}
              className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-amber-400 hover:shadow-md cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900 text-sm">{order.customerName}</p>
                  <p className="text-xs text-slate-500">Order #{String(order.id || order._id || '').slice(-6)} • Table #{order.tableNumber}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                    String(order.paymentStatus || '').toLowerCase() === 'paid'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {String(order.paymentStatus || '').toLowerCase() === 'paid' ? 'Paid' : 'Pending'}
                  </span>
                  <span className="font-display font-bold text-slate-900 text-xs">
                    ₹{order.total}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeView) {
      case 'tables':
        return renderTables();
      case 'team':
        return renderTeam();
      case 'customers':
        return renderCustomers();
      case 'billing':
        return renderBilling();
      case 'overview':
      default:
        return renderOverview();
    }
  };

  return renderContent();
}
