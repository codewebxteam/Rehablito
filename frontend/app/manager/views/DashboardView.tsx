"use client";

import { useMemo, useState } from 'react';
import {
  TrendingUp,
  UserPlus,
  BarChart3,
  AlertCircle,
  MoreVertical,
  CheckCircle2,
  XCircle,
  CreditCard,
  Eye,
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp,
  Download,
  History,
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
  Cell,
} from 'recharts';
import { Lead, Staff, BillingRecord, Patient, ViewType } from '../types';
import { cn } from '../lib/utils';
import { Button } from '../components/ui/Button';

interface DashboardProps {
  leads: Lead[];
  staff: Staff[];
  billing: BillingRecord[];
  patients: Patient[];
  onNavigate: (view: ViewType) => void;
}

const REVENUE_DATA = [
  { name: 'JAN', value: 40 },
  { name: 'FEB', value: 60 },
  { name: 'MAR', value: 55 },
  { name: 'APR', value: 85 },
  { name: 'MAY', value: 70 },
  { name: 'JUN', value: 95 },
];

const PIE_COLORS = ['#004ac6', '#e0e3e5'];

// Safe initials from a name string (handles undefined/empty)
function getInitials(name?: string): string {
  if (!name) return '?';
  return name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// Mask phone number showing only last 4 digits
function maskPhone(phone?: string): string {
  if (!phone || phone.length < 4) return '••••••••••';
  return `XXXXXX${phone.slice(-4)}`;
}

const STATUS_STYLES: Record<string, string> = {
  Hot:  'bg-secondary-container/30 text-on-secondary-container',
  Cold: 'bg-error-container/30 text-on-error-container',
  Warm: 'bg-surface-container-high text-on-surface-variant',
};

export default function DashboardView({ leads, staff, billing, patients, onNavigate }: DashboardProps) {
  const [expanded, setExpanded] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const stats = useMemo(() => {
    const revenue  = billing.reduce((s, b) => s + (b.amountPaid ?? 0), 0);
    const dues     = billing.reduce((s, b) => s + (b.dueAmount ?? 0), 0);
    const active   = staff.filter((s) => s.status === 'Active').length;

    return [
      { label: 'Total Revenue',     value: `₹${(revenue / 1000).toFixed(1)}L`, icon: CreditCard, trend: '+12%',   color: 'text-primary',   bg: 'bg-primary/5'   },
      { label: 'Patients',          value: patients.length,                     icon: UserPlus,   trend: '+4',     color: 'text-secondary', bg: 'bg-secondary/5' },
      { label: 'Open Leads',        value: leads.length,                        icon: BarChart3,  trend: 'Active', color: 'text-tertiary',  bg: 'bg-orange-50'   },
      { label: 'Outstanding Dues',  value: `₹${dues.toLocaleString()}`,         icon: AlertCircle, trend: 'Urgent', color: 'text-error',    bg: 'bg-error/5'     },
    ];
  }, [billing, staff, patients, leads]);

  const { paid, pending, pctCollected } = useMemo(() => {
    const paid    = billing.reduce((s, b) => s + (b.amountPaid ?? 0), 0);
    const pending = billing.reduce((s, b) => s + (b.dueAmount ?? 0), 0);
    const total   = paid + pending;
    return { paid, pending, pctCollected: total > 0 ? Math.round((paid / total) * 100) : 0 };
  }, [billing]);

  const pieData = [
    { name: 'Paid',    value: paid },
    { name: 'Pending', value: pending },
  ];

  function handleExport() {
    setExporting(true);
    setTimeout(() => setExporting(false), 2000);
  }

  const recentLeads = leads.slice(0, 4);

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-on-surface tracking-tight">Good Morning, Team</h1>
          <p className="text-on-surface-variant mt-1 text-sm">Here is what's happening at Rehablito today.</p>
        </div>
        <Button variant="surface" isLoading={exporting} onClick={handleExport} className="w-full sm:w-auto">
          <Download size={16} />
          Export Report
        </Button>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-transparent hover:border-primary/10 transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className={cn('p-2 rounded-lg', stat.bg, stat.color)}>
                <stat.icon size={20} />
              </div>
              <span className={cn('text-xs font-bold flex items-center gap-1', i === 3 ? 'text-error' : 'text-secondary')}>
                {i < 2 && <TrendingUp size={14} />}
                {stat.trend}
              </span>
            </div>
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">{stat.label}</p>
            <h3 className="text-2xl font-extrabold text-on-surface">{stat.value}</h3>
          </div>
        ))}
      </div>

      {/* Charts + Lists */}
      <div className="grid grid-cols-12 gap-8">

        {/* Left Column */}
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
              <ResponsiveContainer width="99%" height="100%">
                <BarChart data={REVENUE_DATA}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#434655' }} />
                  <YAxis hide />
                  <Tooltip
                    cursor={{ fill: '#f2f4f6' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="value" fill="#004ac6" radius={[6, 6, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Leads */}
          <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 md:px-8 py-6 flex justify-between items-center">
              <h3 className="text-lg font-bold text-on-surface">Recent Leads</h3>
              <Button variant="ghost" size="sm" onClick={() => onNavigate('leads')} className="text-primary">
                View All
              </Button>
            </div>

            {recentLeads.length === 0 ? (
              <p className="px-8 pb-8 text-sm text-on-surface-variant">No leads yet.</p>
            ) : (
              <>
                {/* Table — md+ */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-left min-w-[560px]">
                    <thead className="bg-surface-container-low">
                      <tr>
                        {['Name', 'Phone', 'Source', 'Status', 'Action'].map((h) => (
                          <th key={h} className="px-8 py-4 text-[10px] font-extrabold text-on-surface-variant uppercase tracking-widest">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/10">
                      {recentLeads.map((lead) => (
                        <tr key={lead.id} className="hover:bg-surface-container-low transition-colors">
                          <td className="px-8 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                                {getInitials(lead.name)}
                              </div>
                              <span className="text-sm font-bold text-on-surface">{lead.name ?? '—'}</span>
                            </div>
                          </td>
                          <td className="px-8 py-4 text-sm text-on-surface-variant font-mono">{maskPhone(lead.phone)}</td>
                          <td className="px-8 py-4 text-sm text-on-surface-variant">{lead.source ?? '—'}</td>
                          <td className="px-8 py-4">
                            <span className={cn('px-3 py-1 rounded-full text-xs font-bold', STATUS_STYLES[lead.status] ?? STATUS_STYLES.Warm)}>
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
                              <div className="absolute right-8 top-12 w-32 bg-white rounded-xl shadow-xl border border-outline-variant/10 z-50 py-2">
                                <button className="w-full px-4 py-2 text-left text-xs font-bold hover:bg-surface-container-low flex items-center gap-2"><Eye size={14} /> View</button>
                                <button className="w-full px-4 py-2 text-left text-xs font-bold hover:bg-surface-container-low flex items-center gap-2"><Edit size={14} /> Edit</button>
                                <button className="w-full px-4 py-2 text-left text-xs font-bold hover:bg-surface-container-low text-error flex items-center gap-2"><Trash2 size={14} /> Delete</button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Cards — mobile */}
                <div className="sm:hidden divide-y divide-outline-variant/10">
                  {recentLeads.map((lead) => (
                    <div key={lead.id} className="p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                            {getInitials(lead.name)}
                          </div>
                          <span className="text-sm font-bold text-on-surface truncate">{lead.name ?? '—'}</span>
                        </div>
                        <button
                          onClick={() => setActiveMenu(activeMenu === lead.id ? null : lead.id)}
                          className="text-on-surface-variant p-2 hover:bg-surface-container-low rounded-lg"
                        >
                          <MoreVertical size={18} />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <p className="text-on-surface-variant/60 uppercase font-bold tracking-tighter">Phone</p>
                          <p className="font-mono">{maskPhone(lead.phone)}</p>
                        </div>
                        <div>
                          <p className="text-on-surface-variant/60 uppercase font-bold tracking-tighter">Source</p>
                          <p>{lead.source ?? '—'}</p>
                        </div>
                      </div>
                      <span className={cn('inline-block px-3 py-1 rounded-full text-[10px] font-bold', STATUS_STYLES[lead.status] ?? STATUS_STYLES.Warm)}>
                        {lead.status}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="col-span-12 md:col-span-4 space-y-8">

          {/* Payment Distribution */}
          <div className="bg-surface-container-lowest p-8 rounded-xl shadow-sm">
            <h3 className="text-lg font-bold text-on-surface mb-8">Payment Distribution</h3>
            <div className="relative w-48 h-48 mx-auto mb-8">
              <ResponsiveContainer width="99%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-extrabold text-on-surface">{pctCollected}%</span>
                <span className="text-[10px] font-bold text-on-surface-variant">COLLECTED</span>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary" />
                  <span className="text-sm text-on-surface-variant">Paid Amount</span>
                </div>
                <span className="text-sm font-bold text-on-surface">₹{paid.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-surface-variant" />
                  <span className="text-sm text-on-surface-variant">Pending Dues</span>
                </div>
                <span className="text-sm font-bold text-on-surface">₹{pending.toLocaleString()}</span>
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

            <div className="relative space-y-8 before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-[2px] before:bg-outline-variant/20">
              <ActivityItem icon={<CheckCircle2 size={14} />} color="bg-secondary-container/40 text-secondary">
                <p className="text-sm font-bold text-on-surface">Vikram Singh <span className="font-normal text-on-surface-variant">checked in for</span> Physiotherapy</p>
                <p className="text-xs text-on-surface-variant/60 mt-1">12 minutes ago</p>
              </ActivityItem>

              <ActivityItem icon={<CreditCard size={14} />} color="bg-primary/10 text-primary">
                <p className="text-sm font-bold text-on-surface">Payment Received <span className="font-normal text-on-surface-variant">from Priya Das</span></p>
                <p className="text-xs font-bold text-secondary mt-1">₹4,500 collected</p>
                <p className="text-xs text-on-surface-variant/60 mt-1">45 minutes ago</p>
              </ActivityItem>

              <ActivityItem icon={<XCircle size={14} />} color="bg-error/10 text-error">
                <p className="text-sm font-bold text-on-surface">Appointment Cancelled <span className="font-normal text-on-surface-variant">by Amit Roy</span></p>
                <p className="text-xs text-on-surface-variant/60 mt-1">3 hours ago</p>
              </ActivityItem>

              {expanded && (
                <ActivityItem icon={<UserPlus size={14} />} color="bg-primary/10 text-primary">
                  <p className="text-sm font-bold text-on-surface">New Lead <span className="font-normal text-on-surface-variant">from Website</span></p>
                  <p className="text-xs text-on-surface-variant/60 mt-1">5 hours ago</p>
                </ActivityItem>
              )}
            </div>

            <Button variant="outline" onClick={() => setExpanded(!expanded)} className="w-full mt-8">
              {expanded ? <><span>Show Less</span><ChevronUp size={16} /></> : <><span>Show All Activity</span><ChevronDown size={16} /></>}
            </Button>
          </div>

          {/* Branch Highlight */}
          <div className="relative rounded-xl overflow-hidden h-48 group">
            <img
              src="https://picsum.photos/seed/clinic/600/400"
              alt="Branch"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-6 flex flex-col justify-end">
              <h4 className="text-white font-bold text-lg leading-tight">Patient Satisfaction: 98%</h4>
              <p className="text-white/70 text-xs">Your branch is performing 12% above national average this month.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// Small reusable activity item
function ActivityItem({ icon, color, children }: { icon: React.ReactNode; color: string; children: React.ReactNode }) {
  return (
    <div className="relative pl-10">
      <div className={cn('absolute left-0 w-8 h-8 rounded-full flex items-center justify-center z-10 border-4 border-surface-container-lowest', color)}>
        {icon}
      </div>
      <div>{children}</div>
    </div>
  );
}
