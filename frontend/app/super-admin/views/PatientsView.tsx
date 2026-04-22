import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Search, Plus, Filter, MoreVertical, FileText, X, Edit, CheckCircle2, Trash2, Eye, Download, CreditCard, MapPin, User, Phone, Activity, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { toast } from 'sonner';
import { AddPatientModal } from '../components/AddPatientModal';
import { useBranch } from '../components/BranchContext';
import { useAddTransaction } from '../components/AddTransactionContext';
import { generatePatientPDF } from '@/app/manager/lib/generatePatientPDF';

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
            className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
            onClick={() => setViewingPatient(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.97 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-xl rounded-2xl flex flex-col overflow-hidden max-h-[92vh]"
              style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* PDF-style header band */}
              <div className="bg-[#004aad] px-6 py-5 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-xl overflow-hidden flex items-center justify-center shrink-0">
                    <img src="/logo.jpeg" alt="Rehablito" className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <p className="text-white font-extrabold text-base leading-tight">REHABLITO</p>
                    <p className="text-blue-200 text-[10px] font-medium">Physio & Autism Center</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-blue-200 text-[10px]">{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                  <p className="text-blue-100 text-[10px] font-mono">{viewingPatient._id?.slice(-8).toUpperCase() || viewingPatient.id}</p>
                </div>
                <button onClick={() => setViewingPatient(null)} className="ml-4 p-1.5 hover:bg-white/20 rounded-lg transition-colors">
                  <X size={18} className="text-white" />
                </button>
              </div>

              {/* Title strip */}
              <div className="bg-blue-50 px-6 py-2.5 border-b border-blue-100 shrink-0">
                <p className="text-[#004aad] font-extrabold text-xs uppercase tracking-widest text-center">Patient Registration Record</p>
              </div>

              {/* Body */}
              <div className="overflow-y-auto flex-1 bg-white">
                {/* Section header */}
                <div className="bg-blue-50 border-b border-blue-100 px-6 py-2">
                  <p className="text-[#004aad] font-bold text-[10px] uppercase tracking-widest">Patient Information</p>
                </div>

                {/* Info rows - only admin-relevant fields */}
                {[
                  { label: 'Patient ID',        value: viewingPatient._id?.slice(-8).toUpperCase() || viewingPatient.id || '—', mono: true },
                  { label: 'Child Name',         value: viewingPatient.name },
                  { label: 'Parent / Guardian',  value: viewingPatient.parentName || '—' },
                  { label: 'Phone Contact',      value: viewingPatient.parentPhone || '—' },
                  { label: 'Service / Therapy',  value: viewingPatient.therapyType?.map(t => t.replace(/_/g, ' ')).join(', ') || '—' },
                  { label: 'Branch',             value: branches.find(b => b._id === viewingPatient.branch)?.name || '—' },
                  { label: 'Address',            value: viewingPatient.address || '—' },
                  { label: 'Onboarding Date',    value: viewingPatient.lastVisit || '—' },
                  { label: 'Status',             value: viewingPatient.status, badge: true },
                ].map((row, i) => (
                  <div key={row.label} className={cn('grid grid-cols-2 px-6 py-2.5', i % 2 === 0 ? 'bg-blue-50/40' : 'bg-white')}>
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">{row.label}</span>
                    {row.badge
                      ? <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full w-fit',
                          viewingPatient.status === 'Active' ? 'bg-green-50 text-green-600' :
                          viewingPatient.status === 'Discharged' ? 'bg-gray-100 text-gray-500' :
                          'bg-red-50 text-red-500')}>{row.value}</span>
                      : <span className={cn('text-xs font-semibold text-gray-800', row.mono && 'font-mono text-[#004aad]')}>{row.value}</span>
                    }
                  </div>
                ))}

                {/* Diagnosis */}
                <div className="bg-blue-50 border-y border-blue-100 px-6 py-2">
                  <p className="text-[#004aad] font-bold text-[10px] uppercase tracking-widest">Clinical Notes / Diagnosis</p>
                </div>
                <div className="px-6 py-3 bg-white">
                  <p className="text-xs text-gray-700 leading-relaxed">{viewingPatient.condition || 'No diagnosis recorded.'}</p>
                </div>

                {/* Fee */}
                {viewingPatient.totalFee !== undefined && (
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                    <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm w-fit">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Total Fee</p>
                      <p className="text-lg font-extrabold text-[#004aad]">₹{(viewingPatient.totalFee || 0).toLocaleString()}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* PDF-style footer */}
              <div className="bg-[#004aad] px-6 py-3 flex items-center justify-between shrink-0">
                <p className="text-blue-200 text-[9px]">Rehablito Physio & Autism Center — Confidential</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setViewingPatient(null)}
                    className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={async () => {
                      const p = viewingPatient;
                      const branchName = branches.find(b => b._id === p.branch)?.name || '';
                      const doc = await generatePatientPDF({
                        id: p._id || p.id || '',
                        patientId: p._id?.slice(-8).toUpperCase() || p.id || '',
                        name: p.name,
                        parentName: p.parentName,
                        age: p.age,
                        gender: '',
                        therapyType: p.therapyType?.[0] || '',
                        condition: p.condition || '',
                        address: p.address,
                        phone: p.parentPhone || '',
                        onboardedAt: p.lastVisit || new Date().toISOString(),
                        branchName,
                      }, 'Patient Registration Record');
                      doc.save(`Patient_${p.name.replace(/\s/g, '_')}.pdf`);
                    }}
                    className="px-4 py-1.5 rounded-lg bg-white text-[#004aad] text-xs font-bold flex items-center gap-1.5 hover:bg-blue-50 transition-colors"
                  >
                    <Download size={13} /> Download PDF
                  </button>
                </div>
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
            className="fixed inset-0 z-[99999] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
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
                <button onClick={() => setEditingPatient(null)} className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-low">
                  <X size={16} />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input type="text" value={editingPatient.name}
                  onChange={(e) => setEditingPatient(prev => prev ? ({ ...prev, name: e.target.value }) : prev)}
                  className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl py-2.5 px-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/25"
                  placeholder="Full name" />
                <input type="number" min={1} value={editingPatient.age || ''}
                  onChange={(e) => setEditingPatient(prev => prev ? ({ ...prev, age: Number(e.target.value) || 0 }) : prev)}
                  className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl py-2.5 px-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/25"
                  placeholder="Age" />
                <input type="text" value={editingPatient.condition}
                  onChange={(e) => setEditingPatient(prev => prev ? ({ ...prev, condition: e.target.value }) : prev)}
                  className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl py-2.5 px-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/25"
                  placeholder="Condition" />
                <select value={editingPatient.branch}
                  onChange={(e) => setEditingPatient(prev => prev ? ({ ...prev, branch: e.target.value }) : prev)}
                  className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl py-2.5 px-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/25">
                  <option value="">Select Branch</option>
                  {branches.map(branch => (
                    <option key={branch._id} value={branch._id}>{branch.name}</option>
                  ))}
                </select>
                <select value={editingPatient.status}
                  onChange={(e) => setEditingPatient(prev => prev ? ({ ...prev, status: e.target.value as Patient['status'] }) : prev)}
                  className="sm:col-span-2 w-full bg-surface-container-low border border-outline-variant/30 rounded-xl py-2.5 px-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/25">
                  <option value="Active">Active</option>
                  <option value="Discharged">Discharged</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button onClick={() => setEditingPatient(null)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-on-surface-variant border border-outline-variant/30 hover:text-on-surface hover:bg-surface-container-low transition-colors">
                  Cancel
                </button>
                <button onClick={handleSaveEditedPatient}
                  className="px-4 py-2 rounded-xl text-sm font-bold border border-primary/40 text-primary hover:bg-primary/10 transition-colors">
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
