import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { IndianRupee, TrendingUp, Download, Filter, Search } from 'lucide-react';
import { useAddTransaction } from '../components/AddTransactionContext';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { toast } from 'sonner';

// ── API types ──
interface MonthlyTrendEntry {
  _id: { year: number; month: number; branchName?: string };
  revenue: number;
}

interface BranchWise {
  _id: string;
  branchName: string;
  revenue: number;
  dues: number;
  count: number;
}

interface MethodBreakdown {
  _id: string;
  total: number;
  count: number;
}

interface FeeSummary {
  totalRevenue: number;
  totalDues: number;
  totalTransactions: number;
  branchWise: BranchWise[];
  methodBreakdown: MethodBreakdown[];
  monthlyTrend: MonthlyTrendEntry[];
}

interface ApiFee {
  _id: string;
  amount: number;
  dueAmount?: number;
  paymentDate?: string;
  createdAt?: string;
  method?: 'cash' | 'upi' | 'bank_transfer' | 'card';
  status: 'paid' | 'partial' | 'overdue' | 'pending';
  description?: string;
  receiptNumber?: string;
  patientId?: { _id: string; name: string; parentName?: string } | null;
  branchId?: { _id: string; name: string } | null;
}

type StatusFilter = 'All' | 'paid' | 'partial' | 'overdue' | 'pending';

const STATUS_LABEL: Record<ApiFee['status'], string> = {
  paid: 'Paid',
  partial: 'Partial',
  overdue: 'Overdue',
  pending: 'Pending',
};

const METHOD_LABEL: Record<string, string> = {
  cash: 'Cash',
  upi: 'UPI',
  bank_transfer: 'Bank Transfer',
  card: 'Card',
};

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const formatInr = (value: number) => {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
  return `₹${value.toLocaleString()}`;
};

