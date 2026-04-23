"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  IndianRupee, TrendingUp, TrendingDown, Download, Filter, Search,
  Plus, X, Loader2, AlertCircle, Wallet, ArrowUpRight, ArrowDownRight,
  BarChart3, Receipt
} from 'lucide-react';
import { useAddTransaction } from '../components/AddTransactionContext';
import { Pagination } from '../components/Pagination';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useBranch } from '../components/BranchContext';

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

interface Expense {
  _id: string;
  amount: number;
  purpose: string;
  date: string;
}

type StatusFilter = 'All' | 'paid' | 'partial' | 'overdue' | 'pending';

const STATUS_LABEL: Record<ApiFee['status'], string> = {
  paid: 'Paid', partial: 'Partial', overdue: 'Overdue', pending: 'Pending',
};

const METHOD_LABEL: Record<string, string> = {
  cash: 'Cash', upi: 'UPI', bank_transfer: 'Bank Transfer', card: 'Card',
};

const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const formatInr = (value: number) => {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`;
  return `₹${value.toLocaleString()}`;
};

const formatDate = (iso?: string) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
};

// ── Add Expense Modal ──
function AddExpenseModal({
  isOpen,
  onClose,
  onAdd,
}: {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (expense: Expense) => void;
}) {
  const [amount, setAmount] = useState('');
  const [purpose, setPurpose] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (!isOpen) { setAmount(''); setPurpose(''); }
  }, [isOpen]);

  const isValid = amount.trim() !== '' && parseFloat(amount) > 0 && purpose.trim() !== '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    try {
      setIsSaving(true);
      // Optimistically add to local state; real projects would POST to backend
      const expense: Expense = {
        _id: `exp-${Date.now()}`,
        amount: parseFloat(amount),
        purpose: purpose.trim(),
        date: new Date().toISOString(),
      };
      onAdd(expense);
      toast.success('Expense recorded successfully!');
      onClose();
    } catch {
      toast.error('Failed to record expense');
    } finally {
      setIsSaving(false);
    }
  };

  const modal = (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[99999] overflow-y-auto"
          style={{ backgroundColor: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(8px)' }}
          onClick={onClose}
        >
          <div className="flex min-h-full items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="relative w-full max-w-md bg-white/97 backdrop-blur-xl border border-white shadow-2xl rounded-[28px] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
            >
              {/* Decorative blobs */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-red-100/50 rounded-full blur-3xl -z-10 -translate-y-1/2 translate-x-1/3 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-orange-100/40 rounded-full blur-3xl -z-10 translate-y-1/2 -translate-x-1/3 pointer-events-none" />

              {/* Header */}
              <div className="flex justify-between items-center px-7 py-5 border-b border-slate-100/70 bg-white/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-red-500">
                    <TrendingDown size={20} />
                  </div>
                  <div>
                    <h3 className="text-[17px] font-black text-slate-800">Record Expense</h3>
                    <p className="text-[11px] font-bold text-slate-400 mt-0.5">Deducted from net collected</p>
                  </div>
                </div>
                <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                  <X size={18} />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="px-7 py-6 space-y-5">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Amount (₹)</label>
                  <div className="relative flex items-center">
                    <span className="absolute left-4 text-sm font-black text-slate-500 border-r border-slate-200 pr-3 pointer-events-none">₹</span>
                    <input
                      type="number"
                      min="1"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-14 pr-4 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-400/20 focus:border-red-400/50 transition-all placeholder:text-slate-300"
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Purpose / Description</label>
                  <textarea
                    placeholder="e.g. Office supplies, Equipment repair, Utility bills..."
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-400/20 focus:border-red-400/50 transition-all placeholder:text-slate-300 min-h-[90px] resize-none"
                    required
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 transition-colors">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving || !isValid}
                    className="flex items-center gap-2 px-7 py-2.5 rounded-xl text-sm font-black bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 transition-all shadow-[0_8px_16px_-4px_rgba(239,68,68,0.4)]"
                  >
                    {isSaving ? <Loader2 size={15} className="animate-spin" /> : <TrendingDown size={15} />}
                    Record Expense
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );

  if (!mounted) return null;
  return createPortal(modal, document.body);
}

// ── Finance Chart ──
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

  if (!isMounted) return <div className="h-[240px] w-full animate-pulse bg-slate-50 rounded-2xl" />;
  if (chartData.length === 0) {
    return (
      <div className="h-[240px] w-full flex flex-col items-center justify-center gap-3">
        <BarChart3 size={36} className="text-slate-200" />
        <p className="text-sm text-slate-400 font-medium">No revenue data yet</p>
      </div>
    );
  }

  return (
    <div className="h-[240px] w-full mt-4">
      <ResponsiveContainer width="99%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }}
            dy={10}
          />
          <YAxis hide />
          <Tooltip
            formatter={(value) => [`₹${Number(value ?? 0).toLocaleString()}`, 'Revenue'] as [string, string]}
            contentStyle={{ borderRadius: '14px', border: 'none', boxShadow: '0 20px 40px -8px rgba(0,0,0,0.12)', padding: '10px 16px' }}
          />
          <Area type="monotone" dataKey="Revenue" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

// ── KPI Card ──
function KpiCard({
  label, value, sub, icon: Icon, accent, trend,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ElementType;
  accent: 'green' | 'red' | 'indigo' | 'amber';
  trend?: 'up' | 'down';
}) {
  const colors = {
    green:  { bg: 'bg-emerald-50',  icon: 'text-emerald-500',  val: 'text-emerald-600',  badge: 'bg-emerald-100 text-emerald-700'  },
    red:    { bg: 'bg-red-50',      icon: 'text-red-500',      val: 'text-red-600',      badge: 'bg-red-100 text-red-700'          },
    indigo: { bg: 'bg-indigo-50',   icon: 'text-indigo-500',   val: 'text-indigo-600',   badge: 'bg-indigo-100 text-indigo-700'   },
    amber:  { bg: 'bg-amber-50',    icon: 'text-amber-500',    val: 'text-amber-600',    badge: 'bg-amber-100 text-amber-700'     },
  }[accent];

  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col gap-4 relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-28 h-28 rounded-full blur-3xl opacity-30 pointer-events-none"
        style={{ background: accent === 'green' ? '#10b981' : accent === 'red' ? '#ef4444' : accent === 'indigo' ? '#6366f1' : '#f59e0b', transform: 'translate(40%, -40%)' }}
      />
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</span>
        <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', colors.bg)}>
          <Icon size={18} className={colors.icon} />
        </div>
      </div>
      <div>
        <p className={cn('text-[28px] font-black leading-none tracking-tight', colors.val)}>{value}</p>
        <div className="flex items-center gap-1 mt-2">
          {trend === 'up' && <ArrowUpRight size={13} className={colors.icon} />}
          {trend === 'down' && <ArrowDownRight size={13} className={colors.icon} />}
          <p className="text-[11px] font-bold text-slate-400">{sub}</p>
        </div>
      </div>
    </motion.div>
  );
}

// ── Main View ──
export const FinanceView = ({ initialData }: { initialData?: any }) => {
  const hasServerData = !!initialData;
  const [summary, setSummary] = useState<FeeSummary | null>(initialData?.summary || null);
  const [fees, setFees] = useState<ApiFee[]>(initialData?.fees || []);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(!hasServerData);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<StatusFilter>('All');
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [feePage, setFeePage] = useState(1);
  const FEE_PER_PAGE = 10;
  const { selectedBranchId } = useBranch();

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
    const fetchFinance = async () => {
      try {
        setIsLoading(true);
        const branchParam = selectedBranchId ? `?branch=${selectedBranchId}` : '';
        const [summaryRes, feesRes] = await Promise.all([
          api.get(`/admin/fees/summary${branchParam}`),
          api.get(`/admin/fees${branchParam}`),
        ]);
        if (summaryRes.data.success) setSummary(summaryRes.data.data as FeeSummary);
        if (feesRes.data.success) setFees(feesRes.data.data as ApiFee[]);
      } catch {
        toast.error('Failed to load finance data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchFinance();
  }, [selectedBranchId]);

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netCollected = (summary?.totalRevenue || 0) - (summary?.totalDues || 0);
  const netProfit = netCollected - totalExpenses;
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

  const pagedFees = filteredFees.slice((feePage - 1) * FEE_PER_PAGE, feePage * FEE_PER_PAGE);

  return (
    <div className="w-full space-y-6 pb-10">
      {/* ── KPI Cards Row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          label="Total Revenue"
          value={formatInr(summary?.totalRevenue || 0)}
          sub={`${summary?.totalTransactions || 0} transactions`}
          icon={TrendingUp}
          accent="green"
          trend="up"
        />
        <KpiCard
          label="Outstanding Dues"
          value={formatInr(summary?.totalDues || 0)}
          sub="Pending collection"
          icon={AlertCircle}
          accent="amber"
          trend="down"
        />
        <KpiCard
          label="Total Expenses"
          value={formatInr(totalExpenses)}
          sub={`${expenses.length} expense${expenses.length !== 1 ? 's' : ''} recorded`}
          icon={Wallet}
          accent="red"
          trend="down"
        />
        <KpiCard
          label="Net Profit"
          value={formatInr(netProfit)}
          sub={`${profitPercent}% collection rate`}
          icon={IndianRupee}
          accent="indigo"
          trend="up"
        />
      </div>

      {/* ── Chart + Branch Performance Row ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-[15px] font-black text-slate-800">Monthly Revenue</h3>
              <p className="text-xs font-medium text-slate-400 mt-0.5">Last 6 months across all branches</p>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 bg-indigo-50 px-2.5 py-1 rounded-full">Revenue</span>
          </div>
          {isLoading ? (
            <div className="h-[240px] w-full mt-4 animate-pulse bg-slate-50 rounded-2xl" />
          ) : (
            <FinanceChart trend={summary?.monthlyTrend || []} />
          )}
        </div>

        {/* Branch Performance */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="text-[15px] font-black text-slate-800 mb-5">Branch Performance</h3>
          {summary && summary.branchWise.length > 0 ? (
            <div className="space-y-5">
              {summary.branchWise.map(branch => {
                const max = Math.max(...summary.branchWise.map(b => b.revenue), 1);
                const percent = (branch.revenue / max) * 100;
                return (
                  <div key={branch._id}>
                    <div className="flex justify-between items-center mb-1.5">
                      <p className="text-sm font-bold text-slate-700">{branch.branchName}</p>
                      <span className="text-sm font-black text-indigo-500">{formatInr(branch.revenue)}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percent}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-indigo-600"
                      />
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 mt-1">{branch.count} txns · {formatInr(branch.dues)} dues</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center mt-8 gap-3">
              <BarChart3 size={32} className="text-slate-200" />
              <p className="text-sm text-slate-400">No branch data</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Expenses Log ── */}
      {expenses.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-50 rounded-xl flex items-center justify-center">
                <Wallet size={16} className="text-red-500" />
              </div>
              <h3 className="text-[15px] font-black text-slate-800">Expense Log</h3>
            </div>
            <span className="text-xs font-black text-red-500 bg-red-50 px-3 py-1 rounded-full">
              Total: {formatInr(totalExpenses)}
            </span>
          </div>
          <div className="divide-y divide-slate-50">
            {expenses.map(exp => (
              <div key={exp._id} className="flex items-center justify-between px-6 py-3.5 hover:bg-slate-50/60 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center">
                    <TrendingDown size={14} className="text-red-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-700">{exp.purpose}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{formatDate(exp.date)}</p>
                  </div>
                </div>
                <span className="text-sm font-black text-red-500">−₹{exp.amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Transactions Table ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-visible">
        <div className="px-6 py-5 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center">
              <Receipt size={18} className="text-indigo-500" />
            </div>
            <div>
              <h3 className="text-[15px] font-black text-slate-800">Recent Transactions</h3>
              <p className="text-[11px] font-medium text-slate-400 mt-0.5">{filteredFees.length} records</p>
            </div>
          </div>

          <div className="flex w-full md:w-auto items-center gap-2">
            {/* Search */}
            <div className="relative flex-1 md:flex-none">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
              <input
                type="text"
                placeholder="Search patient, branch..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setFeePage(1); }}
                className="w-full md:w-64 bg-slate-50 border border-slate-100 rounded-xl py-2 pl-10 pr-4 text-sm font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all placeholder:text-slate-300"
              />
            </div>

            {/* Filter */}
            <div className="relative">
              <button
                onClick={() => setIsFilterMenuOpen(p => !p)}
                className={cn(
                  "p-2 rounded-xl border transition-colors",
                  isFilterMenuOpen ? "bg-indigo-50 border-indigo-200 text-indigo-500" : "border-slate-100 text-slate-400 hover:bg-slate-50"
                )}
              >
                <Filter size={16} />
              </button>
              <AnimatePresence>
                {isFilterMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="absolute right-0 mt-2 w-40 rounded-2xl border border-slate-100 bg-white shadow-xl p-1.5 z-20"
                  >
                    {(['All', 'paid', 'partial', 'overdue', 'pending'] as StatusFilter[]).map(option => (
                      <button
                        key={option}
                        onClick={() => { setActiveFilter(option); setIsFilterMenuOpen(false); }}
                        className={cn(
                          "w-full text-left px-3 py-2 rounded-xl text-sm transition-colors capitalize font-medium",
                          activeFilter === option
                            ? "bg-indigo-50 text-indigo-600 font-bold"
                            : "text-slate-500 hover:bg-slate-50"
                        )}
                      >
                        {option === 'All' ? 'All' : STATUS_LABEL[option as ApiFee['status']]}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Download CSV */}
            <button
              onClick={() => {
                const headers = ['Receipt No', 'Patient', 'Branch', 'Method', 'Date', 'Amount', 'Due Amount', 'Status'];
                const rows = filteredFees.map(fee => [
                  fee.receiptNumber || fee._id.slice(-8),
                  fee.patientId?.name || 'Unknown',
                  fee.branchId?.name || '—',
                  METHOD_LABEL[fee.method || 'cash'] || fee.method || '—',
                  formatDate(fee.paymentDate || fee.createdAt),
                  fee.amount,
                  fee.dueAmount ?? 0,
                  STATUS_LABEL[fee.status],
                ]);
                const csv = [headers, ...rows]
                  .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
                  .join('\n');
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `transactions_${new Date().toISOString().slice(0, 10)}.csv`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="p-2 rounded-xl border border-slate-100 text-slate-400 hover:bg-slate-50 hover:text-indigo-500 transition-colors"
              title="Download CSV"
            >
              <Download size={16} />
            </button>

            {/* Add Expense */}
            <button
              onClick={() => setIsExpenseModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-black bg-red-500 text-white hover:bg-red-600 transition-all shadow-md shadow-red-500/20"
            >
              <Plus size={15} />
              Add Expense
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="text-center">
              <div className="w-10 h-10 rounded-full border-4 border-indigo-100 border-t-indigo-500 animate-spin mx-auto mb-3" />
              <p className="text-sm text-slate-400 font-medium">Loading transactions…</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70">
                  {['Transaction', 'Branch', 'Method', 'Date', 'Amount', 'Status'].map(col => (
                    <th key={col} className={cn(
                      "px-5 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-widest",
                      col === 'Status' && "text-right"
                    )}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {pagedFees.map(fee => (
                  <motion.tr
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    key={fee._id}
                    className="hover:bg-slate-50/40 transition-colors group"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-emerald-50 shrink-0">
                          <TrendingUp size={16} className="text-emerald-500" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">
                            {fee.patientId?.name || 'Unknown patient'}
                          </p>
                          <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wider mt-0.5">
                            {fee.receiptNumber || fee._id.slice(-8)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm font-medium text-slate-500">{fee.branchId?.name || '—'}</td>
                    <td className="px-5 py-4">
                      <span className="px-2.5 py-1 bg-slate-100 rounded-lg text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        {METHOD_LABEL[fee.method || 'cash'] || fee.method}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm font-medium text-slate-400 whitespace-nowrap">{formatDate(fee.paymentDate || fee.createdAt)}</td>
                    <td className="px-5 py-4">
                      <span className="text-sm font-black text-emerald-600">+₹{fee.amount.toLocaleString()}</span>
                      {(fee.dueAmount ?? 0) > 0 && (
                        <p className="text-[10px] font-bold text-red-400 mt-0.5">Due ₹{(fee.dueAmount ?? 0).toLocaleString()}</p>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className={cn(
                        "px-3 py-1.5 text-[10px] font-black rounded-lg uppercase tracking-wider inline-block",
                        fee.status === 'paid' && "bg-emerald-50 text-emerald-600",
                        fee.status === 'partial' && "bg-amber-50 text-amber-600",
                        fee.status === 'overdue' && "bg-red-50 text-red-600",
                        fee.status === 'pending' && "bg-slate-100 text-slate-500",
                      )}>
                        {STATUS_LABEL[fee.status]}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
            {filteredFees.length === 0 && (
              <div className="py-16 text-center">
                <Receipt size={36} className="text-slate-200 mx-auto mb-3" />
                <p className="text-sm text-slate-400 font-medium">No transactions found</p>
              </div>
            )}
          </div>
        )}
        <Pagination total={filteredFees.length} page={feePage} perPage={FEE_PER_PAGE} onChange={p => setFeePage(p)} />
      </div>

      {/* Add Expense Modal */}
      <AddExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        onAdd={(expense) => setExpenses(prev => [expense, ...prev])}
      />
    </div>
  );
};
