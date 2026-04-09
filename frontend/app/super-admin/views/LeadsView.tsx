import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Plus, PhoneCall, Mail, UserPlus, Filter, ChevronDown, CheckCircle2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Lead {
  id: string;
  name: string;
  phone: string;
  source: string;
  service: string;
  status: 'New' | 'Contacted' | 'Converted' | 'Lost';
  date: string;
}

type LeadStatusFilter = 'All' | Lead['status'];

const INITIAL_LEADS: Lead[] = [
  { id: 'LD-001', name: 'Aman Sharma', phone: '+91 98765 43210', source: 'Website', service: 'Physiotherapy', status: 'New', date: 'Today, 10:30 AM' },
  { id: 'LD-002', name: 'Vikram Patnaik', phone: '+91 87654 32109', source: 'Google Ads', service: 'Autism Center', status: 'Contacted', date: 'Yesterday, 04:15 PM' },
  { id: 'LD-003', name: 'Kavita Rao', phone: '+91 76543 21098', source: 'Referral', service: 'Physiotherapy', status: 'Converted', date: '10 May, 11:00 AM' },
  { id: 'LD-004', name: 'Meher Khan', phone: '+91 65432 10987', source: 'Facebook', service: 'Autism Center', status: 'New', date: '10 May, 09:20 AM' },
  { id: 'LD-005', name: 'Rahul Desai', phone: '+91 54321 09876', source: 'Direct', service: 'Chiropractic', status: 'Lost', date: '08 May, 02:45 PM' },
];

