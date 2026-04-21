"use client";
import { useEffect, useState, useMemo } from 'react';
import api from '@/lib/api';
import { 
  Search, 
  Filter, 
  MoreVertical, 
  UserPlus, 
  ShieldCheck, 
  ChevronLeft, 
  ChevronRight,
  TrendingUp,
  Lock,
  Download,
  Eye,
  Edit,
  Trash2,
  X
} from 'lucide-react';
import { Lead } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import React from 'react';
import { exportToCSV } from '../lib/csvExport';
import { Button } from '../components/ui/Button';

interface LeadManagementProps {
  leads: Lead[];
  onUpdateStatus: (id: string, status: Lead['status']) => void;
  onAddLead: (lead: Omit<Lead, 'id' | 'dateReceived'>) => void;
  onDeleteLead: (id: string) => void;
  onUpdateLead: (lead: Lead) => void;
}

export default function LeadManagementView({ leads, onUpdateStatus, onAddLead, onDeleteLead, onUpdateLead }: LeadManagementProps) {
  const [conversionRate, setConversionRate] = useState<string>('—');
  const [recentLeads, setRecentLeads] = useState<number | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get('/manager/leads/stats');
        if (data.success) {
          setConversionRate(data.data.conversionRate || '0%');
          setRecentLeads(data.data.recentLeads ?? null);
        }
      } catch (err) {
        console.error('Failed to load lead stats:', err);
      }
    };
    fetchStats();
  }, []);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [newLead, setNewLead] = useState<any>({ name: '', parentName: '', phone: '', email: '', age: '', service: '', source: '', status: 'New' });
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'All Statuses' || lead.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [leads, searchTerm, statusFilter]);

  const maskPhone = (phone: string) => {
    return `XXXXXX${phone.slice(-4)}`;
  };

  const handleAddLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (newLead.name && newLead.phone) {
      setIsProcessing(true);
      setTimeout(() => {
        onAddLead(newLead);
        setIsModalOpen(false);
        setNewLead({ name: '', parentName: '', phone: '', email: '', age: '', service: '', source: '', status: 'New' });
        setIsProcessing(false);
      }, 800);
    }
  };

  const handleUpdateLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingLead) {
      setIsProcessing(true);
      setTimeout(() => {
        onUpdateLead(editingLead);
        setIsEditModalOpen(false);
        setEditingLead(null);
        setIsProcessing(false);
      }, 800);
    }
  };

  const handleDeleteLead = (id: string) => {
    if (window.confirm('Are you sure you want to delete this lead?')) {
      onDeleteLead(id);
      setActiveMenu(null);
    }
  };

  const handleExportCSV = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const exportData = filteredLeads.map(lead => ({
        Name: lead.name,
        Phone: lead.phone,
        Source: lead.source,
        'Date Received': lead.dateReceived,
        Status: lead.status
      }));
      exportToCSV(exportData, `Leads_Export_${new Date().toISOString().split('T')[0]}`);
      setIsProcessing(false);
    }, 1000);
  };

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-8 h-[2px] bg-secondary rounded-full"></span>
            <span className="text-secondary font-bold text-xs uppercase tracking-[0.2em]">Patient Pipeline</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-on-surface tracking-tight mb-3">Lead Management</h1>
          <p className="text-on-surface-variant font-medium leading-relaxed text-sm md:text-base">
            Overview of incoming referrals and patient inquiries. Manage status transitions from initial contact to clinical conversion.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <Button 
            variant="surface"
            onClick={handleExportCSV}
            isLoading={isProcessing}
            className="flex-1 sm:flex-none"
          >
            <Download size={20} />
            Export CSV
          </Button>
          <Button 
            variant="secondary"
            onClick={() => setIsModalOpen(true)}
            className="flex-1 sm:flex-none bg-gradient-to-br from-secondary to-[#008f82]"
          >
            <UserPlus size={20} />
            Add New Lead
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8 bg-surface-container-lowest p-6 rounded-xl flex flex-col md:flex-row items-stretch md:items-center gap-6 shadow-sm border border-outline-variant/10">
          <div className="flex-1 relative">
            <label className="block text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-wider mb-1.5 ml-1">Search by name</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/60" size={18} />
              <input 
                type="text" 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-surface-container-low border-none rounded-xl pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-primary/10"
                placeholder="Enter patient name..."
              />
            </div>
          </div>
          <div className="w-full md:w-64">
            <label className="block text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-wider mb-1.5 ml-1">Status Filter</label>
            <select 
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/10 appearance-none"
            >
              <option>All Statuses</option>
              <option>New</option>
              <option>Contacted</option>
              <option>Converted</option>
              <option>Cold</option>
            </select>
          </div>
          <button className="hidden md:block mt-5 p-3 bg-surface-container-high rounded-xl text-on-surface-variant hover:bg-primary/10 hover:text-primary transition-colors">
            <Filter size={18} />
          </button>
        </div>
        <div className="col-span-12 lg:col-span-4 bg-secondary-container/20 p-6 rounded-xl flex items-center gap-4 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="text-on-secondary-container" size={16} />
              <span className="text-xs font-bold text-on-secondary-container uppercase tracking-tight">Security Protocol</span>
            </div>
            <p className="text-xs text-on-secondary-container/80 font-medium">Sensitive phone data is masked for compliance.</p>
          </div>
          <Lock className="absolute -right-4 -bottom-4 text-secondary-container/30 rotate-12" size={96} />
        </div>
      </div>

      {/* Table / Cards */}
      <div className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm border border-outline-variant/10">
        {/* Desktop/Tablet Table View (> 640px) */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-surface-container-low/50">
                <th className="text-left py-5 px-4 xl:px-6 2xl:px-8 text-[11px] font-bold text-on-surface-variant/60 uppercase tracking-widest border-none">Patient Name</th>
                <th className="text-left py-5 px-4 xl:px-6 2xl:px-8 text-[11px] font-bold text-on-surface-variant/60 uppercase tracking-widest border-none">Phone Identity</th>
                <th className="text-left py-5 px-4 xl:px-6 2xl:px-8 text-[11px] font-bold text-on-surface-variant/60 uppercase tracking-widest border-none">Source</th>
                <th className="text-left py-5 px-4 xl:px-6 2xl:px-8 text-[11px] font-bold text-on-surface-variant/60 uppercase tracking-widest border-none">Date Received</th>
                <th className="text-left py-5 px-4 xl:px-6 2xl:px-8 text-[11px] font-bold text-on-surface-variant/60 uppercase tracking-widest border-none">Pipeline Status</th>
                <th className="text-right py-5 px-4 xl:px-6 2xl:px-8 text-[11px] font-bold text-on-surface-variant/60 uppercase tracking-widest border-none">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-low">
              {filteredLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-surface-container-low/30 transition-colors group">
                  <td className="py-5 px-4 xl:px-6 2xl:px-8">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase">
                        {lead.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="font-semibold text-on-surface">{lead.name}</span>
                    </div>
                  </td>
                  <td className="py-5 px-4 xl:px-6 2xl:px-8">
                    <span className="font-mono text-sm tracking-tighter text-on-surface-variant bg-surface-container-low px-2 py-1 rounded">
                      {maskPhone(lead.phone)}
                    </span>
                  </td>
                  <td className="py-5 px-4 xl:px-6 2xl:px-8 text-sm text-on-surface-variant font-medium">{lead.source}</td>
                  <td className="py-5 px-4 xl:px-6 2xl:px-8 text-sm text-on-surface-variant">{lead.dateReceived}</td>
                  <td className="py-5 px-4 xl:px-6 2xl:px-8">
                    <select 
                      value={lead.status}
                      onChange={e => onUpdateStatus(lead.id, e.target.value as Lead['status'])}
                      className={cn(
                        "text-xs font-bold px-3 py-1.5 rounded-full border-none focus:ring-0 cursor-pointer",
                        lead.status === 'New' ? "bg-blue-50 text-blue-700" :
                        lead.status === 'Contacted' ? "bg-amber-50 text-amber-700" :
                        lead.status === 'Converted' ? "bg-emerald-50 text-emerald-700" :
                        "bg-gray-50 text-gray-700"
                      )}
                    >
                      <option value="New">New</option>
                      <option value="Contacted">Contacted</option>
                      <option value="Converted">Converted</option>
                      <option value="Cold">Cold</option>
                    </select>
                  </td>
                  <td className="py-5 px-4 xl:px-6 2xl:px-8 text-right relative">
                    <button 
                      onClick={() => setActiveMenu(activeMenu === lead.id ? null : lead.id)}
                      className="text-on-surface-variant group-hover:text-primary transition-all p-2 rounded-lg hover:bg-surface-container-high"
                    >
                      <MoreVertical size={20} />
                    </button>

                    {activeMenu === lead.id && (
                      <div className="absolute right-12 top-12 w-32 bg-white rounded-xl shadow-xl border border-outline-variant/10 z-50 py-2 overflow-hidden">
                        <button 
                          onClick={() => {
                            setSelectedLead(lead);
                            setIsViewModalOpen(true);
                            setActiveMenu(null);
                          }}
                          className="w-full px-4 py-2 text-left text-xs font-bold hover:bg-surface-container-low flex items-center gap-2"
                        >
                          <Eye size={14} /> View
                        </button>
                        <button 
                          onClick={() => {
                            setEditingLead(lead);
                            setIsEditModalOpen(true);
                            setActiveMenu(null);
                          }}
                          className="w-full px-4 py-2 text-left text-xs font-bold hover:bg-surface-container-low flex items-center gap-2"
                        >
                          <Edit size={14} /> Edit
                        </button>
                        <button 
                          onClick={() => handleDeleteLead(lead.id)}
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
          {filteredLeads.map((lead) => (
            <div key={lead.id} className="p-4 sm:p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm uppercase shrink-0">
                    {lead.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-on-surface truncate">{lead.name}</h4>
                    <p className="text-xs text-on-surface-variant truncate">{lead.source}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setActiveMenu(activeMenu === lead.id ? null : lead.id)}
                  className="text-on-surface-variant p-2 rounded-lg hover:bg-surface-container-high"
                >
                  <MoreVertical size={20} />
                </button>

                {activeMenu === lead.id && (
                  <div className="absolute right-12 top-12 w-32 bg-white rounded-xl shadow-xl border border-outline-variant/10 z-50 py-2 overflow-hidden">
                    <button 
                      onClick={() => {
                        setSelectedLead(lead);
                        setIsViewModalOpen(true);
                        setActiveMenu(null);
                      }}
                      className="w-full px-4 py-2 text-left text-xs font-bold hover:bg-surface-container-low flex items-center gap-2"
                    >
                      <Eye size={14} /> View
                    </button>
                    <button 
                      onClick={() => {
                        setEditingLead(lead);
                        setIsEditModalOpen(true);
                        setActiveMenu(null);
                      }}
                      className="w-full px-4 py-2 text-left text-xs font-bold hover:bg-surface-container-low flex items-center gap-2"
                    >
                      <Edit size={14} /> Edit
                    </button>
                    <button 
                      onClick={() => handleDeleteLead(lead.id)}
                      className="w-full px-4 py-2 text-left text-xs font-bold hover:bg-surface-container-low text-error flex items-center gap-2"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest mb-1">Phone</p>
                  <span className="font-mono text-xs tracking-tighter text-on-surface-variant bg-surface-container-low px-2 py-1 rounded">
                    {maskPhone(lead.phone)}
                  </span>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest mb-1">Received</p>
                  <p className="text-xs text-on-surface-variant">{lead.dateReceived}</p>
                </div>
              </div>

              <div className="pt-2">
                <p className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest mb-2">Pipeline Status</p>
                <select 
                  value={lead.status}
                  onChange={e => onUpdateStatus(lead.id, e.target.value as Lead['status'])}
                  className={cn(
                    "w-full text-xs font-bold px-4 py-2.5 rounded-xl border border-outline-variant/20 focus:ring-0 cursor-pointer",
                    lead.status === 'New' ? "bg-blue-50 text-blue-700" :
                    lead.status === 'Contacted' ? "bg-amber-50 text-amber-700" :
                    lead.status === 'Converted' ? "bg-emerald-50 text-emerald-700" :
                    "bg-gray-50 text-gray-700"
                  )}
                >
                  <option value="New">New</option>
                  <option value="Contacted">Contacted</option>
                  <option value="Converted">Converted</option>
                  <option value="Cold">Cold</option>
                </select>
              </div>
            </div>
          ))}
        </div>

        {filteredLeads.length === 0 && (
          <div className="py-20 text-center text-on-surface-variant/60 font-medium">
            No leads found matching your criteria.
          </div>
        )}

        <div className="px-8 py-4 bg-surface-container-low/20 flex flex-col sm:flex-row justify-between items-center gap-4">
          <span className="text-xs font-medium text-on-surface-variant">Showing {filteredLeads.length} of {leads.length} clinical leads</span>
          <div className="flex items-center gap-2">
            <button className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors">
              <ChevronLeft size={18} />
            </button>
            <button className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary text-white text-xs font-bold">1</button>
            <button className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface text-xs font-bold hover:bg-surface-container-high transition-colors">2</button>
            <button className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
        <div className="bg-gradient-to-br from-primary to-primary-container p-6 rounded-2xl text-white shadow-xl shadow-primary/10">
          <div className="flex justify-between items-start mb-4">
            <TrendingUp size={32} />
            <span className="bg-white/20 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">Conversion</span>
          </div>
          <h3 className="text-2xl font-bold mb-1">{conversionRate}</h3>
          <p className="text-white/80 text-xs font-medium">
            {recentLeads !== null ? `${recentLeads} new leads in last 7 days` : 'Current conversion rate'}
          </p>
        </div>
        <div className="bg-surface-container-lowest p-6 rounded-2xl relative overflow-hidden shadow-sm border border-outline-variant/10">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="text-secondary" size={20} />
              <h3 className="text-sm font-bold text-on-surface">Privacy Compliance</h3>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Lead records are encrypted at rest and comply with 256-bit AES standards for patient data protection.
            </p>
          </div>
          <Lock className="absolute right-0 bottom-0 p-2 text-surface-container-high opacity-40" size={64} />
        </div>
        <div className="bg-surface-container-lowest p-1 rounded-2xl border border-outline-variant/10 shadow-sm overflow-hidden">
          <img 
            src="https://picsum.photos/seed/medical/400/300" 
            alt="Medical" 
            className="w-full h-full object-cover rounded-xl"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {/* Add Lead Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-8 w-full max-w-2xl shadow-2xl"
            >
              <h3 className="text-xl font-bold mb-6">Add New Lead</h3>
              <form onSubmit={handleAddLead} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Child Name</label>
                  <input 
                    type="text" 
                    required
                    value={newLead.name}
                    onChange={e => setNewLead((prev: any) => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20"
                    placeholder="e.g. Julianne Roberts"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Parent Name</label>
                  <input 
                    type="text" 
                    value={newLead.parentName || ''}
                    onChange={e => setNewLead((prev: any) => ({ ...prev, parentName: e.target.value }))}
                    className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20"
                    placeholder="Parent's Name"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Phone Number *</label>
                  <input 
                    type="tel" 
                    required
                    value={newLead.phone}
                    onChange={e => setNewLead((prev: any) => ({ ...prev, phone: e.target.value }))}
                    className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20"
                    placeholder="9876543210"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Email</label>
                  <input 
                    type="email" 
                    value={newLead.email || ''}
                    onChange={e => setNewLead((prev: any) => ({ ...prev, email: e.target.value }))}
                    className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20"
                    placeholder="Email Address"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Age</label>
                  <input 
                    type="number" 
                    value={newLead.age || ''}
                    onChange={e => setNewLead((prev: any) => ({ ...prev, age: e.target.value }))}
                    className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20"
                    placeholder="Age"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Diagnosis / Service</label>
                  <input 
                    type="text" 
                    value={newLead.service || ''}
                    onChange={e => setNewLead((prev: any) => ({ ...prev, service: e.target.value }))}
                    className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20"
                    placeholder="Service required"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Source</label>
                  <input 
                    type="text" 
                    value={newLead.source}
                    onChange={e => setNewLead((prev: any) => ({ ...prev, source: e.target.value }))}
                    className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20"
                    placeholder="e.g. Facebook Ads"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Status</label>
                  <select 
                    value={newLead.status}
                    onChange={e => setNewLead((prev: any) => ({ ...prev, status: e.target.value as Lead['status'] }))}
                    className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 appearance-none"
                  >
                    <option value="New">New</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Converted">Converted</option>
                    <option value="Cold">Cold</option>
                  </select>
                </div>
                <div className="flex gap-4 pt-4 md:col-span-2">
                  <Button 
                    type="button"
                    variant="ghost"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    isLoading={isProcessing}
                    className="flex-1"
                  >
                    Create Lead
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Edit Lead Modal */}
        {isEditModalOpen && editingLead && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-8 w-full max-w-2xl shadow-2xl"
            >
              <h3 className="text-xl font-bold mb-6">Edit Lead</h3>
              <form onSubmit={handleUpdateLead} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Child Name</label>
                  <input 
                    type="text" 
                    required
                    value={editingLead.name}
                    onChange={e => setEditingLead(prev => prev ? ({ ...prev, name: e.target.value }) : null)}
                    className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Parent Name</label>
                  <input 
                    type="text" 
                    value={editingLead.parentName || ''}
                    onChange={e => setEditingLead(prev => prev ? ({ ...prev, parentName: e.target.value }) : null)}
                    className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Phone Number *</label>
                  <input 
                    type="tel" 
                    required
                    value={editingLead.phone}
                    onChange={e => setEditingLead(prev => prev ? ({ ...prev, phone: e.target.value }) : null)}
                    className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Email</label>
                  <input 
                    type="email" 
                    value={editingLead.email || ''}
                    onChange={e => setEditingLead(prev => prev ? ({ ...prev, email: e.target.value }) : null)}
                    className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Age</label>
                  <input 
                    type="number" 
                    value={editingLead.age || ''}
                    onChange={e => setEditingLead(prev => prev ? ({ ...prev, age: parseInt(e.target.value) || undefined }) : null)}
                    className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Diagnosis / Service</label>
                  <input 
                    type="text" 
                    value={editingLead.service || ''}
                    onChange={e => setEditingLead(prev => prev ? ({ ...prev, service: e.target.value }) : null)}
                    className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Source</label>
                  <input 
                    type="text" 
                    value={editingLead.source}
                    onChange={e => setEditingLead(prev => prev ? ({ ...prev, source: e.target.value }) : null)}
                    className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Status</label>
                  <select 
                    value={editingLead.status}
                    onChange={e => setEditingLead(prev => prev ? ({ ...prev, status: e.target.value as Lead['status'] }) : null)}
                    className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 appearance-none"
                  >
                    <option value="New">New</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Converted">Converted</option>
                    <option value="Cold">Cold</option>
                  </select>
                </div>
                <div className="flex gap-4 pt-4 md:col-span-2">
                  <Button 
                    type="button"
                    variant="ghost"
                    onClick={() => setIsEditModalOpen(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    isLoading={isProcessing}
                    className="flex-1"
                  >
                    Save Changes
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* View Lead Modal */}
        {isViewModalOpen && selectedLead && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl relative"
            >
              <button 
                onClick={() => setIsViewModalOpen(false)}
                className="absolute right-6 top-6 p-2 text-on-surface-variant hover:bg-surface-container-low rounded-lg"
              >
                <X size={20} />
              </button>
              
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xl uppercase">
                  {selectedLead.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-on-surface">{selectedLead.name}</h3>
                  <p className="text-on-surface-variant font-medium">{selectedLead.source}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">Phone Number</p>
                  <p className="font-mono text-sm font-bold text-on-surface">{selectedLead.phone}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">Date Received</p>
                  <p className="text-sm font-bold text-on-surface">{selectedLead.dateReceived}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">Current Status</p>
                  <span className={cn(
                    "inline-block px-3 py-1 rounded-full text-xs font-bold",
                    selectedLead.status === 'New' ? "bg-blue-50 text-blue-700" :
                    selectedLead.status === 'Contacted' ? "bg-amber-50 text-amber-700" :
                    selectedLead.status === 'Converted' ? "bg-emerald-50 text-emerald-700" :
                    "bg-gray-50 text-gray-700"
                  )}>
                    {selectedLead.status}
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">Lead ID</p>
                  <p className="text-sm font-bold text-on-surface">#L-{selectedLead.id.slice(-6)}</p>
                </div>
              </div>

              <div className="p-4 bg-surface-container-low rounded-xl mb-8">
                <p className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest mb-2">Internal Notes</p>
                <p className="text-xs text-on-surface-variant leading-relaxed italic">
                  "Patient expressed interest in post-operative rehabilitation services. Follow-up scheduled for next week."
                </p>
              </div>

              <Button 
                onClick={() => setIsViewModalOpen(false)}
                className="w-full"
              >
                Close Details
              </Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

