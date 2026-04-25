"use client";

import { useEffect, useMemo, useState, useCallback } from 'react';
import {
  TrendingUp,
  UserPlus,
  BarChart3,
  AlertCircle,
  MoreVertical,
  History,
  XCircle,
  CreditCard,
  Eye,
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp,
  Download
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Lead, Staff, BillingRecord, Patient, ViewType } from '../types';
import { cn } from '../lib/utils';
import { Button } from '../components/ui/Button';
import api from '@/lib/api';
import { toast } from 'sonner';

interface DashboardProps {
  leads: Lead[];
  staff: Staff[];
  billing: BillingRecord[];
  patients: Patient[];
  onNavigate: (view: ViewType) => void;
}

interface BillingSummary {
  overall: { totalRevenue: number; totalDues: number; totalTransactions: number };
  currentMonth: { month: string; revenue: number; dues: number; transactions: number };
  monthlyTrend: Array<{ _id: { year: number; month: number }; revenue: number; dues: number; count: number }>;
  outstandingDues: Array<{ _id: string; patientName: string; totalDue: number; lastPayment: string }>;
}

interface PatientStats {
  total: number;
  active: number;
  discharged: number;
  onHold: number;
  recentAdmissions: number;
}

interface LeadStats {
  total: number;
  new: number;
  contacted: number;
  converted: number;
  closed: number;
  conversionRate: string;
  recentLeads: number;
}

interface RecentPayment {
  _id: string;
  amount: number;
  paymentDate: string;
  status: string;
  patientId?: { name?: string; parentName?: string } | null;
}

const COLORS = ['#004ac6', '#e0e3e5'];

const MONTH_LABELS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

