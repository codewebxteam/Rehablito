import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  UsersRound,
  CreditCard,
  BadgeCheck,
  Mail,
  Wallet,
  Activity,
  Plus
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useAddTransaction, LiveFeedItem } from '../components/AddTransactionContext';

// --- Types ---
interface ActivityItem {
  id: string;
  user: string;
  action: string;
  location: string;
  time: string;
  icon: React.ReactNode;
  color: string;
}

interface LeadItem {
  id: string;
  name: string;
  phone: string;
  type: string;
  location: string;
  initials: string;
  color: string;
}

const MONTH_LABELS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const BRANCH_COLORS = ['#2563eb', '#006a61', '#c3c6d7', '#f59e0b', '#8b5cf6', '#ec4899'];
const BRANCH_PROGRESS_COLORS = ['bg-secondary', 'bg-teal-500', 'bg-blue-400', 'bg-amber-500', 'bg-purple-500', 'bg-pink-500'];

// Dashboard API Response Types
interface PatientStats {
  total: number;
  active: number;
  discharged: number;
  onHold: number;
}

interface LeadStats {
  total: number;
  new: number;
  contacted: number;
  converted: number;
  closed: number;
}

interface AttendanceStats {
  date: string;
  present: number;
  absent: number;
  leave: number;
  halfDay: number;
  total: number;
}

interface MonthlyTrendBucket {
  _id: { year: number; month: number; branchName: string };
  revenue: number;
}

interface FeeSummary {
  totalRevenue: number;
  totalDues: number;
  totalTransactions: number;
  branchWise: Array<{
    _id: string;
    branchName: string;
    revenue: number;
    dues: number;
    count: number;
  }>;
  methodBreakdown: Array<{
    _id: string;
    total: number;
    count: number;
  }>;
  monthlyTrend?: MonthlyTrendBucket[];
}

interface ApiLead {
  _id: string;
  childName: string;
  parentName?: string;
  parentPhone?: string;
  diagnosis?: string;
  branchId?: { name?: string } | null;
  createdAt: string;
}

interface ApiFee {
  _id: string;
  amount: number;
  paymentDate: string;
  status: string;
  patientId?: { name?: string; parentName?: string } | null;
  branchId?: { name?: string } | null;
}

// --- Components ---

interface RevenueChartProps {
  monthlyTrend?: MonthlyTrendBucket[];
  isLoading?: boolean;
}

