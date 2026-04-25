import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  UsersRound,
  CreditCard,
  BadgeCheck,
  Mail,
  Wallet,
  Activity,
  Plus,
  TrendingUp,
  Layers3,
  Clock,
  ArrowUpRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar,
  Legend,
} from 'recharts';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useAddTransaction, LiveFeedItem } from '../components/AddTransactionContext';
import { AddBranchModal } from '../components/AddBranchModal';
import { useBranch } from '../components/BranchContext';

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

const MONTH_LABELS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const BRANCH_PROGRESS_COLORS = ['#3b82f6', '#14b8a6', '#6366f1', '#f59e0b', '#a855f7', '#ec4899'];

// Dashboard API Response Types
interface PatientStats { total: number; active: number; discharged: number; onHold: number; }
interface LeadStats { total: number; new: number; contacted: number; converted: number; closed: number; }
interface AttendanceStats { date: string; present: number; absent: number; leave: number; halfDay: number; total: number; }
interface MonthlyTrendBucket { _id: { year: number; month: number; branchName: string }; revenue: number; }

interface FeeSummary {
  totalRevenue: number;
  totalDues: number;
  totalTransactions: number;
  branchWise: Array<{ _id: string; branchName: string; revenue: number; dues: number; count: number; }>;
  methodBreakdown: Array<{ _id: string; total: number; count: number; }>;
  monthlyTrend?: MonthlyTrendBucket[];
}

interface ApiLead { _id: string; childName: string; parentName?: string; parentPhone?: string; diagnosis?: string; branchId?: { name?: string } | null; createdAt: string; }
interface ApiFee { _id: string; amount: number; paymentDate: string; status: string; patientId?: { name?: string; parentName?: string } | null; branchId?: { name?: string } | null; }

// --- KPI CARD COMPACT ---
interface KpiCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  subColor?: string;
  bg: string;
  iconBg: string;
  iconColor: string;
  isLoading?: boolean;
  onClick: () => void;
}

const KpiCard = ({ icon, label, value, sub, subColor, bg, iconBg, iconColor, onClick }: KpiCardProps) => (
  <motion.div
    whileHover={{ y: -3, scale: 1.01 }}
    transition={{ type: 'spring', stiffness: 300, damping: 22 }}
    onClick={onClick}
    className={cn('cursor-pointer rounded-2xl p-4 border border-white/70 shadow-sm backdrop-blur-xl group relative overflow-hidden', bg)}
  >
    <div className="flex items-center justify-between mb-3">
      <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center transition-all group-hover:scale-110', iconBg, iconColor)}>
        {icon}
      </div>
      <ArrowUpRight size={14} className="text-on-surface-variant/20 group-hover:text-primary transition-colors" />
    </div>
    <p className="text-[10px] font-black uppercase tracking-[0.15em] text-on-surface-variant/40 mb-0.5">{label}</p>
    <p className="text-2xl font-black font-headline text-on-surface leading-none tracking-tight">{value}</p>
    <p className={cn('text-[11px] font-bold mt-2', subColor || 'text-on-surface-variant/50')}>{sub}</p>
  </motion.div>
);

