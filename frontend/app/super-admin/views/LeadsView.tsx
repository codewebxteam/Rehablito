import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Plus, PhoneCall, Mail, UserPlus, Filter, ChevronDown, CheckCircle2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useBranch } from '../components/BranchContext';
import { Pagination } from '../components/Pagination';

interface Lead {
  _id?: string;
  id?: string;
  name: string;        // Child Name
  parentName?: string;
  phone: string;       // Parent Phone
  email?: string;      // Parent Email
  age?: number;
  source: string;      // Referred By
  service: string;     // Diagnosis
  status: 'New' | 'Contacted' | 'Converted' | 'Lost';
  date: string;
}

type LeadStatusFilter = 'All' | Lead['status'];

interface ApiLead {
  _id: string;
  childName: string;
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
  age?: number;
  referredBy?: string;
  diagnosis?: string;
  status: 'new' | 'contacted' | 'converted' | 'closed';
  createdAt: string;
}

interface Branch {
  _id: string;
  name: string;
}

const DEFAULT_LEADS: Lead[] = [
  { id: 'LD-001', name: 'Aman Sharma', phone: '+91 98765 43210', source: 'Website', service: 'Physiotherapy', status: 'New', date: 'Today, 10:30 AM' },
  { id: 'LD-002', name: 'Vikram Patnaik', phone: '+91 87654 32109', source: 'Google Ads', service: 'Autism Center', status: 'Contacted', date: 'Yesterday, 04:15 PM' },
];

const maskPhoneNumber = (phone: string) => {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  const digitCount = digits.length;
  
  // For standard 10-digit numbers with country codes (e.g., +91 98765 43210 has 12 digits)
  // We want to skip masking the country code, mask the next 6 digits, and keep the last 4.
  const countryCodeLen = Math.max(0, digitCount - 10);
  const coreMaskLen = Math.max(0, digitCount - countryCodeLen - 4);
  
  let currentIdx = 0;
  return phone.replace(/\d/g, (match) => {
    currentIdx++;
    if (currentIdx <= countryCodeLen) return match; // Keep country code
    if (currentIdx <= countryCodeLen + coreMaskLen) return 'X'; // Mask middle
    return match; // Keep last 4
  });
};

