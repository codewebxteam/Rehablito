import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  UsersRound,
  CreditCard,
  BadgeCheck,
  Mail,
  Wallet
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { toast } from 'sonner';

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

const RevenueChart = ({ monthlyTrend = [], isLoading = false }: RevenueChartProps) => {
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const { data, branches } = React.useMemo(() => {
    if (!monthlyTrend.length) return { data: [] as Array<Record<string, string | number>>, branches: [] as string[] };
    const branchSet = new Set<string>();
    const bucket: Record<string, Record<string, string | number>> = {};
    monthlyTrend.forEach((m) => {
      const key = `${m._id.year}-${m._id.month}`;
      const branchName = m._id.branchName || 'Unknown';
      branchSet.add(branchName);
      if (!bucket[key]) {
        bucket[key] = { name: MONTH_LABELS[(m._id.month - 1) % 12], _year: m._id.year, _month: m._id.month };
      }
      bucket[key][branchName] = Math.round(m.revenue / 1000);
    });
    const sorted = Object.values(bucket).sort((a, b) => {
      if (a._year !== b._year) return (a._year as number) - (b._year as number);
      return (a._month as number) - (b._month as number);
    });
    return { data: sorted, branches: Array.from(branchSet) };
  }, [monthlyTrend]);

  if (!isMounted || isLoading) {
    return (
      <div className="bg-surface-container-lowest p-8 rounded-xl shadow-sm border border-outline-variant/10">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
          <div>
            <h4 className="text-xl font-bold font-headline text-on-surface">Revenue Trends</h4>
            <p className="text-sm text-on-surface-variant mt-1">Consolidated branch performance (last 6 months)</p>
          </div>
        </div>
        <div className="h-72 w-full animate-pulse bg-surface-container-low rounded-xl"></div>
      </div>
    );
  }

  return (
    <div className="bg-surface-container-lowest p-8 rounded-xl shadow-sm border border-outline-variant/10">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
        <div>
          <h4 className="text-xl font-bold font-headline text-on-surface">Revenue Trends</h4>
          <p className="text-sm text-on-surface-variant mt-1">Consolidated branch performance (last 6 months, in ₹K)</p>
        </div>
        <div className="flex flex-wrap gap-5">
          {branches.map((b, i) => (
            <div key={b} className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: BRANCH_COLORS[i % BRANCH_COLORS.length] }}></span>
              <span className="text-xs font-bold text-on-surface-variant">{b}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="h-72 w-full">
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-sm text-on-surface-variant">
            No revenue data available.
          </div>
        ) : (
          <ResponsiveContainer width="99%" height={288}>
            <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f2f4f6" />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#434655', fontSize: 11, fontWeight: 700 }}
                dy={10}
              />
              <YAxis hide />
              <Tooltip
                cursor={{ fill: 'transparent' }}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                formatter={(value, name) => [`₹${value}K`, String(name)]}
              />
              {branches.map((b, i) => (
                <Bar key={b} dataKey={b} fill={BRANCH_COLORS[i % BRANCH_COLORS.length]} radius={[4, 4, 0, 0]} barSize={12} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

interface ActivityFeedProps {
  items: ActivityItem[];
  isLoading?: boolean;
}

const ActivityFeed = ({ items, isLoading = false }: ActivityFeedProps) => (
  <div className="bg-surface-container-lowest p-8 rounded-xl shadow-sm border border-outline-variant/10">
    <div className="flex items-center justify-between mb-8">
      <h4 className="text-xl font-bold font-headline text-on-surface">Live Activity</h4>
      <span className="w-2 h-2 bg-error rounded-full animate-ping"></span>
    </div>
    {isLoading ? (
      <div className="space-y-4">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-12 bg-surface-container-low rounded-lg animate-pulse" />)}
      </div>
    ) : items.length === 0 ? (
      <p className="text-sm text-on-surface-variant text-center py-8">No recent activity yet.</p>
    ) : (
      <div className="space-y-7">
        {items.map((item, idx) => (
          <div key={item.id} className="flex gap-4 relative">
            {idx !== items.length - 1 && (
              <div className="absolute top-10 left-4.5 -bottom-8 w-0.5 bg-surface-container-low"></div>
            )}
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 z-10 border border-outline-variant/10", item.color)}>
              {item.icon}
            </div>
            <div className="flex-1 pt-0.5">
              <p className="text-sm font-semibold text-on-surface leading-snug">
                <span className="text-primary font-bold">{item.user}</span> {item.action} {item.location}
              </p>
              <p className="text-[11px] text-on-surface-variant mt-1 font-medium opacity-60">{item.time}</p>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

interface BranchPerformanceProps {
  branchWise?: FeeSummary['branchWise'];
  isLoading?: boolean;
}

const BranchPerformance = ({ branchWise = [], isLoading = false }: BranchPerformanceProps) => {
  const maxRevenue = Math.max(1, ...branchWise.map(b => b.revenue));
  const fmt = (v: number) => v >= 100000 ? `₹${(v / 100000).toFixed(1)}L` : v >= 1000 ? `₹${(v / 1000).toFixed(1)}K` : `₹${v}`;

  return (
    <div className="bg-surface-container-lowest p-8 rounded-xl shadow-sm border border-outline-variant/10">
      <h4 className="text-xl font-bold font-headline text-on-surface mb-8">Branch Performance</h4>
      {isLoading ? (
        <div className="space-y-8">
          {[1, 2, 3].map(i => <div key={i} className="h-14 bg-surface-container-low rounded-lg animate-pulse" />)}
        </div>
      ) : branchWise.length === 0 ? (
        <p className="text-sm text-on-surface-variant text-center py-4">No branch revenue recorded yet.</p>
      ) : (
        <div className="space-y-8">
          {branchWise.map((branch, i) => {
            const progress = Math.round((branch.revenue / maxRevenue) * 100);
            return (
              <div key={branch._id || branch.branchName} className="space-y-3">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-sm font-bold text-on-surface">{branch.branchName}</p>
                    <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider mt-1 opacity-60">
                      {branch.count} TXN · ₹{branch.dues.toLocaleString('en-IN')} DUE
                    </p>
                  </div>
                  <span className="text-sm font-black text-secondary">{fmt(branch.revenue)}</span>
                </div>
                <div className="w-full h-2.5 bg-surface-container-low rounded-full overflow-hidden">
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
};

interface RecentLeadsProps {
  leads?: LeadItem[];
  isLoading?: boolean;
}

const RecentLeads = ({ leads = [], isLoading = false }: RecentLeadsProps) => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h4 className="text-xl font-bold font-headline text-on-surface">Recent Leads</h4>
      <button className="text-sm font-bold text-primary hover:underline bg-primary/5 px-4 py-2 rounded-xl transition-all">
        View All Activity
      </button>
    </div>
    {isLoading ? (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-surface-container-lowest p-5 rounded-xl animate-pulse h-24"></div>
        ))}
      </div>
    ) : leads.length === 0 ? (
      <p className="text-sm text-on-surface-variant text-center py-8">No recent leads.</p>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {leads.map((lead) => (
        <motion.div 
          key={lead.id}
          whileHover={{ scale: 1.02 }}
          className="bg-surface-container-lowest p-5 rounded-xl shadow-sm border border-outline-variant/10 flex items-center gap-5 hover:border-primary/20 transition-all cursor-pointer group"
        >
          <div className={cn("w-14 h-14 rounded-xl flex items-center justify-center font-bold text-lg group-hover:bg-primary group-hover:text-white transition-all", lead.color)}>
            {lead.initials}
          </div>
          <div className="flex-1">
            <h5 className="text-[15px] font-bold text-on-surface">{lead.name}</h5>
            <p className="text-xs text-on-surface-variant mt-0.5 opacity-60">{lead.phone}</p>
          </div>
          <div className="text-right">
            <span className="px-2.5 py-1.5 bg-surface-container-low text-[9px] font-black rounded-lg text-on-surface-variant block mb-1.5 uppercase tracking-wider">
              {lead.type}
            </span>
            <span className="text-[10px] text-on-surface-variant font-bold opacity-60">{lead.location}</span>
          </div>
        </motion.div>
      ))}
    </div>
    )}
  </div>
);

// --- Main View ---
export const DashboardView = () => {
  const [patientStats, setPatientStats] = useState<PatientStats | null>(null);
  const [, setLeadStats] = useState<LeadStats | null>(null);
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats | null>(null);
  const [feeSummary, setFeeSummary] = useState<FeeSummary | null>(null);
  const [recentLeads, setRecentLeads] = useState<LeadItem[]>([]);
  const [activityItems, setActivityItems] = useState<ActivityItem[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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

    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);

        const [patientsRes, leadsRes, attendanceRes, feesRes, leadsListRes, feesListRes] = await Promise.all([
          api.get('/admin/patients/stats'),
          api.get('/admin/leads/stats'),
          api.get('/admin/attendance/stats'),
          api.get('/admin/fees/summary'),
          api.get('/admin/leads'),
          api.get('/admin/fees'),
        ]);

        if (patientsRes.data.success) setPatientStats(patientsRes.data.data);
        if (leadsRes.data.success) setLeadStats(leadsRes.data.data);
        if (attendanceRes.data.success) setAttendanceStats(attendanceRes.data.data);
        if (feesRes.data.success) setFeeSummary(feesRes.data.data);

        const leadPalette = [
          'bg-blue-50 text-blue-700',
          'bg-secondary-container/20 text-secondary',
          'bg-surface-container-low text-on-surface-variant',
          'bg-primary-container/10 text-primary',
        ];

        let leadsForFeed: ApiLead[] = [];
        if (leadsListRes.data?.success && Array.isArray(leadsListRes.data.data)) {
          leadsForFeed = leadsListRes.data.data as ApiLead[];
          const transformed: LeadItem[] = leadsForFeed.slice(0, 4).map((lead, idx) => {
            const displayName = lead.childName || lead.parentName || 'Unknown';
            const masked = lead.parentPhone ? `XXXXXX${String(lead.parentPhone).slice(-4)}` : 'N/A';
            const initials = displayName
              .split(' ')
              .slice(0, 2)
              .map(n => n[0])
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
        }

        // Build activity feed from latest fees + latest leads
        const fees: ApiFee[] = feesListRes.data?.success ? (feesListRes.data.data || []) : [];
        const feeActivities: ActivityItem[] = fees.slice(0, 3).map(f => {
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

        const leadActivities: ActivityItem[] = leadsForFeed.slice(0, 3).map(l => ({
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
      } catch (err: unknown) {
        console.error('Failed to fetch dashboard data:', err);
        const axiosError = err as { response?: { data?: { message?: string } } };
        const message = axiosError?.response?.data?.message || 'Failed to load dashboard data';
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Format currency value
  const formatCurrency = (value: number | undefined) => {
    if (value === undefined || value === null) return '₹0';
    if (value >= 100000) {
      return `₹${(value / 100000).toFixed(1)}L`;
    }
    return `₹${value.toLocaleString()}`;
  };

  // Calculate staff percentage
  const staffPercentage = attendanceStats 
    ? `${attendanceStats.present}/${attendanceStats.total}`
    : '0/0';

  return (
    <div className="space-y-10 relative z-10 max-w-7xl mx-auto">
      {/* KPI Grid */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {/* Total Revenue - from Fee Summary */}
        <div className="bg-surface-container-lowest p-7 rounded-xl shadow-sm border border-outline-variant/10 animate-pulse" style={{ animationPlayState: isLoading ? 'running' : 'paused' }}>
          {!isLoading && (
            <>
              <div className="flex items-start justify-between mb-5">
                <div className="p-3.5 rounded-xl bg-secondary-container/30">
                  <Wallet className="text-secondary" size={32} />
                </div>
              </div>
              <p className="text-on-surface-variant text-[11px] uppercase tracking-widest mb-1.5 font-bold opacity-60">Total Revenue</p>
              <h3 className="text-3xl font-black font-headline text-on-surface">{formatCurrency(feeSummary?.totalRevenue)}</h3>
              <p className="text-on-surface-variant/40 text-xs mt-3 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                From {feeSummary?.totalTransactions || 0} transactions
              </p>
            </>
          )}
        </div>

        {/* Active Patients */}
        <div className="bg-surface-container-lowest p-7 rounded-xl shadow-sm border border-outline-variant/10 animate-pulse" style={{ animationPlayState: isLoading ? 'running' : 'paused' }}>
          {!isLoading && (
            <>
              <div className="flex items-start justify-between mb-5">
                <div className="p-3.5 rounded-xl bg-primary-container/10">
                  <UsersRound className="text-primary" size={32} />
                </div>
              </div>
              <p className="text-on-surface-variant text-[11px] uppercase tracking-widest mb-1.5 font-bold opacity-60">Active Patients</p>
              <h3 className="text-3xl font-black font-headline text-on-surface">{patientStats?.active || 0}</h3>
              <p className="text-on-surface-variant/40 text-xs mt-3 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                Of {patientStats?.total || 0} total
              </p>
            </>
          )}
        </div>

        {/* Outstanding Dues */}
        <div className="bg-surface-container-lowest p-7 rounded-xl shadow-sm border border-outline-variant/10 animate-pulse" style={{ animationPlayState: isLoading ? 'running' : 'paused' }}>
          {!isLoading && (
            <>
              <div className="flex items-start justify-between mb-5">
                <div className="p-3.5 rounded-xl bg-error-container/20">
                  <CreditCard className="text-error" size={32} />
                </div>
                {(feeSummary?.totalDues || 0) > 50000 && (
                  <div className="bg-error/10 text-error px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter">
                    CRITICAL
                  </div>
                )}
              </div>
              <p className="text-on-surface-variant text-[11px] uppercase tracking-widest mb-1.5 font-bold opacity-60">Outstanding Dues</p>
              <h3 className="text-3xl font-black font-headline text-on-surface">{formatCurrency(feeSummary?.totalDues)}</h3>
              <p className="text-on-surface-variant/40 text-xs mt-3 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-error"></span>
                Pending collection
              </p>
            </>
          )}
        </div>

        {/* Staff on Duty */}
        <div className="bg-surface-container-lowest p-7 rounded-xl shadow-sm border border-outline-variant/10 animate-pulse" style={{ animationPlayState: isLoading ? 'running' : 'paused' }}>
          {!isLoading && (
            <>
              <div className="flex items-start justify-between mb-5">
                <div className="p-3.5 rounded-xl bg-surface-container-low">
                  <BadgeCheck className="text-on-surface" size={32} />
                </div>
              </div>
              <p className="text-on-surface-variant text-[11px] uppercase tracking-widest mb-1.5 font-bold opacity-60">Staff on Duty</p>
              <h3 className="text-3xl font-black font-headline text-on-surface">{staffPercentage}</h3>
              <p className="text-on-surface-variant/40 text-xs mt-3 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-on-surface"></span>
                Present today
              </p>
            </>
          )}
        </div>
      </motion.div>

      {/* Row 1: Chart & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
          <ActivityFeed items={activityItems} isLoading={isLoading} />
        </motion.div>
      </div>

      {/* Row 2: Performance & Leads */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10">
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
