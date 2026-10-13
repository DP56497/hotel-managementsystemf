import { motion } from 'framer-motion';
import { Building2, Camera, CheckCircle2, CircleDollarSign, CreditCard, Crown, DollarSign, Eye, FileText, MessageSquare, Plus, Printer, Receipt, RefreshCw, Search, Sparkles, Trash2, TrendingDown, TrendingUp, Users, Video, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { formatCurrency, getRevenueSummary } from '../utils/revenue';

const extraItemPresets = [
  { name: 'Extra Tawa Roti', price: 15, stock: 50, image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&auto=format&fit=crop&q=80' },
  { name: 'Extra Butter Roti', price: 20, stock: 50, image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&auto=format&fit=crop&q=80' },
  { name: 'Roasted Papad', price: 20, stock: 50, image: 'https://plus.unsplash.com/premium_photo-1697730398251-40cd8dc57e0b?w=500&auto=format&fit=crop&q=80' },
  { name: 'Masala Papad', price: 40, stock: 40, image: 'https://plus.unsplash.com/premium_photo-1697730398251-40cd8dc57e0b?w=500&auto=format&fit=crop&q=80' },
  { name: 'Masala Chaas', price: 25, stock: 60, image: 'https://plus.unsplash.com/premium_photo-1698500034742-098f7fc04163?w=500&auto=format&fit=crop&q=80' },
  { name: 'Extra Puri (4 Pcs)', price: 40, stock: 40, image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500&auto=format&fit=crop&q=80' },
  { name: 'Green Salad', price: 50, stock: 35, image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&auto=format&fit=crop&q=80' },
  { name: 'Extra Pav (2 Pcs)', price: 25, stock: 50, image: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=500&auto=format&fit=crop&q=80' },
  { name: 'Curd / Plain Dahi', price: 30, stock: 40, image: 'https://images.unsplash.com/photo-1588710929895-46b7264811a9?w=500&auto=format&fit=crop&q=80' },
  { name: 'Steamed Jeera Rice', price: 90, stock: 30, image: 'https://plus.unsplash.com/premium_photo-1695182186010-71cbb7c6d5b5?w=500&auto=format&fit=crop&q=80' }
];

const expensePresets = [
  { category: 'Groceries & Fresh Vegetables', amount: 3500, period: 'daily', label: '🥬 Daily Sabzi & Groceries' },
  { category: 'Dairy, Milk & Spices', amount: 1800, period: 'daily', label: '🥛 Fresh Dairy & Milk' },
  { category: 'Commercial LPG Gas Cylinders', amount: 4800, period: 'weekly', label: '⚡ Commercial LPG Gas' },
  { category: 'Kitchen & Service Staff Salaries', amount: 30000, period: 'monthly', label: '👨‍🍳 Staff Payroll' },
  { category: 'Cleaning & Sanitizing Supplies', amount: 1200, period: 'weekly', label: '🧹 Table Sanitizers & Detergents' },
  { category: 'Kitchen Bartan & Stove Repair', amount: 2200, period: 'monthly', label: '🛠️ Equipment Maintenance' },
  { category: 'Electricity & Utility Bills', amount: 8500, period: 'monthly', label: '💡 Electricity & Water' },
  { category: 'Linen, Tablecloths & Napkins', amount: 1500, period: 'monthly', label: '🧺 Laundry & Linen' }
];

export default function OwnerDashboard({ activeView, setActiveView, hotels, accounts, menuItems, customers, orders, analytics, inventory, expenses, messages, selectedOrder, onAddAccount, onDeleteAccount, onAddMenuItem, onDeleteMenuItem, onCreateCustomer, onSelectOrder, onDeleteOrder, onSendMessage, onAddExpense, onDeleteExpense }) {
  const [newAccount, setNewAccount] = useState({ name: '', email: '', role: 'manager', staffCategory: 'waiter', aadhaarNumber: '', faceImage: '' });
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [newMenuItem, setNewMenuItem] = useState({ name: '', category: 'Gujarati Dish', price: '', image: '', stock: '' });
  const [menuFilterCategory, setMenuFilterCategory] = useState('All');
  const [newCustomer, setNewCustomer] = useState({ name: '', email: '', category: 'Customer', tableNumber: '' });
  const [recipientId, setRecipientId] = useState('');
  const [recipientRole, setRecipientRole] = useState('manager');
  const [messageContent, setMessageContent] = useState('');
  const [newExpense, setNewExpense] = useState({ category: '', amount: '', period: 'monthly', date: new Date().toISOString().slice(0, 10) });

  const [revenuePeriod, setRevenuePeriod] = useState('today');
  const [invoiceOrderId, setInvoiceOrderId] = useState(null);
  const [selectedMessageRecipientId, setSelectedMessageRecipientId] = useState('all');
  const [expenseFilterCategory, setExpenseFilterCategory] = useState('All');
  const [expensePeriodFilter, setExpensePeriodFilter] = useState('all');
  const [expenseSearch, setExpenseSearch] = useState('');

  const teamMembers = accounts.filter((account) => ['manager', 'staff'].includes(account.role));
  const managers = teamMembers.filter((member) => member.role === 'manager');
  const staffMembers = teamMembers.filter((member) => member.role === 'staff');
  const revenueSummary = useMemo(() => getRevenueSummary(orders, revenuePeriod), [orders, revenuePeriod]);
  const revenue = formatCurrency(revenueSummary.total);
  const activeOrders = orders.filter((order) => !['Completed', 'Cancelled'].includes(order.status));
  const occupiedTables = new Set(activeOrders.map((order) => order.tableNumber).filter(Boolean));
  const totalTables = 20;
  const occupancy = `${Math.min(100, Math.round((occupiedTables.size / totalTables) * 100))}%`;
  const totalExpenses = expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  const netRevenue = revenueSummary.total - totalExpenses;
  const profitMargin = revenueSummary.total > 0
    ? Math.round(((revenueSummary.total - totalExpenses) / revenueSummary.total) * 100)
    : 0;

  const filteredMessages = useMemo(() => {
    if (selectedMessageRecipientId === 'all') {
      return messages;
    }
    const targetId = String(selectedMessageRecipientId);
    return messages.filter(
      (m) => String(m.senderId) === targetId || String(m.recipientId) === targetId
    );
  }, [messages, selectedMessageRecipientId]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => {
      const cat = (expense.category || '').toLowerCase();
      const matchesCategory =
        expenseFilterCategory === 'All' ||
        cat.includes(expenseFilterCategory.toLowerCase());
      const matchesPeriod =
        expensePeriodFilter === 'all' ||
        (expense.period || '').toLowerCase() === expensePeriodFilter.toLowerCase();
      const matchesSearch =
        !expenseSearch.trim() ||
        cat.includes(expenseSearch.toLowerCase()) ||
        String(expense.amount || '').includes(expenseSearch.trim());
      return matchesCategory && matchesPeriod && matchesSearch;
    });
  }, [expenses, expenseFilterCategory, expensePeriodFilter, expenseSearch]);

  const filteredExpensesTotal = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  }, [filteredExpenses]);

  const recentMessages = messages.slice(0, 5);
  const recipientOptions = teamMembers.map((member) => ({ id: member.id, name: member.name, role: member.role }));

  const startCamera = async () => {
    setCameraError('');
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Camera is not supported on this device. Please use photo upload.');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
      });
      streamRef.current = stream;
      setIsCameraActive(true);
    } catch (err) {
      console.error('Camera access error:', err);
      setCameraError('Camera access denied or unavailable. You can also upload a photo below.');
      setIsCameraActive(false);
    }
  };

  useEffect(() => {
    if (isCameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [isCameraActive]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = 360;
    canvas.height = 360;
    const ctx = canvas.getContext('2d');
    const width = video.videoWidth || 360;
    const height = video.videoHeight || 360;
    const size = Math.min(width, height);
    const startX = (width - size) / 2;
    const startY = (height - size) / 2;
    ctx.drawImage(video, startX, startY, size, size, 0, 0, 360, 360);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
    setNewAccount((prev) => ({ ...prev, faceImage: dataUrl }));
    stopCamera();
  };

  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 360;
        canvas.height = 360;
        const ctx = canvas.getContext('2d');
        const size = Math.min(img.width, img.height);
        const startX = (img.width - size) / 2;
        const startY = (img.height - size) / 2;
        ctx.drawImage(img, startX, startY, size, size, 0, 0, 360, 360);
        setNewAccount((prev) => ({ ...prev, faceImage: canvas.toDataURL('image/jpeg', 0.88) }));
      };
      img.src = loadEvent.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleAccountSubmit = (event) => {
    event.preventDefault();
    if (!newAccount.name.trim() || !newAccount.email.trim()) {
      alert('Please provide Name and Email');
      return;
    }
    stopCamera();
    onAddAccount({ ...newAccount, hotelId: hotels[0]?.id || 1, hotelName: hotels[0]?.name || 'Royal Plaza Hotel Surat' });
    setNewAccount({ name: '', email: '', role: 'manager', staffCategory: 'waiter', aadhaarNumber: '', faceImage: '' });
  };

  const handleFoodImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setNewMenuItem((prev) => ({ ...prev, image: e.target.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleMenuSubmit = (event) => {
    event.preventDefault();
    if (!newMenuItem.name.trim() || !newMenuItem.price) return;
    const defaultImages = {
      'Gujarati Dish': 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=500&auto=format&fit=crop&q=80',
      'South Indian Dish': 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=500&auto=format&fit=crop&q=80',
      'Chinese Dish': 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=500&auto=format&fit=crop&q=80',
      'Punjabi Dish': 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=500&auto=format&fit=crop&q=80',
      'Extra Item': 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&auto=format&fit=crop&q=80'
    };
    onAddMenuItem({
      name: newMenuItem.name.trim(),
      category: newMenuItem.category,
      price: Number(newMenuItem.price) || 0,
      image: newMenuItem.image?.trim() || defaultImages[newMenuItem.category] || defaultImages['Gujarati Dish'],
      stock: Number(newMenuItem.stock) || 15
    });
    setNewMenuItem({ name: '', category: newMenuItem.category, price: '', image: '', stock: '' });
  };

  const handleCustomerSubmit = (event) => {
    event.preventDefault();
    onCreateCustomer({ ...newCustomer, tableNumber: Number(newCustomer.tableNumber) || 1 });
    setNewCustomer({ name: '', email: '', category: 'Customer', tableNumber: '' });
  };

  const handleMessageSubmit = (event) => {
    event.preventDefault();
    const recipient = teamMembers.find((member) => String(member.id) === String(recipientId));
    if (!recipient || !messageContent.trim()) return;
    onSendMessage(recipient.id, recipient.name, recipient.role, messageContent.trim());
    setMessageContent('');
  };

  const handleExpenseSubmit = async (event) => {
    event.preventDefault();
    if (!newExpense.category.trim() || Number(newExpense.amount) <= 0) return;
    await onAddExpense({ ...newExpense, category: newExpense.category.trim(), amount: Number(newExpense.amount) });
    setNewExpense({ category: '', amount: '', period: 'monthly', date: new Date().toISOString().slice(0, 10) });
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Metric Cards Banner */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Revenue Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Gross Revenue</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20">
              <CircleDollarSign size={18} />
            </div>
          </div>
          <p className="font-display text-3xl font-extrabold text-slate-900">{revenue}</p>
          <div className="mt-3 flex items-center gap-1.5 rounded-xl bg-slate-100 p-1 border border-slate-200/80">
            {['today', 'month', 'year'].map((period) => (
              <button
                key={period}
                onClick={() => setRevenuePeriod(period)}
                className={`flex-1 rounded-lg py-1 text-[11px] font-bold transition-all cursor-pointer ${
                  revenuePeriod === period
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {period === 'today' ? 'Today' : period === 'month' ? 'Monthly' : 'Yearly'}
              </button>
            ))}
          </div>
          <p className="mt-2.5 text-[11px] font-medium text-slate-500">
            {revenueSummary.count} orders registered • {revenueSummary.label}
          </p>
        </motion.div>

        {/* Occupancy Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Live Occupancy</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 border border-indigo-500/20">
              <Building2 size={18} />
            </div>
          </div>
          <p className="font-display text-3xl font-extrabold text-slate-900">{occupancy}</p>
          <div className="mt-3.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-blue-600 transition-all duration-500"
              style={{ width: occupancy }}
            />
          </div>
          <p className="mt-2.5 text-[11px] font-medium text-slate-500">
            {occupiedTables.size} active tables occupied
          </p>
        </motion.div>

        {/* Managers Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Managers</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 border border-blue-500/20">
              <Crown size={18} />
            </div>
          </div>
          <p className="font-display text-3xl font-extrabold text-slate-900">{managers.length}</p>
          <div className="mt-3.5 flex items-center gap-1.5 text-xs font-semibold text-blue-700">
            <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
            <span>Floor supervision active</span>
          </div>
          <p className="mt-2 text-[11px] font-medium text-slate-500">Supervising all operations</p>
        </motion.div>

        {/* Staff Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Hospitality Staff</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              <Users size={18} />
            </div>
          </div>
          <p className="font-display text-3xl font-extrabold text-slate-900">{staffMembers.length}</p>
          <div className="mt-3.5 flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Kitchen & Waiters live</span>
          </div>
          <p className="mt-2 text-[11px] font-medium text-slate-500">Chefs, Waiters & Floor crew</p>
        </motion.div>
      </section>

      {/* Expenses & Financial Summary Section */}
      <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        {/* Add Cost Form */}
        <form onSubmit={handleExpenseSubmit} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-display text-lg font-bold text-slate-900">Record Hotel Cost</h2>
            <span className="rounded-full bg-amber-50 border border-amber-200/60 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800">Operational</span>
          </div>
          <p className="text-xs text-slate-500">Track facility, inventory, maintenance, electricity, or kitchen costs.</p>
          
          <div className="mt-4 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Cost Category</label>
              <input
                required
                value={newExpense.category}
                onChange={(event) => setNewExpense({ ...newExpense, category: event.target.value })}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20"
                placeholder="e.g. Daily Fresh Vegetables or Gas Cylinder"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Amount (INR ₹)</label>
              <input
                required
                type="number"
                min="1"
                value={newExpense.amount}
                onChange={(event) => setNewExpense({ ...newExpense, amount: event.target.value })}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20"
                placeholder="e.g. 2500"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Frequency</label>
                <select
                  value={newExpense.period}
                  onChange={(event) => setNewExpense({ ...newExpense, period: event.target.value })}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-sm font-medium text-slate-800 outline-none transition focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20 cursor-pointer"
                >
                  {['daily', 'weekly', 'monthly', 'yearly'].map((period) => (
                    <option key={period} value={period}>{period[0].toUpperCase() + period.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
                <input
                  required
                  type="date"
                  value={newExpense.date}
                  onChange={(event) => setNewExpense({ ...newExpense, date: event.target.value })}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20 cursor-pointer"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="mt-5 flex items-center justify-center gap-2 w-full rounded-2xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 py-3 text-sm font-bold text-white shadow-md shadow-amber-500/20 transition hover:brightness-105 active:scale-[0.99] cursor-pointer"
          >
            <Plus size={16} />
            <span>Add Operating Cost</span>
          </button>
        </form>

        {/* Net Revenue & Costs Breakdown */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Executive P&L</span>
                <h2 className="font-display text-xl font-bold text-slate-900 mt-0.5">Net Revenue After Costs</h2>
              </div>
              <div className="text-right">
                <span className="text-xs font-medium text-slate-500">Total Costs Logged</span>
                <p className="font-display text-base font-bold text-rose-600">{formatCurrency(totalExpenses)}</p>
              </div>
            </div>

            <div className="mt-4">
              <p className={`font-display text-4xl font-black ${netRevenue >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                {formatCurrency(netRevenue)}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Calculated from {revenueSummary.label.toLowerCase()} revenue minus total recorded expenses
              </p>
            </div>

            <div className="mt-5 space-y-2 max-h-56 overflow-y-auto pr-1">
              {expenses.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 py-8 text-center text-xs text-slate-400">
                  No hotel costs recorded yet. Added operational expenses will appear here.
                </div>
              ) : (
                expenses.map((expense) => {
                  const expenseId = expense._id || expense.id;
                  return (
                    <div
                      key={expenseId}
                      className="group flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 px-3.5 py-2 text-xs transition hover:bg-white hover:shadow-sm"
                    >
                      <div>
                        <span className="font-semibold text-slate-800">{expense.category}</span>
                        <span className="ml-2 text-[10px] text-slate-500 capitalize rounded-md bg-slate-200/80 px-1.5 py-0.5">{expense.period}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-slate-900">{formatCurrency(expense.amount)}</span>
                        {onDeleteExpense && (
                          <button
                            type="button"
                            onClick={() => onDeleteExpense(expenseId)}
                            title="Remove cost"
                            className="text-slate-400 opacity-60 hover:opacity-100 hover:text-rose-600 transition cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Financial health indicator</span>
            <span className={`font-bold px-2 py-0.5 rounded-full text-[11px] ${netRevenue >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
              {netRevenue >= 0 ? 'Profitable Operations' : 'Deficit Watch'}
            </span>
          </div>
        </div>
      </section>

      {/* Internal Staff & Manager Messaging */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Team Communication</span>
            <h3 className="font-display text-lg font-bold text-slate-900">Direct Staff & Manager Channels</h3>
          </div>
          <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            Live DB Synced
          </span>
        </div>

        {/* Recipient Filter Tabs for Separate Conversation Threads */}
        <div className="mb-5">
          <label className="block text-xs font-semibold text-slate-700 mb-2">Separate Staff Threads & Direct Channels:</label>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setSelectedMessageRecipientId('all');
                setRecipientId('');
              }}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition cursor-pointer border ${
                selectedMessageRecipientId === 'all'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                  : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
              }`}
            >
              🌐 All Threads ({messages.length})
            </button>
            {teamMembers.map((member) => {
              const memberId = String(member.id);
              const isSelected = String(selectedMessageRecipientId) === memberId;
              const threadCount = messages.filter(
                (m) => String(m.senderId) === memberId || String(m.recipientId) === memberId
              ).length;
              const icon = member.role === 'manager'
                ? '👔'
                : member.staffCategory === 'chef'
                  ? '🍳'
                  : member.staffCategory === 'cleaning'
                    ? '🧹'
                    : '🍽️';

              return (
                <button
                  key={member.id}
                  type="button"
                  onClick={() => {
                    setSelectedMessageRecipientId(member.id);
                    setRecipientId(String(member.id));
                    setRecipientRole(member.role);
                  }}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition cursor-pointer border flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-amber-400 hover:bg-amber-50/50'
                  }`}
                >
                  <span>{icon}</span>
                  <span>{member.name}</span>
                  <span className={`text-[10px] rounded-full px-1.5 py-0.2 ${
                    isSelected ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {threadCount}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <form onSubmit={handleMessageSubmit} className="grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Target Recipient</label>
              <select
                value={recipientId}
                onChange={(event) => {
                  setRecipientId(event.target.value);
                  setSelectedMessageRecipientId(event.target.value || 'all');
                }}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-sm font-medium text-slate-800 outline-none transition focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20 cursor-pointer"
              >
                <option value="">Select manager or staff</option>
                {recipientOptions.map((recipient) => (
                  <option key={recipient.id} value={recipient.id}>{`${recipient.name} — ${recipient.role}`}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Message Content</label>
              <textarea
                value={messageContent}
                onChange={(event) => setMessageContent(event.target.value)}
                rows="4"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20"
                placeholder="Share priority guidelines, urgent table requests, or operational notices."
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-2xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 py-2.5 text-xs font-bold text-white shadow-md shadow-amber-500/20 transition hover:brightness-105 active:scale-[0.99] cursor-pointer"
            >
              Transmit Message
            </button>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3 border-b border-slate-200/60 pb-2">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  {selectedMessageRecipientId === 'all'
                    ? 'All Live Messages'
                    : `Thread: ${teamMembers.find((m) => String(m.id) === String(selectedMessageRecipientId))?.name || 'Selected Staff'}`}
                </p>
                <span className="text-[10px] font-semibold text-slate-400">
                  {filteredMessages.length} in DB
                </span>
              </div>
              <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                {filteredMessages.length === 0 ? (
                  <p className="py-8 text-center text-xs text-slate-400">No messages in this conversation thread yet.</p>
                ) : (
                  filteredMessages.map((message) => {
                    const isOwn = String(message.senderId) === String(window.localStorage.getItem('userId') || '');
                    return (
                      <div
                        key={message._id || message.id}
                        className={`rounded-xl p-3 text-xs shadow-sm border ${
                          isOwn
                            ? 'border-amber-200 bg-amber-50/80 text-slate-800'
                            : 'border-slate-200 bg-white text-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="font-bold text-slate-900">
                            {isOwn ? `To: ${message.recipientName}` : `From: ${message.senderName}`}
                          </span>
                          <span className="rounded-md bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 border border-slate-200 capitalize">
                            {message.senderRole}
                          </span>
                        </div>
                        <p className="text-slate-700">{message.content}</p>
                        <div className="mt-1 flex items-center justify-end text-[10px] text-slate-400">
                          {message.createdAt ? new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </form>
      </section>
    </div>
  );

  const renderHotelSetup = () => (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="font-display text-lg font-bold text-slate-900">Hotel Profile & Configuration</h3>
      <p className="mt-1 text-xs text-slate-500">Active configuration for the Royal Plaza Hotel Surat luxury operations.</p>
      <div className="mt-4 space-y-3">
        {hotels.map((hotel) => (
          <div key={hotel.id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900">{hotel.name}</p>
                <p className="text-xs text-slate-500">{hotel.city}, Gujarat</p>
              </div>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">Live Active</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderMenu = () => {
    const categories = ['All', 'Gujarati Dish', 'South Indian Dish', 'Chinese Dish', 'Punjabi Dish', 'Extra Item'];
    const filteredMenuItems = menuFilterCategory === 'All' 
      ? menuItems 
      : menuItems.filter((item) => item.category === menuFilterCategory);

    const categoryDefaultImage = {
      'Gujarati Dish': 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=500&auto=format&fit=crop&q=80',
      'South Indian Dish': 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=500&auto=format&fit=crop&q=80',
      'Chinese Dish': 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=500&auto=format&fit=crop&q=80',
      'Punjabi Dish': 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=500&auto=format&fit=crop&q=80',
      'Extra Item': 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&auto=format&fit=crop&q=80'
    };

    const currentPreviewImage = newMenuItem.image?.trim() || categoryDefaultImage[newMenuItem.category];

    return (
      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        {/* Create Dish Form */}
        <form onSubmit={handleMenuSubmit} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Menu Management</span>
              <h3 className="font-display text-lg font-bold text-slate-900">Add Vegetarian Dish</h3>
            </div>
            <span className="flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> Pure Veg
            </span>
          </div>
          <p className="text-xs text-slate-500">Ensure premium vegetarian cuisine offerings for Royal Plaza dining guests.</p>
          
          <div className="mt-4 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Dish Name *</label>
              <input
                required
                value={newMenuItem.name}
                onChange={(event) => setNewMenuItem({ ...newMenuItem, name: event.target.value })}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20"
                placeholder="e.g. Shahi Paneer or Dal Baati"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category *</label>
                <select
                  value={newMenuItem.category}
                  onChange={(event) => setNewMenuItem({ ...newMenuItem, category: event.target.value })}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-sm font-medium text-slate-800 outline-none transition focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20 cursor-pointer"
                >
                  {['Gujarati Dish', 'South Indian Dish', 'Chinese Dish', 'Punjabi Dish', 'Extra Item'].map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Price (₹ INR) *</label>
                <input
                  required
                  type="number"
                  min="1"
                  value={newMenuItem.price}
                  onChange={(event) => setNewMenuItem({ ...newMenuItem, price: event.target.value })}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20"
                  placeholder="e.g. 240"
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Stock Quantity</label>
                <input
                  type="number"
                  min="0"
                  value={newMenuItem.stock}
                  onChange={(event) => setNewMenuItem({ ...newMenuItem, stock: event.target.value })}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20"
                  placeholder="Default: 15"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">Dish Photo</label>
                  <label className="text-[11px] font-bold text-amber-600 hover:text-amber-700 cursor-pointer">
                    Upload image
                    <input type="file" accept="image/*" onChange={handleFoodImageUpload} className="hidden" />
                  </label>
                </div>
                <input
                  type="text"
                  value={newMenuItem.image}
                  onChange={(event) => setNewMenuItem({ ...newMenuItem, image: event.target.value })}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20"
                  placeholder="Paste URL or click Upload"
                />
              </div>
            </div>

            {/* Live Dish Photo Preview */}
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-3 flex items-center gap-3">
              <img
                src={currentPreviewImage}
                alt="Preview"
                className="h-14 w-14 rounded-xl object-cover border border-slate-200 shadow-sm shrink-0"
                onError={(e) => { e.currentTarget.src = categoryDefaultImage['Gujarati Dish']; }}
              />
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">{newMenuItem.name || 'Dish Name Preview'}</p>
                <p className="text-[11px] font-semibold text-amber-600">₹{newMenuItem.price || 0}</p>
                <p className="text-[10px] text-slate-400">Live preview with selected category</p>
              </div>
            </div>

            {/* Quick Extra Items Presets */}
            <div className="rounded-2xl border border-amber-200/60 bg-amber-50/40 p-3.5">
              <div className="flex items-center justify-between mb-2">
                <span className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                  <Sparkles size={14} className="text-amber-600" />
                  <span>1-Click Extra Item Presets</span>
                </span>
                <span className="text-[10px] font-semibold text-amber-700 uppercase">Fast Add</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {extraItemPresets.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => {
                      setNewMenuItem({
                        name: preset.name,
                        category: 'Extra Item',
                        price: String(preset.price),
                        image: preset.image,
                        stock: String(preset.stock)
                      });
                    }}
                    className="rounded-lg border border-amber-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 shadow-sm transition hover:border-amber-400 hover:bg-amber-100/60 hover:text-amber-900 active:scale-95 cursor-pointer"
                  >
                    + {preset.name} (₹{preset.price})
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="mt-5 w-full rounded-2xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 py-3 text-sm font-bold text-white shadow-md shadow-amber-500/20 transition hover:brightness-105 active:scale-[0.99] cursor-pointer"
          >
            Publish Dish to Live Menu
          </button>
        </form>

        {/* Menu Catalog List */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Live Catalog</span>
                <h3 className="font-display text-lg font-bold text-slate-900">Hotel Menu ({filteredMenuItems.length} dishes)</h3>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                {menuItems.length} Total
              </span>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setMenuFilterCategory(cat)}
                  className={`rounded-xl px-3 py-1 text-xs font-semibold transition-all cursor-pointer ${
                    menuFilterCategory === cat
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Dish Items List */}
            <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
              {filteredMenuItems.map((item) => (
                <div
                  key={item.id}
                  className="group flex items-center gap-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/60 p-3 transition hover:bg-white hover:border-amber-300 hover:shadow-md"
                >
                  <img
                    src={item.image || categoryDefaultImage[item.category] || categoryDefaultImage['Gujarati Dish']}
                    alt={item.name}
                    referrerPolicy="no-referrer"
                    className="h-14 w-14 rounded-xl object-cover border border-slate-200 shadow-sm shrink-0"
                    onError={(e) => {
                      if (categoryDefaultImage[item.category]) {
                        e.currentTarget.src = categoryDefaultImage[item.category];
                      }
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="truncate">
                        <div className="flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" title="Pure Veg" />
                          <p className="font-bold text-slate-900 text-sm truncate">{item.name}</p>
                        </div>
                        <p className="text-[11px] text-slate-500">{item.category}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-display font-extrabold text-amber-600 text-sm">₹{item.price}</p>
                        <p className="text-[10px] font-medium text-slate-500">Stock: {item.stock}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onDeleteMenuItem(item.id)}
                      className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-rose-500 opacity-60 hover:opacity-100 hover:text-rose-700 transition cursor-pointer"
                    >
                      <Trash2 size={11} /> Remove Dish
                    </button>
                  </div>
                </div>
              ))}
              {filteredMenuItems.length === 0 && (
                <div className="py-12 text-center text-xs text-slate-400">
                  No dishes found in this category filter.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderTeam = () => (
    <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      {/* Create Team Member Card */}
      <form onSubmit={handleAccountSubmit} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Staff & Management</span>
            <h3 className="font-display text-lg font-bold text-slate-900">Add Team Member</h3>
          </div>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">Owner Authority</span>
        </div>
        <p className="text-xs text-slate-500">Create staff or manager accounts with Aadhaar number and facial verification.</p>

        <div className="mt-4 space-y-3">
          <div>
            <label className="block mb-1 text-xs font-semibold text-slate-700">Full Name *</label>
            <input
              required
              value={newAccount.name}
              onChange={(event) => setNewAccount({ ...newAccount, name: event.target.value })}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20"
              placeholder="e.g. Rahul Sharma"
            />
          </div>

          <div>
            <label className="block mb-1 text-xs font-semibold text-slate-700">Work Email *</label>
            <input
              required
              type="email"
              value={newAccount.email}
              onChange={(event) => setNewAccount({ ...newAccount, email: event.target.value })}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20"
              placeholder="e.g. rahul@royalplaza.com"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block mb-1 text-xs font-semibold text-slate-700">Role *</label>
              <select
                value={newAccount.role}
                onChange={(event) => setNewAccount({ ...newAccount, role: event.target.value })}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-sm font-medium text-slate-800 outline-none transition focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20 cursor-pointer"
              >
                <option value="manager">Manager</option>
                <option value="staff">Staff</option>
              </select>
            </div>

            {newAccount.role === 'staff' ? (
              <div>
                <label className="block mb-1 text-xs font-semibold text-slate-700">Staff Category *</label>
                <select
                  value={newAccount.staffCategory}
                  onChange={(event) => setNewAccount({ ...newAccount, staffCategory: event.target.value })}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-sm font-medium text-slate-800 outline-none transition focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20 cursor-pointer"
                >
                  <option value="chef">Chef</option>
                  <option value="cleaning">Cleaning Staff</option>
                  <option value="waiter">Waiter</option>
                </select>
              </div>
            ) : (
              <div>
                <label className="block mb-1 text-xs font-semibold text-slate-700">Department</label>
                <input disabled value="Hotel Floor Operations" className="w-full rounded-2xl border border-slate-200 bg-slate-100 px-3.5 py-2.5 text-sm text-slate-500 cursor-not-allowed" />
              </div>
            )}
          </div>

          {/* Aadhaar Number */}
          <div>
            <label className="block mb-1 text-xs font-semibold text-slate-700">Aadhaar Card Number</label>
            <div className="relative">
              <input
                value={newAccount.aadhaarNumber || ''}
                onChange={(event) => {
                  const val = event.target.value.replace(/\D/g, '').slice(0, 12);
                  const formatted = val.replace(/(\d{4})(?=\d)/g, '$1 ');
                  setNewAccount({ ...newAccount, aadhaarNumber: formatted });
                }}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 pl-10 text-sm text-slate-800 outline-none transition focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20"
                placeholder="XXXX XXXX XXXX (12 digits)"
              />
              <CreditCard size={17} className="absolute left-3.5 top-3 text-amber-600 pointer-events-none" />
            </div>
          </div>

          {/* Face Photo Section */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3.5">
            <div className="flex items-center justify-between mb-2">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                <Camera size={15} className="text-amber-600" /> Facial Verification & Profile Photo
              </span>
              {newAccount.faceImage && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  <CheckCircle2 size={12} className="text-emerald-600" /> Verified
                </span>
              )}
            </div>

            {isCameraActive ? (
              <div className="space-y-3">
                <div className="relative aspect-square max-w-[240px] mx-auto overflow-hidden rounded-2xl border-2 border-amber-500 bg-slate-950 shadow-inner">
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                  <div className="pointer-events-none absolute inset-3 rounded-full border-2 border-dashed border-amber-300/80 flex items-center justify-center">
                    <span className="rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-amber-200">
                      Center face here
                    </span>
                  </div>
                  <div className="absolute top-2 left-2 flex items-center gap-1.5 rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                    <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" /> LIVE
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={capturePhoto}
                    className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md transition hover:brightness-105 cursor-pointer"
                  >
                    <Camera size={14} /> Capture Face
                  </button>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : newAccount.faceImage ? (
              <div className="flex items-center gap-3.5 bg-white rounded-xl p-2.5 border border-emerald-200 shadow-sm">
                <img
                  src={newAccount.faceImage}
                  alt="Captured Face"
                  className="h-14 w-14 rounded-xl object-cover border-2 border-emerald-500 shadow-sm shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-emerald-800 flex items-center gap-1">
                    <CheckCircle2 size={13} className="text-emerald-600" /> Photo Ready
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={startCamera}
                      className="text-[11px] font-semibold text-amber-700 hover:underline cursor-pointer"
                    >
                      Retake
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => setNewAccount({ ...newAccount, faceImage: '' })}
                      className="text-[11px] font-semibold text-rose-600 hover:underline cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={startCamera}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50/50 hover:bg-amber-100/50 py-3 px-4 text-xs font-bold text-amber-900 transition cursor-pointer"
                >
                  <Camera size={16} className="text-amber-700" />
                  <span>Open Live Camera to Verify Face</span>
                </button>
                <div className="text-center">
                  <label className="text-[11px] text-slate-500 hover:text-amber-800 underline cursor-pointer">
                    Or select file from device
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>
              </div>
            )}

            {cameraError && (
              <p className="mt-2 text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-xl p-2">
                {cameraError}
              </p>
            )}
          </div>
        </div>

        <button
          type="submit"
          className="mt-5 w-full rounded-2xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 py-3 text-sm font-bold text-white shadow-md shadow-amber-500/20 transition hover:brightness-105 active:scale-[0.99] cursor-pointer"
        >
          Register Team Member
        </button>
      </form>

      {/* Team Rosters Column */}
      <div className="space-y-4">
        {/* Managers */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-display font-bold text-slate-900 text-sm">Active Managers ({managers.length})</h4>
            <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-[11px] font-bold text-indigo-700">Floor Leadership</span>
          </div>
          <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
            {managers.map((member) => (
              <div key={member.id} className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/60 p-3 transition hover:bg-white hover:shadow-sm">
                {member.faceImage ? (
                  <img src={member.faceImage} alt={member.name} className="h-11 w-11 rounded-xl object-cover border border-indigo-200 shadow-sm shrink-0" />
                ) : (
                  <div className="h-11 w-11 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-600 text-white font-bold flex items-center justify-center shrink-0 shadow-sm text-sm">
                    {member.name?.[0]?.toUpperCase() || 'M'}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-1">
                    <p className="font-bold text-slate-900 text-xs truncate">{member.name}</p>
                    <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 shrink-0">Manager</span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate">{member.email}</p>
                  <div className="mt-1 flex items-center justify-between text-[10px]">
                    <span className="text-slate-500 font-medium">Aadhaar: {member.aadhaarNumber || 'Verified'}</span>
                    {onDeleteAccount && member.role !== 'owner' && (
                      <button onClick={() => onDeleteAccount(member.id)} className="text-rose-600 font-semibold hover:underline cursor-pointer">Remove</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {managers.length === 0 && <p className="text-center text-xs text-slate-400 py-3">No managers created yet.</p>}
          </div>
        </div>

        {/* Staff Members */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-display font-bold text-slate-900 text-sm">Staff Members ({staffMembers.length})</h4>
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">Kitchen & Floor</span>
          </div>
          <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
            {staffMembers.map((member) => (
              <div key={member.id} className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/60 p-3 transition hover:bg-white hover:shadow-sm">
                {member.faceImage ? (
                  <img src={member.faceImage} alt={member.name} className="h-11 w-11 rounded-xl object-cover border border-emerald-200 shadow-sm shrink-0" />
                ) : (
                  <div className="h-11 w-11 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white font-bold flex items-center justify-center shrink-0 shadow-sm text-sm">
                    {member.name?.[0]?.toUpperCase() || 'S'}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-1">
                    <p className="font-bold text-slate-900 text-xs truncate">{member.name}</p>
                    <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 capitalize shrink-0">
                      {member.staffCategory || member.role}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate">{member.email}</p>
                  <div className="mt-1 flex items-center justify-between text-[10px]">
                    <span className="text-slate-500 font-medium">Aadhaar: {member.aadhaarNumber || 'Verified'}</span>
                    {onDeleteAccount && (
                      <button onClick={() => onDeleteAccount(member.id)} className="text-rose-600 font-semibold hover:underline cursor-pointer">Remove</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {staffMembers.length === 0 && <p className="text-center text-xs text-slate-400 py-3">No staff members created yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );

  const renderCustomers = () => (
    <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      <form onSubmit={handleCustomerSubmit} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="font-display text-lg font-bold text-slate-900 mb-1">Create Guest / Customer Profile</h3>
        <p className="text-xs text-slate-500 mb-4">Register an in-house table dining guest or customer record.</p>
        <div className="space-y-3">
          <input value={newCustomer.name} onChange={(event) => setNewCustomer({ ...newCustomer, name: event.target.value })} className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-amber-500 focus:bg-white" placeholder="Customer Name" />
          <input value={newCustomer.email} onChange={(event) => setNewCustomer({ ...newCustomer, email: event.target.value })} className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-amber-500 focus:bg-white" placeholder="Customer Email" />
          <input value={newCustomer.tableNumber} onChange={(event) => setNewCustomer({ ...newCustomer, tableNumber: event.target.value })} className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-amber-500 focus:bg-white" placeholder="Assigned Table Number" />
          <select value={newCustomer.category} onChange={(event) => setNewCustomer({ ...newCustomer, category: event.target.value })} className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-sm text-slate-800 outline-none focus:border-amber-500 focus:bg-white cursor-pointer">
            <option value="Customer">Regular Customer</option>
            <option value="Temporary">Walk-in Guest</option>
          </select>
        </div>
        <button type="submit" className="mt-5 w-full rounded-2xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 py-3 text-sm font-bold text-white shadow-md shadow-amber-500/20 transition hover:brightness-105 active:scale-[0.99] cursor-pointer">
          Create Guest Profile
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
                <span className="rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-800">Table #{customer.tableNumber}</span>
              </div>
              <p className="mt-2 text-[11px] text-slate-400">Category: {customer.category} | Created: {customer.createdAt}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderBilling = () => (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      {/* Formal Tax Invoice */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-[0_10px_35px_-10px_rgba(15,23,42,0.06)]">
        {selectedOrder && invoiceOrderId ? (
          <div className="invoice-print-area bg-white text-slate-900">
            <button
              onClick={() => setInvoiceOrderId(null)}
              className="mb-5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100 print:hidden cursor-pointer"
            >
              ← Back to bills list
            </button>

            {/* Official Hotel Invoice Header */}
            <div className="flex items-start justify-between gap-4 border-b-2 border-slate-900 pb-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-amber-400">
                  <Crown size={24} />
                </div>
                <div>
                  <h2 className="font-display text-2xl font-black tracking-tight text-slate-900 uppercase">
                    {hotels[0]?.name || 'Royal Plaza Hotel Surat'}
                  </h2>
                  <p className="text-xs text-slate-600 font-medium">5-Star Luxury Dining & Operations Suite • Surat, Gujarat</p>
                </div>
              </div>
              <div className="text-right">
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">PAID INVOICE</span>
                <p className="mt-1 text-xs text-slate-500 font-mono">Invoice #{selectedOrder.id.toString().slice(-6)}</p>
              </div>
            </div>

            {(() => {
              const customerEmail = selectedOrder.userEmail || customers?.find((c) => (c.name && c.name.toLowerCase() === (selectedOrder.customerName || '').toLowerCase()) || Number(c.tableNumber) === Number(selectedOrder.tableNumber))?.email || 'guest@royalplaza.com';
              return (
                <div className="my-5 grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
                  <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Customer</span>
                    <span className="font-bold text-slate-900 truncate block">{selectedOrder.customerName || 'Guest'}</span>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Email ID</span>
                    <span className="font-bold text-slate-900 truncate block" title={customerEmail}>{customerEmail}</span>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Table No.</span>
                    <span className="font-bold text-slate-900 block">Table #{selectedOrder.tableNumber || 'N/A'}</span>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Payment Mode</span>
                    <span className="font-bold text-slate-900 block uppercase">{selectedOrder.paymentMethod || 'UPI / Cash'}</span>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Timestamp</span>
                    <span className="font-bold text-slate-900 block truncate">
                      {selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN')}
                    </span>
                  </div>
                </div>
              );
            })()}

            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <table className="w-full border-collapse text-left text-xs">
                <thead className="bg-slate-900 text-white">
                  <tr>
                    <th className="px-3.5 py-2.5">#</th>
                    <th className="px-3.5 py-2.5">Item Description</th>
                    <th className="px-3.5 py-2.5">Category</th>
                    <th className="px-3.5 py-2.5 text-center">Qty</th>
                    <th className="px-3.5 py-2.5 text-right">Price</th>
                    <th className="px-3.5 py-2.5 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedOrder.items.map((item, index) => (
                    <tr key={`${item.name}-${index}`} className="hover:bg-slate-50/50">
                      <td className="px-3.5 py-2 text-slate-400">{index + 1}</td>
                      <td className="px-3.5 py-2 font-bold text-slate-900">{item.name}</td>
                      <td className="px-3.5 py-2 text-slate-500">{item.category || 'Food'}</td>
                      <td className="px-3.5 py-2 text-center font-semibold">{item.qty}</td>
                      <td className="px-3.5 py-2 text-right text-slate-600">₹{item.price}</td>
                      <td className="px-3.5 py-2 text-right font-bold text-slate-900">₹{item.qty * item.price}</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50 text-sm font-bold">
                    <td colSpan="5" className="px-3.5 py-3 text-right text-slate-800">Grand Total (Incl. GST):</td>
                    <td className="px-3.5 py-3 text-right font-display text-base font-extrabold text-amber-700">₹{selectedOrder.total}</td>
                  </tr>
                </tbody>
              </table>
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

            <div className="mt-6 border-t border-slate-200 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
              <p>Thank you for choosing Royal Plaza Hotel Surat. Have a great day!</p>
              <div className="flex items-center gap-2 print:hidden">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-xs font-bold text-white shadow-md transition hover:bg-slate-800 cursor-pointer"
                >
                  <Printer size={14} /> Print Official Invoice
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to delete invoice #${selectedOrder.id.toString().slice(-6)}?`)) {
                      onDeleteOrder?.(selectedOrder.id);
                      setInvoiceOrderId(null);
                    }
                  }}
                  className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-600 hover:text-white hover:border-rose-600 cursor-pointer shadow-sm"
                  title="Delete Invoice"
                >
                  <Trash2 size={14} /> Delete Invoice
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-20 text-center">
            <FileText size={40} className="mx-auto text-slate-300 mb-3" />
            <p className="font-display text-base font-bold text-slate-800">Select an order bill to inspect invoice</p>
            <p className="mt-1 text-xs text-slate-400">Click on any order in the right column to generate full official print bill.</p>
          </div>
        )}
      </div>

      {/* Orders List for Billing */}
      <div className="space-y-3">
        <h4 className="font-display font-bold text-slate-900 text-sm px-1">Completed & Active Bills ({orders.length})</h4>
        <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
          {orders.map((order) => (
            <div
              key={order.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-amber-400"
            >
              <div className="min-w-0">
                <p className="truncate font-bold text-slate-900 text-sm">{order.customerName}</p>
                <p className="text-xs text-slate-500">Order #{order.id.toString().slice(-6)} • Table #{order.tableNumber}</p>
                <p className="text-xs font-extrabold text-amber-700 mt-1">₹{order.total}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    onSelectOrder(order.id);
                    setInvoiceOrderId(order.id);
                  }}
                  className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white transition hover:bg-amber-600 cursor-pointer shadow-sm"
                >
                  <Eye size={13} /> View Invoice
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to delete invoice for Order #${order.id.toString().slice(-6)} (${order.customerName})?`)) {
                      onDeleteOrder?.(order.id);
                      if (invoiceOrderId === order.id || selectedOrder?.id === order.id) {
                        setInvoiceOrderId(null);
                      }
                    }
                  }}
                  className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-600 hover:text-white hover:border-rose-600 cursor-pointer shadow-sm"
                  title="Delete Invoice"
                >
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </div>
          ))}
          {orders.length === 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-xs text-slate-400">
              No dining orders registered yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderExpenses = () => (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-xl bg-amber-500/10 p-2 text-amber-600 border border-amber-500/20">
              <CircleDollarSign size={20} />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600">Financial Ledger</span>
          </div>
          <h2 className="font-display text-2xl font-black text-slate-900 mt-2">Hotel Costs & Operational Expenses</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Record, track, and audit kitchen costs, daily groceries, electricity, salaries, and supplies stored directly in MongoDB database.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {['today', 'month', 'year'].map((period) => (
            <button
              key={period}
              type="button"
              onClick={() => setRevenuePeriod(period)}
              className={`rounded-xl px-3.5 py-2 text-xs font-bold transition cursor-pointer ${
                revenuePeriod === period
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {period === 'today' ? 'Today' : period === 'month' ? 'This Month' : 'This Year'}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Financial Metric Cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Gross Revenue */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Gross Revenue ({revenuePeriod})</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20">
              <DollarSign size={16} />
            </span>
          </div>
          <p className="font-display text-2xl font-black text-slate-900">{revenue}</p>
          <p className="mt-2 text-[11px] font-medium text-slate-500">{revenueSummary.count} orders registered</p>
        </div>

        {/* Total Hotel Costs */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Recorded Costs</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 border border-rose-500/20">
              <Receipt size={16} />
            </span>
          </div>
          <p className="font-display text-2xl font-black text-rose-600">{formatCurrency(totalExpenses)}</p>
          <p className="mt-2 text-[11px] font-medium text-slate-500">{expenses.length} expense entries in database</p>
        </div>

        {/* Net Profit */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Net Operating Profit</span>
            <span className={`flex h-8 w-8 items-center justify-center rounded-xl border ${
              netRevenue >= 0 ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-rose-500/10 text-rose-600 border-rose-500/20'
            }`}>
              {netRevenue >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            </span>
          </div>
          <p className={`font-display text-2xl font-black ${netRevenue >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
            {formatCurrency(netRevenue)}
          </p>
          <p className="mt-2 text-[11px] font-medium text-slate-500">
            {netRevenue >= 0 ? `+${profitMargin}% profit margin` : 'Deficit / over budget'}
          </p>
        </div>

        {/* Financial Health */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Cost Health Ratio</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 border border-blue-500/20">
              <Sparkles size={16} />
            </span>
          </div>
          <p className="font-display text-2xl font-black text-blue-600">
            {revenueSummary.total > 0 ? `${Math.round((totalExpenses / revenueSummary.total) * 100)}%` : '0%'}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Database synchronized</span>
          </div>
        </div>
      </section>

      {/* Main Grid: Add Expense Form & Presets + Expenses Ledger Table */}
      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        {/* Record Hotel Cost Form */}
        <div className="space-y-4">
          <form onSubmit={handleExpenseSubmit} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-display text-lg font-bold text-slate-900">Record Hotel Cost</h3>
                <p className="text-xs text-slate-500">Instantly persist hotel expense to MongoDB database</p>
              </div>
              <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                DB Stored
              </span>
            </div>

            {/* Quick 1-Click Presets */}
            <div className="mb-4">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                Quick 1-Click Common Presets:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {expensePresets.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setNewExpense({
                        category: preset.category,
                        amount: String(preset.amount),
                        period: preset.period,
                        date: new Date().toISOString().slice(0, 10)
                      });
                    }}
                    className="flex flex-col items-start p-2.5 rounded-xl border border-slate-200 bg-slate-50/80 hover:bg-amber-50 hover:border-amber-300 transition text-left text-xs cursor-pointer group"
                  >
                    <span className="font-semibold text-slate-800 group-hover:text-amber-800 line-clamp-1">{preset.label}</span>
                    <span className="text-[11px] font-bold text-amber-600 mt-0.5">₹{preset.amount} • {preset.period}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Expense Category / Description</label>
                <input
                  required
                  value={newExpense.category}
                  onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                  placeholder="e.g. Daily Fresh Sabzi, LPG Gas, Kitchen Bartan Soap"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Amount (INR ₹)</label>
                <input
                  required
                  type="number"
                  min="1"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                  placeholder="e.g. 3500"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Frequency</label>
                  <select
                    value={newExpense.period}
                    onChange={(e) => setNewExpense({ ...newExpense, period: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-sm font-medium text-slate-800 outline-none transition focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20 cursor-pointer"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Expense Date</label>
                  <input
                    required
                    type="date"
                    value={newExpense.date}
                    onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20 cursor-pointer"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="mt-4 w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 py-3 text-sm font-bold text-white shadow-md shadow-amber-500/20 transition hover:brightness-105 active:scale-[0.99] cursor-pointer"
              >
                <Plus size={16} />
                <span>Save Hotel Cost in Database</span>
              </button>
            </div>
          </form>
        </div>

        {/* Recorded Costs Ledger Table & Filters */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-lg font-bold text-slate-900">Recorded Costs Ledger</h3>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700">
                  {filteredExpenses.length} entries
                </span>
              </div>
              <p className="text-xs text-slate-500">Filtered Total: <strong className="text-rose-600">{formatCurrency(filteredExpensesTotal)}</strong></p>
            </div>

            {/* Frequency Filter */}
            <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 border border-slate-200/80">
              {['all', 'daily', 'weekly', 'monthly', 'yearly'].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setExpensePeriodFilter(p)}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-bold capitalize transition cursor-pointer ${
                    expensePeriodFilter === p
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Search Bar */}
          <div className="mt-4 mb-3">
            <div className="relative">
              <Search size={14} className="absolute left-3.5 top-3 text-slate-400" />
              <input
                value={expenseSearch}
                onChange={(e) => setExpenseSearch(e.target.value)}
                placeholder="Search costs by category or amount..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 pl-9 pr-3.5 py-2 text-xs text-slate-800 outline-none transition focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20"
              />
              {expenseSearch && (
                <button
                  type="button"
                  onClick={() => setExpenseSearch('')}
                  className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="px-3.5 py-2.5 font-bold">Date</th>
                  <th className="px-3.5 py-2.5 font-bold">Category</th>
                  <th className="px-3.5 py-2.5 font-bold">Frequency</th>
                  <th className="px-3.5 py-2.5 font-bold text-right">Amount</th>
                  <th className="px-3.5 py-2.5 font-bold text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredExpenses.map((expense) => {
                  const expenseId = expense._id || expense.id;
                  return (
                    <tr key={expenseId} className="hover:bg-slate-50/80 transition">
                      <td className="px-3.5 py-2.5 text-slate-600 font-medium whitespace-nowrap">
                        {expense.date || (expense.createdAt ? new Date(expense.createdAt).toISOString().slice(0, 10) : '—')}
                      </td>
                      <td className="px-3.5 py-2.5 font-bold text-slate-900">
                        {expense.category}
                      </td>
                      <td className="px-3.5 py-2.5 whitespace-nowrap">
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700 capitalize border border-slate-200">
                          {expense.period || 'daily'}
                        </span>
                      </td>
                      <td className="px-3.5 py-2.5 text-right font-extrabold text-slate-900 whitespace-nowrap">
                        ₹{expense.amount}
                      </td>
                      <td className="px-3.5 py-2.5 text-center whitespace-nowrap">
                        {onDeleteExpense && (
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Delete expense "${expense.category}" (₹${expense.amount})?`)) {
                                onDeleteExpense(expenseId);
                              }
                            }}
                            className="rounded-lg p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            title="Delete Cost"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredExpenses.length === 0 && (
              <div className="py-12 text-center text-xs text-slate-400">
                <Receipt size={32} className="mx-auto text-slate-300 mb-2" />
                <p className="font-semibold text-slate-700">No hotel costs found</p>
                <p className="mt-0.5 text-slate-400">Add an operating cost using the form on the left or select a preset.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const contentMap = {
    overview: renderOverview(),
    hotel: renderHotelSetup(),
    menu: renderMenu(),
    team: renderTeam(),
    customers: renderCustomers(),
    billing: renderBilling(),
    expenses: renderExpenses()
  };

  return contentMap[activeView] || renderOverview();
}
