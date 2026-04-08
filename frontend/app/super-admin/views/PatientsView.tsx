import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Search, Plus, Filter, MoreVertical, FileText, X, Edit, CheckCircle2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// --- Types ---
interface Patient {
  id: string;
  name: string;
  age: number;
  condition: string;
  branch: string;
  status: 'Active' | 'Discharged' | 'Critical';
  lastVisit: string;
}

type PatientStatusFilter = 'All' | Patient['status'];

// --- Mock Data ---
const PATIENTS: Patient[] = [
  { id: 'PT-001', name: 'Aarav Gupta', age: 34, condition: 'Post-Op Rehab', branch: 'Mumbai', status: 'Active', lastVisit: '10 May 2026' },
  { id: 'PT-002', name: 'Riya Sharma', age: 10, condition: 'Autism Spectrum', branch: 'Delhi', status: 'Active', lastVisit: '09 May 2026' },
  { id: 'PT-003', name: 'Karan Desai', age: 65, condition: 'Knee Replacement', branch: 'Patna', status: 'Discharged', lastVisit: '25 Apr 2026' },
  { id: 'PT-004', name: 'Ananya Verma', age: 28, condition: 'Sports Injury', branch: 'Mumbai', status: 'Active', lastVisit: '11 May 2026' },
  { id: 'PT-005', name: 'Vihaan Singh', age: 8, condition: 'ADHD / Autism', branch: 'Delhi', status: 'Active', lastVisit: '08 May 2026' },
  { id: 'PT-006', name: 'Megha Rao', age: 45, condition: 'Stroke Paralysis', branch: 'Patna', status: 'Critical', lastVisit: '11 May 2026' },
];