export const LeadsView = () => {
  const [leads, setLeads] = useState<Lead[]>(INITIAL_LEADS);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatusFilter>('All');
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [newLead, setNewLead] = useState<Omit<Lead, 'id' | 'date'>>({
    name: '',
    phone: '',
    source: '',
    service: '',
    status: 'New'
  });

  const resetLeadForm = () => {
    setNewLead({
      name: '',
      phone: '',
      source: '',
      service: '',
      status: 'New'
    });
  };

  const handleAddLead = () => {
    if (!newLead.name.trim() || !newLead.phone.trim() || !newLead.source.trim() || !newLead.service.trim()) {
      return;
    }

    const highestId = leads.reduce((max, lead) => {
      const numericPart = Number(lead.id.replace('LD-', ''));
      return Number.isNaN(numericPart) ? max : Math.max(max, numericPart);
    }, 0);

    const id = `LD-${String(highestId + 1).padStart(3, '0')}`;
    const date = new Date().toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    setLeads(prev => [{ id, date, ...newLead }, ...prev]);
    setIsAddModalOpen(false);
    resetLeadForm();
  };

  const filteredLeads = leads.filter((l) => {
    const matchesSearch =
      l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.phone.includes(searchTerm);
    const matchesStatus = statusFilter === 'All' || l.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: leads.length,
    new: leads.filter(l => l.status === 'New').length,
    contacted: leads.filter(l => l.status === 'Contacted').length,
    converted: leads.filter(l => l.status === 'Converted').length,
  };

  const updateStatus = (id: string, newStatus: Lead['status']) => {
    setLeads(prev => prev.map(lead => lead.id === id ? { ...lead, status: newStatus } : lead));
    setOpenDropdownId(null);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: 'Total Leads', value: stats.total, icon: <UserPlus size={20} />, color: 'bg-surface-container-low text-on-surface' },
          { title: 'New Queries', value: stats.new, icon: <Mail size={20} />, color: 'bg-blue-50 text-blue-600' },
          { title: 'Following Up', value: stats.contacted, icon: <PhoneCall size={20} />, color: 'bg-amber-50 text-amber-600' },
          { title: 'Converted', value: stats.converted, icon: <CheckCircle2 size={20} />, color: 'bg-green-50 text-green-600' },
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
          <div className="relative">
            <button
              onClick={() => setIsFilterMenuOpen(prev => !prev)}
              className="p-2.5 border border-outline-variant/20 rounded-xl text-on-surface-variant hover:bg-surface-container-low transition-colors"
              aria-label="Filter leads"
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
                  {(['All', 'New', 'Contacted', 'Converted', 'Lost'] as LeadStatusFilter[]).map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        setStatusFilter(option);
                        setIsFilterMenuOpen(false);
                      }}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                        statusFilter === option
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
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-primary hover:bg-primary/90 text-white p-2.5 px-5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-primary/20 transition-all"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Add Lead</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/10 min-h-[400px]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low/30 border-b border-outline-variant/10">
                <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider opacity-70">Lead Info</th>
                <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider opacity-70">Source</th>
                <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider opacity-70">Service Required</th>
                <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider opacity-70">Date</th>
                <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider opacity-70">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-low/50">
              {filteredLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-surface-container-low/20 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">{lead.name}</span>
                      <span className="text-xs text-on-surface-variant mt-0.5 opacity-80">{lead.phone}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-surface-container-low rounded-lg text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                      {lead.source}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-on-surface-variant">{lead.service}</td>
                  <td className="px-6 py-4 text-sm text-on-surface-variant opacity-80">{lead.date}</td>
                  <td className="px-6 py-4 relative">
                    {/* Status Dropdown */}
                    <div className="relative inline-block">
                      <button 
                        onClick={() => setOpenDropdownId(openDropdownId === lead.id ? null : lead.id)}
                        className={cn(
                          "flex items-center gap-2 px-3 py-1.5 text-xs font-black rounded-lg uppercase tracking-wider transition-all border",
                          lead.status === 'New' && "bg-blue-50 text-blue-700 border-blue-200/50 hover:bg-blue-100",
                          lead.status === 'Contacted' && "bg-amber-50 text-amber-700 border-amber-200/50 hover:bg-amber-100",
                          lead.status === 'Converted' && "bg-green-50 text-green-700 border-green-200/50 hover:bg-green-100",
                          lead.status === 'Lost' && "bg-surface-container-low text-on-surface-variant border-transparent hover:bg-surface-container-high"
                        )}
                      >
                        {lead.status}
                        <ChevronDown size={14} className="opacity-50" />
                      </button>

                      <AnimatePresence>
                        {openDropdownId === lead.id && (
                          <motion.div 
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute right-0 top-full mt-2 w-36 bg-surface-container-lowest border border-outline-variant/10 shadow-xl rounded-xl py-1 z-50 overflow-hidden"
                          >
                            {(['New', 'Contacted', 'Converted', 'Lost'] as const).map(status => (
                              <button
                                key={status}
                                onClick={() => updateStatus(lead.id, status)}
                                className={cn(
                                  "w-full text-left px-4 py-2 text-xs font-bold transition-colors hover:bg-surface-container-low",
                                  status === 'New' && "text-blue-600",
                                  status === 'Contacted' && "text-amber-600",
                                  status === 'Converted' && "text-green-600",
                                  status === 'Lost' && "text-on-surface-variant"
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
              ))}
            </tbody>
          </table>
          
          {filteredLeads.length === 0 && (
            <div className="p-10 text-center text-on-surface-variant opacity-60">
              No leads found.
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isAddModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => {
              setIsAddModalOpen(false);
              resetLeadForm();
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.16 }}
              className="w-full max-w-lg rounded-2xl bg-surface-container-lowest border border-outline-variant/20 shadow-2xl p-6"
              role="dialog"
              aria-modal="true"
              aria-label="Add lead"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                  <h4 className="text-lg font-extrabold text-on-surface">Add Lead</h4>
                  <p className="text-sm text-on-surface-variant mt-1">Create a new lead in the pipeline.</p>
                </div>
                <button
                  onClick={() => {
                    setIsAddModalOpen(false);
                    resetLeadForm();
                  }}
                  className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-low"
                  aria-label="Close add lead modal"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={newLead.name}
                  onChange={(e) => setNewLead(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl py-2.5 px-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/25"
                  placeholder="Lead name"
                />
                <input
                  type="text"
                  value={newLead.phone}
                  onChange={(e) => setNewLead(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl py-2.5 px-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/25"
                  placeholder="Phone number"
                />
                <input
                  type="text"
                  value={newLead.source}
                  onChange={(e) => setNewLead(prev => ({ ...prev, source: e.target.value }))}
                  className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl py-2.5 px-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/25"
                  placeholder="Source"
                />
                <input
                  type="text"
                  value={newLead.service}
                  onChange={(e) => setNewLead(prev => ({ ...prev, service: e.target.value }))}
                  className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl py-2.5 px-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/25"
                  placeholder="Service required"
                />
                <select
                  value={newLead.status}
                  onChange={(e) => setNewLead(prev => ({ ...prev, status: e.target.value as Lead['status'] }))}
                  className="sm:col-span-2 w-full bg-surface-container-low border border-outline-variant/30 rounded-xl py-2.5 px-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/25"
                >
                  <option value="New">New</option>
                  <option value="Contacted">Contacted</option>
                  <option value="Converted">Converted</option>
                  <option value="Lost">Lost</option>
                </select>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setIsAddModalOpen(false);
                    resetLeadForm();
                  }}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-on-surface-variant border border-outline-variant/30 hover:text-on-surface hover:bg-surface-container-low transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddLead}
                  disabled={!newLead.name.trim() || !newLead.phone.trim() || !newLead.source.trim() || !newLead.service.trim()}
                  className="px-4 py-2 rounded-xl text-sm font-bold bg-primary text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Add Lead
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
