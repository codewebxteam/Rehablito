import React, { useEffect, useState } from 'react';
import { Search, Plus, Filter, UserCog, Edit, Trash2, X, UsersRound, UserCheck, UserMinus, Eye, EyeOff, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'motion/react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useBranch } from '../components/BranchContext';
import { Pagination } from '../components/Pagination';

type StaffRole = 'staff' | 'branch_manager';

interface Staff {
  _id: string;
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  staffId?: string;
  mobileNumber?: string;
  branch: string;
  status: 'Active' | 'On Leave' | 'Inactive';
}

type StaffStatusFilter = 'All' | Staff['status'];

interface Branch {
  _id: string;
  name: string;
}

interface ApiStaff {
  _id: string;
  name: string;
  email: string;
  role: StaffRole;
  staffId?: string;
  mobileNumber?: string;
  branchId?: { _id: string; name: string } | null;
}

interface NewStaffForm {
  name: string;
  email: string;
  password: string;
  role: StaffRole;
  branch: string;
  staffId: string;
  mobileNumber: string;
}

const INITIAL_FORM: NewStaffForm = {
  name: '',
  email: '',
  password: '',
  role: 'staff',
  branch: '',
  staffId: '',
  mobileNumber: '',
};

const roleLabel = (role: StaffRole) => (role === 'branch_manager' ? 'Branch Manager' : 'Staff');

export const StaffView = ({ initialData }: { initialData?: any }) => {
  const transformApiStaff = (data: ApiStaff[]): Staff[] => data.map((s: ApiStaff) => ({
    _id: s._id,
    id: s._id,
    name: s.name,
    email: s.email,
    role: s.role,
    staffId: s.staffId,
    mobileNumber: s.mobileNumber,
    branch: s.branchId?._id || '',
    status: 'Active' as const,
  }));

  const hasServerData = !!initialData;
  const { selectedBranchId } = useBranch();
  const [staffList, setStaffList] = useState<Staff[]>(
    hasServerData && Array.isArray(initialData?.staff) ? transformApiStaff(initialData.staff) : []
  );
  const [branches, setBranches] = useState<Branch[]>(initialData?.branches || []);
  const [isLoading, setIsLoading] = useState(!hasServerData);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StaffStatusFilter>('All');
  const [roleFilter, setRoleFilter] = useState<StaffRole | 'All'>('All');
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<NewStaffForm>(INITIAL_FORM);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [editForm, setEditForm] = useState<NewStaffForm>(INITIAL_FORM);
  const [showAddPass, setShowAddPass] = useState(false);
  const [showEditPass, setShowEditPass] = useState(false);
  const [deletingStaff, setDeletingStaff] = useState<Staff | null>(null);
  const [page, setPage] = useState(1);
  const PER_PAGE = 10;

  const resetForm = () => setForm(INITIAL_FORM);
  const closeModal = () => {
    setIsAddModalOpen(false);
    setShowAddPass(false);
    resetForm();
  };

  const openEdit = (s: Staff) => {
    setEditingStaff(s);
    setEditForm({
      name: s.name,
      email: s.email,
      password: '',
      role: s.role,
      branch: s.branch,
      staffId: s.staffId || '',
      mobileNumber: s.mobileNumber || '',
    });
  };

  const closeEdit = () => {
    setEditingStaff(null);
    setShowEditPass(false);
    setEditForm(INITIAL_FORM);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const branchParam = selectedBranchId ? `?branch=${selectedBranchId}` : '';
        const [staffRes, branchRes] = await Promise.all([
          api.get(`/admin/staff${branchParam}`),
          api.get('/admin/branches'),
        ]);

        if (branchRes.data.success && branchRes.data.data) {
          setBranches(branchRes.data.data);
        }

        if (staffRes.data.success) {
          setStaffList(transformApiStaff(staffRes.data.data));
        }
      } catch (err) {
        console.error('Failed to fetch staff:', err);
        toast.error('Failed to load staff');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [selectedBranchId]);

  const handleAddStaff = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.password.trim() || !form.branch) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload: Record<string, unknown> = {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
        branchId: form.branch,
      };
      if (form.staffId.trim()) payload.staffId = form.staffId.trim();
      if (form.mobileNumber.trim()) payload.mobileNumber = form.mobileNumber.trim();

      const { data } = await api.post('/admin/staff', payload);
      if (data.success) {
        toast.success('Staff added successfully');
        const s: ApiStaff = data.data;
        setStaffList(prev => [{
          _id: s._id,
          id: s._id,
          name: s.name,
          email: s.email,
          role: s.role,
          staffId: s.staffId,
          mobileNumber: s.mobileNumber,
          branch: s.branchId?._id || form.branch,
          status: 'Active',
        }, ...prev]);
        closeModal();
      }
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      toast.error(axiosError?.response?.data?.message || 'Failed to add staff');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditStaff = async () => {
    if (!editingStaff) return;
    if (!editForm.name.trim() || !editForm.email.trim() || !editForm.branch) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (editForm.password && editForm.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload: Record<string, unknown> = {
        name: editForm.name.trim(),
        email: editForm.email.trim(),
        role: editForm.role,
        branchId: editForm.branch,
        staffId: editForm.staffId.trim() || undefined,
        mobileNumber: editForm.mobileNumber.trim() || undefined,
      };
      if (editForm.password) payload.password = editForm.password;

      const { data } = await api.put(`/admin/staff/${editingStaff._id}`, payload);
      if (data.success) {
        toast.success('Staff updated');
        const s: ApiStaff = data.data;
        setStaffList(prev => prev.map(row => row._id === editingStaff._id ? {
          ...row,
          name: s.name,
          email: s.email,
          role: s.role,
          staffId: s.staffId,
          mobileNumber: s.mobileNumber,
          branch: s.branchId?._id || editForm.branch,
        } : row));
        closeEdit();
      }
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      toast.error(axiosError?.response?.data?.message || 'Failed to update staff');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteStaff = async () => {
    if (!deletingStaff) return;
    try {
      const { data } = await api.delete(`/admin/staff/${deletingStaff._id}`);
      if (data.success) {
        toast.success('Staff deleted');
        setStaffList(prev => prev.filter(s => s._id !== deletingStaff._id));
        setDeletingStaff(null);
      }
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      toast.error(axiosError?.response?.data?.message || 'Failed to delete staff');
    }
  };

  const filteredStaff = staffList.filter(s => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      s.name.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      (s.staffId?.toLowerCase().includes(q) ?? false);
    const matchesStatus = statusFilter === 'All' || s.status === statusFilter;
    const matchesRole = roleFilter === 'All' || s.role === roleFilter;
    return matchesSearch && matchesStatus && matchesRole;
  });

  const pagedStaff = filteredStaff.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const totalStaff = staffList.length;
  const branchManagers = staffList.filter(s => s.role === 'branch_manager').length;
  const activeStaff = staffList.filter(s => s.status === 'Active').length;
  const inactiveStaff = staffList.filter(s => s.status === 'Inactive').length;

  return (
    <div className="w-full space-y-4 sm:space-y-6 lg:space-y-8 pb-6 lg:pb-10">
      {/* KPI Cards Area */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {/* Total Staff */}
        <div 
          onClick={() => { setStatusFilter('All'); setRoleFilter('All'); }}
          className={cn(
             "bg-surface-container-lowest p-5 rounded-xl border hover:-translate-y-1 hover:shadow-md hover:border-primary/30 transition-all duration-200 cursor-pointer group relative",
             statusFilter === 'All' && roleFilter === 'All' ? 'border-primary/40 shadow-sm' : 'border-outline-variant/10'
          )}
        >
          {isLoading ? (
             <div className="h-24 animate-pulse bg-surface-container-low rounded-lg" />
          ) : (
            <>
              <div className="flex items-start justify-between mb-3">
                <div className="p-2.5 rounded-lg bg-blue-50 group-hover:bg-blue-600 transition-colors duration-300">
                  <UsersRound className="text-blue-600 group-hover:text-white transition-colors duration-300" size={20} />
                </div>
              </div>
              <p className="text-on-surface-variant text-[10px] uppercase tracking-wider mb-1 font-bold">Total Staff</p>
              <h3 className="text-2xl font-black font-headline text-on-surface">{totalStaff}</h3>
              <p className="text-on-surface-variant/70 text-xs mt-2 flex items-center gap-1 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                Across {branches.length || 0} branches
              </p>
            </>
          )}
        </div>

        {/* Branch Managers */}
        <div 
          onClick={() => { setStatusFilter('All'); setRoleFilter('branch_manager'); }}
          className={cn(
             "bg-surface-container-lowest p-5 rounded-xl border hover:-translate-y-1 hover:shadow-md hover:border-primary/30 transition-all duration-200 cursor-pointer group relative",
             roleFilter === 'branch_manager' ? 'border-indigo-400 shadow-sm' : 'border-outline-variant/10'
          )}
        >
          {isLoading ? (
             <div className="h-24 animate-pulse bg-surface-container-low rounded-lg" />
          ) : (
            <>
              <div className="flex items-start justify-between mb-3">
                <div className="p-2.5 rounded-lg bg-indigo-50 group-hover:bg-indigo-600 transition-colors duration-300">
                  <UserCog className="text-indigo-600 group-hover:text-white transition-colors duration-300" size={20} />
                </div>
              </div>
              <p className="text-on-surface-variant text-[10px] uppercase tracking-wider mb-1 font-bold">Branch Managers</p>
              <h3 className="text-2xl font-black font-headline text-on-surface">{branchManagers}</h3>
              <p className="text-on-surface-variant/70 text-xs mt-2 flex items-center gap-1 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                Leadership team
              </p>
            </>
          )}
        </div>

        {/* Active Staff */}
        <div 
          onClick={() => { setStatusFilter('Active'); setRoleFilter('All'); }}
          className={cn(
             "bg-surface-container-lowest p-5 rounded-xl border hover:-translate-y-1 hover:shadow-md hover:border-primary/30 transition-all duration-200 cursor-pointer group relative",
             statusFilter === 'Active' ? 'border-emerald-400 shadow-sm' : 'border-outline-variant/10'
          )}
        >
          {isLoading ? (
             <div className="h-24 animate-pulse bg-surface-container-low rounded-lg" />
          ) : (
            <>
              <div className="flex items-start justify-between mb-3">
                <div className="p-2.5 rounded-lg bg-emerald-50 group-hover:bg-emerald-600 transition-colors duration-300">
                  <UserCheck className="text-emerald-600 group-hover:text-white transition-colors duration-300" size={20} />
                </div>
              </div>
              <p className="text-on-surface-variant text-[10px] uppercase tracking-wider mb-1 font-bold">Active Staff</p>
              <h3 className="text-2xl font-black font-headline text-on-surface">{activeStaff}</h3>
              <p className="text-on-surface-variant/70 text-xs mt-2 flex items-center gap-1 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Currently active
              </p>
            </>
          )}
        </div>

        {/* Inactive Staff */}
        <div 
          onClick={() => { setStatusFilter('Inactive'); setRoleFilter('All'); }}
          className={cn(
             "bg-surface-container-lowest p-5 rounded-xl border hover:-translate-y-1 hover:shadow-md hover:border-primary/30 transition-all duration-200 cursor-pointer group relative",
             statusFilter === 'Inactive' ? 'border-rose-400 shadow-sm' : 'border-outline-variant/10'
          )}
        >
          {isLoading ? (
             <div className="h-24 animate-pulse bg-surface-container-low rounded-lg" />
          ) : (
            <>
              <div className="flex items-start justify-between mb-3">
                <div className="p-2.5 rounded-lg bg-rose-50 group-hover:bg-rose-600 transition-colors duration-300">
                  <UserMinus className="text-rose-600 group-hover:text-white transition-colors duration-300" size={20} />
                </div>
              </div>
              <p className="text-on-surface-variant text-[10px] uppercase tracking-wider mb-1 font-bold">Inactive Staff</p>
              <h3 className="text-2xl font-black font-headline text-on-surface">{inactiveStaff}</h3>
              <p className="text-on-surface-variant/70 text-xs mt-2 flex items-center gap-1 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                Needs attention
              </p>
            </>
          )}
        </div>
      </motion.div>

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
              placeholder="Search staff, email, ID..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
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
                        setPage(1);
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
        {isLoading ? (
          <div className="h-80 flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin mx-auto mb-4"></div>
              <p className="text-on-surface-variant">Loading staff...</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low/30 border-b border-outline-variant/10">
                  <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider opacity-70">Employee</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider opacity-70">Role</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider opacity-70">Email</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider opacity-70">Branch</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider opacity-70">Status</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider opacity-70 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-low/50">
                {pagedStaff.map((staff) => (
                  <motion.tr
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    key={staff.id}
                    className="hover:bg-surface-container-low/20 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center font-bold text-on-surface-variant/70 text-sm">
                          {staff.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">{staff.name}</span>
                          <span className="text-[10px] text-on-surface-variant uppercase tracking-wider mt-0.5 opacity-60 font-bold">{staff.staffId || staff._id.slice(-8)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-on-surface-variant">{roleLabel(staff.role)}</td>
                    <td className="px-6 py-4 text-sm font-medium text-on-surface-variant">{staff.email}</td>
                    <td className="px-6 py-4 text-sm font-medium text-on-surface-variant">
                      {branches.find(b => b._id === staff.branch)?.name || 'Unknown'}
                    </td>
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
                          onClick={() => openEdit(staff)}
                          aria-label={`Edit ${staff.name}`}
                          className="p-2 hover:bg-surface-container-low rounded-lg text-primary transition-colors"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => setDeletingStaff(staff)}
                          aria-label={`Delete ${staff.name}`}
                          className="p-2 hover:bg-error/10 rounded-lg text-error transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
                {filteredStaff.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-10 text-center text-on-surface-variant opacity-60">
                      No staff found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        <Pagination total={filteredStaff.length} page={page} perPage={PER_PAGE} onChange={p => setPage(p)} />
      </div>

      <AnimatePresence>
        {isAddModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.16 }}
              className="w-full max-w-lg rounded-2xl bg-surface-container-lowest border border-outline-variant/20 shadow-2xl p-6 max-h-[90vh] overflow-y-auto"
              role="dialog"
              aria-modal="true"
              aria-label="Add staff member"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                  <h4 className="text-lg font-extrabold text-on-surface">Add Staff Member</h4>
                  <p className="text-sm text-on-surface-variant mt-1">Create a new employee account.</p>
                </div>
                <button
                  onClick={closeModal}
                  className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-low"
                  aria-label="Close add staff modal"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                  className="sm:col-span-2 w-full bg-surface-container-low border border-outline-variant/30 rounded-xl py-2.5 px-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/25"
                  placeholder="Full name *"
                />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl py-2.5 px-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/25"
                  placeholder="Email *"
                />
                <div className="relative">
                  <input
                    type={showAddPass ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => setForm(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl py-2.5 pl-3 pr-10 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/25"
                    placeholder="Password * (min 6 chars)"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAddPass(!showAddPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40 hover:text-on-surface transition-colors"
                  >
                    {showAddPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <div className="relative">
                  <select
                    value={form.role}
                    onChange={(e) => setForm(prev => ({ ...prev, role: e.target.value as StaffRole }))}
                    className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl py-2.5 pl-3 pr-10 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/25 appearance-none cursor-pointer"
                  >
                    <option value="staff">Staff</option>
                    <option value="branch_manager">Branch Manager</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40 pointer-events-none" size={16} />
                </div>
                <div className="relative">
                  <select
                    value={form.branch}
                    onChange={(e) => setForm(prev => ({ ...prev, branch: e.target.value }))}
                    className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl py-2.5 pl-3 pr-10 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/25 appearance-none cursor-pointer"
                  >
                    <option value="">Select branch *</option>
                    {branches.map(b => (
                      <option key={b._id} value={b._id}>{b.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40 pointer-events-none" size={16} />
                </div>
                <input
                  type="text"
                  value={form.staffId}
                  onChange={(e) => setForm(prev => ({ ...prev, staffId: e.target.value }))}
                  className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl py-2.5 px-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/25"
                  placeholder="Staff ID"
                />
                <input
                  type="tel"
                  value={form.mobileNumber}
                  onChange={(e) => setForm(prev => ({ ...prev, mobileNumber: e.target.value }))}
                  className="sm:col-span-2 w-full bg-surface-container-low border border-outline-variant/30 rounded-xl py-2.5 px-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/25"
                  placeholder="Mobile number"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-on-surface-variant border border-outline-variant/30 hover:text-on-surface hover:bg-surface-container-low transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddStaff}
                  disabled={isSubmitting || !form.name.trim() || !form.email.trim() || !form.password.trim() || !form.branch}
                  className="px-4 py-2 rounded-xl text-sm font-bold bg-primary text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? 'Adding...' : 'Add Staff'}
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
            onClick={closeEdit}
          >
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.16 }}
              className="w-full max-w-lg rounded-2xl bg-surface-container-lowest border border-outline-variant/20 shadow-2xl p-6 max-h-[90vh] overflow-y-auto"
              role="dialog"
              aria-modal="true"
              aria-label="Edit staff member"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                  <h4 className="text-lg font-extrabold text-on-surface">Edit Staff Member</h4>
                  <p className="text-sm text-on-surface-variant mt-1">Update this employee&apos;s details.</p>
                </div>
                <button
                  onClick={closeEdit}
                  className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-low"
                  aria-label="Close edit staff modal"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  className="sm:col-span-2 w-full bg-surface-container-low border border-outline-variant/30 rounded-xl py-2.5 px-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/25"
                  placeholder="Full name *"
                />
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl py-2.5 px-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/25"
                  placeholder="Email *"
                />
                <div className="relative">
                  <input
                    type={showEditPass ? "text" : "password"}
                    value={editForm.password}
                    onChange={(e) => setEditForm(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl py-2.5 pl-3 pr-10 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/25"
                    placeholder="New password (leave blank to keep)"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPass(!showEditPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40 hover:text-on-surface transition-colors"
                  >
                    {showEditPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <div className="relative">
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm(prev => ({ ...prev, role: e.target.value as StaffRole }))}
                    className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl py-2.5 pl-3 pr-10 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/25 appearance-none cursor-pointer"
                  >
                    <option value="staff">Staff</option>
                    <option value="branch_manager">Branch Manager</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40 pointer-events-none" size={16} />
                </div>
                <div className="relative">
                  <select
                    value={editForm.branch}
                    onChange={(e) => setEditForm(prev => ({ ...prev, branch: e.target.value }))}
                    className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl py-2.5 pl-3 pr-10 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/25 appearance-none cursor-pointer"
                  >
                    <option value="">Select branch *</option>
                    {branches.map(b => (
                      <option key={b._id} value={b._id}>{b.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40 pointer-events-none" size={16} />
                </div>
                <input
                  type="text"
                  value={editForm.staffId}
                  onChange={(e) => setEditForm(prev => ({ ...prev, staffId: e.target.value }))}
                  className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl py-2.5 px-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/25"
                  placeholder="Staff ID"
                />
                <input
                  type="tel"
                  value={editForm.mobileNumber}
                  onChange={(e) => setEditForm(prev => ({ ...prev, mobileNumber: e.target.value }))}
                  className="sm:col-span-2 w-full bg-surface-container-low border border-outline-variant/30 rounded-xl py-2.5 px-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/25"
                  placeholder="Mobile number"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={closeEdit}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-on-surface-variant border border-outline-variant/30 hover:text-on-surface hover:bg-surface-container-low transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditStaff}
                  disabled={isSubmitting || !editForm.name.trim() || !editForm.email.trim() || !editForm.branch}
                  className="px-4 py-2 rounded-xl text-sm font-bold bg-primary text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
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
                  <h4 className="text-lg font-extrabold text-on-surface">Delete Staff</h4>
                  <p className="text-sm text-on-surface-variant mt-1">This action cannot be undone.</p>
                </div>
                <button
                  onClick={() => setDeletingStaff(null)}
                  className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-low"
                  aria-label="Close delete staff modal"
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
