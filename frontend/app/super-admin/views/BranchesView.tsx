import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Building2, Plus, Search, MapPin, Phone, Mail, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { toast } from 'sonner';
import { AddBranchModal } from '../components/AddBranchModal';

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

export const BranchesView = ({ initialData }: { initialData?: any }) => {
  const hasServerData = !!initialData;
  const [branches, setBranches] = useState<ApiBranch[]>(initialData?.branches || []);
  const [isLoading, setIsLoading] = useState(!hasServerData);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

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
  }, [hasServerData]);

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

      <AddBranchModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onSuccess={(newBranch) => setBranches(prev => [newBranch, ...prev])} 
      />
    </div>
  );
};
