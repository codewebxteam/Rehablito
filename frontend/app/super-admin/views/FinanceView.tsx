import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { IndianRupee, TrendingUp, TrendingDown, Download, Filter, Search, RefreshCw } from 'lucide-react';
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
import { useAdminFees, useAdminFeeSummary, AdminFee } from '../hooks/useAdminData';

// Static chart data (real aggregate endpoint not available)
const REVENUE_DATA = [
  { name: 'Jan', Income: 400000, Expense: 240000 },
  { name: 'Feb', Income: 300000, Expense: 139000 },
  { name: 'Mar', Income: 800000, Expense: 480000 },
  { name: 'Apr', Income: 578000, Expense: 390800 },
  { name: 'May', Income: 689000, Expense: 480000 },
  { name: 'Jun', Income: 639000, Expense: 380000 },
  { name: 'Jul', Income: 800000, Expense: 430000 },
];


interface Transaction {
  id: string;
  type: 'Income' | 'Expense';
  description: string;
  category: string;
  amount: number;
  date: string;
  status: 'Completed' | 'Pending' | 'Failed';
}

const TRANSACTIONS: Transaction[] = [
  { id: 'TRX-1092', type: 'Income', description: 'Patient Consultation (Aarav Gupta)', category: 'Service', amount: 1500, date: 'Today, 10:45 AM', status: 'Completed' },
  { id: 'TRX-1091', type: 'Expense', description: 'Monthly Electricity Bill (Mumbai)', category: 'Utility', amount: 12500, date: 'Yesterday, 04:30 PM', status: 'Completed' },
  { id: 'TRX-1090', type: 'Income', description: 'Physiotherapy Package (Megha Rao)', category: 'Package', amount: 35000, date: '10 May, 11:20 AM', status: 'Pending' },
  { id: 'TRX-1089', type: 'Expense', description: 'Therapist Equipment Replacements', category: 'Equipment', amount: 45000, date: '08 May, 02:15 PM', status: 'Completed' },
  { id: 'TRX-1088', type: 'Income', description: 'Autism Center Registration', category: 'Service', amount: 5000, date: '08 May, 10:00 AM', status: 'Completed' },
];