// --- REVENUE TREND CHART ---
const RevenueTrends = React.memo(({ monthlyTrend = [], isLoading = false }: { monthlyTrend?: MonthlyTrendBucket[]; isLoading?: boolean }) => {
  const { data } = React.useMemo(() => {
    if (!monthlyTrend.length) return { data: [] as Array<Record<string, string | number>> };
    const bucket: Record<string, Record<string, string | number>> = {};
    monthlyTrend.forEach((m) => {
      const key = `${m._id.year}-${m._id.month}`;
      if (!bucket[key]) bucket[key] = { name: MONTH_LABELS[(m._id.month - 1) % 12], _year: m._id.year, _month: m._id.month, revenue: 0 };
      bucket[key].revenue = (bucket[key].revenue as number) + Math.round(m.revenue / 1000);
    });
    return { data: Object.values(bucket).sort((a, b) => (a._year as number) !== (b._year as number) ? (a._year as number) - (b._year as number) : (a._month as number) - (b._month as number)) };
  }, [monthlyTrend]);

  return (
    <div className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-base font-black font-headline text-on-surface">Revenue Trend</h4>
          <p className="text-[11px] text-on-surface-variant/50 font-medium">Monthly growth (₹K)</p>
        </div>
        <div className="p-2 bg-blue-50 rounded-xl"><TrendingUp size={16} className="text-blue-500" /></div>
      </div>
      <div className="h-[180px] w-full">
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-on-surface-variant/30 text-sm font-medium">No data yet</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 5, left: -28, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 700 }} dy={8} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 700 }} />
              <Tooltip contentStyle={{ backgroundColor: '#fff', borderRadius: '14px', border: 'none', boxShadow: '0 8px 24px rgb(0 0 0 / 0.1)', padding: '8px 12px' }} formatter={(v: any) => [`₹${v}K`, 'Revenue']} />
              <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} fill="url(#revGrad)" dot={{ r: 3, strokeWidth: 2, fill: '#fff', stroke: '#3b82f6' }} activeDot={{ r: 5, strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
});
RevenueTrends.displayName = 'RevenueTrends';

// --- PATIENT DONUT CHART ---
const PatientPieChart = React.memo(({ patient, isLoading }: { patient: PatientStats | null; isLoading: boolean }) => {
  const data = patient ? [
    { name: 'Active', value: patient.active, color: '#10b981' },
    { name: 'Discharged', value: patient.discharged, color: '#3b82f6' },
    { name: 'On Hold', value: patient.onHold, color: '#f59e0b' },
  ] : [];

  const RADIAN = Math.PI / 180;
  const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={10} fontWeight={800}>{`${(percent * 100).toFixed(0)}%`}</text>;
  };

  return (
    <div className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-base font-black font-headline text-on-surface">Patients</h4>
        <span className="text-xs font-black text-primary bg-primary/5 px-2.5 py-1 rounded-full">{patient?.total || 0} Total</span>
      </div>
      <div className="h-36">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} cx="50%" cy="50%" innerRadius={42} outerRadius={68} paddingAngle={3} dataKey="value" labelLine={false} label={renderLabel}>
                  {data.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgb(0 0 0 / 0.1)', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-between mt-2">
            {data.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                <div>
                  <p className="text-[10px] font-black text-on-surface">{d.value}</p>
                  <p className="text-[9px] text-on-surface-variant/50 font-bold">{d.name}</p>
                </div>
              </div>
            ))}
          </div>
    </div>
  );
});
PatientPieChart.displayName = 'PatientPieChart';

