import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Search, Plus, Filter, MoreVertical, FileText, X, Edit, CheckCircle2, Trash2, Eye, Download, Printer, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { toast } from 'sonner';
import { AddPatientModal } from '../components/AddPatientModal';
import { useBranch } from '../components/BranchContext';
import { useAddTransaction } from '../components/AddTransactionContext';

// --- Types ---
interface Patient {
  _id?: string;
  id?: string;
  name: string;        // Child Name
  parentName?: string;
  parentPhone?: string;
  address?: string;
  therapyType?: string[];
  age: number;
  condition: string;
  branch: string;
  status: 'Active' | 'Discharged' | 'Critical';
  lastVisit: string;
  totalFee?: number;
}

type PatientStatusFilter = 'All' | Patient['status'];

interface ApiPatient {
  _id: string;
  name: string;
  parentName?: string;
  parentPhone?: string;
  address?: string;
  therapyType?: string[];
  age: number;
  condition: string;
  branchId?: { _id: string; name: string } | null;
  status: 'active' | 'discharged' | 'on_hold';
  admissionDate: string;
  totalFee?: number;
}

// Default fallback data
const DEFAULT_PATIENTS: Patient[] = [
  { id: 'PT-001', name: 'Aarav Gupta', parentName: 'Rahul Gupta', parentPhone: '9876543210', therapyType: ['autism_therapy'], age: 5, condition: 'Autism Spectrum', branch: 'Mumbai', status: 'Active', lastVisit: '10 May 2026' },
  { id: 'PT-002', name: 'Riya Sharma', parentName: 'Priya Sharma', parentPhone: '8765432109', therapyType: ['speech_therapy'], age: 6, condition: 'Speech Delay', branch: 'Delhi', status: 'Active', lastVisit: '09 May 2026' },
];

interface Branch {
  _id: string;
  name: string;
}