export const PatientsView = () => {
  const [patients, setPatients] = useState<Patient[]>(PATIENTS);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<PatientStatusFilter>('All');
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deletingPatient, setDeletingPatient] = useState<Patient | null>(null);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
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

  const handleAddPatient = () => {
    if (!newPatient.name.trim() || !newPatient.condition.trim() || !newPatient.branch.trim() || newPatient.age <= 0) {
      return;
    }

    const highestId = patients.reduce((max, patient) => {
      const numericPart = Number(patient.id.replace('PT-', ''));
      return Number.isNaN(numericPart) ? max : Math.max(max, numericPart);
    }, 0);

    const id = `PT-${String(highestId + 1).padStart(3, '0')}`;
    setPatients(prev => [{ id, ...newPatient }, ...prev]);
    setIsAddModalOpen(false);
    resetPatientForm();
  };

  const handleDeletePatient = () => {
    if (!deletingPatient) return;
    setPatients(prev => prev.filter(patient => patient.id !== deletingPatient.id));
    setDeletingPatient(null);
  };

  const handleMarkDischarged = (id: string) => {
    setPatients(prev => prev.map(patient => (
      patient.id === id ? { ...patient, status: 'Discharged' } : patient
    )));
    setActiveMenu(null);
  };

  const handleSaveEditedPatient = () => {
    if (!editingPatient) return;
    if (!editingPatient.name.trim() || !editingPatient.condition.trim() || !editingPatient.branch.trim() || editingPatient.age <= 0) {
      return;
    }
    setPatients(prev => prev.map(patient => (patient.id === editingPatient.id ? editingPatient : patient)));
    setEditingPatient(null);
    setActiveMenu(null);
  };

  const filteredPatients = patients.filter(p => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">
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
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low/30">
                <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider opacity-70">Patient</th>
                <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider opacity-70">Age</th>
                <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider opacity-70">Condition</th>
                <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider opacity-70">Branch</th>
                <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider opacity-70">Last Visit</th>
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
                  className="hover:bg-surface-container-low/20 transition-colors group"
                >
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">{patient.name}</span>
                      <span className="text-[10px] text-on-surface-variant uppercase tracking-wider mt-0.5 opacity-60 font-bold">{patient.id}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-on-surface-variant">{patient.age} yrs</td>
                  <td className="px-6 py-4 text-sm font-medium text-on-surface-variant">{patient.condition}</td>
                  <td className="px-6 py-4 text-sm font-medium text-on-surface-variant">{patient.branch}</td>
                  <td className="px-6 py-4 text-sm text-on-surface-variant opacity-80">{patient.lastVisit}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-3 py-1.5 text-[10px] font-black rounded-lg uppercase tracking-wider",
                      patient.status === 'Active' && "bg-blue-50 text-blue-700",
                      patient.status === 'Discharged' && "bg-surface-container-low text-on-surface-variant",
                      patient.status === 'Critical' && "bg-error/10 text-error"
                    )}>
                      {patient.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="relative inline-block text-left">
                      <button
                        onClick={() => setActiveMenu(activeMenu === patient.id ? null : patient.id)}
                        className="p-2 hover:bg-surface-container-low rounded-lg text-on-surface-variant transition-colors"
                      >
                        <MoreVertical size={16} />
                      </button>

                      {activeMenu === patient.id && (
                        <div className="absolute right-0 mt-2 w-44 rounded-xl border border-outline-variant/20 bg-surface-container-lowest shadow-xl p-1.5 z-20">
                          <button
                            onClick={() => {
                              setEditingPatient(patient);
                            }}
                            className="w-full px-3 py-2 text-left text-sm rounded-lg text-on-surface-variant hover:bg-surface-container-low flex items-center gap-2"
                          >
                            <Edit size={14} />
                            Edit
                          </button>
                          {patient.status !== 'Discharged' && (
                            <button
                              onClick={() => handleMarkDischarged(patient.id)}
                              className="w-full px-3 py-2 text-left text-sm rounded-lg text-on-surface-variant hover:bg-surface-container-low flex items-center gap-2"
                            >
                              <CheckCircle2 size={14} />
                              Mark Discharged
                            </button>
                          )}
                          <button
                            onClick={() => {
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
            </tbody>
          </table>
          
          {filteredPatients.length === 0 && (
            <div className="p-10 text-center text-on-surface-variant opacity-60">
              No patients found.
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
              resetPatientForm();
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
              aria-label="Add patient"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                  <h4 className="text-lg font-extrabold text-on-surface">Add Patient</h4>
                  <p className="text-sm text-on-surface-variant mt-1">Create a new patient record.</p>
                </div>
                <button
                  onClick={() => {
                    setIsAddModalOpen(false);
                    resetPatientForm();
                  }}
                  className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-low"
                  aria-label="Close add patient modal"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={newPatient.name}
                  onChange={(e) => setNewPatient(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl py-2.5 px-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/25"
                  placeholder="Full name"
                />
                <input
                  type="number"
                  min={1}
                  value={newPatient.age || ''}
                  onChange={(e) => setNewPatient(prev => ({ ...prev, age: Number(e.target.value) || 0 }))}
                  className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl py-2.5 px-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/25"
                  placeholder="Age"
                />
                <input
                  type="text"
                  value={newPatient.condition}
                  onChange={(e) => setNewPatient(prev => ({ ...prev, condition: e.target.value }))}
                  className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl py-2.5 px-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/25"
                  placeholder="Condition"
                />
                <input
                  type="text"
                  value={newPatient.branch}
                  onChange={(e) => setNewPatient(prev => ({ ...prev, branch: e.target.value }))}
                  className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl py-2.5 px-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/25"
                  placeholder="Branch"
                />
                <select
                  value={newPatient.status}
                  onChange={(e) => setNewPatient(prev => ({ ...prev, status: e.target.value as Patient['status'] }))}
                  className="sm:col-span-2 w-full bg-surface-container-low border border-outline-variant/30 rounded-xl py-2.5 px-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/25"
                >
                  <option value="Active">Active</option>
                  <option value="Discharged">Discharged</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setIsAddModalOpen(false);
                    resetPatientForm();
                  }}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-on-surface-variant border border-outline-variant/30 hover:text-on-surface hover:bg-surface-container-low transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddPatient}
                  disabled={!newPatient.name.trim() || !newPatient.condition.trim() || !newPatient.branch.trim() || newPatient.age <= 0}
                  className="px-4 py-2 rounded-xl text-sm font-bold bg-primary text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Add Patient
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deletingPatient && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setDeletingPatient(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.16 }}
              className="w-full max-w-md rounded-2xl bg-surface-container-lowest border border-outline-variant/20 shadow-2xl p-6"
              role="dialog"
              aria-modal="true"
              aria-label="Delete patient"
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
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setEditingPatient(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.16 }}
              className="w-full max-w-lg rounded-2xl bg-surface-container-lowest border border-outline-variant/20 shadow-2xl p-6"
              role="dialog"
              aria-modal="true"
              aria-label="Edit patient"
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
                <input
                  type="text"
                  value={editingPatient.branch}
                  onChange={(e) => setEditingPatient(prev => prev ? ({ ...prev, branch: e.target.value }) : prev)}
                  className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl py-2.5 px-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/25"
                  placeholder="Branch"
                />
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
