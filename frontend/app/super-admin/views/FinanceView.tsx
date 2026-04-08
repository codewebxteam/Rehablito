import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { IndianRupee, TrendingUp, TrendingDown, Download, Filter, Search } from 'lucide-react';
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

// --- Mock Data ---
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

type TransactionFilter = 'All' | 'Income' | 'Expense' | 'Completed' | 'Pending' | 'Failed';

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
  const [activeFilter, setActiveFilter] = useState<TransactionFilter>('All');
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);

  const filteredTransactions = TRANSACTIONS.filter((t) => {
    const matchesSearch =
      t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      activeFilter === 'All' ||
      t.type === activeFilter ||
      t.status === activeFilter;

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-10">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/10 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <IndianRupee size={120} />
          </div>
          <p className="text-sm font-bold text-on-surface-variant opacity-70 mb-1">Total Revenue</p>
          <h3 className="text-4xl font-black text-on-surface">₹48.5L</h3>
          <p className="text-xs text-green-600 font-bold mt-2 flex items-center gap-1">
            <TrendingUp size={14} /> +12% from last month
          </p>
        </div>
        <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/10 shadow-sm relative overflow-hidden">
          <p className="text-sm font-bold text-on-surface-variant opacity-70 mb-1">Total Expenses</p>
          <h3 className="text-4xl font-black text-on-surface">₹22.1L</h3>
          <p className="text-xs text-error font-bold mt-2 flex items-center gap-1">
            <TrendingDown size={14} /> -5% from last month
          </p>
        </div>
        <div className="bg-primary/5 p-6 rounded-2xl border border-primary/20 shadow-sm relative overflow-hidden">
          <p className="text-sm font-bold text-primary opacity-80 mb-1">Net Profit</p>
          <h3 className="text-4xl font-black text-primary">₹26.4L</h3>
          <div className="mt-2 w-full bg-primary/20 rounded-full h-1.5 overflow-hidden">
            <div className="bg-primary h-full w-[54%] rounded-full"></div>
          </div>
          <p className="text-[10px] text-primary/70 font-bold mt-2 uppercase tracking-wider">54% Profit Margin</p>
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
      <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/10 overflow-visible">
        <div className="p-6 md:p-8 border-b border-surface-container-low flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="text-xl font-bold font-headline text-on-surface">Recent Transactions</h3>
          
          <div className="flex w-full md:w-auto items-center gap-3">
            <div className="relative flex-1 md:flex-none">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/50" size={18} />
              <input 
                type="text" 
                placeholder="Search description or ID..."
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
                    {(['All', 'Income', 'Expense', 'Completed', 'Pending', 'Failed'] as TransactionFilter[]).map((option) => (
                      <button
                        key={option}
                        onClick={() => {
                          setActiveFilter(option);
                          setIsFilterMenuOpen(false);
                        }}
                        className={cn(
                          "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                          activeFilter === option
                            ? "bg-primary/10 text-primary font-semibold"
                            : "text-on-surface-variant hover:bg-surface-container-low"
                        )}
                      >
                        {option}
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

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low/30">
                <th className="px-8 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider opacity-70">Transaction</th>
                <th className="px-8 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider opacity-70">Category</th>
                <th className="px-8 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider opacity-70">Date</th>
                <th className="px-8 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider opacity-70">Amount</th>
                <th className="px-8 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider opacity-70 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-low/50">
              {filteredTransactions.map((trx) => (
                <motion.tr 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  key={trx.id} 
                  className="hover:bg-surface-container-low/20 transition-colors"
                >
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center font-bold",
                        trx.type === 'Income' ? "bg-green-50 text-green-600" : "bg-error/10 text-error"
                      )}>
                        {trx.type === 'Income' ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-on-surface">{trx.description}</span>
                        <span className="text-[10px] text-on-surface-variant uppercase tracking-wider font-bold opacity-60 mt-0.5">{trx.id}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-4">
                    <span className="px-3 py-1 bg-surface-container-low rounded-lg text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                      {trx.category}
                    </span>
                  </td>
                  <td className="px-8 py-4 text-sm font-medium text-on-surface-variant">{trx.date}</td>
                  <td className="px-8 py-4">
                    <span className={cn(
                      "text-sm font-black",
                      trx.type === 'Income' ? "text-green-600" : "text-error"
                    )}>
                      {trx.type === 'Income' ? '+' : '-'}₹{trx.amount.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-8 py-4 text-right">
                    <span className={cn(
                      "px-3 py-1.5 text-[10px] font-black rounded-lg uppercase tracking-wider",
                      trx.status === 'Completed' && "bg-green-50 text-green-700",
                      trx.status === 'Pending' && "bg-amber-50 text-amber-700",
                      trx.status === 'Failed' && "bg-error/10 text-error"
                    )}>
                      {trx.status}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          
          {filteredTransactions.length === 0 && (
            <div className="p-10 text-center text-on-surface-variant opacity-60">
              No transactions found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
