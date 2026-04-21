"use client";

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { X, UserPlus, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { toast } from 'sonner';

interface Branch {
  _id: string;
  name: string;
}

interface ServiceOption {
  _id: string;
  name: string;
  price: number;
  unit: 'session' | 'month';
}

interface AddPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (newPatient: any) => void;
  branches: Branch[];
}

const INPUT_CLASS = 'w-full bg-surface-container-lowest border border-outline-variant/30 rounded-xl py-3 px-4 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all placeholder:text-on-surface-variant/40';
const LABEL_CLASS = 'block text-[11px] font-black uppercase tracking-wider text-on-surface-variant/60 mb-1.5';

export function AddPatientModal({ isOpen, onClose, onSuccess, branches }: AddPatientModalProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [services, setServices] = useState<ServiceOption[]>([]);

  useEffect(() => {
    setMounted(true);
    // Fetch services from DB
    api.get('/admin/services').then(({ data }) => {
      if (data.success) setServices(data.data);
    }).catch(() => {});
  }, []);

  const [form, setForm] = useState({
    name: '',           // Child Name
    parentName: '',
    parentPhone: '',
    address: '',
    branchId: '',
    serviceId: '',      // Service from DB
    therapyType: '',    // legacy fallback
  });

  // Derived: selected service
  const selectedService = services.find(s => s._id === form.serviceId) || null;

  // reset on close
  useEffect(() => {
    if (!isOpen) {
      setForm({
        name: '',
        parentName: '',
        parentPhone: '',
        address: '',
        branchId: '',
        serviceId: '',
        therapyType: '',
      });
    }
  }, [isOpen]);

  const firstRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (isOpen) setTimeout(() => firstRef.current?.focus(), 80);
  }, [isOpen]);

  const isValid = form.name.trim() !== '' && form.branchId.trim() !== '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    try {
      setIsSaving(true);
      const payload: any = {
        name: form.name.trim(),
        branchId: form.branchId,
        parentName: form.parentName.trim(),
        address: form.address.trim(),
      };
      
      if (form.parentPhone.trim()) {
        const rawPhone = form.parentPhone.trim();
        payload.parentPhone = rawPhone.startsWith('+') ? rawPhone : `+91 ${rawPhone}`;
      }

      if (form.serviceId) {
        payload.serviceId = form.serviceId;
        payload.totalFee = selectedService?.price ?? 0;
        // Also populate therapyType for backward compat
        if (selectedService) {
          payload.therapyType = [selectedService.name.toLowerCase().replace(/ /g, '_')];
        }
      } else if (form.therapyType) {
        payload.therapyType = [form.therapyType];
      }

      const { data } = await api.post('/admin/patients', payload);
      
      if (data.success) {
        toast.success('Patient added successfully!');
        if (onSuccess) onSuccess(data.data);
        onClose();
      } else {
        toast.error(data.message || 'Failed to add patient');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to add patient');
    } finally {
      setIsSaving(false);
    }
  };

  const set = <K extends keyof typeof form>(key: K, value: typeof form[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[99999] overflow-y-auto" style={{ backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)' }} onClick={onClose}>
          <div className="flex min-h-full items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="relative w-full max-w-2xl bg-white/95 backdrop-blur-xl border border-white shadow-2xl rounded-[32px] overflow-hidden my-8 sm:my-12 text-left"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
            >
              {/* Soft decorative blur */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-100/50 rounded-full blur-3xl -z-10 -translate-y-1/2 translate-x-1/3" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-rose-100/40 rounded-full blur-3xl -z-10 translate-y-1/2 -translate-x-1/3" />

              <div className="flex justify-between items-center px-8 py-6 border-b border-slate-100/60 bg-white/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-sm border border-primary/10">
                    <UserPlus size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black font-headline text-slate-800">New Patient Record</h3>
                    <p className="text-xs font-bold text-slate-500 mt-0.5">Register a new child intake profile</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="px-8 py-6 space-y-6">
                
                {/* Primary Identifiers */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className={LABEL_CLASS}>Child Name *</label>
                      <input ref={firstRef} type="text" placeholder="e.g. Aarav Sharma" value={form.name} onChange={(e) => set('name', e.target.value)} className={INPUT_CLASS} required />
                    </div>
                    <div>
                      <label className={LABEL_CLASS}>Parent/Guardian Name</label>
                      <input type="text" placeholder="e.g. Rahul Sharma" value={form.parentName} onChange={(e) => set('parentName', e.target.value)} className={INPUT_CLASS} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                     <div>
                        <label className={LABEL_CLASS}>Phone Contact</label>
                        <div className="relative flex items-center">
                          <span className="absolute left-4 text-sm font-semibold text-on-surface-variant/80 border-r border-outline-variant/30 pr-3 pointer-events-none">+91</span>
                          <input type="tel" placeholder="98765 43210" value={form.parentPhone} onChange={(e) => set('parentPhone', e.target.value)} className={cn(INPUT_CLASS, "pl-[4.5rem]")} />
                        </div>
                     </div>
                     <div>
                        <label className={LABEL_CLASS}>Center Branch *</label>
                        <select required value={form.branchId} onChange={(e) => set('branchId', e.target.value)} className={cn(INPUT_CLASS, 'appearance-none cursor-pointer bg-white')}>
                          <option value="" disabled>Select a branch</option>
                          {branches.map(b => (
                            <option key={b._id} value={b._id}>{b.name}</option>
                          ))}
                        </select>
                     </div>
                  </div>
                </div>

                {/* Secondary Details Container */}
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 shadow-inner">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     {/* Therapy Type */}
                     <div className="space-y-4">
                       <h4 className="text-[12px] font-black uppercase text-slate-800 tracking-wider">Clinical details</h4>
                        <div className="space-y-3">
                           <label className={LABEL_CLASS}>Service / Therapy Name</label>
                           <select value={form.serviceId} onChange={(e) => set('serviceId', e.target.value)} className={cn(INPUT_CLASS, 'appearance-none cursor-pointer bg-white')}>
                             <option value="">No service selected</option>
                             {services.map(s => (
                               <option key={s._id} value={s._id}>{s.name} — ₹{s.price.toLocaleString()} / {s.unit}</option>
                             ))}
                           </select>
                           {selectedService && (
                             <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-blue-50 border border-blue-100">
                               <span className="text-[10px] font-black uppercase tracking-wider text-blue-600">Total Fee</span>
                               <span className="text-sm font-black text-slate-800">₹{selectedService.price.toLocaleString()} / {selectedService.unit}</span>
                             </div>
                           )}
                        </div>
                     </div>

                     {/* Address */}
                     <div className="space-y-4">
                       <h4 className="text-[12px] font-black uppercase text-slate-800 tracking-wider">Location</h4>
                       <div className="space-y-3">
                         <label className={LABEL_CLASS}>Residential Address</label>
                         <textarea 
                           placeholder="Full street address and unit number" 
                           value={form.address} 
                           onChange={(e) => set('address', e.target.value)} 
                           className={cn(INPUT_CLASS, "min-h-[80px] resize-none")} 
                         />
                       </div>
                     </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={onClose} className="px-6 py-3 rounded-2xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={isSaving || !isValid} className="flex items-center gap-2 px-8 py-3 rounded-2xl text-sm font-black bg-primary text-white hover:bg-primary/90 disabled:opacity-50 transition-all shadow-[0_10px_20px_-5px_rgba(37,99,235,0.3)]">
                    {isSaving ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
                    Add Patient
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );

  if (!mounted) return null;
  return createPortal(modalContent, document.body);
}
