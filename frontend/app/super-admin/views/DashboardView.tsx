import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  TrendingUp, 
  UsersRound, 
  CreditCard, 
  BadgeCheck, 
  Mail,
  ArrowUpRight,
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
interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down';
  status?: string;
  color: string;
}

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

// --- Mock Data (Fallback) ---
const REVENUE_DATA = [
  { name: 'JAN', Mumbai: 60, Patna: 40, Delhi: 30 },
  { name: 'FEB', Mumbai: 70, Patna: 45, Delhi: 35 },
  { name: 'MAR', Mumbai: 85, Patna: 55, Delhi: 40 },
  { name: 'APR', Mumbai: 95, Patna: 65, Delhi: 50 },
  { name: 'MAY', Mumbai: 75, Patna: 50, Delhi: 40 },
  { name: 'JUN', Mumbai: 80, Patna: 60, Delhi: 45 },
];

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

interface FeeSummary {
  totalRevenue: number;
  totalDues: number;
  totalTransactions: number;
  branchWise: Array<{
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
}

interface ApiLead {
  _id: string;
  name: string;
  phone?: string;
  service?: string;
  location?: string;
}

const ACTIVITIES: ActivityItem[] = [
  { id: '1', user: 'Rohit Desai', action: 'registered at', location: 'Mumbai', time: '10:42 AM', icon: <Users size={18} />, color: 'bg-blue-50 text-blue-600' },
  { id: '2', user: 'Payment ₹3,500', action: 'received at', location: 'Patna', time: '10:15 AM', icon: <CreditCard size={18} />, color: 'bg-secondary-container/20 text-secondary' },
  { id: '3', user: 'Anjali Singh', action: 'discharge processed', location: 'Delhi', time: '09:50 AM', icon: <BadgeCheck size={18} />, color: 'bg-primary-container/10 text-primary' },
  { id: '4', user: 'Inquiry from N. Khan', action: 'for', location: 'Mumbai', time: '09:30 AM', icon: <Mail size={18} />, color: 'bg-surface-container-low text-on-surface-variant' },
];

// Mock leads - will be replaced with API data
const DEFAULT_LEADS: LeadItem[] = [
  { id: '1', name: 'Aman Sharma', phone: 'XXXXXX1234', type: 'PHYSIO', location: 'Mumbai', initials: 'AS', color: 'bg-blue-50 text-blue-700' },
  { id: '2', name: 'Vikram Patnaik', phone: 'XXXXXX5678', type: 'AUTISM', location: 'Patna', initials: 'VP', color: 'bg-secondary-container/20 text-secondary' },
  { id: '3', name: 'Kavita Rao', phone: 'XXXXXX9012', type: 'PHYSIO', location: 'Delhi', initials: 'KR', color: 'bg-surface-container-low text-on-surface-variant' },
  { id: '4', name: 'Meher Khan', phone: 'XXXXXX3456', type: 'AUTISM', location: 'Mumbai', initials: 'MK', color: 'bg-blue-50 text-blue-600' },
];

// --- Components ---

const StatCard = ({ title, value, change, icon, trend, status, color }: StatCardProps) => (
  <motion.div 
    whileHover={{ y: -4 }}
    className="bg-surface-container-lowest p-7 rounded-xl shadow-sm border border-outline-variant/10"
  >
    <div className="flex items-start justify-between mb-5">
      <div className={cn("p-3.5 rounded-xl", color)}>
        {icon}
      </div>
      {change && (
        <div className={cn(
          "flex items-center gap-1 font-bold text-sm px-2 py-1 rounded-lg",
          trend === 'up' ? "text-secondary bg-secondary/5" : "text-error bg-error/5"
        )}>
          {trend === 'up' ? <ArrowUpRight size={16} /> : <TrendingUp size={16} className="rotate-180" />}
          {change}
        </div>
      )}
      {status && (
        <div className="bg-error/10 text-error px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter">
          {status}
        </div>
      )}
    </div>
    <p className="text-on-surface-variant text-[11px] uppercase tracking-widest mb-1.5 font-bold opacity-60">{title}</p>
    <h3 className="text-3xl font-black font-headline text-on-surface">{value}</h3>
    <p className="text-on-surface-variant/40 text-xs mt-3 flex items-center gap-1">
      <span className={cn("w-1.5 h-1.5 rounded-full", trend === 'up' ? "bg-secondary" : "bg-primary")}></span>
      vs last month
    </p>
  </motion.div>
);

const RevenueChart = () => {
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="bg-surface-container-lowest p-8 rounded-xl shadow-sm border border-outline-variant/10">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
          <div>
            <h4 className="text-xl font-bold font-headline text-on-surface">Revenue Trends</h4>
            <p className="text-sm text-on-surface-variant mt-1">Consolidated branch performance (Jan - Jun)</p>
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
          <p className="text-sm text-on-surface-variant mt-1">Consolidated branch performance (Jan - Jun)</p>
        </div>
        <div className="flex flex-wrap gap-5">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-primary-container"></span>
            <span className="text-xs font-bold text-on-surface-variant">Mumbai</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-secondary"></span>
            <span className="text-xs font-bold text-on-surface-variant">Patna</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-outline-variant"></span>
            <span className="text-xs font-bold text-on-surface-variant">Delhi</span>
          </div>
        </div>
      </div>
      <div className="h-72 w-full">
        <ResponsiveContainer width="99%" height={288}>
          <BarChart data={REVENUE_DATA} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
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
            />
            <Bar dataKey="Mumbai" fill="#2563eb" radius={[4, 4, 0, 0]} barSize={12} />
            <Bar dataKey="Patna" fill="#006a61" radius={[4, 4, 0, 0]} barSize={12} />
            <Bar dataKey="Delhi" fill="#c3c6d7" radius={[4, 4, 0, 0]} barSize={12} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const ActivityFeed = () => (
  <div className="bg-surface-container-lowest p-8 rounded-xl shadow-sm border border-outline-variant/10">
    <div className="flex items-center justify-between mb-8">
      <h4 className="text-xl font-bold font-headline text-on-surface">Live Activity</h4>
      <span className="w-2 h-2 bg-error rounded-full animate-ping"></span>
    </div>
    <div className="space-y-7">
      {ACTIVITIES.map((item, idx) => (
        <div key={item.id} className="flex gap-4 relative">
          {idx !== ACTIVITIES.length - 1 && (
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
  </div>
);

const BranchPerformance = () => (
  <div className="bg-surface-container-lowest p-8 rounded-xl shadow-sm border border-outline-variant/10">
    <h4 className="text-xl font-bold font-headline text-on-surface mb-8">Branch Performance</h4>
    <div className="space-y-8">
      {[
        { name: 'Mumbai — Andheri', stats: '138 PTS · 9 STAFF · 22 LEADS', value: '₹2.1L', progress: 74, color: 'bg-secondary' },
        { name: 'Patna — Boring Road', stats: '106 PTS · 7 STAFF · 15 LEADS', value: '₹1.6L', progress: 56, color: 'bg-teal-500' },
        { name: 'Delhi — Dwarka', stats: '68 PTS · 5 STAFF · 9 LEADS', value: '₹1.1L', progress: 38, color: 'bg-blue-400' },
      ].map((branch) => (
        <div key={branch.name} className="space-y-3">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-sm font-bold text-on-surface">{branch.name}</p>
              <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider mt-1 opacity-60">{branch.stats}</p>
            </div>
            <span className="text-sm font-black text-secondary">{branch.value}</span>
          </div>
          <div className="w-full h-2.5 bg-surface-container-low rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${branch.progress}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={cn("h-full rounded-full", branch.color)} 
            />
          </div>
        </div>
      ))}
    </div>
  </div>
);

interface RecentLeadsProps {
  leads?: LeadItem[];
  isLoading?: boolean;
}

const RecentLeads = ({ leads = DEFAULT_LEADS, isLoading = false }: RecentLeadsProps) => (
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
  const [leadStats, setLeadStats] = useState<LeadStats | null>(null);
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats | null>(null);
  const [feeSummary, setFeeSummary] = useState<FeeSummary | null>(null);
  const [recentLeads, setRecentLeads] = useState<LeadItem[]>(DEFAULT_LEADS);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch all stats in parallel
        const [patientsRes, leadsRes, attendanceRes, feesRes, leadsListRes] = await Promise.all([
          api.get('/admin/patients/stats'),
          api.get('/admin/leads/stats'),
          api.get('/admin/attendance/stats'),
          api.get('/admin/fees/summary'),
          api.get('/admin/leads?limit=4&sort=-createdAt')
        ]);

        if (patientsRes.data.success) {
          setPatientStats(patientsRes.data.data);
        }
        if (leadsRes.data.success) {
          setLeadStats(leadsRes.data.data);
        }
        if (attendanceRes.data.success) {
          setAttendanceStats(attendanceRes.data.data);
        }
        if (feesRes.data.success) {
          setFeeSummary(feesRes.data.data);
        }
        if (leadsListRes.data.success && leadsListRes.data.data.length > 0) {
          // Transform leads data to match LeadItem type
          const transformedLeads = leadsListRes.data.data.map((lead: ApiLead, idx: number) => ({
            id: lead._id,
            name: lead.name,
            phone: lead.phone ? `XXXXXX${String(lead.phone).slice(-4)}` : 'N/A',
            type: lead.service || 'SERVICE',
            location: lead.location || 'Unknown',
            initials: lead.name?.split(' ').slice(0, 2).map((n: string) => n[0]).join('') || 'XX',
            color: ['bg-blue-50 text-blue-700', 'bg-secondary-container/20 text-secondary', 'bg-surface-container-low text-on-surface-variant'][idx % 3]
          }));
          setRecentLeads(transformedLeads.slice(0, 4));
        }
      } catch (err: unknown) {
        console.error('Failed to fetch dashboard data:', err);
        const axiosError = err as { response?: { data?: { message?: string } } };
        const message = axiosError?.response?.data?.message || 'Failed to load dashboard data';
        setError(message);
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
          <RevenueChart />
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <ActivityFeed />
        </motion.div>
      </div>

      {/* Row 2: Performance & Leads */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <BranchPerformance />
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