export default function DashboardView({ leads, onNavigate }: DashboardProps) {
  const [isActivityExpanded, setIsActivityExpanded] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const [billingSummary, setBillingSummary] = useState<BillingSummary | null>(null);
  const [patientStats, setPatientStats] = useState<PatientStats | null>(null);
  const [leadStats, setLeadStats] = useState<LeadStats | null>(null);
  const [recentPayments, setRecentPayments] = useState<RecentPayment[]>([]);

  useEffect(() => {
    const fetchAll = async () => {
      let toastId;
      try {
        toastId = toast.loading('Loading dashboard...', { duration: Infinity });
        const [billingRes, patientRes, leadRes, paymentsRes] = await Promise.all([
          api.get('/manager/billing/summary'),
          api.get('/manager/patients/stats'),
          api.get('/manager/leads/stats'),
          api.get('/manager/billing?limit=5'),
        ]);
        if (billingRes.data?.success) setBillingSummary(billingRes.data.data);
        if (patientRes.data?.success) setPatientStats(patientRes.data.data);
        if (leadRes.data?.success) setLeadStats(leadRes.data.data);
        if (paymentsRes.data?.success) setRecentPayments(paymentsRes.data.data || []);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        if (toastId) toast.dismiss(toastId);
      }
    };
    fetchAll();
  }, []);

  const formatCurrency = (v: number) => {
    if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
    if (v >= 1000) return `₹${(v / 1000).toFixed(1)}K`;
    return `₹${v.toLocaleString('en-IN')}`;
  };

  const stats = useMemo(() => {
    const totalRevenue = billingSummary?.overall.totalRevenue ?? 0;
    const outstandingDues = billingSummary?.overall.totalDues ?? 0;
    const totalPatients = patientStats?.total ?? 0;
    const recentAdmissions = patientStats?.recentAdmissions ?? 0;
    const openLeads = leadStats ? leadStats.new + leadStats.contacted : leads.length;

    return [
      { label: 'Total Revenue', value: formatCurrency(totalRevenue), icon: CreditCard, trend: billingSummary ? formatCurrency(billingSummary.currentMonth.revenue) : '—', color: 'text-primary', bg: 'bg-primary/5' },
      { label: 'New Patients', value: totalPatients, icon: UserPlus, trend: `+${recentAdmissions}`, color: 'text-secondary', bg: 'bg-secondary/5' },
      { label: 'Open Leads', value: openLeads, icon: BarChart3, trend: leadStats?.conversionRate ?? 'Active', color: 'text-tertiary', bg: 'bg-orange-50' },
      { label: 'Total Dues', value: formatCurrency(outstandingDues), icon: AlertCircle, trend: outstandingDues > 0 ? 'Urgent' : 'Clear', color: 'text-error', bg: 'bg-error/5' },
    ];
  }, [billingSummary, patientStats, leadStats, leads]);

  const revenueData = useMemo(() => {
    if (!billingSummary?.monthlyTrend?.length) return [];
    return billingSummary.monthlyTrend.map(m => ({
      name: MONTH_LABELS[(m._id.month - 1) % 12],
      value: Math.round(m.revenue / 1000),
    }));
  }, [billingSummary]);

  const pieData = useMemo((): [{name: string, value: number}, {name: string, value: number}, {percentage: number}] => {
    const paid = billingSummary?.overall.totalRevenue ?? 0;
    const pending = billingSummary?.overall.totalDues ?? 0;
    const total = paid + pending;
    return [
      { name: 'Paid Amount', value: paid },
      { name: 'Pending Dues', value: pending },
      { percentage: total > 0 ? Math.round((paid / total) * 100) : 0 }
    ];
  }, [billingSummary]);

  const activityItems = useMemo(() => {
    return recentPayments.map(p => ({
      id: p._id,
      name: p.patientId?.name || p.patientId?.parentName || 'Patient',
      amount: p.amount,
      date: p.paymentDate,
      status: p.status,
    }));
  }, [recentPayments]);

  const formatRelative = useCallback((iso: string) => {
    const d = new Date(iso);
    const diffMs = Date.now() - d.getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins} min${mins === 1 ? '' : 's'} ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hour${hrs === 1 ? '' : 's'} ago`;
    const days = Math.floor(hrs / 24);
    return `${days} day${days === 1 ? '' : 's'} ago`;
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-on-surface tracking-tight leading-none">Good Morning, Team</h1>
          <p className="text-on-surface-variant mt-2 text-sm md:text-base font-medium">Here is what&apos;s happening at Rehablito today.</p>
        </div>
        {/* <Button 
          variant="surface"
          isLoading={isExporting}
          onClick={() => {
            setIsExporting(true);
            setTimeout(() => setIsExporting(false), 2000);
          }}
          className="w-full sm:w-auto"
        >
          <Download size={16} />
          Export Report
        </Button> */}
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-transparent hover:border-primary/10 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className={cn("p-2 rounded-lg", stat.bg, stat.color)}>
                <stat.icon size={20} />
              </div>
              <span className={cn("text-xs font-bold flex items-center gap-1", i === 3 ? "text-error" : "text-secondary")}>
                {i < 2 && <TrendingUp size={14} />}
                {stat.trend}
              </span>
            </div>
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">{stat.label}</p>
            <h3 className="text-2xl font-extrabold text-on-surface">{stat.value}</h3>
          </div>
        ))}
      </div>

      {/* Charts & Lists Grid */}
      <div className="grid grid-cols-12 gap-8">
        {/* Main Charts Section */}
        <div className="col-span-12 md:col-span-8 space-y-8">
          {/* Revenue Chart */}
          <div className="bg-surface-container-lowest p-8 rounded-xl shadow-sm">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-lg font-bold text-on-surface">Monthly Revenue Growth</h3>
              <select className="text-xs border-none bg-surface-container-low rounded-lg focus:ring-0 font-bold px-3 py-1.5">
                <option>Last 6 Months</option>
                <option>Last Year</option>
              </select>
            </div>
            <div className="h-64 w-full">
              {revenueData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm text-on-surface-variant">
                  No revenue data yet.
                </div>
              ) : (
                <ResponsiveContainer width="99%" height="100%" minWidth={1} minHeight={1}>
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fontWeight: 700, fill: '#434655' }}
                    />
                    <YAxis hide />
                    <Tooltip
                      cursor={{ fill: '#f2f4f6' }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      formatter={(value) => [`₹${value}K`, 'Revenue']}
                    />
                    <Bar
                      dataKey="value"
                      fill="#004ac6"
                      radius={[6, 6, 0, 0]}
                      barSize={40}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Recent Leads Table */}
          <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-visible">
            <div className="px-6 md:px-8 py-6 flex justify-between items-center">
              <h3 className="text-lg font-bold text-on-surface">Recent Leads</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onNavigate('leads')}
                className="text-primary"
              >
                View All
              </Button>
            </div>
            
            {/* Desktop/Tablet Table View (> 640px) */}
            <div className="hidden sm:block overflow-x-auto overflow-y-visible">
              <table className="w-full text-left min-w-150">
                <thead className="bg-surface-container-low">
                  <tr>
                    <th className="px-8 py-4 text-[10px] font-extrabold text-on-surface-variant uppercase tracking-widest">Name</th>
                    <th className="px-8 py-4 text-[10px] font-extrabold text-on-surface-variant uppercase tracking-widest">Phone</th>
                    <th className="px-8 py-4 text-[10px] font-extrabold text-on-surface-variant uppercase tracking-widest">Source</th>
                    <th className="px-8 py-4 text-[10px] font-extrabold text-on-surface-variant uppercase tracking-widest">Status</th>
                    <th className="px-8 py-4 text-[10px] font-extrabold text-on-surface-variant uppercase tracking-widest">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {leads.slice(0, 4).map((lead, index) => (
                    <tr key={lead.id} className="hover:bg-surface-container-low transition-colors">
                      <td className="px-8 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                            {lead.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <span className="text-sm font-bold text-on-surface">{lead.name}</span>
                        </div>
                      </td>
                      <td className="px-8 py-4 text-sm text-on-surface-variant font-mono">
                        XXXXXX{lead.phone.slice(-4)}
                      </td>
                      <td className="px-8 py-4 text-sm text-on-surface-variant">{lead.source}</td>
                      <td className="px-8 py-4">
                        <span className={cn(
                          "inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap min-w-23",
                          lead.status === 'Hot' ? "bg-secondary-container/30 text-on-secondary-container" :
                          lead.status === 'Cold' ? "bg-error-container/30 text-on-error-container" :
                          "bg-surface-container-high text-on-surface-variant"
                        )}>
                          {lead.status}
                        </span>
                      </td>
                      <td className="px-8 py-4 relative">
                        <button 
                          onClick={() => setActiveMenu(activeMenu === lead.id ? null : lead.id)}
                          className="text-on-surface-variant hover:text-primary transition-all p-2 rounded-lg hover:bg-surface-container-high"
                        >
                          <MoreVertical size={18} />
                        </button>
                        
                        {activeMenu === lead.id && (
                          <div className={cn(
                            "absolute right-0 w-32 bg-white rounded-xl shadow-xl border border-outline-variant/10 z-50 py-2 overflow-hidden",
                            index === 0 ? "top-full mt-2" : "bottom-full mb-2"
                          )}>
                            <button
                              onClick={() => {
                                onNavigate('leads');
                                setActiveMenu(null);
                              }}
                              className="w-full px-4 py-2 text-left text-xs font-bold hover:bg-surface-container-low flex items-center gap-2"
                            >
                              <Eye size={14} /> View
                            </button>
                            <button
                              onClick={() => {
                                onNavigate('leads');
                                setActiveMenu(null);
                              }}
                              className="w-full px-4 py-2 text-left text-xs font-bold hover:bg-surface-container-low flex items-center gap-2"
                            >
                              <Edit size={14} /> Edit
                            </button>
                            <button
                              onClick={() => {
                                onNavigate('leads');
                                setActiveMenu(null);
                              }}
                              className="w-full px-4 py-2 text-left text-xs font-bold hover:bg-surface-container-low text-error flex items-center gap-2"
                            >
                              <Trash2 size={14} /> Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Mobile Card View (< 640px) */}
            <div className="sm:hidden divide-y divide-outline-variant/10">
              {leads.slice(0, 4).map((lead) => (
                <div key={lead.id} className="p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                        {lead.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="text-sm font-bold text-on-surface truncate">{lead.name}</span>
                    </div>
                    <button 
                      onClick={() => setActiveMenu(activeMenu === lead.id ? null : lead.id)}
                      className="text-on-surface-variant p-2 hover:bg-surface-container-low rounded-lg"
                    >
                      <MoreVertical size={18} />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="min-w-0">
                      <p className="text-on-surface-variant/60 uppercase font-bold tracking-tighter">Phone</p>
                      <p className="font-mono truncate">XXXXXX{lead.phone.slice(-4)}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-on-surface-variant/60 uppercase font-bold tracking-tighter">Source</p>
                      <p className="truncate">{lead.source}</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className={cn(
                      "inline-flex items-center justify-center px-3 py-1 rounded-full text-[10px] font-bold whitespace-nowrap min-w-23",
                      lead.status === 'Hot' ? "bg-secondary-container/30 text-on-secondary-container" :
                      lead.status === 'Cold' ? "bg-error-container/30 text-on-error-container" :
                      "bg-surface-container-high text-on-surface-variant"
                    )}>
                      {lead.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Column */}
        <div className="col-span-12 md:col-span-4 space-y-8">
          {/* Payment Distribution */}
          <div className="bg-surface-container-lowest p-8 rounded-xl shadow-sm">
            <h3 className="text-lg font-bold text-on-surface mb-8">Payment Distribution</h3>
            <div className="relative w-48 h-48 mx-auto mb-8">
              <ResponsiveContainer width="99%" height="100%" minWidth={1} minHeight={1}>
                <PieChart>
                  <Pie
                    data={pieData.slice(0, 2)}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.slice(0, 2).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-extrabold text-on-surface">{pieData[2].percentage}%</span>
                <span className="text-[10px] font-bold text-on-surface-variant">COLLECTED</span>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary"></div>
                  <span className="text-sm font-medium text-on-surface-variant">Paid Amount</span>
                </div>
                <span className="text-sm font-bold text-on-surface">₹{pieData[0].value.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-surface-variant"></div>
                  <span className="text-sm font-medium text-on-surface-variant">Pending Dues</span>
                </div>
                <span className="text-sm font-bold text-on-surface">₹{pieData[1].value.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Activity Feed */}
          <div className="bg-surface-container-lowest p-8 rounded-xl shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-on-surface">Activity Feed</h3>
              <button className="text-on-surface-variant hover:text-primary transition-all">
                <History size={18} />
              </button>
            </div>
            <div className="relative space-y-8 before:absolute before:left-3.75 before:top-2 before:bottom-2 before:w-0.5 before:bg-outline-variant/20">
              {activityItems.length === 0 && (
                <p className="text-sm text-on-surface-variant text-center py-4">No recent activity.</p>
              )}
              {(isActivityExpanded ? activityItems : activityItems.slice(0, 3)).map(item => {
                const isPaid = item.status === 'paid' || item.status === 'partial';
                return (
                  <div key={item.id} className="relative pl-10">
                    <div className={cn(
                      "absolute left-0 w-8 h-8 rounded-full flex items-center justify-center z-10 border-4 border-surface-container-lowest",
                      isPaid ? "bg-secondary-container/40 text-secondary" : "bg-error/10 text-error"
                    )}>
                      {isPaid ? <CreditCard size={14} /> : <XCircle size={14} />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-on-surface">
                        {isPaid ? 'Payment Received' : 'Payment Pending'}{' '}
                        <span className="font-normal text-on-surface-variant">from {item.name}</span>
                      </p>
                      <p className={cn("text-xs font-bold mt-1", isPaid ? "text-secondary" : "text-error")}>
                        ₹{item.amount.toLocaleString('en-IN')} {isPaid ? 'collected' : 'outstanding'}
                      </p>
                      <p className="text-xs text-on-surface-variant/60 mt-1">{formatRelative(item.date)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <Button 
              variant="outline"
              onClick={() => setIsActivityExpanded(!isActivityExpanded)}
              className="w-full mt-8"
            >
              {isActivityExpanded ? (
                <>
                  Show Less
                  <ChevronUp size={16} />
                </>
              ) : (
                <>
                  Show All Activity
                  <ChevronDown size={16} />
                </>
              )}
            </Button>
          </div>

          {/* Performance Card */}
          <div className="relative rounded-xl overflow-hidden h-48 group">
            <img 
              src="https://picsum.photos/seed/clinic/600/400" 
              alt="Clinic" 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent p-6 flex flex-col justify-end">
              <h4 className="text-white font-bold text-lg leading-tight">Your branch</h4>
              <p className="text-white/70 text-xs">Keep up the great work — your team is caring for our community every day.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