export const LeadsView = ({ initialData }: { initialData?: any }) => {
  const transformApiLeads = (data: ApiLead[]) => data.map((l: ApiLead) => ({
    _id: l._id,
    id: l._id,
    name: l.childName || '',
    parentName: l.parentName || '',
    phone: l.parentPhone || '',
    email: l.parentEmail || '',
    age: l.age,
    source: l.referredBy || 'Direct',
    service: l.diagnosis || 'Service',
    status: l.status === 'new' ? 'New' : l.status === 'contacted' ? 'Contacted' : l.status === 'converted' ? 'Converted' : 'Lost' as Lead['status'],
    date: new Date(l.createdAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true })
  }));

  const hasServerData = !!initialData;
  const [leads, setLeads] = useState<Lead[]>(
    hasServerData && Array.isArray(initialData?.leads) ? transformApiLeads(initialData.leads) : DEFAULT_LEADS
  );
  const [branches, setBranches] = useState<Branch[]>(initialData?.branches || []);
  const [isLoading, setIsLoading] = useState(!hasServerData);
  const { selectedBranchId } = useBranch();
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatusFilter>('All');
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const PER_PAGE = 10;
  const [newLead, setNewLead] = useState({
    childName: '',
    parentName: '',
    parentPhone: '',
    parentEmail: '',
    age: '',
    diagnosis: '',
    referredBy: '',
    branchId: '',
    status: 'new'
  });

  const resetLeadForm = () => {
    setNewLead({
      childName: '',
      parentName: '',
      parentPhone: '',
      parentEmail: '',
      age: '',
      diagnosis: '',
      referredBy: '',
      branchId: '',
      status: 'new'
    });
  };

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const branchParam = selectedBranchId ? `?branch=${selectedBranchId}` : '';
        const [leadsRes, branchRes] = await Promise.all([
          api.get(`/admin/leads${branchParam}`),
          api.get('/admin/branches')
        ]);
        
        if (leadsRes.data.success) {
          setLeads(transformApiLeads(leadsRes.data.data));
        }
        
        if (branchRes.data.success && branchRes.data.data) {
          setBranches(branchRes.data.data);
        }
      } catch (err: unknown) {
        console.error('Failed to fetch leads:', err);
        setError('Failed to load leads');
        toast.error('Failed to load leads');
      } finally {
        setIsLoading(false);
      }
    };
    fetchLeads();
  }, [selectedBranchId]);

  const handleAddLead = async () => {
    if (!newLead.parentPhone.trim()) {
      toast.error('Please provide a contact phone number');
      return;
    }

    try {
      const payload = {
        childName: newLead.childName,
        parentName: newLead.parentName,
        parentPhone: newLead.parentPhone,
        parentEmail: newLead.parentEmail || undefined,
        age: newLead.age ? Number(newLead.age) : undefined,
        diagnosis: newLead.diagnosis || undefined,
        referredBy: newLead.referredBy || undefined,
        branchId: newLead.branchId || undefined,
        status: newLead.status
      };
      const { data } = await api.post('/admin/leads', payload);
      if (data.success) {
        toast.success('Lead added successfully');
        // Refresh leads after adding
        const leadsRes = await api.get('/admin/leads');
        if (leadsRes.data.success) {
          setLeads(transformApiLeads(leadsRes.data.data));
        }
        setIsAddModalOpen(false);
        resetLeadForm();
      }
    } catch (err: unknown) {
      console.error('Failed to add lead:', err);
      toast.error('Failed to add lead');
    }
  };

  const filteredLeads = leads.filter((l) => {
    const matchesSearch =
      (l.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.parentName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.phone || '').includes(searchTerm);
    const matchesStatus = statusFilter === 'All' || l.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pagedLeads = filteredLeads.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const stats = {
    total: leads.length,
    new: leads.filter(l => l.status === 'New').length,
    contacted: leads.filter(l => l.status === 'Contacted').length,
    converted: leads.filter(l => l.status === 'Converted').length,
  };

  const updateStatus = async (id: string, newStatus: Lead['status']) => {
    try {
      const statusMap = { 'New': 'new', 'Contacted': 'contacted', 'Converted': 'converted', 'Lost': 'closed' } as const;
      const { data } = await api.put(`/admin/leads/${id}`, { status: statusMap[newStatus] });
      if (data.success) {
        toast.success('Lead status updated');
        setLeads(prev => prev.map(lead => lead._id === id ? { ...lead, status: newStatus } : lead));
        setOpenDropdownId(null);
      }
    } catch (err: unknown) {
      toast.error('Failed to update lead status');
    }
  };

  return (
    <div className="w-full space-y-4 sm:space-y-6 pb-6 lg:pb-10">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
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
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
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
      <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/10 min-h-96">
        {isLoading ? (
          <div className="h-96 flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin mx-auto mb-4"></div>
              <p className="text-on-surface-variant">Loading leads...</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low/30 border-b border-outline-variant/10">
                  <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider opacity-70">Lead Info</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider opacity-70">Source & Contact</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider opacity-70">Service Required</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider opacity-70">Date</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider opacity-70">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-low/50">
                {pagedLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-surface-container-low/20 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">{lead.name}</span>
                        {lead.age && <span className="px-1.5 py-0.5 bg-surface-container-low rounded text-[10px] text-on-surface-variant font-bold">{lead.age}y</span>}
                      </div>
                      {lead.parentName && <span className="text-xs text-on-surface-variant opacity-70 mt-0.5 italic">P: {lead.parentName}</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="px-3 py-1 bg-surface-container-low rounded-lg text-[10px] font-bold text-on-surface-variant uppercase tracking-wider w-fit">
                        {lead.source}
                      </span>
                      <div className="flex flex-col mt-1 space-y-0.5">
                        <span className="text-xs text-on-surface-variant opacity-80">{lead.phone}</span>
                        {lead.email && <span className="text-[10px] text-on-surface-variant opacity-60 truncate max-w-[120px]">{lead.email}</span>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-on-surface-variant">{lead.service}</td>
                  <td className="px-6 py-4 text-sm text-on-surface-variant opacity-80">{lead.date}</td>
                  <td className="px-6 py-4 relative">
                    {/* Status Dropdown */}
                    <div className="relative inline-block">
                      <button 
                        onClick={() => lead._id && setOpenDropdownId(openDropdownId === lead._id ? null : lead._id)}
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
                        {openDropdownId === lead._id && (
                          <motion.div 
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute right-0 top-full mt-2 w-36 bg-surface-container-lowest border border-outline-variant/10 shadow-xl rounded-xl py-1 z-50 overflow-hidden"
                          >
                            {(['New', 'Contacted', 'Converted', 'Lost'] as const).map(status => (
                              <button
                                key={status}
                                onClick={() => updateStatus(lead._id!, status)}
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
              {filteredLeads.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-on-surface-variant opacity-60">
                    No leads found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        )}
        <Pagination total={filteredLeads.length} page={page} perPage={PER_PAGE} onChange={p => setPage(p)} />
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

              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={newLead.childName}
                    onChange={(e) => setNewLead(prev => ({ ...prev, childName: e.target.value }))}
                    className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl py-2.5 px-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/25"
                    placeholder="Child name"
                  />
                  <input
                    type="text"
                    value={newLead.parentName}
                    onChange={(e) => setNewLead(prev => ({ ...prev, parentName: e.target.value }))}
                    className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl py-2.5 px-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/25"
                    placeholder="Parent name"
                  />
                  <input
                    type="tel"
                    value={newLead.parentPhone}
                    onChange={(e) => setNewLead(prev => ({ ...prev, parentPhone: e.target.value }))}
                    className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl py-2.5 px-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/25"
                    placeholder="Parent phone *"
                  />
                  <input
                    type="email"
                    value={newLead.parentEmail}
                    onChange={(e) => setNewLead(prev => ({ ...prev, parentEmail: e.target.value }))}
                    className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl py-2.5 px-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/25"
                    placeholder="Parent email"
                  />
                  <input
                    type="number"
                    value={newLead.age}
                    onChange={(e) => setNewLead(prev => ({ ...prev, age: e.target.value }))}
                    className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl py-2.5 px-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/25"
                    placeholder="Age"
                  />
                  <input
                    type="text"
                    value={newLead.diagnosis}
                    onChange={(e) => setNewLead(prev => ({ ...prev, diagnosis: e.target.value }))}
                    className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl py-2.5 px-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/25"
                    placeholder="Diagnosis"
                  />
                  <input
                    type="text"
                    value={newLead.referredBy}
                    onChange={(e) => setNewLead(prev => ({ ...prev, referredBy: e.target.value }))}
                    className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl py-2.5 px-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/25"
                    placeholder="Referred by"
                  />
                  <select
                    value={newLead.branchId}
                    onChange={(e) => setNewLead(prev => ({ ...prev, branchId: e.target.value }))}
                    className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl py-2.5 px-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/25"
                  >
                    <option value="">Select Branch</option>
                    {branches.map(branch => (
                      <option key={branch._id} value={branch._id}>{branch.name}</option>
                    ))}
                  </select>
                </div>
                <select
                  value={newLead.status}
                  onChange={(e) => setNewLead(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl py-2.5 px-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/25"
                >
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="converted">Converted</option>
                  <option value="closed">Closed</option>
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
                  disabled={!newLead.parentPhone.trim()}
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
