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

const todayIso = () => new Date().toISOString().slice(0, 10);

const INPUT_CLASS =
  'w-full h-11 bg-white border border-gray-200 rounded-xl px-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/50 transition-all';

const LABEL_CLASS = 'block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5';

export function AddTransactionModal() {
  const { isOpen, closeModal, onSaved, pushLiveFeedItem } = useAddTransaction();

  const [branches, setBranches] = useState<Branch[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const [form, setForm] = useState({
    description: '',
    branchId: '',
    method: 'cash' as 'cash' | 'upi' | 'bank_transfer' | 'card',
    date: todayIso(),
    amount: '',
    status: 'pending' as 'paid' | 'partial' | 'overdue' | 'pending',
  });

  // fetch branches once
  useEffect(() => {
    if (!isOpen) return;
    api.get('/admin/branches').then(res => {
      if (res.data.success) setBranches(res.data.data || []);
    }).catch(() => {});
  }, [isOpen]);

  // reset on close
  useEffect(() => {
    if (!isOpen) {
      setForm({ description: '', branchId: '', method: 'cash', date: todayIso(), amount: '', status: 'pending' });
    }
  }, [isOpen]);

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
                      onChange={e => set('branchId', e.target.value)}
                      className={cn(INPUT_CLASS, 'appearance-none cursor-pointer')}
                    >
                      <option value="">Select branch</option>
                      {branches.map(b => (
                        <option key={b._id} value={b._id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>Method</label>
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
                </div>

                {/* Date + Amount */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={LABEL_CLASS}>Date</label>
                    <input
                      type="date"
                      value={form.date}
                      onChange={e => set('date', e.target.value)}
                      className={INPUT_CLASS}
                    />
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>Amount (₹) <span className="text-red-500">*</span></label>
                    <input
                      type="number"
                      min={1}
                      placeholder="0.00"
                      value={form.amount}
                      onChange={e => set('amount', e.target.value)}
                      className={INPUT_CLASS}
                      required
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
