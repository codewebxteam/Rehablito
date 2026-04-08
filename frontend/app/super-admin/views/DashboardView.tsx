import React from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  TrendingUp, 
  UsersRound, 
  CreditCard, 
  BadgeCheck, 
  Mail,
  ArrowUpRight,
  Wallet,
  Loader2
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
import {
  useAdminPatientStats,
  useAdminLeadStats,
  useAdminFeeSummary,
  useAdminAttendanceStats,
  useAdminLeads,
  useAdminBranches,
} from '../hooks/useAdminData';

// --- Types ---
interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down';
  status?: string;
  color: string;
  loading?: boolean;
}

// Static chart data (real data would need aggregate endpoint)
const REVENUE_DATA = [
  { name: 'JAN', Mumbai: 60, Patna: 40, Delhi: 30 },
  { name: 'FEB', Mumbai: 70, Patna: 45, Delhi: 35 },
  { name: 'MAR', Mumbai: 85, Patna: 55, Delhi: 40 },
  { name: 'APR', Mumbai: 95, Patna: 65, Delhi: 50 },
  { name: 'MAY', Mumbai: 75, Patna: 50, Delhi: 40 },
  { name: 'JUN', Mumbai: 80, Patna: 60, Delhi: 45 },
];

// --- Components ---

const StatCard = ({ title, value, change, icon, trend, status, color, loading }: StatCardProps) => (
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
    {loading ? (
      <div className="flex items-center gap-2">
        <Loader2 size={18} className="animate-spin text-on-surface-variant/40" />
        <span className="text-on-surface-variant/40 text-sm">Loading...</span>
      </div>
    ) : (
      <h3 className="text-3xl font-black font-headline text-on-surface">{value}</h3>
    )}
    <p className="text-on-surface-variant/40 text-xs mt-3 flex items-center gap-1">
      <span className={cn("w-1.5 h-1.5 rounded-full", trend === 'up' ? "bg-secondary" : "bg-primary")}></span>
      vs last month
    </p>
  </motion.div>
);

