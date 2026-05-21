"use client";

import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Building2, Plus, Search, MapPin, Phone, Mail, Edit, Save, Users, Map, Loader2, UserCog, User, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { toast } from 'sonner';
import { AddBranchModal } from '../components/AddBranchModal';

interface ApiManager {
  _id: string;
  name: string;
  email: string;
}

interface ApiStaff {
  _id: string;
  name: string;
  email: string;
  role: string;
  staffId?: string;
  mobileNumber?: string;
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

  // Detail View States (Replaced Modal)
  const [selectedBranch, setSelectedBranch] = useState<ApiBranch | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Staff fetching states
  const [branchStaff, setBranchStaff] = useState<ApiStaff[]>([]);
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);

  // Edit Form State
  const [editForm, setEditForm] = useState({
    name: '', phone: '', email: '', address: '', city: '', state: '',
    latitude: '', longitude: '', radiusMeters: '', shiftStart: '', shiftEnd: '', isActive: true
  });

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

  // Open Branch Details (Inline)
  const openBranchDetails = async (branch: ApiBranch) => {
    setSelectedBranch(branch);
    setEditForm({
      name: branch.name || '',
      phone: branch.phone || '',
      email: branch.email || '',
      address: branch.address || '',
      city: branch.city || '',
      state: branch.state || '',
      latitude: branch.location?.latitude?.toString() || '',
      longitude: branch.location?.longitude?.toString() || '',
      radiusMeters: branch.location?.radiusMeters?.toString() || '',
      shiftStart: branch.shiftStart || '',
      shiftEnd: branch.shiftEnd || '',
      isActive: branch.isActive
    });
    setIsEditing(false);
    
    // Fetch Staff for this branch
    try {
      setIsLoadingStaff(true);
      const { data } = await api.get(`/admin/staff?branch=${branch._id}`);
      if (data.success) {
        setBranchStaff(data.data);
      }
    } catch (err) {
      toast.error('Failed to load branch staff');
    } finally {
      setIsLoadingStaff(false);
    }
  };

  const handleBackToList = () => {
    setSelectedBranch(null);
    setIsEditing(false);
  };

  // Handle Edit Submit
  const handleUpdateBranch = async () => {
    if (!selectedBranch) return;
    
    setIsSaving(true);
    try {
      const payload = {
        name: editForm.name,
        phone: editForm.phone,
        email: editForm.email,
        address: editForm.address,
        city: editForm.city,
        state: editForm.state,
        isActive: editForm.isActive,
        shiftStart: editForm.shiftStart,
        shiftEnd: editForm.shiftEnd,
        location: {
          latitude: parseFloat(editForm.latitude) || 0,
          longitude: parseFloat(editForm.longitude) || 0,
          radiusMeters: parseInt(editForm.radiusMeters) || 200
        }
      };

      const { data } = await api.put(`/admin/branches/${selectedBranch._id}`, payload);
      
      if (data.success) {
        toast.success('Branch updated successfully!');
        setBranches(prev => prev.map(b => b._id === selectedBranch._id ? data.data : b));
        setSelectedBranch(data.data); // Update inline data
        setIsEditing(false);
      }
    } catch (err) {
      toast.error('Failed to update branch');
      console.error(err);
    } finally {
      setIsSaving(false);
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
    <div className="w-full min-w-0 space-y-4 sm:space-y-6 pb-6 lg:pb-10">
      
      <AnimatePresence mode="wait">
        {!selectedBranch ? (
          /* ========================================= */
          /* LIST VIEW (Grid & Metrics)                */
          /* ========================================= */
          <motion.div
            key="list-view"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-4 sm:space-y-6"
          >
            {/* Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {[
                { title: 'Total Branches', value: branches.length, color: 'bg-surface-container-low text-on-surface' },
                { title: 'Active', value: activeCount, color: 'bg-green-50 text-green-600' },
                { title: 'Inactive', value: branches.length - activeCount, color: 'bg-amber-50 text-amber-600' },
              ].map((stat, idx) => (
                <div key={idx} className="bg-surface-container-lowest p-5 sm:p-6 rounded-2xl border border-outline-variant/10 shadow-sm flex items-center justify-between">
                  {isLoading ? (
                    <div className="w-full h-14 sm:h-16 animate-pulse bg-surface-container-low rounded-lg" />
                  ) : (
                    <>
                      <div>
                        <p className="text-xs sm:text-sm font-bold text-on-surface-variant opacity-70 mb-1">{stat.title}</p>
                        <h3 className="text-2xl sm:text-3xl font-black">{stat.value}</h3>
                      </div>
                      <div className={cn('w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0', stat.color)}>
                        <Building2 size={20} />
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-surface-container-lowest p-4 sm:p-6 rounded-2xl shadow-sm border border-outline-variant/10 min-w-0">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-xl text-primary shrink-0">
                  <Building2 size={20} />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold font-headline text-on-surface">Branches</h3>
                  <p className="text-[10px] sm:text-xs text-on-surface-variant font-medium opacity-60">Manage all clinic branches</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row w-full lg:w-auto items-stretch sm:items-center gap-3">
                <div className="relative flex-1 sm:flex-none w-full sm:w-[280px]">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/50" size={18} />
                  <input
                    type="text"
                    placeholder="Search branches..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-surface-container-low/50 border border-outline-variant/20 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all text-on-surface"
                  />
                </div>
                {/* <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white p-2.5 px-5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 transition-all shrink-0"
                >
                  <Plus size={18} />
                  <span>Add Branch</span>
                </button> */}
              </div>
            </div>

            {/* Branch Grid */}
            <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/10 p-4 sm:p-6 min-h-96 min-w-0">
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
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredBranches.map((branch) => (
                    <div
                      key={branch._id}
                      onClick={() => openBranchDetails(branch)}
                      className="p-4 sm:p-5 rounded-xl border border-outline-variant/20 bg-surface-container-low/30 hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group flex flex-col"
                    >
                      <div className="flex items-start justify-between mb-3 gap-2">
                        <h4 className="text-sm sm:text-base font-bold text-on-surface group-hover:text-primary transition-colors line-clamp-1">{branch.name}</h4>
                        <span className={cn(
                          'px-2 py-1 text-[9px] sm:text-[10px] font-black rounded-lg uppercase tracking-wider shrink-0',
                          branch.isActive ? 'bg-green-50 text-green-700' : 'bg-surface-container-low text-on-surface-variant'
                        )}>
                          {branch.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="space-y-2 text-[11px] sm:text-xs text-on-surface-variant flex-1">
                        <div className="flex items-start gap-2">
                          <MapPin size={14} className="mt-0.5 shrink-0 opacity-60" />
                          <span className="line-clamp-2">{branch.address}, {branch.city}{branch.state ? `, ${branch.state}` : ''}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone size={14} className="shrink-0 opacity-60" />
                          <span className="truncate">{branch.phone}</span>
                        </div>
                        {branch.email && (
                          <div className="flex items-center gap-2">
                            <Mail size={14} className="shrink-0 opacity-60" />
                            <span className="truncate">{branch.email}</span>
                          </div>
                        )}
                      </div>
                      <div className="mt-4 pt-3 border-t border-outline-variant/20 text-[11px] sm:text-xs flex justify-between items-center">
                        <div className="truncate pr-2">
                          <span className="text-on-surface-variant opacity-60">Manager: </span>
                          <span className="font-semibold text-on-surface">{branch.managerId?.name || 'Unassigned'}</span>
                        </div>
                        <div className="text-primary opacity-0 group-hover:opacity-100 transition-opacity font-semibold flex items-center gap-1 shrink-0">
                          View Details
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          /* ========================================= */
          /* INLINE DETAIL VIEW                        */
          /* ========================================= */
          <motion.div
            key="detail-view"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/10 overflow-hidden flex flex-col min-h-[calc(100vh-120px)]"
          >
            {/* Header Area */}
            <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-outline-variant/20 flex flex-col md:flex-row items-start md:items-center justify-between bg-surface-container-low/30 gap-4 shrink-0">
              <div className="flex items-center gap-3 sm:gap-4 min-w-0 w-full md:w-auto">
                <button 
                  onClick={handleBackToList} 
                  className="p-2.5 bg-surface-container-low hover:bg-surface-container-high rounded-xl transition-colors shrink-0"
                >
                  <ArrowLeft size={20} className="text-on-surface-variant" />
                </button>
                <div className="hidden sm:flex w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-xl items-center justify-center text-primary shrink-0">
                  <Building2 size={20} className="sm:w-6 sm:h-6" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg sm:text-xl font-bold text-on-surface flex flex-wrap items-center gap-2 sm:gap-3 leading-tight">
                    <span className="truncate">{selectedBranch.name}</span>
                    <span className={cn(
                      'px-2 py-1 text-[9px] sm:text-[10px] font-black rounded-lg uppercase tracking-wider shrink-0',
                      editForm.isActive ? 'bg-green-50 text-green-700' : 'bg-surface-container-high text-on-surface-variant'
                    )}>
                      {editForm.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </h3>
                  <p className="text-[10px] sm:text-xs text-on-surface-variant font-medium mt-0.5 truncate">Branch Details & Staff Management</p>
                </div>
              </div>
              
              <div className="flex items-center justify-end w-full md:w-auto">
                {!isEditing ? (
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="w-full md:w-auto flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 bg-primary/10 text-primary rounded-xl text-xs sm:text-sm font-bold hover:bg-primary/20 transition-colors"
                  >
                    <Edit size={16} /> Edit Details
                  </button>
                ) : (
                  <button 
                    onClick={handleUpdateBranch}
                    disabled={isSaving}
                    className="w-full md:w-auto flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 bg-primary text-white rounded-xl text-xs sm:text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    Save Changes
                  </button>
                )}
              </div>
            </div>

            {/* Split Layout Body */}
            <div className="flex-1 p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
              
              {/* LEFT COLUMN: Branch Details Form */}
              <div className="space-y-6">
                <h4 className="text-xs sm:text-sm font-black uppercase tracking-widest text-on-surface-variant flex items-center gap-2">
                  <MapPin size={16} /> Location & Contact
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="col-span-1 sm:col-span-2 space-y-1.5">
                    <label className="text-[11px] sm:text-xs font-bold text-on-surface-variant ml-1">Branch Name</label>
                    <input 
                      type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})}
                      disabled={!isEditing}
                      className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-3 sm:px-4 py-2.5 text-xs sm:text-sm disabled:opacity-70 disabled:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 outline-none transition-colors"
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-[11px] sm:text-xs font-bold text-on-surface-variant ml-1">Phone Number</label>
                    <input 
                      type="text" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})}
                      disabled={!isEditing}
                      className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-3 sm:px-4 py-2.5 text-xs sm:text-sm disabled:opacity-70 disabled:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 outline-none transition-colors"
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-[11px] sm:text-xs font-bold text-on-surface-variant ml-1">Email Address</label>
                    <input 
                      type="email" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})}
                      disabled={!isEditing}
                      className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-3 sm:px-4 py-2.5 text-xs sm:text-sm disabled:opacity-70 disabled:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 outline-none transition-colors"
                    />
                  </div>

                  <div className="col-span-1 sm:col-span-2 space-y-1.5">
                    <label className="text-[11px] sm:text-xs font-bold text-on-surface-variant ml-1">Full Address</label>
                    <input 
                      type="text" value={editForm.address} onChange={e => setEditForm({...editForm, address: e.target.value})}
                      disabled={!isEditing}
                      className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-3 sm:px-4 py-2.5 text-xs sm:text-sm disabled:opacity-70 disabled:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 outline-none transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] sm:text-xs font-bold text-on-surface-variant ml-1">City</label>
                    <input 
                      type="text" value={editForm.city} onChange={e => setEditForm({...editForm, city: e.target.value})}
                      disabled={!isEditing}
                      className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-3 sm:px-4 py-2.5 text-xs sm:text-sm disabled:opacity-70 disabled:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 outline-none transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] sm:text-xs font-bold text-on-surface-variant ml-1">State</label>
                    <input 
                      type="text" value={editForm.state} onChange={e => setEditForm({...editForm, state: e.target.value})}
                      disabled={!isEditing}
                      className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-3 sm:px-4 py-2.5 text-xs sm:text-sm disabled:opacity-70 disabled:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 outline-none transition-colors"
                    />
                  </div>
                </div>

                <hr className="border-outline-variant/20" />

                <h4 className="text-xs sm:text-sm font-black uppercase tracking-widest text-on-surface-variant flex items-center gap-2 pt-2">
                  <Map size={16} /> Geo-Fencing & Shift
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] sm:text-xs font-bold text-on-surface-variant ml-1">Shift Start</label>
                    <input 
                      type="time" value={editForm.shiftStart} onChange={e => setEditForm({...editForm, shiftStart: e.target.value})}
                      disabled={!isEditing}
                      className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-3 sm:px-4 py-2.5 text-xs sm:text-sm disabled:opacity-70 disabled:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 outline-none transition-colors"
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-[11px] sm:text-xs font-bold text-on-surface-variant ml-1">Shift End</label>
                    <input 
                      type="time" value={editForm.shiftEnd} onChange={e => setEditForm({...editForm, shiftEnd: e.target.value})}
                      disabled={!isEditing}
                      className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-3 sm:px-4 py-2.5 text-xs sm:text-sm disabled:opacity-70 disabled:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 outline-none transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] sm:text-xs font-bold text-on-surface-variant ml-1">Latitude</label>
                    <input 
                      type="number" value={editForm.latitude} onChange={e => setEditForm({...editForm, latitude: e.target.value})}
                      disabled={!isEditing}
                      className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-3 sm:px-4 py-2.5 text-xs sm:text-sm disabled:opacity-70 disabled:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 outline-none font-mono transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] sm:text-xs font-bold text-on-surface-variant ml-1">Longitude</label>
                    <input 
                      type="number" value={editForm.longitude} onChange={e => setEditForm({...editForm, longitude: e.target.value})}
                      disabled={!isEditing}
                      className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-3 sm:px-4 py-2.5 text-xs sm:text-sm disabled:opacity-70 disabled:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 outline-none font-mono transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5 col-span-1 sm:col-span-2">
                    <label className="text-[11px] sm:text-xs font-bold text-on-surface-variant ml-1">Geofence Radius (Meters)</label>
                    <input 
                      type="number" value={editForm.radiusMeters} onChange={e => setEditForm({...editForm, radiusMeters: e.target.value})}
                      disabled={!isEditing}
                      className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl px-3 sm:px-4 py-2.5 text-xs sm:text-sm disabled:opacity-70 disabled:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 outline-none transition-colors"
                    />
                  </div>
                  
                  {isEditing && (
                    <div className="col-span-1 sm:col-span-2 flex items-center justify-between p-3 sm:p-4 bg-surface-container-low border border-outline-variant/20 rounded-xl mt-2">
                      <div>
                        <p className="text-xs sm:text-sm font-bold text-on-surface">Branch Status</p>
                        <p className="text-[10px] sm:text-xs text-on-surface-variant">Toggle branch active state</p>
                      </div>
                      <button
                        onClick={() => setEditForm({...editForm, isActive: !editForm.isActive})}
                        className={cn(
                          "w-12 h-6 rounded-full transition-colors relative shrink-0",
                          editForm.isActive ? "bg-green-500" : "bg-outline-variant"
                        )}
                      >
                        <span className={cn(
                          "absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform",
                          editForm.isActive ? "translate-x-6" : "translate-x-0"
                        )} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT COLUMN: Manager & Staff */}
              <div className="space-y-6">
                {/* Manager Widget */}
                <div>
                  <h4 className="text-xs sm:text-sm font-black uppercase tracking-widest text-on-surface-variant flex items-center gap-2 mb-3 sm:mb-4">
                    <UserCog size={16} /> Branch Manager
                  </h4>
                  <div className="bg-surface-container-low p-3 sm:p-4 rounded-2xl border border-outline-variant/20 flex items-center gap-3 sm:gap-4 overflow-hidden">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shadow-inner shrink-0">
                      {selectedBranch.managerId ? selectedBranch.managerId.name.substring(0, 2).toUpperCase() : <User size={18} />}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-on-surface text-sm sm:text-base truncate">{selectedBranch.managerId?.name || 'No Manager Assigned'}</h4>
                      <p className="text-[10px] sm:text-xs text-on-surface-variant truncate">{selectedBranch.managerId?.email || 'Assign a manager from staff list'}</p>
                    </div>
                  </div>
                </div>

                {/* Staff List */}
                <div className="flex flex-col">
                  <h4 className="text-xs sm:text-sm font-black uppercase tracking-widest text-on-surface-variant flex items-center gap-2 mb-3 sm:mb-4">
                    <Users size={16} /> Assigned Staff ({branchStaff.length})
                  </h4>
                  
                  <div className="bg-surface-container-low rounded-2xl border border-outline-variant/20 overflow-hidden flex flex-col h-[400px]">
                    {isLoadingStaff ? (
                      <div className="flex flex-col items-center justify-center text-on-surface-variant h-full">
                        <Loader2 className="animate-spin mb-2" size={24} />
                        <span className="text-xs font-bold">Loading staff...</span>
                      </div>
                    ) : branchStaff.length === 0 ? (
                      <div className="p-6 sm:p-8 text-center text-on-surface-variant text-xs sm:text-sm flex flex-col items-center justify-center h-full">
                        No staff assigned to this branch yet.
                      </div>
                    ) : (
                      <div className="overflow-y-auto divide-y divide-outline-variant/10">
                        {branchStaff.map(staff => (
                          <div key={staff._id} className="p-3 sm:p-4 flex items-center justify-between hover:bg-surface-container-lowest transition-colors gap-3">
                            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-surface-container-high flex items-center justify-center text-[10px] sm:text-xs font-bold text-on-surface-variant shrink-0">
                                {staff.name.substring(0, 2).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs sm:text-sm font-bold text-on-surface truncate">{staff.name}</p>
                                <p className="text-[9px] sm:text-[10px] text-on-surface-variant uppercase tracking-wider truncate">{staff.role.replace('_', ' ')} • {staff.staffId || 'No ID'}</p>
                              </div>
                            </div>
                            <button className="p-1.5 sm:p-2 text-on-surface-variant hover:text-primary transition-colors hover:bg-primary/10 rounded-lg shrink-0">
                              <Mail size={14} className="sm:w-4 sm:h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AddBranchModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onSuccess={(newBranch) => setBranches(prev => [newBranch, ...prev])} 
      />
    </div>
  );
};