import { useEffect, useState, useMemo } from 'react';
import { Routes, Route, Navigate, useNavigate, useParams, useLocation } from 'react-router-dom';
import AuthPage from './components/AuthPage';
import ResetPasswordPage from './components/ResetPasswordPage';
import CustomerDashboard from './components/CustomerDashboard';
import ManagerDashboard from './components/ManagerDashboard';
import OwnerDashboard from './components/OwnerDashboard';
import SharedLayout from './components/SharedLayout';
import StaffDashboard from './components/StaffDashboard';
import WaiterNotificationToast from './components/WaiterNotificationToast';
import { askCopilot, createExpense, deleteExpense, createMenuItem, createMessage, createOrder, deleteOrder, createUser, deleteUser, deleteMenuItem, getAnalytics, getCurrentUser, getExpenses, getInventory, getMenuItems, getMessages, getOrders, loginUser, registerUser, markMessagesRead, updateOrder, getUsers, seedMenuItems, getTables, markTableClean, markTableUnclean, getCopilotHistory, clearCopilotHistory } from './services/api';
import { initialMenuItems } from './data/menuData';
import { HOTEL_TABLES } from './data/tableData';
import { calculateOrderUtensils, computeLiveBartanStock } from './utils/bartanUtils';

const DEFAULT_HOTEL_NAME = 'Royal Plaza Hotel Surat';

const baseHotels = [
  { id: 1, name: DEFAULT_HOTEL_NAME, address: '', city: 'Surat', state: '' }
];

const baseAccounts = [
  { id: 1, name: 'Hotel Owner', email: 'owner@royalplaza.com', role: 'owner', hotelId: 1, hotelName: 'Royal Plaza', joiningDate: '2024-01-16' }
];

const baseMenuItems = initialMenuItems;

const baseCustomers = [
  { id: 1, name: 'Priya Shah', email: 'priya@example.com', category: 'Customer', tableNumber: 5, hotelId: 1, createdAt: '2026-07-29' }
];

const baseOrders = [];

const createTemporaryPassword = () => `Royal${crypto.randomUUID().replaceAll('-', '').slice(0, 12)}!A1`;

const areOrdersEqual = (a = [], b = []) => {
  if (a === b) return true;
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const oA = a[i];
    const oB = b[i];
    if (
      String(oA.id || oA._id) !== String(oB.id || oB._id) ||
      oA.status !== oB.status ||
      oA.paymentStatus !== oB.paymentStatus ||
      oA.total !== oB.total ||
      oA.tableNumber !== oB.tableNumber ||
      (oA.items?.length || 0) !== (oB.items?.length || 0)
    ) {
      return false;
    }
  }
  return true;
};

const getDefaultViewForRole = (userRole, userStaffCategory) => {
  if (userRole === 'staff') {
    return userStaffCategory === 'cleaning' ? 'tables' : 'orders';
  }
  return 'overview';
};

const isMongoId = (id) => /^[0-9a-fA-F]{24}$/.test(String(id || ''));

const normalizeMenuItem = (item) => ({ ...item, id: item?.id || item?._id || Date.now() });

const normalizeOrder = (order) => ({
  ...order,
  id: order?.id || order?._id || Date.now(),
  tableNumber: Number(order?.tableNumber || 1),
  readyAt: order?.readyAt || null,
  completedAt: order?.completedAt || null,
  preparedBy: order?.preparedBy || '',
  servedBy: order?.servedBy || '',
  prepTimeMinutes: typeof order?.prepTimeMinutes === 'number' ? order.prepTimeMinutes : null,
  serveTimeMinutes: typeof order?.serveTimeMinutes === 'number' ? order.serveTimeMinutes : null,
  totalResponseTimeMinutes: typeof order?.totalResponseTimeMinutes === 'number' ? order.totalResponseTimeMinutes : null
});

