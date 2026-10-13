/**
 * Kitchen Bartan / Utensils stock calculation & synchronization utilities.
 * Connects dishware inventory dynamically with customer orders, active tables,
 * dirty dishes in wash sinks, and cleaning staff sanitation actions.
 */

export const DEFAULT_BARTAN_DEFINITIONS = [
  { id: 'plates', name: 'Dining Plates / Thali', total: 50, unit: 'plates' },
  { id: 'glasses', name: 'Water Glasses', total: 60, unit: 'glasses' },
  { id: 'bowls', name: 'Curry Bowls / Katori', total: 80, unit: 'bowls' },
  { id: 'spoons', name: 'Spoons & Cutlery', total: 100, unit: 'pcs' },
  { id: 'pots', name: 'Cooking Pots / Handi', total: 25, unit: 'pots' }
];

/**
 * Calculates the exact utensils consumed by a single customer order.
 * @param {object} order - Customer order object with items array
 * @returns {object} { plates, glasses, bowls, spoons, pots }
 */
export const calculateOrderUtensils = (order) => {
  const items = Array.isArray(order?.items) ? order.items : [];
  let plates = 0;
  let glasses = 0;
  let bowls = 0;
  let spoons = 0;
  let pots = 0;

  if (items.length > 0) {
    items.forEach((item) => {
      const qty = Math.max(1, Number(item.qty || 1));
      const name = (item.name || '').toLowerCase();
      const cat = (item.category || '').toLowerCase();

      // Plates / Thalis
      if (name.includes('thali') || name.includes('platter')) {
        plates += qty * 1;
        bowls += qty * 3; // Thali includes multiple katoris
        spoons += qty * 2;
        glasses += qty * 1;
      } else {
        plates += qty * 1;
      }

      // Glasses: beverages, water, chaas, lassi
      if (
        name.includes('lassi') ||
        name.includes('chaas') ||
        name.includes('buttermilk') ||
        name.includes('juice') ||
        name.includes('water') ||
        name.includes('soda') ||
        name.includes('shake') ||
        name.includes('tea') ||
        name.includes('coffee') ||
        cat.includes('beverage') ||
        cat.includes('drink')
      ) {
        glasses += qty * 1;
      }

      // Bowls / Katori: curries, gravies, dals, sabzis, soups, desserts, sambar
      if (
        name.includes('dal') ||
        name.includes('curry') ||
        name.includes('gravy') ||
        name.includes('sabzi') ||
        name.includes('soup') ||
        name.includes('kheer') ||
        name.includes('halwa') ||
        name.includes('gulab') ||
        name.includes('sambar') ||
        name.includes('kadhi') ||
        name.includes('chole') ||
        name.includes('paneer')
      ) {
        bowls += qty * 1;
      }

      // Spoons: curries, rice, biryani, soups, desserts
      if (
        name.includes('rice') ||
        name.includes('biryani') ||
        name.includes('khichdi') ||
        name.includes('soup') ||
        name.includes('dal') ||
        name.includes('curry') ||
        name.includes('kheer') ||
        name.includes('halwa') ||
        name.includes('gulab')
      ) {
        spoons += qty * 1;
      }

      // Cooking pots / Handi: handi dishes, curries, biryanis
      if (
        name.includes('handi') ||
        name.includes('kadai') ||
        name.includes('biryani') ||
        name.includes('dal') ||
        name.includes('paneer') ||
        name.includes('curry')
      ) {
        pots += Math.ceil(qty / 2);
      }
    });

    // Baseline minimum requirements for active dining order
    plates = Math.max(plates, 2);
    glasses = Math.max(glasses, 2);
    bowls = Math.max(bowls, 2);
    spoons = Math.max(spoons, plates * 2);
    pots = Math.max(pots, 1);
  } else {
    // Default baseline allocation for empty/unspecified items order
    plates = 2;
    glasses = 2;
    bowls = 2;
    spoons = 4;
    pots = 1;
  }

  return { plates, glasses, bowls, spoons, pots };
};

/**
 * Computes live 3-way dishware stock:
 * - inUse: currently on active tables / kitchen
 * - dirty: in washing sink awaiting cleaning man
 * - clean: clean and sanitized on kitchen shelves
 * 
 * @param {Array} orders - List of all hotel orders
 * @param {object} dirtyUtensilsMap - { plates: number, glasses: number, ... }
 * @returns {Array} List of dishware stock items with full counts & table info
 */
export const computeLiveBartanStock = (orders = [], dirtyUtensilsMap = {}) => {
  // 1. Identify all active dining orders
  const activeOrders = orders.filter((order) => {
    const s = String(order.status || '').toLowerCase();
    const p = String(order.paymentStatus || '').toLowerCase();
    return s !== 'completed' && s !== 'cancelled' && p !== 'paid';
  });

  // 2. Tally in-use utensils across all active orders and track tables
  const inUseCounts = { plates: 0, glasses: 0, bowls: 0, spoons: 0, pots: 0 };
  const activeTablesMap = { plates: new Set(), glasses: new Set(), bowls: new Set(), spoons: new Set(), pots: new Set() };

  activeOrders.forEach((order) => {
    const tableNum = order.tableNumber;
    const req = calculateOrderUtensils(order);

    Object.keys(inUseCounts).forEach((key) => {
      if (req[key] > 0) {
        inUseCounts[key] += req[key];
        if (tableNum) activeTablesMap[key].add(Number(tableNum));
      }
    });
  });

  // 3. Construct live stock array preserving totals and calculating clean available
  return DEFAULT_BARTAN_DEFINITIONS.map((def) => {
    const total = def.total;
    const inUse = Math.min(total, inUseCounts[def.id] || 0);
    const rawDirty = Math.max(0, Number(dirtyUtensilsMap[def.id] || 0));
    // Dirty cannot exceed (total - inUse)
    const dirty = Math.min(total - inUse, rawDirty);
    const clean = Math.max(0, total - inUse - dirty);

    const activeTables = Array.from(activeTablesMap[def.id] || []).sort((a, b) => a - b);

    return {
      id: def.id,
      name: def.name,
      unit: def.unit,
      total,
      clean,
      inUse,
      dirty,
      activeTables,
      activeOrdersCount: activeOrders.length
    };
  });
};
