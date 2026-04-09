import React, { useState } from 'react';
import { Search, Plus, Filter, UserCog, Edit, Trash2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'motion/react';

interface Staff {
  id: string;
  name: string;
  role: string;
  department: string;
  branch: string;
  status: 'Active' | 'On Leave' | 'Inactive';
}

type StaffStatusFilter = 'All' | Staff['status'];

const INITIAL_STAFF: Staff[] = [
  { id: 'EMP-001', name: 'Dr. Sameer Khan', role: 'Senior Therapist', department: 'Physiotherapy', branch: 'Mumbai', status: 'Active' },
  { id: 'EMP-002', name: 'Alia Bhattacharya', role: 'Behavioral Expert', department: 'Autism Center', branch: 'Delhi', status: 'Active' },
  { id: 'EMP-003', name: 'Rohan Mehta', role: 'Junior Therapist', department: 'Physiotherapy', branch: 'Mumbai', status: 'On Leave' },
  { id: 'EMP-004', name: 'Kritika Singh', role: 'Receptionist', department: 'Admin', branch: 'Patna', status: 'Active' },
  { id: 'EMP-005', name: 'Dr. Anita Desai', role: 'Consultant', department: 'Autism Center', branch: 'Patna', status: 'Inactive' },
];

export const StaffView = () => {
  const [staffList, setStaffList] = useState<Staff[]>(INITIAL_STAFF);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StaffStatusFilter>('All');
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [deletingStaff, setDeletingStaff] = useState<Staff | null>(null);
  const [editedRole, setEditedRole] = useState('');
  const [newStaff, setNewStaff] = useState<Omit<Staff, 'id'>>({
    name: '',
    role: '',
    department: '',
    branch: '',
    status: 'Active'
  });

  const resetNewStaffForm = () => {
    setNewStaff({
      name: '',
      role: '',
      department: '',
      branch: '',
      status: 'Active'
    });
  };

  const handleAddStaff = () => {
    if (!newStaff.name.trim() || !newStaff.role.trim() || !newStaff.department.trim() || !newStaff.branch.trim()) {
      return;
    }

    const highestId = staffList.reduce((max, member) => {
      const numericPart = Number(member.id.replace('EMP-', ''));
      return Number.isNaN(numericPart) ? max : Math.max(max, numericPart);
    }, 0);

    const id = `EMP-${String(highestId + 1).padStart(3, '0')}`;

    setStaffList(prev => [{ id, ...newStaff }, ...prev]);
    setIsAddModalOpen(false);
    resetNewStaffForm();
  };

  const openDeleteModal = (id: string) => {
    const member = staffList.find(s => s.id === id);
    if (!member) return;
    setDeletingStaff(member);
  };

  const openEditModal = (id: string) => {
    const member = staffList.find(s => s.id === id);
    if (!member) return;
    setEditedRole(member.role);
    setEditingStaff(member);
  };

  const handleDeleteStaff = () => {
    if (!deletingStaff) return;
    setStaffList(prev => prev.filter(member => member.id !== deletingStaff.id));
    setDeletingStaff(null);
  };

  const handleEditStaff = () => {
    if (!editingStaff || !editedRole.trim()) return;
    setStaffList(prev =>
      prev.map(s => (s.id === editingStaff.id ? { ...s, role: editedRole.trim() } : s))
    );
    setEditingStaff(null);
    setEditedRole('');
  };

  const filteredStaff = staffList.filter(s => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/10">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary rounded-xl text-white shadow-sm shadow-primary/25">
            <UserCog size={20} />
          </div>
          <div>
            <h3 className="text-xl font-bold font-headline text-on-surface">Staff Directory</h3>
            <p className="text-xs text-on-surface-variant font-medium opacity-60">Manage employee records and roles</p>
          </div>
        </div>
        
        <div className="flex w-full sm:w-auto items-center gap-3">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/50" size={18} />
            <input 
              type="text" 
              placeholder="Search staff, roles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64 bg-surface-container-low/50 border border-outline-variant/20 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all text-on-surface"
            />
          </div>
          <div className="relative">
            <button
              onClick={() => setIsFilterMenuOpen(prev => !prev)}
              className="p-2.5 border border-outline-variant/20 rounded-xl text-on-surface-variant hover:bg-surface-container-low transition-colors"
              aria-label="Filter staff"
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
                  {(['All', 'Active', 'On Leave', 'Inactive'] as StaffStatusFilter[]).map((option) => (
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
            <span className="hidden sm:inline">Add Staff</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low/30 border-b border-outline-variant/10">
                <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider opacity-70">Employee</th>
                <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider opacity-70">Role</th>
                <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider opacity-70">Department</th>
                <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider opacity-70">Branch</th>
                <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider opacity-70">Status</th>
                <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider opacity-70 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-low/50">
              {filteredStaff.map((staff) => (
                <motion.tr 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  key={staff.id} 
                  className="hover:bg-surface-container-low/20 transition-colors group"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center font-bold text-on-surface-variant/70 text-sm">
                        {staff.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">{staff.name}</span>
                        <span className="text-[10px] text-on-surface-variant uppercase tracking-wider mt-0.5 opacity-60 font-bold">{staff.id}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-on-surface-variant">{staff.role}</td>
                  <td className="px-6 py-4 text-sm font-medium text-on-surface-variant">
                    <span className="px-3 py-1 bg-surface-container-low rounded-lg text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                      {staff.department}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-on-surface-variant">{staff.branch}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-3 py-1.5 text-[10px] font-black rounded-lg uppercase tracking-wider",
                      staff.status === 'Active' && "bg-green-50 text-green-700",
                      staff.status === 'On Leave' && "bg-amber-50 text-amber-700",
                      staff.status === 'Inactive' && "bg-surface-container-low text-on-surface-variant"
                    )}>
                      {staff.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-100">
                      <button
                        onClick={() => openEditModal(staff.id)}
                        aria-label={`Edit ${staff.name}`}
                        className="p-2 hover:bg-surface-container-low rounded-lg text-primary transition-colors"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => openDeleteModal(staff.id)}
                        aria-label={`Delete ${staff.name}`}
                        className="p-2 hover:bg-error/10 rounded-lg text-error transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          
          {filteredStaff.length === 0 && (
            <div className="p-10 text-center text-on-surface-variant opacity-60">
              No staff found.
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
              resetNewStaffForm();
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
              aria-label="Add staff member"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                  <h4 className="text-lg font-extrabold text-on-surface">Add Staff Member</h4>
                  <p className="text-sm text-on-surface-variant mt-1">Create a new employee record.</p>
                </div>
                <button
                  onClick={() => {
                    setIsAddModalOpen(false);
                    resetNewStaffForm();
                  }}
                  className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-low"
                  aria-label="Close add staff modal"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={newStaff.name}
                  onChange={(e) => setNewStaff(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl py-2.5 px-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/25"
                  placeholder="Full name"
                />
                <input
                  type="text"
                  value={newStaff.role}
                  onChange={(e) => setNewStaff(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl py-2.5 px-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/25"
                  placeholder="Role"
                />
                <input
                  type="text"
                  value={newStaff.department}
                  onChange={(e) => setNewStaff(prev => ({ ...prev, department: e.target.value }))}
                  className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl py-2.5 px-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/25"
                  placeholder="Department"
                />
                <input
                  type="text"
                  value={newStaff.branch}
                  onChange={(e) => setNewStaff(prev => ({ ...prev, branch: e.target.value }))}
                  className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl py-2.5 px-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/25"
                  placeholder="Branch"
                />
                <select
                  value={newStaff.status}
                  onChange={(e) => setNewStaff(prev => ({ ...prev, status: e.target.value as Staff['status'] }))}
                  className="sm:col-span-2 w-full bg-surface-container-low border border-outline-variant/30 rounded-xl py-2.5 px-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/25"
                >
                  <option value="Active">Active</option>
                  <option value="On Leave">On Leave</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setIsAddModalOpen(false);
                    resetNewStaffForm();
                  }}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-on-surface-variant border border-outline-variant/30 hover:text-on-surface hover:bg-surface-container-low transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddStaff}
                  disabled={!newStaff.name.trim() || !newStaff.role.trim() || !newStaff.department.trim() || !newStaff.branch.trim()}
                  className="px-4 py-2 rounded-xl text-sm font-bold bg-primary text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Add Staff
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingStaff && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => {
              setEditingStaff(null);
              setEditedRole('');
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.16 }}
              className="w-full max-w-md rounded-2xl bg-surface-container-lowest border border-outline-variant/20 shadow-2xl p-6"
              role="dialog"
              aria-modal="true"
              aria-label="Edit staff member"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                  <h4 className="text-lg font-extrabold text-on-surface">Edit Staff Role</h4>
                  <p className="text-sm text-on-surface-variant mt-1">Update role for {editingStaff.name}.</p>
                </div>
                <button
                  onClick={() => {
                    setEditingStaff(null);
                    setEditedRole('');
                  }}
                  className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-low"
                  aria-label="Close edit modal"
                >
                  <X size={16} />
                </button>
              </div>

              <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">
                Role
              </label>
              <input
                type="text"
                value={editedRole}
                onChange={(e) => setEditedRole(e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl py-2.5 px-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/40"
                placeholder="Enter staff role"
              />

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setEditingStaff(null);
                    setEditedRole('');
                  }}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-on-surface-variant border border-outline-variant/30 hover:text-on-surface hover:bg-surface-container-low transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditStaff}
                  disabled={!editedRole.trim()}
                  className="px-4 py-2 rounded-xl text-sm font-bold border border-primary/40 text-primary hover:bg-primary/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deletingStaff && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setDeletingStaff(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.16 }}
              className="w-full max-w-md rounded-2xl bg-surface-container-lowest border border-outline-variant/20 shadow-2xl p-6"
              role="dialog"
              aria-modal="true"
              aria-label="Delete staff member"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h4 className="text-lg font-extrabold text-on-surface">Delete Staff Member</h4>
                  <p className="text-sm text-on-surface-variant mt-1">This action cannot be undone.</p>
                </div>
                <button
                  onClick={() => setDeletingStaff(null)}
                  className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-low"
                  aria-label="Close delete modal"
                >
                  <X size={16} />
                </button>
              </div>

              <p className="text-sm text-on-surface-variant">
                Are you sure you want to remove
                <span className="font-bold text-on-surface"> {deletingStaff.name}</span>?
              </p>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setDeletingStaff(null)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-on-surface-variant border border-outline-variant/30 hover:text-on-surface hover:bg-surface-container-low transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteStaff}
                  className="px-4 py-2 rounded-xl text-sm font-bold bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-200 transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