const syncOrdersWithBackend = (freshOrders = [], prevOrders = []) => {
  const freshMap = new Map();
  freshOrders.forEach((o) => {
    const key = String(o.id || o._id);
    freshMap.set(key, o);
  });

  const result = [...freshOrders];

  // Only retain local temporary orders (e.g. created offline with temporary numeric IDs)
  // Never retain stale MongoDB IDs that the server no longer returns!
  prevOrders.forEach((po) => {
    const key = String(po.id || po._id);
    if (!freshMap.has(key)) {
      if (!isMongoId(key)) {
        result.push(po);
      }
    }
  });

  return result;
};

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState('');
  const [staffCategory, setStaffCategory] = useState('');
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [customerTableNumber, setCustomerTableNumber] = useState('1');
  const [analytics, setAnalytics] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [messages, setMessages] = useState([]);
  const [waiterNotifications, setWaiterNotifications] = useState([]);
  const handleDismissWaiterNotification = (id) => setWaiterNotifications((prev) => prev.filter((n) => n.id !== id));
  const [copilotMessages, setCopilotMessages] = useState([
    { role: 'assistant', content: 'Hello. I can answer questions about your hotel workspace, orders, revenue, inventory, menu, and role responsibilities.' }
  ]);
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem('token')));
  const [copilotInput, setCopilotInput] = useState('How is business today?');
  const [isCopilotLoading, setIsCopilotLoading] = useState(false);
  const [activeView, setActiveView] = useState(() => {
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    if (pathParts[0] === 'dashboard' && pathParts[1]) return pathParts[1];
    return 'overview';
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hotels, setHotels] = useState(baseHotels);
  const [accounts, setAccounts] = useState(baseAccounts);
  const [menuItems, setMenuItems] = useState(baseMenuItems);
  const [customers, setCustomers] = useState(baseCustomers);
  const [orders, setOrders] = useState(() => {
    try {
      const saved = localStorage.getItem('hotel_orders');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed.map(normalizeOrder);
      }
    } catch (e) {}
    return baseOrders;
  });
  const [currentHotelId, setCurrentHotelId] = useState(baseHotels[0].id);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [tables, setTables] = useState(() => {
    try {
      const saved = localStorage.getItem('hotel_tables');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to load tables from localStorage', e);
    }
    return HOTEL_TABLES;
  });

  const handleAddTable = (tableData) => {
    const nextNumber = Number(tableData.number);
    if (!nextNumber || nextNumber <= 0) {
      alert('Please enter a valid table number.');
      return false;
    }
    if (tables.some((t) => Number(t.number) === nextNumber)) {
      alert(`Table #${nextNumber} already exists. Please choose a different number.`);
      return false;
    }
    const capacity = Number(tableData.capacity) || 4;
    const category = tableData.category?.trim() || `${capacity} Persons (Extra)`;
    const newTable = {
      id: nextNumber,
      number: nextNumber,
      capacity,
      category,
      isExtra: true
    };
    setTables((prev) => {
      const updated = [...prev, newTable].sort((a, b) => a.number - b.number);
      try {
        localStorage.setItem('hotel_tables', JSON.stringify(updated));
      } catch (e) {
        console.warn('LocalStorage save error', e);
      }
      return updated;
    });
    return true;
  };

  const handleDeleteTable = (tableNumber) => {
    setTables((prev) => {
      const updated = prev.filter((t) => t.number !== tableNumber);
      try {
        localStorage.setItem('hotel_tables', JSON.stringify(updated));
      } catch (e) {
        console.warn('LocalStorage save error', e);
      }
      return updated;
    });
  };

  const [tableCleanStatus, setTableCleanStatus] = useState(() => {
    try {
      const saved = localStorage.getItem('hotel_table_clean_status');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  // Track dirty utensils in dishwashing sink awaiting cleaning staff
  const [dirtyBartan, setDirtyBartan] = useState(() => {
    try {
      const saved = localStorage.getItem('hotel_bartan_dirty');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed === 'object' && parsed !== null) return parsed;
      }
    } catch (e) {}
    return { plates: 4, glasses: 6, bowls: 8, spoons: 12, pots: 2 };
  });

  // Dynamically computed live Bartan Stock:
  // - inUse: actively consumed by customer orders currently dining
  // - dirty: dishes awaiting cleaning man in the wash sink
  // - clean: sanitized and ready on kitchen shelves
  const bartanStock = useMemo(() => {
    return computeLiveBartanStock(orders, dirtyBartan);
  }, [orders, dirtyBartan]);

  const handleCleanTable = async (tableNumber) => {
    const num = Number(tableNumber);
    setTableCleanStatus((prev) => {
      const next = { ...prev, [num]: 'clean' };
      try {
        localStorage.setItem('hotel_table_clean_status', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
    try {
      await markTableClean(num);
    } catch (apiError) {
      console.warn('Backend markTableClean warning:', apiError?.message);
    }
  };

  const handleMarkTableNeedsCleaning = async (tableNumber) => {
    const num = Number(tableNumber);
    setTableCleanStatus((prev) => {
      const next = { ...prev, [num]: 'needs_cleaning' };
      try {
        localStorage.setItem('hotel_table_clean_status', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
    try {
      await markTableUnclean(num);
    } catch (apiError) {
      console.warn('Backend markTableUnclean warning:', apiError?.message);
    }
  };

  const handleCleanBartan = (itemId) => {
    setDirtyBartan((prev) => {
      const next = { ...prev, [itemId]: 0 };
      try {
        localStorage.setItem('hotel_bartan_dirty', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  const handleCleanAllBartan = () => {
    const next = { plates: 0, glasses: 0, bowls: 0, spoons: 0, pots: 0 };
    setDirtyBartan(next);
    try {
      localStorage.setItem('hotel_bartan_dirty', JSON.stringify(next));
    } catch (e) {}
  };

  const handlePaymentCompleted = async (paidOrder) => {
    const normalized = normalizeOrder(paidOrder);
    const orderId = normalized.id || normalized._id;
    const nowIso = new Date().toISOString();

    setOrders((prev) => {
      const updated = prev.map((order) => {
        const isTarget = String(order.id || order._id) === String(orderId);
        const isSameTable = Number(order.tableNumber) === Number(normalized.tableNumber);
        if (isTarget || (isSameTable && String(order.status || '').toLowerCase() !== 'cancelled')) {
          return {
            ...order,
            ...(isTarget ? normalized : {}),
            paymentStatus: 'paid',
            status: 'Completed',
            paidAt: order.paidAt || normalized.paidAt || nowIso,
            completedAt: order.completedAt || normalized.completedAt || nowIso
          };
        }
        return order;
      });
      try {
        localStorage.setItem('hotel_orders', JSON.stringify(updated));
        localStorage.setItem('hotel_orders_updated', Date.now().toString());
      } catch (e) {}
      return updated;
    });

    if (normalized.tableNumber) {
      handleMarkTableNeedsCleaning(normalized.tableNumber);
    }

    // Automatically transition completed order's utensils to dirty wash sink
    const orderUtensils = calculateOrderUtensils(normalized);
    setDirtyBartan((prev) => {
      const next = {
        plates: (prev.plates || 0) + orderUtensils.plates,
        glasses: (prev.glasses || 0) + orderUtensils.glasses,
        bowls: (prev.bowls || 0) + orderUtensils.bowls,
        spoons: (prev.spoons || 0) + orderUtensils.spoons,
        pots: (prev.pots || 0) + orderUtensils.pots,
      };
      try {
        localStorage.setItem('hotel_bartan_dirty', JSON.stringify(next));
      } catch (e) {}
      return next;
    });

    // Persist payment to backend database so polling intervals keep paymentStatus as 'paid'
    if (orderId && role !== 'customer') {
      try {
        await updateOrder(orderId, {
          paymentStatus: 'paid',
          status: 'Completed',
          paidAt: normalized.paidAt || nowIso,
          completedAt: normalized.completedAt || nowIso
        });
      } catch (apiError) {
        console.warn('Backend payment status update warning:', apiError?.message);
      }

      // Also persist any other unpaid orders on the same table if applicable
      const sameTableUnpaid = orders.filter(
        (o) => Number(o.tableNumber) === Number(normalized.tableNumber) &&
          String(o.id || o._id) !== String(orderId) &&
          String(o.status || '').toLowerCase() !== 'cancelled' &&
          String(o.paymentStatus || '').toLowerCase() !== 'paid'
      );
      for (const o of sameTableUnpaid) {
        const oid = o.id || o._id;
        if (oid) {
          try {
            await updateOrder(oid, {
              paymentStatus: 'paid',
              status: 'Completed',
              paidAt: nowIso,
              completedAt: nowIso
            });
          } catch (e) {}
        }
      }
    }
  };



  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsAuthenticated(false);
      setLoading(false);
      return;
    }

    const loadSession = async () => {
      try {
        const [userRes, analyticsRes, inventoryRes, expensesRes, menuRes, ordersRes] = await Promise.all([
          getCurrentUser(),
          getAnalytics().catch(() => ({ data: [] })),
          getInventory().catch(() => ({ data: [] })),
          getExpenses().catch(() => ({ data: [] })),
          getMenuItems().catch(() => ({ data: [] })),
          getOrders().catch(() => ({ data: [] }))
        ]);
        const [messagesResult] = await Promise.allSettled([getMessages()]);
        const user = userRes?.data?.user;
        if (!user) {
          throw new Error('User session could not be verified');
        }

        setRole(user.role || 'customer');
        setStaffCategory(user.staffCategory || 'waiter');
        setUserName(user.name || 'User');
        setUserEmail(user.email || '');
        setUserId(user.id || user._id || '');
        setCustomerTableNumber(String(user.tableNumber || '1'));
        setIsAuthenticated(true);

        const pathParts = window.location.pathname.split('/').filter(Boolean);
        const urlView = pathParts[0] === 'dashboard' && pathParts[1] ? pathParts[1] : null;
        const defaultRoleView = getDefaultViewForRole(user.role, user.staffCategory);
        setActiveView(urlView || defaultRoleView);

        setAnalytics(analyticsRes.data || []);
        setInventory(inventoryRes.data || []);
        setExpenses(expensesRes.data || []);
        const loadedMenu = (menuRes.data || []).map(normalizeMenuItem);
        if (loadedMenu.length === 0) {
          try {
            const seedRes = await seedMenuItems();
            if (seedRes.data?.ok) {
              const freshMenu = await getMenuItems();
              setMenuItems((freshMenu.data || []).map(normalizeMenuItem));
            } else {
              setMenuItems(initialMenuItems.map(normalizeMenuItem));
            }
          } catch {
            setMenuItems(initialMenuItems.map(normalizeMenuItem));
          }
        } else {
          setMenuItems(loadedMenu);
        }
        const freshOrders = (ordersRes.data || []).map(normalizeOrder);
        setOrders((prev) => {
          const synced = syncOrdersWithBackend(freshOrders, prev);
          try {
            localStorage.setItem('hotel_orders', JSON.stringify(synced));
          } catch (e) {}
          return synced;
        });
        setMessages(messagesResult.status === 'fulfilled' ? messagesResult.value.data || [] : []);
        try {
          await markMessagesRead();
          setMessages((prev) => prev.map((message) => ({ ...message, read: true })));
        } catch (readError) {
          console.warn('Could not mark messages as read:', readError);
        }

        // Load tables and persistent cleanliness status from database
        try {
          const tablesRes = await getTables();
          const cleanMap = {};
          (tablesRes.data || []).forEach((t) => {
            cleanMap[Number(t.number)] = t.status === 'unclean' ? 'needs_cleaning' : t.status;
          });
          setTableCleanStatus(cleanMap);
          try {
            localStorage.setItem('hotel_table_clean_status', JSON.stringify(cleanMap));
          } catch (e) {}
        } catch (tableErr) {
          console.warn('Could not load tables from database:', tableErr?.message);
        }

        // Load persistent Copilot chat history from database
        try {
          const copilotRes = await getCopilotHistory();
          if (Array.isArray(copilotRes.data) && copilotRes.data.length > 0) {
            const formatted = copilotRes.data.flatMap((c) => [
              { role: 'user', content: c.prompt },
              { role: 'assistant', content: c.response }
            ]);
            setCopilotMessages(formatted);
          }
        } catch (copilotErr) {
          console.warn('Could not load copilot history from database:', copilotErr?.message);
        }
        try {
          const usersRes = await getUsers();
          const users = usersRes.data || [];
          setAccounts(users.map((u) => ({ id: u._id || u.id || Date.now(), name: u.name, email: u.email, role: u.role, staffCategory: u.role === 'staff' ? (u.staffCategory || 'waiter') : undefined, aadhaarNumber: u.aadhaarNumber, faceImage: u.faceImage, hotelId: u.hotelId || 1, hotelName: u.hotelName || DEFAULT_HOTEL_NAME, joiningDate: u.joiningDate || new Date().toISOString().slice(0, 10) })));
          const customerUsers = users.filter((u) => u.role === 'customer');
          if (customerUsers.length > 0) {
            setCustomers(customerUsers.map((u) => ({ id: u._id || u.id, name: u.name, email: u.email, category: 'Customer', tableNumber: Number(u.tableNumber || 1), hotelId: 1, createdAt: u.createdAt ? new Date(u.createdAt).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10) })));
          }
        } catch (err) {
          // ignore - keep base accounts
        }
      } catch (error) {
        console.warn('Authentication session verification failed:', error?.message);
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        setIsAuthenticated(false);
        setRole('');
        setStaffCategory('');
        setUserName('');
        setUserEmail('');
        setUserId('');
      } finally {
        setLoading(false);
      }
    };

    loadSession();
  }, []);

  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === 'hotel_orders' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setOrders(parsed);
        } catch (err) {}
      }
      if (e.key === 'hotel_table_clean_status' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setTableCleanStatus(parsed);
        } catch (err) {}
      }
      if (e.key === 'hotel_waiter_notification' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setWaiterNotifications((prev) => [parsed, ...prev.filter((n) => n.id !== parsed.id)]);
        } catch (err) {}
      }
      if (e.key === 'hotel_messages' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setMessages(parsed);
        } catch (err) {}
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    const refreshData = async () => {
      try {
        const reqs = [
          getOrders(),
          getTables(),
          getMessages()
        ];
        if (role === 'owner') {
          reqs.push(getExpenses());
        }
        const results = await Promise.allSettled(reqs);
        const [ordersRes, tablesRes, messagesRes] = results;
        const expensesRes = role === 'owner' ? results[3] : null;

        if (ordersRes.status === 'fulfilled') {
          const fresh = (ordersRes.value.data || []).map(normalizeOrder);
          setOrders((prev) => {
            const synced = syncOrdersWithBackend(fresh, prev);
            if (areOrdersEqual(prev, synced)) {
              return prev;
            }
            try {
              localStorage.setItem('hotel_orders', JSON.stringify(synced));
            } catch (e) {}
            return synced;
          });
        }

        if (tablesRes.status === 'fulfilled') {
          const cleanMap = {};
          (tablesRes.value.data || []).forEach((t) => {
            cleanMap[Number(t.number)] = t.status === 'unclean' ? 'needs_cleaning' : t.status;
          });
          setTableCleanStatus((prev) => {
            const hasChanged = Object.keys(cleanMap).some((k) => cleanMap[k] !== prev[k]);
            if (!hasChanged) return prev;
            try {
              localStorage.setItem('hotel_table_clean_status', JSON.stringify(cleanMap));
            } catch (e) {}
            return cleanMap;
          });
        }

        if (messagesRes.status === 'fulfilled') {
          const freshMessages = messagesRes.value.data || [];
          setMessages((prev) => {
            if (freshMessages.length === prev.length && freshMessages[0]?._id === prev[0]?._id) {
              return prev;
            }
            return freshMessages;
          });
        }

        if (expensesRes && expensesRes.status === 'fulfilled') {
          const freshExpenses = expensesRes.value.data || [];
          setExpenses((prev) => {
            if (freshExpenses.length === prev.length && freshExpenses[0]?._id === prev[0]?._id) {
              return prev;
            }
            return freshExpenses;
          });
        }
      } catch (error) {
        // silent
      }
    };
    const interval = window.setInterval(refreshData, 3500);
    return () => window.clearInterval(interval);
  }, [isAuthenticated, role]);

  const handleRefreshData = async () => {
    setIsRefreshing(true);
    try {
      const [ordersRes, analyticsRes, inventoryRes, expensesRes, menuRes] = await Promise.allSettled([
        getOrders(),
        getAnalytics(),
        getInventory(),
        getExpenses(),
        getMenuItems()
      ]);

      if (ordersRes.status === 'fulfilled') {
        const freshOrders = (ordersRes.value.data || []).map(normalizeOrder);
        setOrders((prev) => {
          const synced = syncOrdersWithBackend(freshOrders, prev);
          try {
            localStorage.setItem('hotel_orders', JSON.stringify(synced));
          } catch (e) {}
          return synced;
        });
      }

      if (analyticsRes.status === 'fulfilled') {
        setAnalytics(analyticsRes.value.data || []);
      }
      if (inventoryRes.status === 'fulfilled') {
        setInventory(inventoryRes.value.data || []);
      }
      if (expensesRes.status === 'fulfilled') {
        setExpenses(expensesRes.value.data || []);
      }
      if (menuRes.status === 'fulfilled') {
        const loadedMenu = (menuRes.value.data || []).map(normalizeMenuItem);
        if (loadedMenu.length > 0) setMenuItems(loadedMenu);
      }

      const [messagesRes, usersRes] = await Promise.allSettled([
        getMessages(),
        getUsers()
      ]);

      if (messagesRes.status === 'fulfilled') {
        setMessages(messagesRes.value.data || []);
      }
      if (usersRes.status === 'fulfilled') {
        const users = usersRes.value.data || [];
        setAccounts(users.map((u) => ({
          id: u._id || u.id || Date.now(),
          name: u.name,
          email: u.email,
          role: u.role,
          staffCategory: u.role === 'staff' ? (u.staffCategory || 'waiter') : undefined,
          aadhaarNumber: u.aadhaarNumber,
          faceImage: u.faceImage,
          hotelId: u.hotelId || 1,
          hotelName: u.hotelName || DEFAULT_HOTEL_NAME,
          joiningDate: u.joiningDate || new Date().toISOString().slice(0, 10)
        })));
        const customerUsers = users.filter((u) => u.role === 'customer');
        if (customerUsers.length > 0) {
          setCustomers(customerUsers.map((u) => ({
            id: u._id || u.id,
            name: u.name,
            email: u.email,
            category: 'Customer',
            tableNumber: Number(u.tableNumber || 1),
            hotelId: 1,
            createdAt: u.createdAt ? new Date(u.createdAt).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)
          })));
        }
      }
    } catch (error) {
      console.warn('Manual refresh error:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const selectedOrder = orders.find((order) => order.id === selectedOrderId) || orders[orders.length - 1] || null;

  const handleLogin = async (nextRole, nextName, profile = {}) => {
    try {
      const payload = {
        name: nextName,
        email: profile.email,
        password: profile.password,
        role: nextRole,
        staffCategory: profile.staffCategory || 'waiter',
        hotelName: profile.hotelName || DEFAULT_HOTEL_NAME,
        ...(nextRole === 'customer' ? { tableNumber: profile.tableNumber ? Number(profile.tableNumber) : 1 } : {})
      };

      const request = profile.createAccount ? registerUser(payload) : loginUser(payload);
      const response = await request;
      const user = response?.data?.user;
      const token = response?.data?.token;

      if (!token || !user) {
        throw new Error('Authentication failed');
      }

      localStorage.setItem('token', token);
      if (response?.data?.refreshToken) localStorage.setItem('refreshToken', response.data.refreshToken);
      setRole(user.role || nextRole || 'customer');
      setStaffCategory(user.staffCategory || profile.staffCategory || 'waiter');
      setUserName(user.name || nextName);
      setUserEmail(user.email || profile.email || '');
      setUserId(user.id || user._id || '');
      if (user.role === 'customer') {
        setCustomerTableNumber(String(user.tableNumber || profile.tableNumber || '1'));
      }
      setIsAuthenticated(true);
      const effectiveStaffCategory = user.staffCategory || profile.staffCategory || 'waiter';
      const targetView = getDefaultViewForRole(user.role || nextRole, effectiveStaffCategory);
      setActiveView(targetView);
      navigate(`/dashboard/${targetView}`);
      setCurrentHotelId(1);
      setAccounts((prev) => prev.some((account) => account.email?.toLowerCase() === user.email?.toLowerCase()) ? prev : [...prev, { id: Date.now(), name: user.name, email: user.email, role: user.role, staffCategory: user.staffCategory || 'waiter', hotelId: 1, hotelName: user.hotelName || DEFAULT_HOTEL_NAME, joiningDate: new Date().toISOString().slice(0, 10) }]);
      if (user.role === 'customer') {
        setCustomers((prev) => prev.some((customer) => customer.email?.toLowerCase() === user.email?.toLowerCase()) ? prev : [...prev, { id: Date.now(), name: user.name, email: user.email, category: 'Customer', tableNumber: Number(user.tableNumber || 1), hotelId: 1, createdAt: new Date().toISOString().slice(0, 10) }]);
      }

      try {
        const [menuRes, ordersRes] = await Promise.all([getMenuItems(), getOrders()]);
        const loaded = (menuRes.data || []).map(normalizeMenuItem);
        setMenuItems(loaded.length > 0 ? loaded : initialMenuItems.map(normalizeMenuItem));
        const freshOrders = (ordersRes.data || []).map(normalizeOrder);
        setOrders((prev) => {
          const synced = syncOrdersWithBackend(freshOrders, prev);
          try {
            localStorage.setItem('hotel_orders', JSON.stringify(synced));
          } catch (e) {}
          return synced;
        });
      } catch (fetchError) {
        console.warn('Post-login data load failed:', fetchError);
        setMenuItems(initialMenuItems.map(normalizeMenuItem));
      }

      try {
        const expensesRes = await getExpenses();
        setExpenses(expensesRes.data || []);
      } catch (expErr) {
        // ignore
      }

      const messageResult = await getMessages().catch(() => ({ data: [] }));
      setMessages(messageResult.data || []);
      try {
        await markMessagesRead();
        setMessages((prev) => prev.map((message) => ({ ...message, read: true })));
      } catch (readError) {
        console.warn('Could not mark messages as read:', readError);
      }
      try {
        const usersRes = await getUsers();
        const users = usersRes.data || [];
        setAccounts(users.map((u) => ({ id: u._id || u.id || Date.now(), name: u.name, email: u.email, role: u.role, staffCategory: u.role === 'staff' ? (u.staffCategory || 'waiter') : undefined, aadhaarNumber: u.aadhaarNumber, faceImage: u.faceImage, hotelId: u.hotelId || 1, hotelName: u.hotelName || DEFAULT_HOTEL_NAME, joiningDate: u.joiningDate || new Date().toISOString().slice(0, 10) })));
        const customerUsers = users.filter((u) => u.role === 'customer');
        if (customerUsers.length > 0) {
          setCustomers(customerUsers.map((u) => ({ id: u._id || u.id, name: u.name, email: u.email, category: 'Customer', tableNumber: Number(u.tableNumber || 1), hotelId: 1, createdAt: u.createdAt ? new Date(u.createdAt).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10) })));
        }
      } catch (err) {
        // ignore
      }
    } catch (error) {
      console.error(error);
      setIsAuthenticated(false);
      alert(error?.response?.data?.message || 'Login failed. Please try again.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('hotel_orders');
    setOrders([]);
    setIsAuthenticated(false);
    setRole('');
    setStaffCategory('');
    setUserName('');
    setUserEmail('');
    setUserId('');
    setCustomerTableNumber('1');
    setActiveView('overview');
    navigate('/');
  };

  const handleAddHotel = (hotel) => {
    const nextHotel = { id: Date.now(), ...hotel };
    setHotels((prev) => [...prev, nextHotel]);
    setCurrentHotelId(nextHotel.id);
  };

  const handleAddAccount = async (account) => {
    try {
      const temporaryPassword = createTemporaryPassword();
      const response = await createUser({ ...account, password: temporaryPassword });
      setAccounts((prev) => [
        {
          ...response.data,
          ...account,
          id: response.data?._id || response.data?.id || Date.now(),
          staffCategory: account.role === 'staff' ? account.staffCategory : undefined,
          aadhaarNumber: account.aadhaarNumber,
          faceImage: account.faceImage,
          joiningDate: new Date().toISOString().slice(0, 10)
        },
        ...prev
      ]);
      alert(`Account created. Temporary password: ${temporaryPassword}`);
    } catch (error) {
      console.error(error);
      alert(error?.response?.data?.message || 'Account could not be created.');
    }
  };

  const handleDeleteAccount = async (id) => {
    try {
      await deleteUser(id);
      setAccounts((prev) => prev.filter((acc) => acc.id !== id && acc._id !== id));
    } catch (error) {
      console.error(error);
      alert('Account could not be deleted.');
    }
  };

  const handleAddMenuItem = async (item) => {
    try {
      const response = await createMenuItem({ ...item, hotelName: DEFAULT_HOTEL_NAME });
      setMenuItems((prev) => [normalizeMenuItem(response.data), ...prev]);
    } catch (error) {
      console.error(error);
      alert('Menu item could not be saved.');
    }
  };

  const handleAddExpense = async (expense) => {
    try {
      const response = await createExpense(expense);
      setExpenses((prev) => [response.data, ...prev]);
    } catch (error) {
      console.error(error);
      alert(error?.response?.data?.message || 'Cost could not be saved.');
    }
  };

  const handleDeleteExpense = async (id) => {
    try {
      await deleteExpense(id);
      setExpenses((prev) => prev.filter((item) => (item._id || item.id) !== id));
    } catch (error) {
      console.error(error);
      alert(error?.response?.data?.message || 'Cost could not be removed.');
    }
  };

  const handleDeleteMenuItem = async (id) => {
    try {
      await deleteMenuItem(id);
      setMenuItems((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      console.error(error);
      alert('Menu item could not be removed.');
    }
  };

  const handleDeleteOrder = async (orderId) => {
    try {
      await deleteOrder(orderId);
    } catch (error) {
      console.warn('Backend deleteOrder error (proceeding with local deletion):', error);
    }
    setOrders((prev) => {
      const updated = prev.filter((order) => String(order.id) !== String(orderId) && String(order._id) !== String(orderId));
      try {
        localStorage.setItem('hotel_orders', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    if (String(selectedOrderId) === String(orderId)) {
      setSelectedOrderId(null);
    }
  };

  const handleCreateCustomer = async (customer) => {
    try {
      const temporaryPassword = createTemporaryPassword();
      const response = await createUser({ ...customer, role: 'customer', password: temporaryPassword });
      setCustomers((prev) => [
        { ...response.data, ...customer, createdAt: new Date().toISOString().slice(0, 10) },
        ...prev
      ]);
      alert(`Customer account created. Temporary password: ${temporaryPassword}`);
    } catch (error) {
      console.error(error);
      alert(error?.response?.data?.message || 'Customer account could not be created.');
    }
  };

  const handleSaveOrder = async (order) => {
    try {
      const response = await createOrder({ ...order, hotelName: DEFAULT_HOTEL_NAME });
      const nextOrder = normalizeOrder(response.data);
      setOrders((prev) => {
        const updated = [nextOrder, ...prev];
        try {
          localStorage.setItem('hotel_orders', JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });
      setSelectedOrderId(nextOrder.id);
    } catch (error) {
      console.error(error);
      const fallbackOrder = normalizeOrder({
        ...order,
        id: Date.now(),
        status: 'Preparing',
        hotelName: DEFAULT_HOTEL_NAME,
        createdAt: new Date().toISOString()
      });
      setOrders((prev) => {
        const updated = [fallbackOrder, ...prev];
        try {
          localStorage.setItem('hotel_orders', JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });
      setSelectedOrderId(fallbackOrder.id);
    }
  };

  const handleUpdateOrderStatus = async (orderId, nextStatus) => {
    const nowIso = new Date().toISOString();
    const updaterName = userName && userName !== 'Guest'
      ? userName
      : role === 'staff'
        ? (staffCategory === 'chef' ? 'Chef Staff' : 'Waiter Staff')
        : 'Floor Manager';

    let targetOrderForCleanup = null;

    setOrders((prev) => {
      const updated = prev.map((order) => {
        if (String(order.id) === String(orderId) || String(order._id) === String(orderId)) {
          targetOrderForCleanup = order;
          const isTransitionToReady = nextStatus === 'Ready' && order.status !== 'Ready';
          const isTransitionToCompleted = nextStatus === 'Completed' && order.status !== 'Completed';

          let prepTimeMinutes = order.prepTimeMinutes;
          let serveTimeMinutes = order.serveTimeMinutes;
          let totalResponseTimeMinutes = order.totalResponseTimeMinutes;

          if (isTransitionToReady) {
            const createdMs = new Date(order.createdAt || Date.now()).getTime();
            prepTimeMinutes = parseFloat(Math.max(0.5, (Date.now() - createdMs) / 60000).toFixed(1));
          }

          if (isTransitionToCompleted) {
            const readyMs = order.readyAt ? new Date(order.readyAt).getTime() : new Date(order.createdAt || Date.now()).getTime();
            const createdMs = new Date(order.createdAt || Date.now()).getTime();
            serveTimeMinutes = parseFloat(Math.max(0.5, (Date.now() - readyMs) / 60000).toFixed(1));
            totalResponseTimeMinutes = parseFloat(Math.max(0.5, (Date.now() - createdMs) / 60000).toFixed(1));
          }

          return {
            ...order,
            status: nextStatus,
            readyAt: isTransitionToReady ? nowIso : order.readyAt,
            completedAt: isTransitionToCompleted ? nowIso : order.completedAt,
            preparedBy: isTransitionToReady ? updaterName : order.preparedBy,
            servedBy: isTransitionToCompleted ? updaterName : order.servedBy,
            prepTimeMinutes,
            serveTimeMinutes,
            totalResponseTimeMinutes,
            updatedAt: nowIso
          };
        }
        return order;
      });
      try {
        localStorage.setItem('hotel_orders', JSON.stringify(updated));
        localStorage.setItem('hotel_orders_updated', Date.now().toString());
      } catch (e) {}
      return updated;
    });

    try {
      await updateOrder(orderId, {
        status: nextStatus,
        updatedBy: updaterName,
        staffCategory
      });
    } catch (error) {
      console.warn('Backend updateOrder error (proceeding with local update):', error);
    }

    if (nextStatus === 'Ready') {
      const order = targetOrderForCleanup || orders.find(
        (o) => String(o.id) === String(orderId) || String(o._id) === String(orderId)
      );

      const tableNumber = order?.tableNumber || 1;
      const itemsList = (order?.items || []).map((i) => `${i.qty || 1}× ${i.name}`).join(', ') || 'Prepared dishes';
      const notificationContent = `🔔 Table #${tableNumber} Order is READY TO SERVE! 🍳 (${itemsList}) — Please pick up from kitchen dispatch counter.`;

      // 1. Notify waiter accounts via API and messages list
      const waiterAccounts = accounts.filter(
        (acc) => acc.role === 'staff' && (acc.staffCategory === 'waiter' || !acc.staffCategory)
      );

      const generatedMessages = [];
      if (waiterAccounts.length > 0) {
        waiterAccounts.forEach((waiter) => {
          const msg = {
            id: Date.now() + Math.random(),
            senderId: userId || 'chef',
            senderName: updaterName || 'Kitchen Chef',
            senderRole: 'staff',
            recipientId: String(waiter.id || waiter._id),
            recipientName: waiter.name,
            recipientRole: 'staff',
            content: notificationContent,
            read: false,
            createdAt: nowIso
          };
          generatedMessages.push(msg);
          createMessage({
            recipientId: String(waiter.id || waiter._id),
            recipientName: waiter.name,
            recipientRole: 'staff',
            content: notificationContent
          }).catch(() => {});
        });
      } else {
        const msg = {
          id: Date.now(),
          senderId: userId || 'chef',
          senderName: updaterName || 'Kitchen Chef',
          senderRole: 'staff',
          recipientId: 'waiters',
          recipientName: 'Waiter Staff',
          recipientRole: 'staff',
          content: notificationContent,
          read: false,
          createdAt: nowIso
        };
        generatedMessages.push(msg);
        createMessage({
          recipientId: 'waiters',
          recipientName: 'Waiter Staff',
          recipientRole: 'staff',
          content: notificationContent
        }).catch(() => {});
      }

      setMessages((prev) => [...generatedMessages, ...prev]);
      try {
        localStorage.setItem('hotel_messages', JSON.stringify([...generatedMessages, ...messages]));
      } catch (e) {}

      // 2. Broadcast via localStorage for real-time multi-tab/cross-browser instant alert
      const alertPayload = {
        id: Date.now(),
        orderId: order?.id || order?._id || orderId,
        tableNumber,
        customerName: order?.customerName || '',
        items: order?.items || [],
        message: notificationContent,
        chefName: updaterName,
        timestamp: Date.now()
      };

      try {
        localStorage.setItem('hotel_waiter_notification', JSON.stringify(alertPayload));
        localStorage.setItem('hotel_waiter_notification_time', Date.now().toString());
      } catch (e) {}

      // 3. Queue toast in current UI
      setWaiterNotifications((prev) => [alertPayload, ...prev.filter((n) => n.id !== alertPayload.id)]);
    }

    if (nextStatus === 'Completed') {
      const order = targetOrderForCleanup || orders.find(
        (o) => String(o.id) === String(orderId) || String(o._id) === String(orderId)
      );
      // Only flag cleaning if bill is already paid (otherwise table stays occupied for dining until bill payment)
      if (order && String(order.paymentStatus || '').toLowerCase() === 'paid' && order.tableNumber) {
        handleMarkTableNeedsCleaning(order.tableNumber);
      }
      if (order && String(order.paymentStatus || '').toLowerCase() === 'paid') {
        const orderUtensils = calculateOrderUtensils(order);
        setDirtyBartan((prev) => {
          const next = {
            plates: (prev.plates || 0) + orderUtensils.plates,
            glasses: (prev.glasses || 0) + orderUtensils.glasses,
            bowls: (prev.bowls || 0) + orderUtensils.bowls,
            spoons: (prev.spoons || 0) + orderUtensils.spoons,
            pots: (prev.pots || 0) + orderUtensils.pots,
          };
          try {
            localStorage.setItem('hotel_bartan_dirty', JSON.stringify(next));
          } catch (e) {}
          return next;
        });
      }
    }
  };

  const handleDeliverOrderFromToast = (orderId, tableNumber) => {
    handleUpdateOrderStatus(orderId, 'Completed');
    if (tableNumber) {
      handleMarkTableNeedsCleaning(tableNumber);
    }
  };

  const handleCreateCustomerOrder = async (order) => {
    const payload = {
      ...order,
      userId: order.userId || userId,
      userEmail: order.userEmail || userEmail,
      hotelName: DEFAULT_HOTEL_NAME
    };
    try {
      const response = await createOrder(payload);
      const nextOrder = normalizeOrder(response.data);
      setOrders((prev) => {
        const updated = [nextOrder, ...prev.filter((o) => String(o.id || o._id) !== String(nextOrder.id || nextOrder._id))];
        try {
          localStorage.setItem('hotel_orders', JSON.stringify(updated));
          localStorage.setItem('hotel_orders_updated', Date.now().toString());
        } catch (e) {}
        return updated;
      });
      setSelectedOrderId(nextOrder.id);
    } catch (error) {
      console.warn('Backend order creation error, saving order locally for live dashboard:', error);
      const fallbackOrder = normalizeOrder({
        id: Date.now(),
        ...payload,
        status: 'Preparing',
        paymentStatus: 'pending',
        createdAt: new Date().toISOString()
      });
      setOrders((prev) => {
        const updated = [fallbackOrder, ...prev];
        try {
          localStorage.setItem('hotel_orders', JSON.stringify(updated));
          localStorage.setItem('hotel_orders_updated', Date.now().toString());
        } catch (e) {}
        return updated;
      });
      setSelectedOrderId(fallbackOrder.id);
    }
  };
  const handleSendMessage = async (recipientId, recipientName, recipientRole, content) => {
    try {
      const response = await createMessage({ recipientId, recipientName, recipientRole, content });
      setMessages((prev) => [response.data, ...prev]);
    } catch (error) {
      console.error(error);
      alert('Could not send message.');
    }
  };

  const handleCopilotSubmit = async (event) => {
    event.preventDefault();
    const prompt = copilotInput.trim();
    if (!prompt || isCopilotLoading) return;
    setCopilotMessages((prev) => [...prev, { role: 'user', content: prompt }]);
    setCopilotInput('');
    setIsCopilotLoading(true);
    try {
      const response = await askCopilot({
        prompt,
        context: {
          role,
          orders,
          inventory,
          menuItems,
          managerCount: accounts.filter((account) => account.role === 'manager').length,
          staffCount: accounts.filter((account) => account.role === 'staff').length,
          expenses,
          totalExpenses: expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0),
          expenseSummary: expenses[0] ? `${expenses[0].category} ₹${expenses[0].amount}` : ''
        }
      });
      setCopilotMessages((prev) => [...prev, { role: 'assistant', content: response.data?.response || 'I could not find a reliable answer in the current workspace.' }]);
    } catch (error) {
      setCopilotMessages((prev) => [...prev, { role: 'assistant', content: 'The assistant is unavailable right now. Please try again in a moment.' }]);
    } finally {
      setIsCopilotLoading(false);
    }
  };

  const handleViewChange = (nextView) => {
    setActiveView(nextView);
    navigate(`/dashboard/${nextView}`);
  };

  const renderDashboard = (currentView, onNavigate) => {
    const viewToUse = currentView || activeView;
    const navHandler = onNavigate || handleViewChange;

    if (role === 'manager') {
      return (
        <ManagerDashboard
          activeView={viewToUse}
          setActiveView={navHandler}
          hotels={hotels}
          accounts={accounts}
          staffCategory={staffCategory}
          menuItems={menuItems}
          customers={customers}
          orders={orders}
          tables={tables}
          tableCleanStatus={tableCleanStatus}
          onCleanTable={handleCleanTable}
          onMarkTableNeedsCleaning={handleMarkTableNeedsCleaning}
          onAddTable={handleAddTable}
          onDeleteTable={handleDeleteTable}
          bartanStock={bartanStock}
          analytics={analytics}
          messages={messages}
          selectedOrder={selectedOrder}
          onCreateCustomer={handleCreateCustomer}
          onSelectOrder={setSelectedOrderId}
          onSaveOrder={handleSaveOrder}
          onUpdateOrderStatus={handleUpdateOrderStatus}
          onDeleteOrder={handleDeleteOrder}
          onSendMessage={handleSendMessage}
          onPaymentCompleted={handlePaymentCompleted}
        />
      );
    }

    if (role === 'staff') {
      return (
        <StaffDashboard
          activeView={viewToUse}
          setActiveView={navHandler}
          hotels={hotels}
          accounts={accounts}
          staffCategory={staffCategory}
          menuItems={menuItems}
          customers={customers}
          orders={orders}
          tables={tables}
          tableCleanStatus={tableCleanStatus}
          onCleanTable={handleCleanTable}
          onMarkTableNeedsCleaning={handleMarkTableNeedsCleaning}
          bartanStock={bartanStock}
          onCleanBartan={handleCleanBartan}
          onCleanAllBartan={handleCleanAllBartan}
          messages={messages}
          selectedOrder={selectedOrder}
          onCreateCustomer={handleCreateCustomer}
          onSelectOrder={setSelectedOrderId}
          onSaveOrder={handleSaveOrder}
          onUpdateOrderStatus={handleUpdateOrderStatus}
          onDeleteOrder={handleDeleteOrder}
          onSendMessage={handleSendMessage}
          onPaymentCompleted={handlePaymentCompleted}
        />
      );
    }

    if (role === 'customer') {
      return (
        <CustomerDashboard
          activeView={viewToUse}
          setActiveView={navHandler}
          menuItems={menuItems}
          orders={orders}
          userName={userName}
          userEmail={userEmail}
          userId={userId}
          customerTableNumber={customerTableNumber}
          selectedOrderId={selectedOrderId}
          onSelectOrder={setSelectedOrderId}
          onCreateOrder={handleCreateCustomerOrder}
          onPaymentCompleted={handlePaymentCompleted}
          onRefresh={handleRefreshData}
          isRefreshing={isRefreshing}
        />
      );
    }

    return (
      <OwnerDashboard
        activeView={viewToUse}
        setActiveView={navHandler}
        hotels={hotels}
        accounts={accounts}
        menuItems={menuItems}
        customers={customers}
        orders={orders}
        analytics={analytics}
        inventory={inventory}
        expenses={expenses}
        messages={messages}
        selectedOrder={selectedOrder}
        onAddHotel={handleAddHotel}
        onAddAccount={handleAddAccount}
        onDeleteAccount={handleDeleteAccount}
        onAddMenuItem={handleAddMenuItem}
        onAddExpense={handleAddExpense}
        onDeleteExpense={handleDeleteExpense}
        onDeleteMenuItem={handleDeleteMenuItem}
        onCreateCustomer={handleCreateCustomer}
        onSelectOrder={setSelectedOrderId}
        onDeleteOrder={handleDeleteOrder}
        onSendMessage={handleSendMessage}
      />
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <span className="h-3 w-3 animate-ping rounded-full bg-amber-500" />
          <span className="font-semibold text-slate-800 text-sm">
            Initializing Royal Plaza Hotel live workspace...
          </span>
        </div>
      </div>
    );
  }

  const defaultDashboardPath = `/dashboard/${activeView || getDefaultViewForRole(role || 'owner', staffCategory)}`;

  return (
    <Routes>
      {/* Root Route: Always displays Sign In & Create Account page */}
      <Route
        path="/"
        element={
          <AuthPage
            hotels={hotels}
            onLogin={handleLogin}
            initialMode="login"
            isAuthenticated={isAuthenticated}
            userName={userName}
            role={role}
            defaultDashboardPath={defaultDashboardPath}
          />
        }
      />

      {/* Auth Routes */}
      <Route
        path="/login"
        element={
          <AuthPage
            hotels={hotels}
            onLogin={handleLogin}
            initialMode="login"
            isAuthenticated={isAuthenticated}
            userName={userName}
            role={role}
            defaultDashboardPath={defaultDashboardPath}
          />
        }
      />
      <Route
        path="/register"
        element={
          <AuthPage
            hotels={hotels}
            onLogin={handleLogin}
            initialMode="signup"
            isAuthenticated={isAuthenticated}
            userName={userName}
            role={role}
            defaultDashboardPath={defaultDashboardPath}
          />
        }
      />

      <Route
        path="/forgot-password"
        element={
          <AuthPage
            hotels={hotels}
            onLogin={handleLogin}
            initialMode="forgot"
            isAuthenticated={isAuthenticated}
            userName={userName}
            role={role}
            defaultDashboardPath={defaultDashboardPath}
          />
        }
      />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Typo aliases explicitly requested by user */}
      <Route path="/rigiter" element={<Navigate to="/register" replace />} />
      <Route path="/signup" element={<Navigate to="/register" replace />} />
      <Route path="/forgot" element={<Navigate to="/forgot-password" replace />} />
      <Route path="/forgotpassword" element={<Navigate to="/forgot-password" replace />} />
      <Route path="/forgetpassword" element={<Navigate to="/forgot-password" replace />} />
      <Route path="/forget-password" element={<Navigate to="/forgot-password" replace />} />
      <Route path="/resetpassword" element={<Navigate to="/reset-password" replace />} />
      <Route path="/dashboared" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboared/:view" element={<DashboaredTypoRedirect />} />

      {/* Direct Menu / Route shortcuts */}
      <Route path="/overview" element={isAuthenticated ? <Navigate to="/dashboard/overview" replace /> : <Navigate to="/" replace />} />
      <Route path="/tables" element={isAuthenticated ? <Navigate to="/dashboard/tables" replace /> : <Navigate to="/" replace />} />
      <Route path="/menu" element={isAuthenticated ? <Navigate to="/dashboard/menu" replace /> : <Navigate to="/" replace />} />
      <Route path="/orders" element={isAuthenticated ? <Navigate to="/dashboard/orders" replace /> : <Navigate to="/" replace />} />
      <Route path="/team" element={isAuthenticated ? <Navigate to="/dashboard/team" replace /> : <Navigate to="/" replace />} />
      <Route path="/billing" element={isAuthenticated ? <Navigate to="/dashboard/billing" replace /> : <Navigate to="/" replace />} />
      <Route path="/customers" element={isAuthenticated ? <Navigate to="/dashboard/customers" replace /> : <Navigate to="/" replace />} />
      <Route path="/bartan" element={isAuthenticated ? <Navigate to="/dashboard/bartan" replace /> : <Navigate to="/" replace />} />
      <Route path="/feedback" element={isAuthenticated ? <Navigate to="/dashboard/feedback" replace /> : <Navigate to="/" replace />} />
      <Route path="/hotel" element={isAuthenticated ? <Navigate to="/dashboard/hotel" replace /> : <Navigate to="/" replace />} />

      {/* Protected Dashboard Routes */}
      <Route
        path="/dashboard/:view"
        element={
          isAuthenticated ? (
            <DashboardLayoutWrapper
              role={role}
              userName={userName}
              staffCategory={staffCategory}
              activeView={activeView}
              setActiveView={setActiveView}
              tables={tables}
              tableCleanStatus={tableCleanStatus}
              bartanStock={bartanStock}
              hotels={hotels}
              accounts={accounts}
              menuItems={menuItems}
              customers={customers}
              orders={orders}
              analytics={analytics}
              inventory={inventory}
              expenses={expenses}
              messages={messages}
              selectedOrder={selectedOrder}
              selectedOrderId={selectedOrderId}
              setSelectedOrderId={setSelectedOrderId}
              handleAddHotel={handleAddHotel}
              handleAddAccount={handleAddAccount}
              handleDeleteAccount={handleDeleteAccount}
              handleAddMenuItem={handleAddMenuItem}
              handleAddExpense={handleAddExpense}
              handleDeleteExpense={handleDeleteExpense}
              handleDeleteMenuItem={handleDeleteMenuItem}
              handleCreateCustomer={handleCreateCustomer}
              handleCreateCustomerOrder={handleCreateCustomerOrder}
              handleSaveOrder={handleSaveOrder}
              handleUpdateOrderStatus={handleUpdateOrderStatus}
              handleDeleteOrder={handleDeleteOrder}
              handleSendMessage={handleSendMessage}
              handlePaymentCompleted={handlePaymentCompleted}
              handleRefreshData={handleRefreshData}
              isRefreshing={isRefreshing}
              handleLogout={handleLogout}
              userId={userId}
              userEmail={userEmail}
              customerTableNumber={customerTableNumber}
              copilotMessages={copilotMessages}
              copilotInput={copilotInput}
              setCopilotInput={setCopilotInput}
              isCopilotLoading={isCopilotLoading}
              handleCopilotSubmit={handleCopilotSubmit}
              handleViewChange={handleViewChange}
              renderDashboard={renderDashboard}
              waiterNotifications={waiterNotifications}
              handleDismissWaiterNotification={handleDismissWaiterNotification}
              handleDeliverOrderFromToast={handleDeliverOrderFromToast}
            />
          ) : (
            <Navigate to="/" state={{ from: location }} replace />
          )
        }
      />
      <Route
        path="/dashboard"
        element={
          isAuthenticated ? (
            <Navigate to={defaultDashboardPath} replace />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />

      {/* Catch-all 404 redirect */}
      <Route
        path="*"
        element={
          isAuthenticated ? (
            <Navigate to={defaultDashboardPath} replace />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
    </Routes>
  );
}

function DashboardLayoutWrapper({
  role,
  userName,
  staffCategory,
  activeView,
  setActiveView,
  tables,
  hotels,
  accounts,
  menuItems,
  customers,
  orders,
  analytics,
  inventory,
  expenses,
  messages,
  selectedOrder,
  selectedOrderId,
  setSelectedOrderId,
  handleAddHotel,
  handleAddAccount,
  handleDeleteAccount,
  handleAddMenuItem,
  handleAddExpense,
  handleDeleteExpense,
  handleDeleteMenuItem,
  handleCreateCustomer,
  handleCreateCustomerOrder,
  handleSaveOrder,
  handleUpdateOrderStatus,
  handleDeleteOrder,
  handleSendMessage,
  handlePaymentCompleted,
  handleRefreshData,
  isRefreshing,
  handleLogout,
  userId,
  userEmail,
  customerTableNumber,
  copilotMessages,
  copilotInput,
  setCopilotInput,
  isCopilotLoading,
  handleCopilotSubmit,
  handleViewChange,
  renderDashboard,
  waiterNotifications = [],
  handleDismissWaiterNotification,
  handleDeliverOrderFromToast
}) {
  const { view } = useParams();
  const currentView = view || activeView || getDefaultViewForRole(role, staffCategory);

  useEffect(() => {
    if (view && view !== activeView) {
      setActiveView(view);
    }
  }, [view, activeView, setActiveView]);

  return (
    <SharedLayout
      role={role}
      userName={userName}
      staffCategory={staffCategory}
      activeView={currentView}
      setActiveView={handleViewChange}
      tablesCount={tables.length}
      onLogout={handleLogout}
      onRefresh={handleRefreshData}
      isRefreshing={isRefreshing}
      messages={messages}
    >
      <div className="space-y-6">
        {renderDashboard(currentView, handleViewChange)}

        <WaiterNotificationToast
          notifications={waiterNotifications}
          onDismiss={handleDismissWaiterNotification}
          onDeliverOrder={handleDeliverOrderFromToast}
        />

        {role !== 'customer' && currentView === 'overview' && (
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 text-white shadow-sm shadow-amber-500/20">
                  <span className="text-base">✨</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-display text-base font-bold text-slate-900">AI Hotel Operations Copilot</h2>
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">GPT-Powered</span>
                  </div>
                  <p className="text-xs text-slate-500">Instant intelligence on revenue, table turns, orders, and role tasks</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    if (window.confirm('Clear all stored AI Copilot conversation history from database?')) {
                      try {
                        await clearCopilotHistory();
                        setCopilotMessages([{ role: 'assistant', content: 'Chat history cleared. How can I assist you with hotel operations today?' }]);
                      } catch (e) {
                        alert('Could not clear history');
                      }
                    }
                  }}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-500 hover:text-rose-600 hover:border-rose-200 transition cursor-pointer"
                  title="Clear history from database"
                >
                  Clear History
                </button>
                <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                  DB Synced
                </div>
              </div>
            </div>

            {/* Quick Prompt Suggestion Chips */}
            <div className="mb-3 flex flex-wrap gap-1.5">
              {[
                'How is business revenue today?',
                'Which tables are currently occupied?',
                'Are there any pending kitchen orders?',
                'What are the best-selling Gujarati dishes?'
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => setCopilotInput(suggestion)}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600 transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-900 cursor-pointer"
                >
                  💡 {suggestion}
                </button>
              ))}
            </div>

            {/* Chat Messages Container */}
            <div className="max-h-80 space-y-3 overflow-y-auto rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4">
              {copilotMessages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={`max-w-2xl rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed ${
                    message.role === 'user'
                      ? 'ml-auto bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-white shadow-sm font-medium'
                      : 'bg-white text-slate-800 shadow-sm border border-slate-200/80'
                  }`}
                >
                  {message.content}
                </div>
              ))}
              {isCopilotLoading && (
                <div className="flex max-w-xs items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-xs text-amber-700 shadow-sm border border-slate-200">
                  <span className="inline-block h-2 w-2 animate-ping rounded-full bg-amber-500" />
                  <span>AI Copilot is analyzing live hotel data...</span>
                </div>
              )}
            </div>

            {/* Input Form */}
            <form onSubmit={handleCopilotSubmit} className="mt-3.5 flex flex-col gap-2.5 sm:flex-row">
              <input
                value={copilotInput}
                onChange={(event) => setCopilotInput(event.target.value)}
                disabled={isCopilotLoading}
                className="flex-1 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20 disabled:opacity-75"
                placeholder={`Ask Copilot about ${role === 'customer' ? 'dishes or order status' : 'revenue, staff, inventory, or orders'}...`}
              />
              <button
                type="submit"
                disabled={isCopilotLoading}
                className="rounded-2xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-amber-500/20 transition hover:brightness-105 active:scale-[0.99] disabled:opacity-60 cursor-pointer"
              >
                {isCopilotLoading ? 'Analyzing...' : 'Ask Copilot'}
              </button>
            </form>
          </section>
        )}
      </div>
    </SharedLayout>
  );
}

function DashboaredTypoRedirect() {
  const { view } = useParams();
  return <Navigate to={view ? `/dashboard/${view}` : '/dashboard'} replace />;
}

export default App;



