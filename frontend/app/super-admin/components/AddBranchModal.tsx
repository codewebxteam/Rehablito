"use client";

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { X, Building2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { toast } from 'sonner';

interface AddBranchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (newBranch: any) => void;
}

const INPUT_CLASS = 'w-full bg-surface-container-lowest border border-outline-variant/30 rounded-xl py-3 px-4 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all placeholder:text-on-surface-variant/40';
const LABEL_CLASS = 'block text-[11px] font-black uppercase tracking-wider text-on-surface-variant/60 mb-1.5';

export function AddBranchModal({ isOpen, onClose, onSuccess }: AddBranchModalProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [form, setForm] = useState({
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
  });

  // reset on close
  useEffect(() => {
    if (!isOpen) {
      setForm({
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
      });
    }
  }, [isOpen]);

  const firstRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (isOpen) setTimeout(() => firstRef.current?.focus(), 80);
  }, [isOpen]);

  const isValid = form.name.trim() !== '' && form.phone.trim() !== '' && form.address.trim() !== '' && form.city.trim() !== '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    try {
      setIsSaving(true);
      const payload: any = {
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
        toast.success('Branch added successfully!');
        if (onSuccess) onSuccess(data.data);
        onClose();
      } else {
        toast.error(data.message || 'Failed to add branch');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to add branch');
    } finally {
      setIsSaving(false);
    }
  };

  const set = <K extends keyof typeof form>(key: K, value: typeof form[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[99999] overflow-y-auto"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)' }}
          onClick={onClose}
        >
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
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-100/40 rounded-full blur-3xl -z-10 translate-y-1/2 -translate-x-1/3" />

            <div className="flex justify-between items-center px-8 py-6 border-b border-slate-100/60 bg-white/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-sm border border-primary/10">
                  <Building2 size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black font-headline text-slate-800">New Branch</h3>
                  <p className="text-xs font-bold text-slate-500 mt-0.5">Register a clinic location into the network</p>
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
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className={LABEL_CLASS}>Branch Name *</label>
                    <input ref={firstRef} type="text" placeholder="e.g. Jubilee Hills Clinic" value={form.name} onChange={(e) => set('name', e.target.value)} className={INPUT_CLASS} required />
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>Phone Contact *</label>
                    <input type="tel" placeholder="+91 98765 43210" value={form.phone} onChange={(e) => set('phone', e.target.value)} className={INPUT_CLASS} required />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                   <div className="md:col-span-2">
                      <label className={LABEL_CLASS}>Street Address *</label>
                      <input type="text" placeholder="Full street address and unit number" value={form.address} onChange={(e) => set('address', e.target.value)} className={INPUT_CLASS} required />
                   </div>
                   <div>
                      <label className={LABEL_CLASS}>City *</label>
                      <input type="text" placeholder="e.g. Hyderabad" value={form.city} onChange={(e) => set('city', e.target.value)} className={INPUT_CLASS} required />
                   </div>
                   <div>
                      <label className={LABEL_CLASS}>State / Region</label>
                      <input type="text" placeholder="e.g. Telangana" value={form.state} onChange={(e) => set('state', e.target.value)} className={INPUT_CLASS} />
                   </div>
                   <div className="md:col-span-2">
                     <label className={LABEL_CLASS}>Email Address</label>
                     <input type="email" placeholder="branch@rehablito.com" value={form.email} onChange={(e) => set('email', e.target.value)} className={INPUT_CLASS} />
                   </div>
                </div>
              </div>

              {/* Secondary Details Container */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100 shadow-inner">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   {/* Geofence */}
                   <div className="space-y-4">
                     <h4 className="text-[12px] font-black uppercase text-slate-800 tracking-wider">Geofencing</h4>
                     <div className="space-y-3">
                       <input type="number" step="any" placeholder="Latitude (e.g. 17.4326)" value={form.latitude} onChange={(e) => set('latitude', e.target.value)} className={INPUT_CLASS} />
                       <input type="number" step="any" placeholder="Longitude (e.g. 78.4071)" value={form.longitude} onChange={(e) => set('longitude', e.target.value)} className={INPUT_CLASS} />
                       <div className="flex items-center gap-3">
                         <span className="text-[10px] font-bold text-slate-500 w-16">Radius(m)</span>
                         <input type="number" value={form.radiusMeters} onChange={(e) => set('radiusMeters', e.target.value)} className={INPUT_CLASS} />
                       </div>
                     </div>
                   </div>

                   {/* Shift Timings */}
                   <div className="space-y-4">
                     <h4 className="text-[12px] font-black uppercase text-slate-800 tracking-wider">Shift Timing</h4>
                     <div className="space-y-3">
                       <div>
                         <label className="text-[10px] font-bold text-slate-500 pr-2">Start Time</label>
                         <input type="time" value={form.shiftStart} onChange={(e) => set('shiftStart', e.target.value)} className={INPUT_CLASS} />
                       </div>
                       <div>
                         <label className="text-[10px] font-bold text-slate-500 pr-2">End Time</label>
                         <input type="time" value={form.shiftEnd} onChange={(e) => set('shiftEnd', e.target.value)} className={INPUT_CLASS} />
                       </div>
                     </div>
                   </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={onClose} className="px-6 py-3 rounded-2xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={isSaving || !isValid} className="flex items-center gap-2 px-8 py-3 rounded-2xl text-sm font-black bg-primary text-white hover:bg-primary/90 disabled:opacity-50 transition-all shadow-[0_10px_20px_-5px_rgba(37,99,235,0.3)]">
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Building2 size={16} />}
                  Add Branch
                </button>
              </div>

            </form>
          </motion.div>
        </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (!mounted) return null;
  return createPortal(modalContent, document.body);
}