// --- LEAD FUNNEL ---
const LeadFunnel = React.memo(({ stats, isLoading }: { stats: LeadStats | null; isLoading: boolean }) => {
  const data = stats ? [
    { name: 'New', value: stats.new, fill: '#3b82f6' },
    { name: 'Contacted', value: stats.contacted, fill: '#f59e0b' },
    { name: 'Converted', value: stats.converted, fill: '#10b981' },
  ] : [];

  const max = Math.max(1, stats?.total || 1);

  return (
    <div className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-base font-black font-headline text-on-surface">Lead Pipeline</h4>
        {stats && (
          <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
            {Math.round((stats.converted / max) * 100)}% CVR
          </span>
        )}
      </div>
      <div className="space-y-3 mt-2">
        {data.map((stage) => (
            <div key={stage.name}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-[11px] font-black text-on-surface-variant/70 uppercase tracking-wide">{stage.name}</span>
                <span className="text-[12px] font-black text-on-surface">{stage.value}</span>
              </div>
              <div className="h-2 bg-slate-50 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(stage.value / max) * 100}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{ background: stage.fill }}
                />
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between pt-2 border-t border-slate-50 mt-2">
            <span className="text-[10px] uppercase font-black tracking-widest text-on-surface-variant/30">Pipeline Total</span>
            <span className="text-base font-black text-primary">{stats?.total || 0}</span>
          </div>
        </div>
    </div>
  );
});
LeadFunnel.displayName = 'LeadFunnel';

// --- PAYMENT PIE CHART ---
const PaymentPieChart = React.memo(({ fee, isLoading }: { fee: FeeSummary | null; isLoading: boolean }) => {
  const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
  const data = (fee?.methodBreakdown || []).map((m, i) => ({
    name: (m._id || 'Unknown').toUpperCase(),
    value: m.total,
    color: PIE_COLORS[i % PIE_COLORS.length],
  }));

  const total = data.reduce((s, d) => s + d.value, 0) || 1;

  return (
    <div className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-base font-black font-headline text-on-surface">Payment Mix</h4>
        <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full">
          ₹{((fee?.totalDues || 0) / 100000).toFixed(1)}L Due
        </span>
      </div>
      {data.length === 0 ? (
        <div className="h-36 flex items-center justify-center text-on-surface-variant/30 text-sm">No data</div>
      ) : (
        <>
          <div className="h-36">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} cx="50%" cy="50%" outerRadius={65} paddingAngle={4} dataKey="value" strokeWidth={0}>
                  {data.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                  formatter={(v: any) => [`₹${(v / 1000).toFixed(0)}K`, '']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2">
            {data.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
                <span className="text-[10px] font-black text-on-surface-variant/70">{d.name}</span>
                <span className="text-[10px] font-black text-on-surface">{Math.round((d.value / total) * 100)}%</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
});
PaymentPieChart.displayName = 'PaymentPieChart';

// --- BRANCH RANKINGS ---
const BranchRankings = React.memo(({ branchWise = [], isLoading = false }: { branchWise?: FeeSummary['branchWise']; isLoading?: boolean }) => {
  const maxRevenue = Math.max(1, ...branchWise.map(b => b.revenue));
  const fmt = (v: number) => v >= 100000 ? `₹${(v / 100000).toFixed(1)}L` : v >= 1000 ? `₹${(v / 1000).toFixed(1)}K` : `₹${v}`;

  return (
    <div className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-base font-black font-headline text-on-surface">Branch Performance</h4>
        <Layers3 size={16} className="text-on-surface-variant/20" />
      </div>
      {branchWise.length === 0 ? (
        <div className="py-8 text-center text-on-surface-variant/30 text-sm italic">No branch data</div>
      ) : (
        <div className="space-y-4">
          {branchWise.slice(0, 5).map((branch, i) => (
            <div key={branch._id || branch.branchName} className="flex items-center gap-3">
              <div className={cn('w-7 h-7 rounded-lg text-[11px] font-black flex items-center justify-center shrink-0',
                i === 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-50 text-slate-500')}>
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-end mb-1">
                  <span className="text-[12px] font-black text-on-surface truncate">{branch.branchName}</span>
                  <span className="text-[12px] font-black text-primary ml-2 shrink-0">{fmt(branch.revenue)}</span>
                </div>
                <div className="h-1.5 bg-slate-50 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(branch.revenue / maxRevenue) * 100}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ background: BRANCH_PROGRESS_COLORS[i % BRANCH_PROGRESS_COLORS.length] }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});
BranchRankings.displayName = 'BranchRankings';

// --- STAFF ATTENDANCE RADIAL ---
const StaffAttendance = React.memo(({ staff, isLoading }: { staff: AttendanceStats | null; isLoading: boolean }) => {
  const pct = staff ? Math.round((staff.present / Math.max(1, staff.total)) * 100) : 0;
  const radialData = [{ name: 'Present', value: pct, fill: '#10b981' }];

  return (
    <div className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-base font-black font-headline text-on-surface">Staff Today</h4>
        <BadgeCheck size={16} className="text-purple-400" />
      </div>
      {!staff ? (
        <div className="h-32 flex items-center justify-center text-sm text-on-surface-variant/40 font-medium">No data</div>
      ) : (
        <div className="flex items-center gap-4">
          <div className="h-28 w-28 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart cx="50%" cy="50%" innerRadius="68%" outerRadius="85%" data={radialData} startAngle={90} endAngle={-270} barSize={10}>
                <RadialBar background={{ fill: '#f8fafc' }} dataKey="value" cornerRadius={10} />
                <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" fill="#0f172a" fontSize={22} fontWeight={900}>{pct}%</text>
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[11px] font-black text-on-surface-variant/70">{staff.present} Present</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-rose-400" />
              <span className="text-[11px] font-black text-on-surface-variant/70">{staff.absent} Away</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-[11px] font-black text-on-surface-variant/70">{staff.leave} On Leave</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
StaffAttendance.displayName = 'StaffAttendance';

// --- LIVE FEED ---
const LiveFeed = React.memo(({ items, isLoading = false, liveItems = [] }: { items: ActivityItem[]; isLoading?: boolean; liveItems?: LiveFeedItem[] }) => {
  const router = useRouter();
  const toTime = (iso: string) => {
    const d = new Date(iso); const diffMs = Date.now() - d.getTime(); const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'now'; if (mins < 60) return `${mins}m`; const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`; return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  };

  const contextActivities: ActivityItem[] = liveItems.map(l => ({
    id: l.id, user: l.label, action: 'at', location: l.sub, time: toTime(l.time),
    icon: l.icon === 'payment' ? <CreditCard size={12} /> : l.icon === 'patient' ? <UsersRound size={12} /> : <Mail size={12} />,
    color: l.icon === 'payment' ? 'bg-emerald-50 text-emerald-600' : l.icon === 'patient' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600',
  }));

  const all = [...contextActivities, ...items].slice(0, 8);

  return (
    <div className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h4 className="text-base font-black font-headline text-on-surface">Live Feed</h4>
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
        </div>
        <button onClick={() => router.push('/super-admin/finance')} className="text-[10px] font-black text-primary/60 hover:text-primary uppercase tracking-widest transition-colors">
          View All
        </button>
      </div>
      <div className="space-y-3">
        {all.length === 0
            ? <p className="text-center py-6 text-on-surface-variant/30 text-xs italic font-medium">No activity yet</p>
            : all.map((item) => (
                <div key={item.id} className="flex items-center gap-3 group">
                  <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all group-hover:scale-110', item.color)}>
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-bold text-on-surface leading-tight truncate">
                      <span className="text-primary font-black">{item.user}</span>
                      {' '}<span className="text-on-surface-variant/60">{item.action} {item.location}</span>
                    </p>
                  </div>
                  <span className="text-[10px] font-black text-on-surface-variant/30 uppercase shrink-0">{item.time}</span>
                </div>
              ))
        }
      </div>
    </div>
  );
});
LiveFeed.displayName = 'LiveFeed';

// --- MAIN VIEW ---
export const DashboardView = ({ initialData }: { initialData?: any }) => {
  const router = useRouter();
  const [patientStats, setPatientStats] = useState<PatientStats | null>(initialData?.patientStats || null);
  const [leadStats, setLeadStats] = useState<LeadStats | null>(initialData?.leadStats || null);
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats | null>(initialData?.attendanceStats || null);
  const [feeSummary, setFeeSummary] = useState<FeeSummary | null>(initialData?.feeSummary || null);
  const [activityItems, setActivityItems] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [showAddBranch, setShowAddBranch] = useState(false);
  const { liveFeedItems } = useAddTransaction();
  const { selectedBranchId } = useBranch();

  const transformServerData = React.useCallback((data: any) => {
    if (!data) return;
    const toTime = (iso: string) => {
      const d = new Date(iso); const diffMs = Date.now() - d.getTime(); const mins = Math.floor(diffMs / 60000);
      if (mins < 1) return 'now'; if (mins < 60) return `${mins}m`; const hrs = Math.floor(mins / 60);
      if (hrs < 24) return `${hrs}h`; return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    };
    const fees: ApiFee[] = data.recentFees || [];
    const leads: ApiLead[] = data.recentLeads || [];
    setActivityItems([
      ...fees.slice(0, 4).map((f: ApiFee) => ({
        id: `fee-${f._id}`,
        user: f.patientId?.name ? `${f.patientId.name} · ₹${f.amount.toLocaleString()}` : `₹${f.amount.toLocaleString()}`,
        action: 'paid at', location: f.branchId?.name || 'Center', time: toTime(f.paymentDate),
        icon: <CreditCard size={12} />, color: 'bg-emerald-50 text-emerald-600',
      })),
      ...leads.slice(0, 4).map((l: ApiLead) => ({
        id: `lead-${l._id}`,
        user: l.parentName || l.childName || 'Inquiry',
        action: 'via', location: l.branchId?.name || 'Center', time: toTime(l.createdAt),
        icon: <Mail size={12} />, color: 'bg-blue-50 text-blue-600',
      })),
    ]);
  }, []);

  useEffect(() => {
    const fetchDashboard = async () => {
      let toastId;
      try {
        setIsLoading(true);
        toastId = toast.loading('Loading dashboard...', { duration: Infinity });
        const branchParam = selectedBranchId ? `?branch=${selectedBranchId}` : '';
        const { data } = await api.get(`/admin/dashboard${branchParam}`);
        if (data.success) {
          setPatientStats(data.data.patientStats);
          setLeadStats(data.data.leadStats);
          setAttendanceStats(data.data.attendanceStats);
          setFeeSummary(data.data.feeSummary);
          transformServerData(data.data);
        }
      } catch { toast.error('Failed to sync'); }
      finally { 
        setIsLoading(false); 
        if (toastId) toast.dismiss(toastId);
      }
    };
    fetchDashboard();
  }, [selectedBranchId, transformServerData]);

  const fmt = (v?: number) => !v ? '₹0' : v >= 100000 ? `₹${(v / 100000).toFixed(1)}L` : `₹${v.toLocaleString()}`;

  return (
    <div className="w-full space-y-5 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Action Bar */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowAddBranch(true)}
          className="group flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-black hover:bg-primary/90 active:scale-95 transition-all shadow-lg shadow-primary/20"
        >
          <Plus size={16} className="group-hover:rotate-90 transition-transform duration-300" />
          Add Branch
        </button>
      </div>

      {/* KPI Row — compact */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={<Wallet size={16} />} label="Revenue Pool" value={fmt(feeSummary?.totalRevenue)}
          sub={`${feeSummary?.totalTransactions || 0} transactions`}
          bg="bg-gradient-to-br from-white to-blue-50/40" iconBg="bg-blue-50" iconColor="text-blue-600"
          isLoading={isLoading}
          onClick={() => router.push('/super-admin/finance')}
        />
        <KpiCard
          icon={<UsersRound size={16} />} label="Active Patients" value={String(patientStats?.active || 0)}
          sub={`${patientStats?.total || 0} registered total`}
          bg="bg-gradient-to-br from-white to-emerald-50/40" iconBg="bg-emerald-50" iconColor="text-emerald-600"
          isLoading={isLoading}
          onClick={() => router.push('/super-admin/patients')}
        />
        <KpiCard
          icon={<Mail size={16} />} label="Inquiry Flow" value={String(leadStats?.total || 0)}
          sub={`${leadStats?.converted || 0} converted`} subColor="text-emerald-600 font-bold"
          bg="bg-gradient-to-br from-white to-amber-50/40" iconBg="bg-amber-50" iconColor="text-amber-600"
          isLoading={isLoading}
          onClick={() => router.push('/super-admin/leads')}
        />
        <KpiCard
          icon={<BadgeCheck size={16} />} label="Staff Active" value={`${attendanceStats?.present || 0}/${attendanceStats?.total || 0}`}
          sub="Live presence today"
          bg="bg-gradient-to-br from-white to-purple-50/40" iconBg="bg-purple-50" iconColor="text-purple-600"
          isLoading={isLoading}
          onClick={() => router.push('/super-admin/attendance')}
        />
      </div>

      {/* Main Grid — 12 col */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* LEFT: 8 cols - Analytics */}
        <div className="lg:col-span-8 space-y-5">
          {/* Revenue Trend — full width */}
          <RevenueTrends monthlyTrend={feeSummary?.monthlyTrend} isLoading={isLoading} />

          {/* Row: Patient Donut + Lead Funnel + Payment Pie — 3 cols */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <PatientPieChart patient={patientStats} isLoading={isLoading} />
            <LeadFunnel stats={leadStats} isLoading={isLoading} />
            <PaymentPieChart fee={feeSummary} isLoading={isLoading} />
          </div>

          {/* Branch rankings full width */}
          <BranchRankings branchWise={feeSummary?.branchWise} isLoading={isLoading} />
        </div>

        {/* RIGHT: 4 cols - Operations */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          <StaffAttendance staff={attendanceStats} isLoading={isLoading} />
          <LiveFeed items={activityItems} isLoading={isLoading} liveItems={liveFeedItems} />
        </div>
      </div>

      <AddBranchModal 
        isOpen={showAddBranch} 
        onClose={() => setShowAddBranch(false)} 
        onSuccess={() => {
          setShowAddBranch(false);
          router.refresh();
        }} 
      />
    </div>
  );
};