const RevenueChart = () => {
  const [isMounted, setIsMounted] = React.useState(false);
  React.useEffect(() => { setIsMounted(true); }, []);

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
          {[['bg-primary-container','Mumbai'],['bg-secondary','Patna'],['bg-outline-variant','Delhi']].map(([cls,label]) => (
            <div key={label} className="flex items-center gap-2">
              <span className={cn("w-2.5 h-2.5 rounded-full", cls)}></span>
              <span className="text-xs font-bold text-on-surface-variant">{label}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="h-72 w-full">
        <ResponsiveContainer width="99%" height={288}>
          <BarChart data={REVENUE_DATA} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f2f4f6" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#434655', fontSize: 11, fontWeight: 700 }} dy={10} />
            <YAxis hide />
            <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
            <Bar dataKey="Mumbai" fill="#2563eb" radius={[4, 4, 0, 0]} barSize={12} />
            <Bar dataKey="Patna"  fill="#006a61" radius={[4, 4, 0, 0]} barSize={12} />
            <Bar dataKey="Delhi"  fill="#c3c6d7" radius={[4, 4, 0, 0]} barSize={12} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const ActivityFeed = () => {
  // Using recent leads as activity feed
  const { data: leads, isLoading } = useAdminLeads();
  const recentLeads = (leads ?? []).slice(0, 4);

  return (
    <div className="bg-surface-container-lowest p-8 rounded-xl shadow-sm border border-outline-variant/10">
      <div className="flex items-center justify-between mb-8">
        <h4 className="text-xl font-bold font-headline text-on-surface">Recent Leads</h4>
        <span className="w-2 h-2 bg-error rounded-full animate-ping"></span>
      </div>
      {isLoading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => (
            <div key={i} className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-surface-container-low animate-pulse shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-surface-container-low rounded-full animate-pulse w-3/4" />
                <div className="h-2 bg-surface-container-low rounded-full animate-pulse w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-7">
          {recentLeads.map((lead, idx) => (
            <div key={lead._id} className="flex gap-4 relative">
              {idx !== recentLeads.length - 1 && (
                <div className="absolute top-10 left-[18px] bottom-[-32px] w-[2px] bg-surface-container-low"></div>
              )}
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 z-10 border border-outline-variant/10 bg-blue-50 text-blue-600">
                <Users size={18} />
              </div>
              <div className="flex-1 pt-0.5">
                <p className="text-sm font-semibold text-on-surface leading-snug">
                  <span className="text-primary font-bold">{lead.name}</span> — {lead.source ?? 'New Lead'}
                </p>
                <p className="text-[11px] text-on-surface-variant mt-1 font-medium opacity-60 capitalize">{lead.status}</p>
              </div>
            </div>
          ))}
          {recentLeads.length === 0 && (
            <p className="text-sm text-on-surface-variant opacity-60 text-center py-4">No leads yet.</p>
          )}
        </div>
      )}
    </div>
  );
};

const BranchPerformance = () => {
  const { data: branches, isLoading } = useAdminBranches();

  return (
    <div className="bg-surface-container-lowest p-8 rounded-xl shadow-sm border border-outline-variant/10">
      <h4 className="text-xl font-bold font-headline text-on-surface mb-8">Branch Overview</h4>
      {isLoading ? (
        <div className="space-y-6">
          {[1,2,3].map(i => (
            <div key={i} className="space-y-3">
              <div className="h-3 bg-surface-container-low rounded-full animate-pulse w-2/3" />
              <div className="h-2 bg-surface-container-low rounded-full animate-pulse" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {(branches ?? []).map((branch, idx) => {
            const colors = ['bg-secondary', 'bg-teal-500', 'bg-blue-400', 'bg-purple-400'];
            const color  = colors[idx % colors.length];
            return (
              <div key={branch._id} className="space-y-3">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-sm font-bold text-on-surface">{branch.name}</p>
                    <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider mt-1 opacity-60">
                      {branch.city ?? branch.address ?? ''}
                    </p>
                  </div>
                </div>
                <div className="w-full h-2.5 bg-surface-container-low rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(80, 30 + idx * 20)}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={cn("h-full rounded-full", color)} 
                  />
                </div>
              </div>
            );
          })}
          {(branches ?? []).length === 0 && (
            <p className="text-sm text-on-surface-variant opacity-60 text-center py-4">No branches found.</p>
          )}
        </div>
      )}
    </div>
  );
};

// --- Main View ---
export const DashboardView = () => {
  const { data: patientStats, isLoading: pLoading } = useAdminPatientStats();
  const { data: leadStats,    isLoading: lLoading }  = useAdminLeadStats();
  const { data: feeSummary,   isLoading: fLoading }  = useAdminFeeSummary();
  const { data: attStats,     isLoading: aLoading }  = useAdminAttendanceStats();

  const fmt = (n?: number) => n != null ? n.toLocaleString('en-IN') : '—';

  return (
    <div className="space-y-10 relative z-10 max-w-7xl mx-auto">
      {/* KPI Grid */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <StatCard 
          title="Total Revenue" 
          value={feeSummary?.totalRevenue != null ? `₹${fmt(feeSummary.totalRevenue)}` : '₹—'}
          change="12%" 
          trend="up"
          icon={<Wallet className="text-secondary" size={32} />}
          color="bg-secondary-container/30"
          loading={fLoading}
        />
        <StatCard 
          title="Active Patients" 
          value={fmt(patientStats?.active ?? patientStats?.total)}
          change="+8" 
          trend="up"
          icon={<UsersRound className="text-primary" size={32} />}
          color="bg-primary-container/10"
          loading={pLoading}
        />
        <StatCard 
          title="Outstanding Dues" 
          value={feeSummary?.totalDue != null ? `₹${fmt(feeSummary.totalDue)}` : '₹—'}
          status="CRITICAL"
          icon={<CreditCard className="text-error" size={32} />}
          color="bg-error-container/20"
          loading={fLoading}
        />
        <StatCard 
          title="Staff on Duty" 
          value={attStats ? `${attStats.present ?? 0}/${attStats.total ?? 0}` : '—/—'}
          icon={<BadgeCheck className="text-on-surface" size={32} />}
          color="bg-surface-container-low"
          loading={aLoading}
        />
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

      {/* Row 2: Branch & Leads Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <BranchPerformance />
        </motion.div>

        {/* Lead Conversion Stats */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-2"
        >
          <div className="bg-surface-container-lowest p-8 rounded-xl shadow-sm border border-outline-variant/10">
            <h4 className="text-xl font-bold font-headline text-on-surface mb-6">Lead Overview</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-surface-container-low rounded-xl p-6 text-center">
                <p className="text-3xl font-black text-on-surface font-headline">
                  {lLoading ? '…' : fmt(leadStats?.total)}
                </p>
                <p className="text-xs text-on-surface-variant uppercase tracking-wider font-bold mt-2 opacity-60">Total Leads</p>
              </div>
              <div className="bg-secondary/5 rounded-xl p-6 text-center">
                <p className="text-3xl font-black text-secondary font-headline">
                  {lLoading ? '…' : fmt(leadStats?.converted)}
                </p>
                <p className="text-xs text-on-surface-variant uppercase tracking-wider font-bold mt-2 opacity-60">Converted</p>
              </div>
              <div className="bg-primary/5 rounded-xl p-6 text-center">
                <p className="text-3xl font-black text-primary font-headline">
                  {lLoading ? '…' : (leadStats?.conversionRate != null ? `${leadStats.conversionRate}%` : '—')}
                </p>
                <p className="text-xs text-on-surface-variant uppercase tracking-wider font-bold mt-2 opacity-60">Conv. Rate</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