const RevenueChart = React.memo(({ monthlyTrend = [], isLoading = false }: RevenueChartProps) => {
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const { data } = React.useMemo(() => {
    if (!monthlyTrend.length) return { data: [] as Array<Record<string, string | number>> };
    const bucket: Record<string, Record<string, string | number>> = {};
    monthlyTrend.forEach((m) => {
      const key = `${m._id.year}-${m._id.month}`;
      if (!bucket[key]) {
        bucket[key] = { name: MONTH_LABELS[(m._id.month - 1) % 12], _year: m._id.year, _month: m._id.month, revenue: 0 };
      }
      bucket[key].revenue = (bucket[key].revenue as number) + Math.round(m.revenue / 1000);
    });
    const sorted = Object.values(bucket).sort((a, b) => {
      if (a._year !== b._year) return (a._year as number) - (b._year as number);
      return (a._month as number) - (b._month as number);
    });
    return { data: sorted };
  }, [monthlyTrend]);

  if (!isMounted || isLoading) {
    return (
      <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/10">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h4 className="text-lg font-bold font-headline text-on-surface">Revenue Trends</h4>
            <p className="text-xs text-on-surface-variant mt-1">Consolidated branch performance (last 6 months)</p>
          </div>
        </div>
        <div className="h-64 w-full animate-pulse bg-surface-container-low rounded-xl"></div>
      </div>
    );
  }

  return (
    <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/10">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h4 className="text-lg font-bold font-headline text-on-surface">Revenue Trends</h4>
          <p className="text-xs text-on-surface-variant mt-1">Consolidated branch performance (last 6 months, in ₹K)</p>
        </div>
      </div>
      <div className="h-64 w-full">
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-sm text-on-surface-variant">
            No revenue data available.
          </div>
        ) : (
          <ResponsiveContainer width="99%" height={256}>
            <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#4B5563', fontSize: 11, fontWeight: 600 }}
                dy={10}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#4B5563', fontSize: 11, fontWeight: 600 }}
              />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                formatter={(value: any) => [`₹${value}K`, 'Revenue']}
                labelStyle={{ fontWeight: 600, color: '#111827' }}
              />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="#2563eb" 
                strokeWidth={3}
                dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                activeDot={{ r: 6, strokeWidth: 0, fill: '#2563eb' }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
});
RevenueChart.displayName = 'RevenueChart';

interface ActivityFeedProps {
  items: ActivityItem[];
  isLoading?: boolean;
}

const ActivityFeed = React.memo(({ items, isLoading = false, liveItems = [] }: ActivityFeedProps & { liveItems?: LiveFeedItem[] }) => {
  const router = useRouter();

  // Merge context live items (newest first) with api items
  const toActivityTime = (iso: string) => {
    const d = new Date(iso);
    const diffMs = Date.now() - d.getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  };

  const contextActivities: ActivityItem[] = liveItems.map(l => ({
    id: l.id,
    user: l.label,
    action: 'at',
    location: l.sub,
    time: toActivityTime(l.time),
    icon: l.icon === 'payment' ? <CreditCard size={18} /> : l.icon === 'patient' ? <UsersRound size={18} /> : <Mail size={18} />,
    color: l.icon === 'payment' ? 'bg-green-50 text-green-600' : l.icon === 'patient' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600',
  }));

  const mergedItems = [...contextActivities, ...items].slice(0, 8);

  return (
  <div 
    onClick={() => router.push('/super-admin/leads')}
    className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/10 hover:border-primary/30 hover:-translate-y-1 hover:shadow-md transition-all duration-200 cursor-pointer group"
  >
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-2">
        <h4 className="text-lg font-bold font-headline text-on-surface group-hover:text-primary transition-colors duration-300">Live Feed</h4>
        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
      </div>
      <Activity size={14} className="text-on-surface-variant/40" />
    </div>
    {isLoading ? (
      <div className="space-y-4">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-10 bg-surface-container-low rounded-lg animate-pulse" />)}
      </div>
    ) : mergedItems.length === 0 ? (
      <p className="text-sm text-on-surface-variant text-center py-6">No recent activity yet.</p>
    ) : (
      <div className="space-y-4">
        {mergedItems.map((item, idx) => (
          <div key={item.id} className="flex gap-4 relative items-start">
            {idx !== mergedItems.length - 1 && (
              <div className="absolute top-8 left-4 -bottom-6 w-px bg-surface-container-low z-0"></div>
            )}
            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 z-10 border border-outline-variant/10 mt-1", item.color)}>
              {item.icon}
            </div>
            <div className="flex-1">
              <p className="text-[13px] font-semibold text-on-surface leading-tight">
                <span className="text-primary font-bold">{item.user}</span> {item.action} {item.location}
              </p>
              <p className="text-[10px] text-on-surface-variant mt-0.5 font-medium opacity-50">{item.time}</p>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
  );
});
ActivityFeed.displayName = 'ActivityFeed';

interface BranchPerformanceProps {
  branchWise?: FeeSummary['branchWise'];
  isLoading?: boolean;
}

const BranchPerformance = React.memo(({ branchWise = [], isLoading = false }: BranchPerformanceProps) => {
  const maxRevenue = Math.max(1, ...branchWise.map(b => b.revenue));
  const fmt = (v: number) => v >= 100000 ? `₹${(v / 100000).toFixed(1)}L` : v >= 1000 ? `₹${(v / 1000).toFixed(1)}K` : `₹${v}`;

  return (
    <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/10">
      <h4 className="text-lg font-bold font-headline text-on-surface mb-6">Branch Performance</h4>
      {isLoading ? (
        <div className="space-y-6">
          {[1, 2, 3].map(i => <div key={i} className="h-12 bg-surface-container-low rounded-lg animate-pulse" />)}
        </div>
      ) : branchWise.length === 0 ? (
        <p className="text-sm text-on-surface-variant text-center py-4">No branch revenue recorded yet.</p>
      ) : (
        <div className="space-y-5">
          {branchWise.map((branch, i) => {
            const progress = Math.round((branch.revenue / maxRevenue) * 100);
            return (
              <div key={branch._id || branch.branchName} className="space-y-2">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[13px] font-bold text-on-surface">{branch.branchName}</p>
                    <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider mt-0.5 opacity-60">
                      {branch.count} TXN · ₹{branch.dues.toLocaleString('en-IN')} DUE
                    </p>
                  </div>
                  <span className="text-sm font-black text-on-surface">{fmt(branch.revenue)}</span>
                </div>
                <div className="w-full h-1.5 bg-surface-container-low rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={cn("h-full rounded-full", BRANCH_PROGRESS_COLORS[i % BRANCH_PROGRESS_COLORS.length])}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});
BranchPerformance.displayName = 'BranchPerformance';

interface RecentLeadsProps {
  leads?: LeadItem[];
  isLoading?: boolean;
}

const RecentLeads = React.memo(({ leads = [], isLoading = false }: RecentLeadsProps) => {
  const router = useRouter();

  return (
  <div className="space-y-5">
    <div className="flex items-center justify-between">
      <h4 className="text-lg font-bold font-headline text-on-surface">Recent Leads</h4>
      <button 
        onClick={() => router.push('/super-admin/leads')}
        className="text-[13px] font-bold text-primary hover:text-primary/80 transition-colors"
      >
        View All Activity
      </button>
    </div>
    {isLoading ? (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/10 animate-pulse h-20"></div>
        ))}
      </div>
    ) : leads.length === 0 ? (
      <p className="text-sm text-on-surface-variant text-center py-8">No recent leads.</p>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {leads.map((lead) => (
        <motion.div 
          key={lead.id}
          onClick={() => router.push('/super-admin/leads')}
          whileHover={{ y: -2 }}
          className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/10 flex items-center gap-4 hover:shadow-sm hover:border-primary/20 transition-all cursor-pointer group"
        >
          <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm group-hover:bg-primary group-hover:text-white transition-colors", lead.color)}>
            {lead.initials}
          </div>
          <div className="flex-1 min-w-0">
            <h5 className="text-[14px] font-bold text-on-surface truncate">{lead.name}</h5>
            <p className="text-[11px] text-on-surface-variant mt-0.5 opacity-70 truncate">{lead.phone}</p>
          </div>
          <div className="text-right shrink-0">
            <span className="px-2 py-1 bg-surface-container-low text-[9px] font-bold rounded text-on-surface-variant block mb-1 uppercase tracking-wider">
              {lead.type}
            </span>
            <span className="text-[10px] text-on-surface-variant font-medium opacity-70">{lead.location}</span>
          </div>
        </motion.div>
      ))}
    </div>
    )}
  </div>
  );
});
RecentLeads.displayName = 'RecentLeads';

// --- Main View ---
interface DashboardViewProps {
  initialData?: any;
}

export const DashboardView = ({ initialData }: DashboardViewProps) => {
  const router = useRouter();

  const hasServerData = !!initialData;

  const [patientStats, setPatientStats] = useState<PatientStats | null>(
    initialData?.patientStats || null
  );
  const [, setLeadStats] = useState<LeadStats | null>(
    initialData?.leadStats || null
  );
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats | null>(
    initialData?.attendanceStats || null
  );
  const [feeSummary, setFeeSummary] = useState<FeeSummary | null>(
    initialData?.feeSummary || null
  );
  const [recentLeads, setRecentLeads] = useState<LeadItem[]>([]);
  const [activityItems, setActivityItems] = useState<ActivityItem[]>([]);

  const { liveFeedItems, openModal } = useAddTransaction();

  const [isLoading, setIsLoading] = useState(!hasServerData);

  const transformServerData = React.useCallback((data: any) => {
    if (!data) return;

    const toActivityTime = (iso: string) => {
      const d = new Date(iso);
      const diffMs = Date.now() - d.getTime();
      const mins = Math.floor(diffMs / 60000);
      if (mins < 1) return 'just now';
      if (mins < 60) return `${mins}m ago`;
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return `${hrs}h ago`;
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    };

    const leadPalette = [
      'bg-blue-50 text-blue-700',
      'bg-secondary-container/20 text-secondary',
      'bg-surface-container-low text-on-surface-variant',
      'bg-primary-container/10 text-primary',
    ];

    const leadsForFeed: ApiLead[] = data.recentLeads || [];
    const transformed: LeadItem[] = leadsForFeed.slice(0, 4).map((lead: ApiLead, idx: number) => {
      const displayName = lead.childName || lead.parentName || 'Unknown';
      const masked = lead.parentPhone ? `XXXXXX${String(lead.parentPhone).slice(-4)}` : 'N/A';
      const initials = displayName
        .split(' ')
        .slice(0, 2)
        .map((n: string) => n[0])
        .filter(Boolean)
        .join('')
        .toUpperCase() || 'XX';
      return {
        id: lead._id,
        name: displayName,
        phone: masked,
        type: (lead.diagnosis || 'LEAD').slice(0, 16).toUpperCase(),
        location: lead.branchId?.name || 'Unknown',
        initials,
        color: leadPalette[idx % leadPalette.length],
      };
    });
    setRecentLeads(transformed);

    const fees: ApiFee[] = data.recentFees || [];
    const feeActivities: ActivityItem[] = fees.slice(0, 3).map((f: ApiFee) => {
      const patient = f.patientId?.name || f.patientId?.parentName;
      return {
        id: `fee-${f._id}`,
        user: patient ? `${patient} · ₹${f.amount.toLocaleString('en-IN')}` : `Payment ₹${f.amount.toLocaleString('en-IN')}`,
        action: f.status === 'paid' ? 'paid at' : 'pending at',
        location: f.branchId?.name || 'branch',
        time: toActivityTime(f.paymentDate),
        icon: <CreditCard size={18} />,
        color: f.status === 'paid' ? 'bg-secondary-container/20 text-secondary' : 'bg-error/10 text-error',
      };
    });

    const leadActivities: ActivityItem[] = leadsForFeed.slice(0, 3).map((l: ApiLead) => ({
      id: `lead-${l._id}`,
      user: `Inquiry from ${l.parentName || l.childName}`,
      action: 'for',
      location: l.branchId?.name || 'branch',
      time: toActivityTime(l.createdAt),
      icon: <Mail size={18} />,
      color: 'bg-blue-50 text-blue-600',
    }));

    const combined = [...feeActivities, ...leadActivities].slice(0, 5);
    setActivityItems(combined);
  }, []);

  useEffect(() => {
    if (hasServerData) {
      transformServerData(initialData);
      return;
    }

    // Fallback: client-side fetch using combined endpoint
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const { data } = await api.get('/admin/dashboard');
        if (data.success) {
          setPatientStats(data.data.patientStats);
          setLeadStats(data.data.leadStats);
          setAttendanceStats(data.data.attendanceStats);
          setFeeSummary(data.data.feeSummary);
          transformServerData(data.data);
        }
      } catch (err: unknown) {
        console.error('Failed to fetch dashboard data:', err);
        toast.error('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [hasServerData, initialData, transformServerData]);

  // Format currency value
  const formatCurrency = React.useCallback((value: number | undefined) => {
    if (value === undefined || value === null) return '₹0';
    if (value >= 100000) {
      return `₹${(value / 100000).toFixed(1)}L`;
    }
    return `₹${value.toLocaleString()}`;
  }, []);

  // Calculate staff percentage
  const staffPercentage = React.useMemo(() => attendanceStats 
    ? `${attendanceStats.present}/${attendanceStats.total}`
    : '0/0', [attendanceStats]);

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 relative z-10 w-full pb-6 lg:pb-10">
      {/* Dashboard Header Actions */}
      <div className="flex items-center justify-end">
        <button
          onClick={openModal}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 active:scale-95 transition-all shadow-md shadow-primary/20"
        >
          <Plus size={16} />
          <span>Add Patient</span>
        </button>
      </div>

      {/* KPI Grid */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {/* Total Revenue - from Fee Summary */}
        <div 
          onClick={() => router.push('/super-admin/finance')}
          className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/10 hover:-translate-y-1 hover:shadow-md hover:border-primary/30 transition-all duration-200 cursor-pointer group relative"
        >
          {isLoading ? (
             <div className="h-24 animate-pulse bg-surface-container-low rounded-lg" />
          ) : (
            <>
              <div className="flex items-start justify-between mb-3">
                <div className="p-2.5 rounded-lg bg-blue-50 group-hover:bg-blue-600 transition-colors duration-300">
                  <Wallet className="text-blue-600 group-hover:text-white transition-colors duration-300" size={20} />
                </div>
              </div>
              <p className="text-on-surface-variant text-[10px] uppercase tracking-wider mb-1 font-bold">Total Revenue</p>
              <h3 className="text-2xl font-black font-headline text-on-surface">{formatCurrency(feeSummary?.totalRevenue)}</h3>
              <p className="text-on-surface-variant/70 text-xs mt-2 flex items-center gap-1 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                From {feeSummary?.totalTransactions || 0} transactions
              </p>
            </>
          )}
        </div>

        {/* Active Patients */}
        <div 
          onClick={() => router.push('/super-admin/patients')}
          className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/10 hover:-translate-y-1 hover:shadow-md hover:border-primary/30 transition-all duration-200 cursor-pointer group relative"
        >
          {isLoading ? (
            <div className="h-24 animate-pulse bg-surface-container-low rounded-lg" />
          ) : (
            <>
              <div className="flex items-start justify-between mb-3">
                <div className="p-2.5 rounded-lg bg-emerald-50 group-hover:bg-emerald-600 transition-colors duration-300">
                  <UsersRound className="text-emerald-600 group-hover:text-white transition-colors duration-300" size={20} />
                </div>
              </div>
              <p className="text-on-surface-variant text-[10px] uppercase tracking-wider mb-1 font-bold">Active Patients</p>
              <h3 className="text-2xl font-black font-headline text-on-surface">{patientStats?.active || 0}</h3>
              <p className="text-on-surface-variant/70 text-xs mt-2 flex items-center gap-1 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Of {patientStats?.total || 0} total
              </p>
            </>
          )}
        </div>

        {/* Outstanding Dues */}
        <div 
          onClick={() => router.push('/super-admin/finance')}
          className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/10 hover:-translate-y-1 hover:shadow-md hover:border-primary/30 transition-all duration-200 cursor-pointer group relative"
        >
          {isLoading ? (
            <div className="h-24 animate-pulse bg-surface-container-low rounded-lg" />
          ) : (
            <>
              <div className="flex items-start justify-between mb-3">
                <div className="p-2.5 rounded-lg bg-rose-50 group-hover:bg-rose-600 transition-colors duration-300">
                  <CreditCard className="text-rose-600 group-hover:text-white transition-colors duration-300" size={20} />
                </div>
                {(feeSummary?.totalDues || 0) > 50000 && (
                  <div className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border border-rose-200">
                    CRITICAL
                  </div>
                )}
              </div>
              <p className="text-on-surface-variant text-[10px] uppercase tracking-wider mb-1 font-bold">Outstanding Dues</p>
              <h3 className="text-2xl font-black font-headline text-on-surface">{formatCurrency(feeSummary?.totalDues)}</h3>
              <p className="text-on-surface-variant/70 text-xs mt-2 flex items-center gap-1 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                Pending collection
              </p>
            </>
          )}
        </div>

        {/* Staff on Duty */}
        <div 
          onClick={() => router.push('/super-admin/staff')}
          className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/10 hover:-translate-y-1 hover:shadow-md hover:border-primary/30 transition-all duration-200 cursor-pointer group relative"
        >
          {isLoading ? (
            <div className="h-24 animate-pulse bg-surface-container-low rounded-lg" />
          ) : (
            <>
              <div className="flex items-start justify-between mb-3">
                <div className="p-2.5 rounded-lg bg-slate-100 group-hover:bg-slate-700 transition-colors duration-300">
                  <BadgeCheck className="text-slate-600 group-hover:text-white transition-colors duration-300" size={20} />
                </div>
              </div>
              <p className="text-on-surface-variant text-[10px] uppercase tracking-wider mb-1 font-bold">Staff on Duty</p>
              <h3 className="text-2xl font-black font-headline text-on-surface">{staffPercentage}</h3>
              <p className="text-on-surface-variant/70 text-xs mt-2 flex items-center gap-1 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                Present today
              </p>
            </>
          )}
        </div>
      </motion.div>

      {/* Row 1: Chart & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2"
        >
          <RevenueChart monthlyTrend={feeSummary?.monthlyTrend} isLoading={isLoading} />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <ActivityFeed items={activityItems} isLoading={isLoading} liveItems={liveFeedItems} />
        </motion.div>
      </div>

      {/* Row 2: Performance & Leads */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <BranchPerformance branchWise={feeSummary?.branchWise} isLoading={isLoading} />
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-2"
        >
          <RecentLeads leads={recentLeads} isLoading={isLoading} />
        </motion.div>
      </div>
    </div>
  );
};