const FinanceChart = () => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <div className="h-[300px] w-full animate-pulse bg-surface-container-low rounded-xl"></div>;
  }

  return (
    <div className="h-[300px] w-full mt-6">
      <ResponsiveContainer width="99%" height="100%">
        <AreaChart data={REVENUE_DATA} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
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
            formatter={(value: any, name: any) => [`₹${Number(value).toLocaleString()}`, name]}
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
          />
          <Area type="monotone" dataKey="Income" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" />
          <Area type="monotone" dataKey="Expense" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export const FinanceView = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: summary, isLoading: summaryLoading } = useAdminFeeSummary();
  const { data: fees = [], isLoading: feesLoading, refetch } = useAdminFees();

  const fmt = (n?: number) => n != null ? `₹${n.toLocaleString('en-IN')}` : '₹—';

  const filteredFees = fees.filter((f: AdminFee) =>
    f._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-10">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/10 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <IndianRupee size={120} />
          </div>
          <p className="text-sm font-bold text-on-surface-variant opacity-70 mb-1">Total Revenue</p>
          <h3 className="text-4xl font-black text-on-surface">{summaryLoading ? '…' : fmt(summary?.totalPaid)}</h3>
          <p className="text-xs text-green-600 font-bold mt-2 flex items-center gap-1">
            <TrendingUp size={14} /> Live from database
          </p>
        </div>
        <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/10 shadow-sm relative overflow-hidden">
          <p className="text-sm font-bold text-on-surface-variant opacity-70 mb-1">Outstanding Dues</p>
          <h3 className="text-4xl font-black text-on-surface">{summaryLoading ? '…' : fmt(summary?.totalDue)}</h3>
          <p className="text-xs text-error font-bold mt-2 flex items-center gap-1">
            <TrendingDown size={14} /> Pending collection
          </p>
        </div>
        <div className="bg-primary/5 p-6 rounded-2xl border border-primary/20 shadow-sm relative overflow-hidden">
          <p className="text-sm font-bold text-primary opacity-80 mb-1">Total Revenue</p>
          <h3 className="text-4xl font-black text-primary">{summaryLoading ? '…' : fmt(summary?.totalRevenue)}</h3>
          <div className="mt-2 w-full bg-primary/20 rounded-full h-1.5 overflow-hidden">
            <div className="bg-primary h-full w-[75%] rounded-full"></div>
          </div>
          <p className="text-[10px] text-primary/70 font-bold mt-2 uppercase tracking-wider">All fees collected</p>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-surface-container-lowest p-8 rounded-2xl border border-outline-variant/10 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-xl font-bold font-headline text-on-surface">Income vs Expenses</h3>
            <p className="text-sm font-medium text-on-surface-variant opacity-60">Financial overview for the current year</p>
          </div>
          <div className="flex items-center gap-4 bg-surface-container-low p-1.5 rounded-xl">
            <button className="px-4 py-1.5 text-xs font-bold rounded-lg bg-surface-container-lowest shadow-sm text-on-surface">Monthly</button>
            <button className="px-4 py-1.5 text-xs font-bold rounded-lg text-on-surface-variant hover:text-on-surface transition-colors">Quarterly</button>
            <button className="px-4 py-1.5 text-xs font-bold rounded-lg text-on-surface-variant hover:text-on-surface transition-colors">Yearly</button>
          </div>
        </div>
        <FinanceChart />
      </div>

      {/* Transactions Table */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/10 overflow-hidden">
        <div className="p-6 md:p-8 border-b border-surface-container-low flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="text-xl font-bold font-headline text-on-surface">Fee Payments</h3>
          
          <div className="flex w-full md:w-auto items-center gap-3">
            <div className="relative flex-1 md:flex-none">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/50" size={18} />
              <input 
                type="text" 
                placeholder="Search by ID or type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full md:w-64 bg-surface-container-low/50 border border-outline-variant/20 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all font-medium text-on-surface"
              />
            </div>
            <button onClick={refetch} className="p-2 border border-outline-variant/20 rounded-xl text-on-surface-variant hover:bg-surface-container-low transition-colors">
              <RefreshCw size={18} className={feesLoading ? 'animate-spin' : ''} />
            </button>
            <button className="p-2 border border-outline-variant/20 rounded-xl text-on-surface-variant hover:bg-surface-container-low transition-colors">
              <Download size={18} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low/30">
                <th className="px-8 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider opacity-70">Fee ID</th>
                <th className="px-8 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider opacity-70">Type</th>
                <th className="px-8 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider opacity-70">Date</th>
                <th className="px-8 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider opacity-70">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-low/50">
              {feesLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 4 }).map((__, j) => (
                      <td key={j} className="px-8 py-4">
                        <div className="h-3 bg-surface-container-low animate-pulse rounded-full w-3/4" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                filteredFees.map((fee: AdminFee) => (
                  <motion.tr 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    key={fee._id} 
                    className="hover:bg-surface-container-low/20 transition-colors"
                  >
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold bg-green-50 text-green-600">
                          <TrendingUp size={18} />
                        </div>
                        <span className="text-[10px] text-on-surface-variant uppercase tracking-wider font-bold opacity-60 mt-0.5">{fee._id.slice(-8).toUpperCase()}</span>
                      </div>
                    </td>
                    <td className="px-8 py-4">
                      <span className="px-3 py-1 bg-surface-container-low rounded-lg text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                        {fee.type ?? 'Payment'}
                      </span>
                    </td>
                    <td className="px-8 py-4 text-sm font-medium text-on-surface-variant">
                      {new Date(fee.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-8 py-4">
                      <span className="text-sm font-black text-green-600">+₹{fee.amount.toLocaleString('en-IN')}</span>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
          
          {!feesLoading && filteredFees.length === 0 && (
            <div className="p-10 text-center text-on-surface-variant opacity-60">
              No fee records found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
