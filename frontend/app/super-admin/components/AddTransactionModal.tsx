"use client";

import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X, CreditCard, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useAddTransaction, NewTransaction } from './AddTransactionContext';

interface Branch {
  _id: string;
  name: string;
}

interface Patient {
  _id: string;
  name: string;
  totalFee?: number;
  branchId?: string | { _id: string };
}

const todayIso = () => new Date().toISOString().slice(0, 10);

const INPUT_CLASS =
  'w-full h-11 bg-white border border-gray-200 rounded-xl px-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/50 transition-all';

const LABEL_CLASS = 'block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5';

export function AddTransactionModal() {
  const { isOpen, closeModal, onSaved, pushLiveFeedItem, initialPayload } = useAddTransaction();

  const [branches, setBranches] = useState<Branch[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [fees, setFees] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const [form, setForm] = useState({
    description: '',
    branchId: '',
    patientId: '',
    method: 'cash' as 'cash' | 'upi' | 'bank_transfer' | 'card',
    date: todayIso(),
    amount: '',
    dueAmount: '',
    status: 'pending' as 'paid' | 'partial' | 'overdue' | 'pending',
  });

  // Derived: selected patient's total fee
  const selectedPatient = patients.find(p => p._id === form.patientId) || null;
  const initialBaseFee = selectedPatient?.totalFee ?? 0;
  
  const totalPaid = fees
    .filter(f => {
      const pId = typeof f.patientId === 'object' && f.patientId ? f.patientId._id : f.patientId;
      return pId === form.patientId;
    })
    .reduce((sum, f) => sum + (Number(f.amount) || 0), 0);

  const patientTotalFee = initialBaseFee > 0 ? Math.max(0, initialBaseFee - totalPaid) : 0;

  // fetch branches, patients, and fees once
  useEffect(() => {
    if (!isOpen) return;
    Promise.all([
      api.get('/admin/branches'),
      api.get('/admin/patients'),
      api.get('/admin/fees'),
    ]).then(([bRes, pRes, fRes]) => {
      if (bRes.data.success) setBranches(bRes.data.data || []);
      if (pRes.data.success) setPatients(pRes.data.data || []);
      if (fRes.data.success) setFees(fRes.data.data || []);
    }).catch(() => {});
  }, [isOpen]);

  // reset on close or load initialPayload on open
  useEffect(() => {
    if (!isOpen) {
      setForm({ description: '', branchId: '', patientId: '', method: 'cash', date: todayIso(), amount: '', dueAmount: '', status: 'pending' });
    } else if (initialPayload) {
      setForm(prev => ({
        ...prev,
        patientId: initialPayload.patientId || '',
        branchId: initialPayload.branchId || ''
      }));
    }
  }, [isOpen, initialPayload]);

  const firstRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (isOpen) setTimeout(() => firstRef.current?.focus(), 80); }, [isOpen]);

  const isValid = form.amount.trim() !== '' && Number(form.amount) > 0 && form.branchId !== '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    try {
      setIsSaving(true);
      const payload = {
        amount: Number(form.amount),
        dueAmount: Number(form.dueAmount) || 0,
        patientId: form.patientId || undefined,
        branchId: form.branchId,
        method: form.method,
        paymentDate: form.date || todayIso(),
        status: form.status,
        description: form.description || undefined,
      };
      const { data } = await api.post('/admin/fees', payload);
      if (data.success) {
        const saved: NewTransaction = data.data;
        onSaved(saved);
        pushLiveFeedItem({
          id: `fee-${saved._id}`,
          icon: 'payment',
          label: `Payment ₹${Number(form.amount).toLocaleString('en-IN')} – ${form.status === 'paid' ? 'Paid' : 'Pending'}`,
          sub: branches.find(b => b._id === form.branchId)?.name || 'Branch',
          time: new Date().toISOString(),
        });
        toast.success('Transaction saved!');
        closeModal();
      } else {
        toast.error(data.message || 'Failed to save transaction');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save transaction');
    } finally {
      setIsSaving(false);
    }
  };

  const set = <K extends keyof typeof form>(key: K, value: typeof form[K]) =>
    setForm(prev => ({ ...prev, [key]: value }));

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto"
          style={{ backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
          onClick={closeModal}
        >
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.97 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="relative w-full mx-auto my-20 sm:my-24"
            style={{ maxWidth: 540, minWidth: 0 }}
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Add transaction"
          >
            <div
              className="rounded-xl overflow-hidden shadow-2xl"
              style={{ background: '#fff', border: '1px solid #e5e7eb' }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <CreditCard size={16} />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-gray-900 leading-none">Add Transaction</h3>
                    <p className="text-[11px] text-gray-500 mt-0.5">Record a new fee payment</p>
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                  aria-label="Close modal"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                {/* Description */}
                <div>
                  <label className={LABEL_CLASS}>Transaction / Description</label>
                  <input
                    ref={firstRef}
                    type="text"
                    placeholder="e.g. Monthly therapy fee – Aarav"
                    value={form.description}
                    onChange={e => set('description', e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>

                {/* Branch + Method */}
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={LABEL_CLASS}>Branch <span className="text-red-500">*</span></label>
                    <select
                      required
                      value={form.branchId}
                      onChange={e => {
                        const bId = e.target.value;
                        setForm(prev => ({ ...prev, branchId: bId }));
                      }}
                      className={cn(INPUT_CLASS, 'appearance-none cursor-pointer')}
                    >
                      <option value="">Select branch</option>
                      {branches.map(b => (
                        <option key={b._id} value={b._id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>Patient</label>
                    <select
                      value={form.patientId}
                      onChange={e => {
                        const pId = e.target.value;
                        const pat = patients.find(p => p._id === pId);
                        const fee = pat?.totalFee ?? 0;
                        const patPaid = fees
                          .filter(f => (typeof f.patientId === 'object' ? f.patientId?._id : f.patientId) === pId)
                          .reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
                        const currentDue = fee > 0 ? Math.max(0, fee - patPaid) : 0;

                        setForm(prev => ({
                          ...prev,
                          patientId: pId,
                          // Auto-fill due as currentDue when patient changes
                          dueAmount: currentDue > 0 ? String(currentDue) : prev.dueAmount,
                          // Auto-fill branch if patient has one
                          branchId: pat?.branchId ? (typeof pat.branchId === 'string' ? pat.branchId : pat.branchId._id) : prev.branchId
                        }));
                      }}
                      className={cn(INPUT_CLASS, 'appearance-none cursor-pointer')}
                    >
                      <option value="">Search patient...</option>
                      {patients
                        .filter(p => !form.branchId || (typeof p.branchId === 'string' ? p.branchId === form.branchId : p.branchId?._id === form.branchId))
                        .map(p => (
                          <option key={p._id} value={p._id}>{p.name}{p.totalFee ? ` — ₹${p.totalFee.toLocaleString()} total` : ''}</option>
                        ))}
                    </select>
                  </div>
                </div>

                {patientTotalFee > 0 && (
                  <div className="px-4 py-3 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                       <span className="text-[10px] font-black text-indigo-500 uppercase tracking-wider flex-shrink-0">Service Fee Ledger</span>
                    </div>
                    <div className="text-right">
                       <span className="text-[11px] font-bold text-slate-500 block max-w-[150px] sm:max-w-none truncate">Total: ₹{initialBaseFee.toLocaleString()} • Paid: ₹{totalPaid.toLocaleString()}</span>
                       <div className="text-sm font-black text-slate-800 uppercase">Outstanding: ₹{patientTotalFee.toLocaleString()}</div>
                    </div>
                  </div>
                )}

                {/* Method + Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={LABEL_CLASS}>Payment Method</label>
                    <select
                      value={form.method}
                      onChange={e => set('method', e.target.value as typeof form.method)}
                      className={cn(INPUT_CLASS, 'appearance-none cursor-pointer')}
                    >
                      <option value="cash">Cash</option>
                      <option value="card">Card</option>
                      <option value="upi">UPI</option>
                      <option value="bank_transfer">Bank Transfer</option>
                    </select>
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>Payment Date</label>
                    <input
                      type="date"
                      value={form.date}
                      onChange={e => set('date', e.target.value)}
                      className={INPUT_CLASS}
                    />
                  </div>
                </div>

                {/* Amount + Due */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={LABEL_CLASS}>Amount Paid (₹) <span className="text-red-500">*</span></label>
                    <input
                      type="number"
                      min={1}
                      placeholder="0.00"
                      value={form.amount}
                      onChange={e => {
                        const paid = parseFloat(e.target.value) || 0;
                        const due = patientTotalFee > 0 ? Math.max(0, patientTotalFee - paid) : undefined;
                        setForm(prev => ({
                          ...prev,
                          amount: e.target.value,
                          dueAmount: due !== undefined ? String(due) : prev.dueAmount,
                          // If due is 0, auto-set status to paid
                          status: due === 0 ? 'paid' : (due && due > 0 ? 'partial' : prev.status)
                        }));
                      }}
                      className={INPUT_CLASS}
                      required
                    />
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>Due Amount (₹)</label>
                    <input
                      type="number"
                      min={0}
                      placeholder="0"
                      value={form.dueAmount}
                      onChange={e => set('dueAmount', e.target.value)}
                      className={INPUT_CLASS}
                    />
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className={LABEL_CLASS}>Status</label>
                  <div className="flex gap-2 flex-wrap">
                    {(['pending', 'paid', 'partial', 'overdue'] as const).map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => set('status', s)}
                        className={cn(
                          'px-3 py-1.5 rounded-lg text-xs font-bold border transition-all capitalize',
                          form.status === s
                            ? s === 'paid' ? 'bg-green-600 text-white border-green-600'
                              : s === 'pending' ? 'bg-amber-500 text-white border-amber-500'
                              : s === 'overdue' ? 'bg-red-600 text-white border-red-600'
                              : 'bg-blue-600 text-white border-blue-600'
                            : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300'
                        )}
                      >
                        {s === 'paid' ? 'Paid' : s === 'pending' ? 'Pending' : s === 'partial' ? 'Partial' : 'Overdue'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!isValid || isSaving}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold bg-primary text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-primary/20"
                  >
                    {isSaving ? <Loader2 size={15} className="animate-spin" /> : <CreditCard size={15} />}
                    Save Transaction
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