export const PatientsView = ({ initialData }: { initialData?: any }) => {
  const transformApiPatients = (data: ApiPatient[]): Patient[] => data.map((p: ApiPatient) => ({
    _id: p._id,
    id: p._id,
    name: p.name,
    parentName: p.parentName,
    parentPhone: p.parentPhone,
    address: p.address,
    therapyType: p.therapyType,
    age: p.age,
    condition: p.condition,
    branch: p.branchId?._id || '',
    status: (p.status === 'active' ? 'Active' : p.status === 'discharged' ? 'Discharged' : 'Critical') as Patient['status'],
    lastVisit: p.admissionDate ? new Date(p.admissionDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A',
    totalFee: p.totalFee
  }));

  const hasServerData = !!initialData;
  const [patients, setPatients] = useState<Patient[]>(
    hasServerData && Array.isArray(initialData?.patients) ? transformApiPatients(initialData.patients) : DEFAULT_PATIENTS
  );
  const [branches, setBranches] = useState<Branch[]>(initialData?.branches || []);
  const [isLoading, setIsLoading] = useState(!hasServerData);
  const { selectedBranchId } = useBranch();
  const { openModal } = useAddTransaction();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<PatientStatusFilter>('All');
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deletingPatient, setDeletingPatient] = useState<Patient | null>(null);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [viewingPatient, setViewingPatient] = useState<Patient | null>(null);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setViewingPatient(null);
        setIsAddModalOpen(false);
        setEditingPatient(null);
        setDeletingPatient(null);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const [newPatient, setNewPatient] = useState<Omit<Patient, 'id'>>({
    name: '',
    age: 0,
    condition: '',
    branch: '',
    status: 'Active',
    lastVisit: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  });

  const resetPatientForm = () => {
    setNewPatient({
      name: '',
      age: 0,
      condition: '',
      branch: '',
      status: 'Active',
      lastVisit: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    });
  };

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const branchParam = selectedBranchId ? `?branch=${selectedBranchId}` : '';
        const [patientRes, branchRes] = await Promise.all([
          api.get(`/admin/patients${branchParam}`),
          api.get('/admin/branches')
        ]);

        const branchList: Branch[] = branchRes.data.success && branchRes.data.data ? branchRes.data.data : [];
        if (branchList.length) setBranches(branchList);

        if (patientRes.data.success) {
          setPatients(transformApiPatients(patientRes.data.data));
        }
      } catch (err: unknown) {
        console.error('Failed to fetch patients:', err);
        const message = 'Failed to load patients';
        setError(message);
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPatients();
  }, [selectedBranchId]);

  const handleAddPatient = async () => {
    if (!newPatient.name.trim() || !newPatient.condition.trim() || !newPatient.branch.trim() || newPatient.age <= 0) {
      return;
    }

    try {
      const payload = {
        name: newPatient.name,
        age: newPatient.age,
        condition: newPatient.condition,
        branchId: newPatient.branch,
        status: newPatient.status === 'Active' ? 'active' : newPatient.status === 'Discharged' ? 'discharged' : 'on_hold'
      };
      const { data } = await api.post('/admin/patients', payload);
      if (data.success) {
        toast.success('Patient added successfully');
        setPatients(prev => [{
          ...newPatient,
          branch: data.data.branchId?._id || data.data.branchId || newPatient.branch,
          _id: data.data._id,
          id: data.data._id
        }, ...prev]);
        setIsAddModalOpen(false);
        resetPatientForm();
      }
    } catch (err: unknown) {
      toast.error('Failed to add patient');
    }
  };

  const handleDeletePatient = async () => {
    if (!deletingPatient || !deletingPatient._id) return;
    try {
      const { data } = await api.delete(`/admin/patients/${deletingPatient._id}`);
      if (data.success) {
        toast.success('Patient deleted successfully');
        setPatients(prev => prev.filter(patient => patient._id !== deletingPatient._id));
        setDeletingPatient(null);
      }
    } catch (err: unknown) {
      toast.error('Failed to delete patient');
    }
  };

  const handleMarkDischarged = async (id: string) => {
    try {
      const { data } = await api.put(`/admin/patients/${id}`, { status: 'discharged' });
      if (data.success) {
        toast.success('Patient marked as discharged');
        setPatients(prev => prev.map(patient => (
          patient._id === id ? { ...patient, status: 'Discharged' } : patient
        )));
        setActiveMenu(null);
      }
    } catch (err: unknown) {
      toast.error('Failed to update patient status');
    }
  };

  const handleSaveEditedPatient = async () => {
    if (!editingPatient || !editingPatient._id) return;
    if (!editingPatient.name.trim() || !editingPatient.condition.trim() || !editingPatient.branch.trim() || editingPatient.age <= 0) {
      return;
    }
    try {
      const payload = {
        name: editingPatient.name,
        age: editingPatient.age,
        condition: editingPatient.condition,
        branchId: editingPatient.branch,
        status: editingPatient.status === 'Active' ? 'active' : editingPatient.status === 'Discharged' ? 'discharged' : 'on_hold'
      };
      const { data } = await api.put(`/admin/patients/${editingPatient._id}`, payload);
      if (data.success) {
        toast.success('Patient updated successfully');
        setPatients(prev => prev.map(patient => (patient._id === editingPatient._id ? editingPatient : patient)));
        setEditingPatient(null);
        setActiveMenu(null);
      }
    } catch (err: unknown) {
      toast.error('Failed to update patient');
    }
  };

  const filteredPatients = patients.filter(p => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.id?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="w-full space-y-4 sm:space-y-6 pb-6 lg:pb-10">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/10">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-xl text-primary">
            <FileText size={20} />
          </div>
          <div>
            <h3 className="text-xl font-bold font-headline text-on-surface">Patients Directory</h3>
            <p className="text-xs text-on-surface-variant font-medium opacity-60">Manage all admitted and discharged patients</p>
          </div>
        </div>
        
        <div className="flex w-full sm:w-auto items-center gap-3">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/50" size={18} />
            <input 
              type="text" 
              placeholder="Search by name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64 bg-surface-container-low/50 border border-outline-variant/20 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all text-on-surface"
            />
          </div>
          <div className="relative">
            <button
              onClick={() => setIsFilterMenuOpen(prev => !prev)}
              className="p-2.5 border border-outline-variant/20 rounded-xl text-on-surface-variant hover:bg-surface-container-low transition-colors"
              aria-label="Filter patients"
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
                  {(['All', 'Active', 'Discharged', 'Critical'] as PatientStatusFilter[]).map((option) => (
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
            <span className="hidden sm:inline">Add Patient</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/10 overflow-hidden">
        {isLoading ? (
          <div className="h-96 flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin mx-auto mb-4"></div>
              <p className="text-on-surface-variant">Loading patients...</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low/30">
                  <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider opacity-70">Child Name</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider opacity-70">Parent Name</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider opacity-70">Therapy</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider opacity-70">Contact</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider opacity-70">Branch</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider opacity-70 text-right">Fee (₹)</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider opacity-70">Status</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider opacity-70 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-low/50">
                {filteredPatients.map((patient) => (
                <motion.tr 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  key={patient.id} 
                  onClick={() => setViewingPatient(patient)}
                  className="hover:bg-surface-container-low/50 transition-colors group cursor-pointer"
                >
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">{patient.name}</span>
                      <span className="text-[10px] text-on-surface-variant uppercase tracking-wider mt-0.5 opacity-60 font-bold">{patient._id?.slice(-8) || patient.id}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-on-surface-variant">{patient.parentName || 'N/A'}</td>
                  <td className="px-6 py-4 flex flex-wrap gap-1">
                    {patient.therapyType && patient.therapyType.length > 0 ? (
                      patient.therapyType.map((t, i) => (
                        <span key={i} className="px-2 py-1 bg-surface-container-low text-on-surface-variant text-[10px] font-bold rounded-md uppercase tracking-wider">
                          {t.replace('_', ' ')}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-on-surface-variant opacity-60">N/A</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-on-surface-variant whitespace-nowrap">{patient.parentPhone || 'N/A'}</td>
                  <td className="px-6 py-4 text-sm font-medium text-on-surface-variant">{branches.find(b => b._id === patient.branch)?.name || 'Unknown'}</td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm font-black text-on-surface">₹{(patient.totalFee || 0).toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-3 py-1.5 text-[10px] font-black rounded-lg uppercase tracking-wider inline-block",
                      patient.status === 'Active' && "bg-blue-50 text-blue-700",
                      patient.status === 'Discharged' && "bg-surface-container-low text-on-surface-variant",
                      patient.status === 'Critical' && "bg-error/10 text-error"
                    )}>
                      {patient.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="relative inline-block text-left">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          patient.id && setActiveMenu(activeMenu === patient.id ? null : patient.id);
                        }}
                        className="p-2 hover:bg-surface-container-low rounded-lg text-on-surface-variant transition-colors"
                      >
                        <MoreVertical size={16} />
                      </button>

                      {activeMenu === patient.id && (
                        <div className="absolute right-0 mt-2 w-44 rounded-xl border border-outline-variant/20 bg-surface-container-lowest shadow-xl p-1.5 z-20">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openModal({ patientId: patient._id, branchId: patient.branch });
                              setActiveMenu(null);
                            }}
                            className="w-full px-3 py-2 text-left text-sm rounded-lg text-secondary hover:bg-secondary/10 flex items-center gap-2 font-semibold"
                          >
                            <CreditCard size={14} />
                            Add Payment
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewingPatient(patient);
                              setActiveMenu(null);
                            }}
                            className="w-full px-3 py-2 text-left text-sm rounded-lg text-on-surface-variant hover:bg-surface-container-low flex items-center gap-2"
                          >
                            <Eye size={14} />
                            View
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingPatient(patient);
                              setActiveMenu(null);
                            }}
                            className="w-full px-3 py-2 text-left text-sm rounded-lg text-on-surface-variant hover:bg-surface-container-low flex items-center gap-2"
                          >
                            <Edit size={14} />
                            Edit
                          </button>
                          {patient.status !== 'Discharged' && patient._id && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkDischarged(patient._id!);
                              }}
                              className="w-full px-3 py-2 text-left text-sm rounded-lg text-on-surface-variant hover:bg-surface-container-low flex items-center gap-2"
                            >
                              <CheckCircle2 size={14} />
                              Mark Discharged
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingPatient(patient);
                              setActiveMenu(null);
                            }}
                            className="w-full px-3 py-2 text-left text-sm rounded-lg text-error hover:bg-error/10 flex items-center gap-2"
                          >
                            <Trash2 size={14} />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
              {filteredPatients.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-on-surface-variant opacity-60">
                    No patients found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {mounted && createPortal(
        <div id="prescription-portal-root">
          <AnimatePresence>
        {viewingPatient && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99999] flex items-center justify-center p-4 overflow-y-auto"
            style={{ backgroundColor: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)' }}
            onClick={() => setViewingPatient(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.97 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-2xl lg:max-w-3xl rounded-2xl my-4 sm:my-8 flex flex-col"
              style={{ background: '#ffffff', border: '1px solid #eee', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
            >
              <div className="flex justify-between items-center px-4 py-3 bg-slate-100 border-b border-slate-200 no-print">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-2">Document Preview</p>
                <button onClick={() => setViewingPatient(null)} className="p-1.5 rounded-lg transition-colors hover:bg-slate-200" style={{ color: '#666' }} aria-label="Close document">
                  <X size={20} />
                </button>
              </div>

              {/* Print Stylesheet */}
              <style type="text/css" media="print">
                {`
                  body > *:not(#prescription-portal-root) {
                    display: none !important;
                  }
                  body {
                    background: white;
                  }
                  
                  #prescription-portal-root, #prescription-portal-root > div {
                    position: static !important;
                    display: block !important;
                    background: transparent !important;
                    box-shadow: none !important;
                    transform: none !important;
                    width: 100% !important;
                    height: auto !important;
                  }

                  /* Hide backdrop and centered spacing tricks */
                  #prescription-portal-root > div > div {
                    position: static !important;
                    margin: 0 !important;
                    transform: none !important;
                    box-shadow: none !important;
                    border: none !important;
                  }

                  #printable-prescription { 
                    max-width: none !important; 
                    margin: 0 !important; padding: 0 !important;
                    border: none !important;
                  }

                  .no-print { display: none !important; }
                  @page { margin: 1cm; size: A4 portrait; }
                `}
              </style>

              {/* Printable Document Area */}
              <div className="p-6 md:p-10 bg-white flex-1 relative rounded-b-2xl">
                
                <div id="printable-prescription" className="bg-white mx-auto flex flex-col w-full h-full max-w-[800px]">
                  
                  {/* Docket Header */}
                  <div className="flex justify-between items-start border-b-[3px] border-slate-900 pb-5 mb-5 mt-2">
                    <div className="flex gap-4 items-center">
                      <div className="w-16 h-16 bg-transparent flex items-center justify-center shrink-0">
                        <img src="/logo.jpeg" alt="Rehablito Logo" className="w-full h-full object-contain" />
                      </div>
                      <div className="flex flex-col">
                         <h2 className="text-[26px] font-black text-slate-900 tracking-tight font-headline uppercase" style={{ lineHeight: 1 }}>REHABLITO</h2>
                         <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-1.5">{branches.find(b => b._id === viewingPatient.branch)?.name || viewingPatient.branch || 'Clinic'}</p>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end pt-1">
                      <span className="text-[10px] font-black bg-slate-100 px-2 py-1 rounded text-slate-600 uppercase tracking-widest border border-slate-200">
                        PID: {viewingPatient._id?.slice(-8).toUpperCase() || viewingPatient.id}
                      </span>
                      <p className="text-[11px] font-bold text-slate-500 mt-2.5 uppercase tracking-widest">Date: {viewingPatient.lastVisit || new Date().toLocaleDateString('en-GB')}</p>
                    </div>
                  </div>

                  {/* Patient Info Table */}
                  <div className="border border-slate-300/80 rounded-xl overflow-hidden mb-8 shadow-sm">
                    <div className="grid grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-300/80">
                      <div className="p-4 bg-slate-50/50">
                         <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1.5">Child / Patient Name</p>
                         <p className="text-[15px] font-black text-slate-800">{viewingPatient.name}</p>
                      </div>
                      <div className="p-4 bg-slate-50/50">
                         <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1.5">Age / DOB</p>
                         <p className="text-[15px] font-bold text-slate-800">{viewingPatient.age} Years</p>
                      </div>
                      <div className="p-4 bg-slate-50/50 sm:border-t mt-[-1px] sm:mt-0 border-slate-300/80">
                         <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1.5">Parent / Guardian</p>
                         <p className="text-[15px] font-bold text-slate-800">{viewingPatient.parentName || 'N/A'}</p>
                      </div>
                      <div className="p-4 bg-slate-50/50 sm:border-t mt-[-1px] sm:mt-0 border-slate-300/80">
                         <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1.5">Emergency Contact</p>
                         <p className="text-[15px] font-bold text-slate-800">{viewingPatient.parentPhone || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Clinical Section */}
                  <div className="flex-1 flex flex-col gap-6 mt-4">
                    <div>
                      <h4 className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-2 mb-3">
                        <span className="w-1 h-1 rounded-full bg-slate-400"></span>
                        Therapy Program
                      </h4>
                      <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1 bg-slate-50/80 p-4 rounded-xl border border-slate-100">
                          <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1.5">Program Details</p>
                          <p className="text-[14px] font-bold text-slate-700">
                            {viewingPatient.therapyType && viewingPatient.therapyType.length > 0 
                                ? viewingPatient.therapyType.map(t => t.replace(/_/g, ' ')).join(', ').toUpperCase()
                                : (viewingPatient.condition?.toUpperCase() || 'UNSPECIFIED')}
                          </p>
                        </div>
                        {viewingPatient.totalFee && (
                          <div className="bg-slate-900 p-4 rounded-xl shadow-lg sm:min-w-[180px]">
                            <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1.5">Prescribed Fee</p>
                            <p className="text-[18px] font-black text-white">₹{viewingPatient.totalFee.toLocaleString()}</p>
                            <p className="text-[9px] font-bold text-slate-500 mt-1 uppercase">Standard Rate</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Signatures */}
                  <div className="mt-auto pt-16 flex justify-between items-end pb-3 border-b border-white">
                    <div className="text-center w-40">
                      <div className="border-t-2 border-slate-300"></div>
                      <p className="mt-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">Parent/Guardian Signature</p>
                    </div>
                    <div className="text-center w-48">
                      <div className="border-t-2 border-slate-800"></div>
                      <p className="mt-2 text-[9px] font-black text-slate-900 uppercase tracking-widest">Authorized Therapist</p>
                    </div>
                  </div>

                  <div className="mt-4 text-center">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Rehablito Electronic Medical Record • generated automatically</p>
                  </div>
                </div>

              </div>

              {/* Floating Action Bar (Hidden in Print) */}
              <div className="bg-slate-50 border-t border-slate-200 p-4 sm:p-5 flex items-center justify-end gap-3 shrink-0 rounded-b-2xl no-print">
                <button 
                  onClick={() => window.print()} 
                  className="flex justify-center items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black transition-all bg-white hover:bg-slate-100 text-slate-700 shadow-sm border border-slate-200" 
                >
                  <Download size={16} />
                  Download PDF
                </button>
                <button 
                  onClick={() => window.print()} 
                  className="flex justify-center items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black transition-all bg-slate-800 hover:bg-slate-900 text-white shadow-md shadow-slate-900/10" 
                >
                  <Printer size={16} />
                  Print Docket
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>, document.body)}

      <AddPatientModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        branches={branches}
        onSuccess={(newPatient) => {
          setPatients(prev => [
            {
              ...newPatient,
              id: newPatient._id,
              branch: newPatient.branchId?._id || newPatient.branchId,
              status: newPatient.status === 'active' ? 'Active' : 'Discharged'
            },
            ...prev
          ]);
        }} 
      />

      <AnimatePresence>
        {deletingPatient && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9990] bg-black/40 backdrop-blur-sm flex items-start justify-center pt-20 sm:pt-24 pb-8 overflow-y-auto px-4"
            onClick={() => setDeletingPatient(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.16 }}
              className="w-full max-w-[540px] rounded-xl bg-surface-container-lowest border border-outline-variant/20 shadow-2xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h4 className="text-lg font-extrabold text-on-surface">Delete Patient</h4>
                  <p className="text-sm text-on-surface-variant mt-1">This action cannot be undone.</p>
                </div>
                <button
                  onClick={() => setDeletingPatient(null)}
                  className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-low"
                  aria-label="Close delete patient modal"
                >
                  <X size={16} />
                </button>
              </div>

              <p className="text-sm text-on-surface-variant">
                Are you sure you want to remove
                <span className="font-bold text-on-surface"> {deletingPatient.name}</span>?
              </p>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setDeletingPatient(null)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-on-surface-variant border border-outline-variant/30 hover:text-on-surface hover:bg-surface-container-low transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeletePatient}
                  className="px-4 py-2 rounded-xl text-sm font-bold bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-200 transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingPatient && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-start justify-center pt-20 sm:pt-24 pb-8 overflow-y-auto px-4"
            onClick={() => setEditingPatient(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.16 }}
              className="w-full max-w-[540px] rounded-xl bg-surface-container-lowest border border-outline-variant/20 shadow-2xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                  <h4 className="text-lg font-extrabold text-on-surface">Edit Patient</h4>
                  <p className="text-sm text-on-surface-variant mt-1">Update patient details.</p>
                </div>
                <button
                  onClick={() => setEditingPatient(null)}
                  className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-low"
                  aria-label="Close edit patient modal"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={editingPatient.name}
                  onChange={(e) => setEditingPatient(prev => prev ? ({ ...prev, name: e.target.value }) : prev)}
                  className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl py-2.5 px-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/25"
                  placeholder="Full name"
                />
                <input
                  type="number"
                  min={1}
                  value={editingPatient.age || ''}
                  onChange={(e) => setEditingPatient(prev => prev ? ({ ...prev, age: Number(e.target.value) || 0 }) : prev)}
                  className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl py-2.5 px-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/25"
                  placeholder="Age"
                />
                <input
                  type="text"
                  value={editingPatient.condition}
                  onChange={(e) => setEditingPatient(prev => prev ? ({ ...prev, condition: e.target.value }) : prev)}
                  className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl py-2.5 px-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/25"
                  placeholder="Condition"
                />
                <select
                  value={editingPatient.branch}
                  onChange={(e) => setEditingPatient(prev => prev ? ({ ...prev, branch: e.target.value }) : prev)}
                  className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl py-2.5 px-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/25"
                >
                  <option value="">Select Branch</option>
                  {branches.map(branch => (
                    <option key={branch._id} value={branch._id}>{branch.name}</option>
                  ))}
                </select>
                <select
                  value={editingPatient.status}
                  onChange={(e) => setEditingPatient(prev => prev ? ({ ...prev, status: e.target.value as Patient['status'] }) : prev)}
                  className="sm:col-span-2 w-full bg-surface-container-low border border-outline-variant/30 rounded-xl py-2.5 px-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/25"
                >
                  <option value="Active">Active</option>
                  <option value="Discharged">Discharged</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setEditingPatient(null)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-on-surface-variant border border-outline-variant/30 hover:text-on-surface hover:bg-surface-container-low transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEditedPatient}
                  className="px-4 py-2 rounded-xl text-sm font-bold border border-primary/40 text-primary hover:bg-primary/10 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