const FinanceChart = ({ trend }: { trend: MonthlyTrendEntry[] }) => {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  const chartData = useMemo(() => {
    const byMonth = new Map<string, { name: string; Revenue: number; order: number }>();
    trend.forEach(t => {
      const key = `${t._id.year}-${t._id.month}`;
      const existing = byMonth.get(key);
      const order = t._id.year * 12 + t._id.month;
      if (existing) {
        existing.Revenue += t.revenue;
      } else {
        byMonth.set(key, {
          name: `${MONTH_LABELS[t._id.month - 1]} '${String(t._id.year).slice(-2)}`,
          Revenue: t.revenue,
          order,
        });
      }
    });
    return Array.from(byMonth.values()).sort((a, b) => a.order - b.order);
  }, [trend]);

  if (!isMounted) {
    return <div className="h-[300px] w-full animate-pulse bg-surface-container-low rounded-xl"></div>;
  }
  if (chartData.length === 0) {
    return <div className="h-[300px] w-full flex items-center justify-center text-on-surface-variant/60 text-sm">No revenue data yet.</div>;
  }

  return (
    <div className="h-[300px] w-full mt-6">
      <ResponsiveContainer width="99%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 600 }}
            dy={10}
          />
          <YAxis hide />
          <Tooltip
            formatter={(value) => [`₹${Number(value ?? 0).toLocaleString()}`, 'Revenue'] as [string, string]}
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
          />
          <Area type="monotone" dataKey="Revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

const formatDate = (iso?: string) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

export const FinanceView = ({ initialData }: { initialData?: any }) => {
  const hasServerData = !!initialData;
  const [summary, setSummary] = useState<FeeSummary | null>(initialData?.summary || null);
  const [fees, setFees] = useState<ApiFee[]>(initialData?.fees || []);
  const [isLoading, setIsLoading] = useState(!hasServerData);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<StatusFilter>('All');
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);

  // Register to receive new transactions from the global Add Transaction modal
  const { registerSavedHandler } = useAddTransaction();
  useEffect(() => {
    registerSavedHandler((tx) => {
      const newFee: ApiFee = {
        _id: tx._id,
        amount: tx.amount,
        paymentDate: tx.paymentDate,
        method: (tx.method as ApiFee['method']) || 'cash',
        status: tx.status as ApiFee['status'],
        description: tx.description,
        receiptNumber: tx.receiptNumber,
        patientId: tx.patientId ?? null,
        branchId: tx.branchId ?? null,
      };
      setFees(prev => [newFee, ...prev]);
    });
  }, [registerSavedHandler]);

  useEffect(() => {
    if (hasServerData) return;

    const fetchFinance = async () => {
      try {
        setIsLoading(true);
        const [summaryRes, feesRes] = await Promise.all([
          api.get('/admin/fees/summary'),
          api.get('/admin/fees'),
        ]);
        if (summaryRes.data.success) setSummary(summaryRes.data.data as FeeSummary);
        if (feesRes.data.success) setFees(feesRes.data.data as ApiFee[]);
      } catch (err) {
        console.error('Failed to load finance data:', err);
        toast.error('Failed to load finance data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchFinance();
  }, []);

  const netCollected = (summary?.totalRevenue || 0) - (summary?.totalDues || 0);
  const profitPercent = summary && summary.totalRevenue > 0
    ? Math.round((netCollected / summary.totalRevenue) * 100)
    : 0;

  const filteredFees = fees.filter(f => {
    const q = searchTerm.toLowerCase();
    const patientName = f.patientId?.name || '';
    const branchName = f.branchId?.name || '';
    const description = f.description || '';
    const matchesSearch =
      patientName.toLowerCase().includes(q) ||
      branchName.toLowerCase().includes(q) ||
      description.toLowerCase().includes(q) ||
      (f.receiptNumber?.toLowerCase().includes(q) ?? false);
    const matchesFilter = activeFilter === 'All' || f.status === activeFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="w-full space-y-4 sm:space-y-6 lg:space-y-8 pb-6 lg:pb-10">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/10 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <IndianRupee size={120} />
          </div>
          <p className="text-sm font-bold text-on-surface-variant opacity-70 mb-1">Total Revenue</p>
          <h3 className="text-4xl font-black text-on-surface">{formatInr(summary?.totalRevenue || 0)}</h3>
          <p className="text-xs text-green-600 font-bold mt-2 flex items-center gap-1">
            <TrendingUp size={14} /> {summary?.totalTransactions || 0} transactions
          </p>
        </div>
        <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/10 shadow-sm relative overflow-hidden">
          <p className="text-sm font-bold text-on-surface-variant opacity-70 mb-1">Outstanding Dues</p>
          <h3 className="text-4xl font-black text-error">{formatInr(summary?.totalDues || 0)}</h3>
          <p className="text-xs text-error font-bold mt-2 flex items-center gap-1">
            Pending collection
          </p>
        </div>
        <div className="bg-primary/5 p-6 rounded-2xl border border-primary/20 shadow-sm relative overflow-hidden">
          <p className="text-sm font-bold text-primary opacity-80 mb-1">Net Collected</p>
          <h3 className="text-4xl font-black text-primary">{formatInr(netCollected)}</h3>
          <div className="mt-2 w-full bg-primary/20 rounded-full h-1.5 overflow-hidden">
            <div className="bg-primary h-full rounded-full" style={{ width: `${Math.min(profitPercent, 100)}%` }}></div>
          </div>
          <p className="text-[10px] text-primary/70 font-bold mt-2 uppercase tracking-wider">{profitPercent}% collected</p>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-surface-container-lowest p-4 sm:p-6 lg:p-8 rounded-2xl border border-outline-variant/10 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-xl font-bold font-headline text-on-surface">Monthly Revenue</h3>
            <p className="text-sm font-medium text-on-surface-variant opacity-60">Last 6 months across all branches</p>
          </div>
        </div>
        {isLoading ? (
          <div className="h-[300px] w-full animate-pulse bg-surface-container-low rounded-xl mt-6"></div>
        ) : (
          <FinanceChart trend={summary?.monthlyTrend || []} />
        )}
      </div>

      {/* Branch-wise breakdown */}
      {summary && summary.branchWise.length > 0 && (
        <div className="bg-surface-container-lowest p-4 sm:p-6 lg:p-8 rounded-2xl border border-outline-variant/10 shadow-sm">
          <h3 className="text-xl font-bold font-headline text-on-surface mb-6">Branch Performance</h3>
          <div className="space-y-4">
            {summary.branchWise.map(branch => {
              const max = Math.max(...summary.branchWise.map(b => b.revenue), 1);
              const percent = (branch.revenue / max) * 100;
              return (
                <div key={branch._id}>
                  <div className="flex justify-between items-end mb-2">
                    <div>
                      <p className="text-sm font-bold text-on-surface">{branch.branchName}</p>
                      <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider mt-0.5 opacity-60">
                        {branch.count} txns · {formatInr(branch.dues)} dues
                      </p>
                    </div>
                    <span className="text-sm font-black text-secondary">{formatInr(branch.revenue)}</span>
                  </div>
                  <div className="w-full h-2 bg-surface-container-low rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percent}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className="h-full rounded-full bg-secondary"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Transactions Table */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/10 overflow-visible">
        <div className="p-4 sm:p-6 border-b border-surface-container-low flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="text-xl font-bold font-headline text-on-surface">Recent Transactions</h3>

          <div className="flex w-full md:w-auto items-center gap-3">
            <div className="relative flex-1 md:flex-none">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/50" size={18} />
              <input
                type="text"
                placeholder="Search patient, branch, receipt..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full md:w-64 bg-surface-container-low/50 border border-outline-variant/20 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all font-medium text-on-surface"
              />
            </div>
            <div className="relative">
              <button
                onClick={() => setIsFilterMenuOpen((prev) => !prev)}
                className="p-2 border border-outline-variant/20 rounded-xl text-on-surface-variant hover:bg-surface-container-low transition-colors"
                aria-label="Filter transactions"
              >
                <Filter size={18} />
              </button>

              <AnimatePresence>
                {isFilterMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="absolute right-0 mt-2 w-44 rounded-xl border border-outline-variant/20 bg-surface-container-lowest shadow-xl p-2 z-20"
                  >
                    {(['All', 'paid', 'partial', 'overdue', 'pending'] as StatusFilter[]).map((option) => (
                      <button
                        key={option}
                        onClick={() => {
                          setActiveFilter(option);
                          setIsFilterMenuOpen(false);
                        }}
                        className={cn(
                          "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors capitalize",
                          activeFilter === option
                            ? "bg-primary/10 text-primary font-semibold"
                            : "text-on-surface-variant hover:bg-surface-container-low"
                        )}
                      >
                        {option === 'All' ? 'All' : STATUS_LABEL[option as ApiFee['status']]}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <button className="p-2 border border-outline-variant/20 rounded-xl text-on-surface-variant hover:bg-surface-container-low transition-colors">
              <Download size={18} />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="h-80 flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin mx-auto mb-4"></div>
              <p className="text-on-surface-variant">Loading transactions...</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low/30">
                  <th className="px-4 sm:px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider opacity-70">Transaction</th>
                  <th className="px-4 sm:px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider opacity-70">Branch</th>
                  <th className="px-4 sm:px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider opacity-70">Method</th>
                  <th className="px-4 sm:px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider opacity-70">Date</th>
                  <th className="px-4 sm:px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider opacity-70">Amount</th>
                  <th className="px-4 sm:px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider opacity-70 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-low/50">
                {filteredFees.map((fee) => (
                  <motion.tr
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    key={fee._id}
                    className="hover:bg-surface-container-low/20 transition-colors"
                  >
                    <td className="px-4 sm:px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold bg-green-50 text-green-600">
                          <TrendingUp size={18} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-on-surface">
                            {fee.patientId?.name || 'Unknown patient'}
                          </span>
                          <span className="text-[10px] text-on-surface-variant uppercase tracking-wider font-bold opacity-60 mt-0.5">
                            {fee.receiptNumber || fee._id.slice(-8)}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-sm font-medium text-on-surface-variant">
                      {fee.branchId?.name || '—'}
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <span className="px-3 py-1 bg-surface-container-low rounded-lg text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                        {METHOD_LABEL[fee.method || 'cash'] || fee.method}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-sm font-medium text-on-surface-variant">
                      {formatDate(fee.paymentDate || fee.createdAt)}
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-green-600">+₹{fee.amount.toLocaleString()}</span>
                        {(fee.dueAmount ?? 0) > 0 && (
                          <span className="text-[10px] text-error font-bold">Due ₹{(fee.dueAmount ?? 0).toLocaleString()}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-right">
                      <span className={cn(
                        "px-3 py-1.5 text-[10px] font-black rounded-lg uppercase tracking-wider",
                        fee.status === 'paid' && "bg-green-50 text-green-700",
                        fee.status === 'partial' && "bg-amber-50 text-amber-700",
                        fee.status === 'overdue' && "bg-error/10 text-error",
                        fee.status === 'pending' && "bg-surface-container-low text-on-surface-variant"
                      )}>
                        {STATUS_LABEL[fee.status]}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>

            {filteredFees.length === 0 && (
              <div className="p-10 text-center text-on-surface-variant opacity-60">
                No transactions found.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
