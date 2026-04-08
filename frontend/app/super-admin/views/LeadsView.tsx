import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Plus, PhoneCall, Mail, UserPlus, Filter, ChevronDown, CheckCircle2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAdminLeads, useAdminLeadStats, AdminLead } from '../hooks/useAdminData';
import { api } from '@/lib/api';

const statusColors: Record<string, string> = {
  new:       'bg-blue-50 text-blue-700 border-blue-200/50 hover:bg-blue-100',
  contacted: 'bg-amber-50 text-amber-700 border-amber-200/50 hover:bg-amber-100',
  converted: 'bg-green-50 text-green-700 border-green-200/50 hover:bg-green-100',
  lost:      'bg-surface-container-low text-on-surface-variant border-transparent hover:bg-surface-container',
};

export const LeadsView = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const { data: leads = [], isLoading, error, refetch } = useAdminLeads();
  const { data: stats, isLoading: statsLoading } = useAdminLeadStats();

  const filteredLeads = leads.filter((l: AdminLead) =>
    l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.phone.includes(searchTerm)
  );

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await api.put(`/admin/leads/${id}`, { status: newStatus });
      refetch();
    } catch { /* silent */ }
    setOpenDropdownId(null);
  };

  const formatDate = (iso: string) => {
    try { return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }); }
    catch { return iso; }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: 'Total Leads',   value: statsLoading ? '…' : String(stats?.total ?? leads.length),     icon: <UserPlus size={20} />,     color: 'bg-surface-container-low text-on-surface' },
          { title: 'New Queries',   value: statsLoading ? '…' : String(leads.filter(l => l.status === 'new').length), icon: <Mail size={20} />,         color: 'bg-blue-50 text-blue-600' },
          { title: 'Following Up',  value: statsLoading ? '…' : String(leads.filter(l => l.status === 'contacted').length), icon: <PhoneCall size={20} />, color: 'bg-amber-50 text-amber-600' },
          { title: 'Converted',     value: statsLoading ? '…' : String(stats?.converted ?? leads.filter(l => l.status === 'converted').length), icon: <CheckCircle2 size={20} />, color: 'bg-green-50 text-green-600' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/10 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-on-surface-variant opacity-70 mb-1">{stat.title}</p>
              <h3 className="text-3xl font-black">{stat.value}</h3>
            </div>
            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", stat.color)}>
              {stat.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/10">
        <div>
          <h3 className="text-xl font-bold font-headline text-on-surface">Leads Pipeline</h3>
        </div>
        <div className="flex w-full sm:w-auto items-center gap-3">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/50" size={18} />
            <input 
              type="text" 
              placeholder="Search leads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64 bg-surface-container-low/50 border border-outline-variant/20 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all text-on-surface"
            />
          </div>
          <button onClick={refetch} className="p-2.5 border border-outline-variant/20 rounded-xl text-on-surface-variant hover:bg-surface-container-low transition-colors">
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
          </button>
          <button className="bg-primary hover:bg-primary/90 text-white p-2.5 px-5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-primary/20 transition-all">
            <Plus size={18} />
            <span className="hidden sm:inline">Add Lead</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="px-6 py-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-semibold flex items-center justify-between">
          <span>Failed to load leads: {error}</span>
          <button onClick={refetch} className="underline">Retry</button>
        </div>
      )}

      {/* Table */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/10 min-h-[400px]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low/30 border-b border-outline-variant/10">
                <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider opacity-70">Lead Info</th>
                <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider opacity-70">Source</th>
                <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider opacity-70">Branch</th>
                <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider opacity-70">Date</th>
                <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider opacity-70">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-low/50">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 5 }).map((__, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-3 bg-surface-container-low animate-pulse rounded-full w-3/4" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                filteredLeads.map((lead: AdminLead) => (
                  <tr key={lead._id} className="hover:bg-surface-container-low/20 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">{lead.name}</span>
                        <span className="text-xs text-on-surface-variant mt-0.5 opacity-80">{lead.phone}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-surface-container-low rounded-lg text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                        {lead.source ?? '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-on-surface-variant">{lead.branchId ?? '—'}</td>
                    <td className="px-6 py-4 text-sm text-on-surface-variant opacity-80">{formatDate(lead.createdAt)}</td>
                    <td className="px-6 py-4 relative">
                      <div className="relative inline-block">
                        <button 
                          onClick={() => setOpenDropdownId(openDropdownId === lead._id ? null : lead._id)}
                          className={cn(
                            "flex items-center gap-2 px-3 py-1.5 text-xs font-black rounded-lg uppercase tracking-wider transition-all border",
                            statusColors[lead.status?.toLowerCase()] ?? statusColors['new']
                          )}
                        >
                          {lead.status ?? 'new'}
                          <ChevronDown size={14} className="opacity-50" />
                        </button>

                        <AnimatePresence>
                          {openDropdownId === lead._id && (
                            <motion.div 
                              initial={{ opacity: 0, y: 10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 10, scale: 0.95 }}
                              className="absolute right-0 top-full mt-2 w-36 bg-surface-container-lowest border border-outline-variant/10 shadow-xl rounded-xl py-1 z-50 overflow-hidden"
                            >
                              {(['new', 'contacted', 'converted', 'lost'] as const).map(status => (
                                <button
                                  key={status}
                                  onClick={() => updateStatus(lead._id, status)}
                                  className={cn(
                                    "w-full text-left px-4 py-2 text-xs font-bold transition-colors hover:bg-surface-container-low capitalize",
                                    status === 'new' && "text-blue-600",
                                    status === 'contacted' && "text-amber-600",
                                    status === 'converted' && "text-green-600",
                                    status === 'lost' && "text-on-surface-variant"
                                  )}
                                >
                                  Mark {status}
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          
          {!isLoading && filteredLeads.length === 0 && !error && (
            <div className="p-10 text-center text-on-surface-variant opacity-60">
              No leads found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
