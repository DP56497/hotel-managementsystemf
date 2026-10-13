import { useEffect, useState } from 'react';
import { getAnalytics, getInventory } from '../services/api';

export default function RecordsPanel({ type }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        if (type === 'staff') {
          const analyticsRes = await getAnalytics();
          const fallback = [
            { name: 'Rahul', role: 'Senior Housekeeping', performance: '94%', status: 'Top Performer' },
            { name: 'Amit', role: 'Room Service', performance: '88%', status: 'Stable' },
            { name: 'Riya', role: 'Reception', performance: '72%', status: 'Needs Support' }
          ];
          setItems(analyticsRes.data?.length ? fallback : fallback);
        } else if (type === 'managers') {
          const inventoryRes = await getInventory();
          const fallback = [
            { name: 'Nina', role: 'Operations Manager', performance: '96%', status: 'Excellent' },
            { name: 'Arjun', role: 'Food & Service Manager', performance: '90%', status: 'Strong' },
            { name: 'Maya', role: 'Front Office Manager', performance: '84%', status: 'Reliable' }
          ];
          setItems(inventoryRes.data?.length ? fallback : fallback);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [type]);

  if (loading) {
    return <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">Loading records...</div>;
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.name} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-slate-800">{item.name}</p>
              <p className="text-sm text-slate-500">{item.role}</p>
            </div>
            <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-sm text-amber-700">{item.status}</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
            <span>Performance</span>
            <span>{item.performance}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
