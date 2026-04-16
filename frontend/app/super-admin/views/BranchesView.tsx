import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Building2, Plus, Search, MapPin, Phone, Mail, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { toast } from 'sonner';

interface ApiManager {
  _id: string;
  name: string;
  email: string;
}

interface ApiBranch {
  _id: string;
  name: string;
  address: string;
  city: string;
  state?: string;
  phone: string;
  email?: string;
  managerId?: ApiManager | null;
  isActive: boolean;
  location?: { latitude: number; longitude: number; radiusMeters: number };
  shiftStart?: string;
  shiftEnd?: string;
  createdAt: string;
}

interface NewBranchForm {
  name: string;
  address: string;
  city: string;
  state: string;
  phone: string;
  email: string;
  latitude: string;
  longitude: string;
  radiusMeters: string;
  shiftStart: string;
  shiftEnd: string;
}

const INITIAL_FORM: NewBranchForm = {
  name: '',
  address: '',
  city: '',
  state: '',
  phone: '',
  email: '',
  latitude: '',
  longitude: '',
  radiusMeters: '200',
  shiftStart: '09:00',
  shiftEnd: '18:00',
};

export const BranchesView = ({ initialData }: { initialData?: any }) => {
  const hasServerData = !!initialData;
  const [branches, setBranches] = useState<ApiBranch[]>(initialData?.branches || []);
  const [isLoading, setIsLoading] = useState(!hasServerData);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<NewBranchForm>(INITIAL_FORM);

  const fetchBranches = async () => {
    try {
      setIsLoading(true);
      const { data } = await api.get('/admin/branches');
      if (data.success) setBranches(data.data);
    } catch (err) {
      console.error('Failed to fetch branches:', err);
      toast.error('Failed to load branches');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (hasServerData) return;
    fetchBranches();
  }, []);

  const resetForm = () => setForm(INITIAL_FORM);

  const closeModal = () => {
    setIsAddModalOpen(false);
    resetForm();
  };

  const handleAddBranch = async () => {
    if (!form.name.trim() || !form.address.trim() || !form.city.trim() || !form.phone.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload: Record<string, unknown> = {
        name: form.name.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        phone: form.phone.trim(),
      };
      if (form.state.trim()) payload.state = form.state.trim();
      if (form.email.trim()) payload.email = form.email.trim();
      if (form.shiftStart) payload.shiftStart = form.shiftStart;
      if (form.shiftEnd) payload.shiftEnd = form.shiftEnd;
      if (form.latitude || form.longitude || form.radiusMeters) {
        payload.location = {
          latitude: Number(form.latitude) || 0,
          longitude: Number(form.longitude) || 0,
          radiusMeters: Number(form.radiusMeters) || 200,
        };
      }

      const { data } = await api.post('/admin/branches', payload);
      if (data.success) {
        toast.success('Branch added successfully');
        setBranches(prev => [data.data, ...prev]);
        closeModal();
      }
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      toast.error(axiosError?.response?.data?.message || 'Failed to add branch');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredBranches = branches.filter(b => {
    const q = searchTerm.toLowerCase();
    return (
      b.name.toLowerCase().includes(q) ||
      b.city.toLowerCase().includes(q) ||
      (b.address?.toLowerCase().includes(q) ?? false)
    );
  });

  const activeCount = branches.filter(b => b.isActive).length;

  return (
    <div className="w-full space-y-4 sm:space-y-6 pb-6 lg:pb-10">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          { title: 'Total Branches', value: branches.length, color: 'bg-surface-container-low text-on-surface' },
          { title: 'Active', value: activeCount, color: 'bg-green-50 text-green-600' },
          { title: 'Inactive', value: branches.length - activeCount, color: 'bg-amber-50 text-amber-600' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/10 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-on-surface-variant opacity-70 mb-1">{stat.title}</p>
              <h3 className="text-3xl font-black">{stat.value}</h3>
            </div>
            <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', stat.color)}>
              <Building2 size={20} />
            </div>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/10">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-xl text-primary">
            <Building2 size={20} />
          </div>
          <div>
            <h3 className="text-xl font-bold font-headline text-on-surface">Branches</h3>
            <p className="text-xs text-on-surface-variant font-medium opacity-60">Manage all clinic branches</p>
          </div>
        </div>

        <div className="flex w-full sm:w-auto items-center gap-3">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/50" size={18} />
            <input
              type="text"
              placeholder="Search branches..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64 bg-surface-container-low/50 border border-outline-variant/20 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all text-on-surface"
            />
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-primary hover:bg-primary/90 text-white p-2.5 px-5 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-primary/20 transition-all"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Add Branch</span>
          </button>
        </div>
      </div>

      {/* Branch Grid */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/10 p-6 min-h-96">
        {isLoading ? (
          <div className="h-80 flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin mx-auto mb-4"></div>
              <p className="text-on-surface-variant">Loading branches...</p>
            </div>
          </div>
        ) : filteredBranches.length === 0 ? (
          <div className="p-10 text-center text-on-surface-variant opacity-60">No branches found.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBranches.map((branch) => (
              <motion.div
                key={branch._id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 rounded-xl border border-outline-variant/20 bg-surface-container-low/30 hover:border-primary/30 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <h4 className="text-base font-bold text-on-surface">{branch.name}</h4>
                  <span className={cn(
                    'px-2.5 py-1 text-[10px] font-black rounded-lg uppercase tracking-wider',
                    branch.isActive ? 'bg-green-50 text-green-700' : 'bg-surface-container-low text-on-surface-variant'
                  )}>
                    {branch.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="space-y-2 text-xs text-on-surface-variant">
                  <div className="flex items-start gap-2">
                    <MapPin size={14} className="mt-0.5 shrink-0 opacity-60" />
                    <span>{branch.address}, {branch.city}{branch.state ? `, ${branch.state}` : ''}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="opacity-60" />
                    <span>{branch.phone}</span>
                  </div>
                  {branch.email && (
                    <div className="flex items-center gap-2">
                      <Mail size={14} className="opacity-60" />
                      <span>{branch.email}</span>
                    </div>
                  )}
                </div>
                {branch.managerId && (
                  <div className="mt-4 pt-3 border-t border-outline-variant/20 text-xs">
                    <span className="text-on-surface-variant opacity-60">Manager: </span>
                    <span className="font-semibold text-on-surface">{branch.managerId.name}</span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {isAddModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.16 }}
              className="w-full max-w-xl rounded-2xl bg-surface-container-lowest border border-outline-variant/20 shadow-2xl p-6 max-h-[90vh] overflow-y-auto"
              role="dialog"
              aria-modal="true"
              aria-label="Add branch"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                  <h4 className="text-lg font-extrabold text-on-surface">Add Branch</h4>
                  <p className="text-sm text-on-surface-variant mt-1">Create a new clinic branch.</p>
                </div>
                <button
                  onClick={closeModal}
                  className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-low"
                  aria-label="Close add branch modal"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-3">
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl py-2.5 px-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/25"
                  placeholder="Branch name *"
                />
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm(p => ({ ...p, address: e.target.value }))}
                  className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl py-2.5 px-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/25"
                  placeholder="Address *"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => setForm(p => ({ ...p, city: e.target.value }))}
                    className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl py-2.5 px-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/25"
                    placeholder="City *"
                  />
                  <input
                    type="text"
                    value={form.state}
                    onChange={(e) => setForm(p => ({ ...p, state: e.target.value }))}
                    className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl py-2.5 px-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/25"
                    placeholder="State"
                  />
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm(p => ({ ...p, phone: e.target.value }))}
                    className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl py-2.5 px-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/25"
                    placeholder="Phone *"
                  />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))}
                    className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl py-2.5 px-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/25"
                    placeholder="Email"
                  />
                </div>

                <div className="pt-2">
                  <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 opacity-70">Geofence (optional)</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      type="number"
                      step="any"
                      value={form.latitude}
                      onChange={(e) => setForm(p => ({ ...p, latitude: e.target.value }))}
                      className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl py-2.5 px-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/25"
                      placeholder="Latitude"
                    />
                    <input
                      type="number"
                      step="any"
                      value={form.longitude}
                      onChange={(e) => setForm(p => ({ ...p, longitude: e.target.value }))}
                      className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl py-2.5 px-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/25"
                      placeholder="Longitude"
                    />
                    <input
                      type="number"
                      value={form.radiusMeters}
                      onChange={(e) => setForm(p => ({ ...p, radiusMeters: e.target.value }))}
                      className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl py-2.5 px-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/25"
                      placeholder="Radius (m)"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 opacity-70">Shift timing</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="time"
                      value={form.shiftStart}
                      onChange={(e) => setForm(p => ({ ...p, shiftStart: e.target.value }))}
                      className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl py-2.5 px-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/25"
                    />
                    <input
                      type="time"
                      value={form.shiftEnd}
                      onChange={(e) => setForm(p => ({ ...p, shiftEnd: e.target.value }))}
                      className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl py-2.5 px-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/25"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-on-surface-variant border border-outline-variant/30 hover:text-on-surface hover:bg-surface-container-low transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddBranch}
                  disabled={isSubmitting || !form.name.trim() || !form.address.trim() || !form.city.trim() || !form.phone.trim()}
                  className="px-4 py-2 rounded-xl text-sm font-bold bg-primary text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? 'Adding...' : 'Add Branch'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
