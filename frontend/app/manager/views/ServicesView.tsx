"use client";
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Pencil, Trash2, X, Check, Stethoscope, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import api from '@/lib/api';
import { toast } from 'sonner';

interface Service {
  _id: string;
  name: string;
  price: number;
  unit: 'session' | 'month';
  description?: string;
}

const EMPTY_FORM = { name: '', price: '', unit: 'session' as 'session' | 'month', description: '' };

export default function ServicesView() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ ...EMPTY_FORM });
  const [editError, setEditError] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ ...EMPTY_FORM });
  const [addError, setAddError] = useState('');
  const [addSaving, setAddSaving] = useState(false);

  const fetchServices = useCallback(async () => {
    try {
      setLoading(true);
      // Manager sirf apne branch ki services fetch karega
      const { data } = await api.get('/manager/services');
      if (data.success) setServices(data.data);
    } catch { setError('Failed to load services'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchServices(); }, [fetchServices]);

  // ── Add ──
  const handleAdd = async () => {
    if (!addForm.name.trim()) { setAddError('Service name is required'); return; }
    if (!addForm.price || isNaN(Number(addForm.price))) { setAddError('Valid price is required'); return; }
    setAddSaving(true);
    try {
      const { data } = await api.post('/manager/services', {
        name: addForm.name.trim(),
        price: parseFloat(addForm.price),
        unit: addForm.unit,
        description: addForm.description.trim(),
      });
      if (data.success) {
        setServices(prev => [...prev, data.data]);
        setAddForm({ ...EMPTY_FORM });
        setShowAdd(false);
        toast.success('Service added successfully');
      } else { setAddError(data.message || 'Failed to add service'); }
    } catch (e: any) { setAddError(e?.response?.data?.message || 'Failed to add service'); }
    finally { setAddSaving(false); }
  };

  // ── Edit ──
  const startEdit = (s: Service) => {
    setEditingId(s._id);
    setEditForm({ name: s.name, price: String(s.price), unit: s.unit, description: s.description || '' });
    setEditError('');
  };

  const saveEdit = async () => {
    if (!editForm.name.trim() || !editForm.price) { setEditError('Name and price are required'); return; }
    setEditSaving(true);
    try {
      const { data } = await api.put(`/manager/services/${editingId}`, {
        name: editForm.name.trim(),
        price: parseFloat(editForm.price),
        unit: editForm.unit,
        description: editForm.description.trim(),
      });
      if (data.success) {
        setServices(prev => prev.map(s => s._id === editingId ? data.data : s));
        setEditingId(null);
        toast.success('Service updated');
      } else { setEditError(data.message || 'Failed to save'); }
    } catch (e: any) { setEditError(e?.response?.data?.message || 'Failed to save'); }
    finally { setEditSaving(false); }
  };

  // ── Delete ──
  const deleteService = async (id: string) => {
    if (!window.confirm('Delete this service from your branch?')) return;
    try {
      await api.delete(`/manager/services/${id}`);
      setServices(prev => prev.filter(s => s._id !== id));
      toast.success('Service removed');
    } catch { toast.error('Failed to delete service'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-on-surface">Branch Services</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">Manage your branch therapy rates.</p>
        </div>
        <button
          onClick={() => { setShowAdd(true); setAddError(''); }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:opacity-90 transition-opacity w-fit"
        >
          <Plus size={16} /> Add Branch Service
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-outline-variant/10 shadow-sm overflow-hidden">
        <div className="grid grid-cols-12 px-6 py-3 bg-surface-container-low/60 border-b border-outline-variant/10">
          <span className="col-span-1 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">#</span>
          <span className="col-span-6 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Therapy Name</span>
          <span className="col-span-3 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Price (₹)</span>
          <span className="col-span-2 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest text-right">Actions</span>
        </div>

        {loading ? (
          <div className="py-16 flex items-center justify-center gap-3 text-on-surface-variant">
            <Loader2 className="animate-spin" size={22} />
          </div>
        ) : services.length === 0 ? (
          <div className="py-16 text-center text-sm text-on-surface-variant">No services found for your branch.</div>
        ) : (
          <div className="divide-y divide-outline-variant/10">
            {services.map((service, idx) => (
              <div key={service._id} className="grid grid-cols-12 items-center px-6 py-4 hover:bg-surface-container-low/40">
                <span className="col-span-1 text-sm font-bold text-on-surface-variant/50">{idx + 1}</span>
                <div className="col-span-6">
                  <span className="text-sm font-semibold text-on-surface">{service.name}</span>
                </div>
                <span className="col-span-3 text-sm font-bold text-on-surface">₹{service.price} <span className="text-[10px] font-normal text-on-surface-variant">/ {service.unit}</span></span>
                <div className="col-span-2 flex items-center justify-end gap-2">
                  <button onClick={() => startEdit(service)} className="p-2 text-primary hover:bg-primary/10 rounded-lg"><Pencil size={14} /></button>
                  <button onClick={() => deleteService(service._id)} className="p-2 text-error hover:bg-error/10 rounded-lg"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Shared Modal Logic (Edit/Add) */}
      {[
        { open: !!editingId, title: 'Edit Service', onSubmit: saveEdit, form: editForm, setForm: setEditForm, saving: editSaving, onClose: () => setEditingId(null) },
        { open: showAdd, title: 'Add Branch Service', onSubmit: handleAdd, form: addForm, setForm: setAddForm, saving: addSaving, onClose: () => setShowAdd(false) }
      ].map(({ open, title, onSubmit, form, setForm, saving, onClose }) => (
        <AnimatePresence key={title}>
          {open && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <div className="fixed inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
              <motion.div className="relative bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl">
                <h2 className="text-lg font-bold mb-4">{title}</h2>
                <div className="space-y-4">
                  <input className={INPUT_CLASS} placeholder="Service Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                  <div className="flex gap-2">
                    <input className={INPUT_CLASS} placeholder="Price" value={form.price} onChange={e => setForm({...form, price: e.target.value})} />
                    <select className={INPUT_CLASS} value={form.unit} onChange={e => setForm({...form, unit: e.target.value as any})}>
                      <option value="session">/ session</option>
                      <option value="month">/ month</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button className="flex-1 py-2 rounded-xl border" onClick={onClose}>Cancel</button>
                  <button className="flex-1 py-2 rounded-xl bg-primary text-white" onClick={onSubmit}>{saving ? '...' : 'Save'}</button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      ))}
    </div>
  );
}

const INPUT_CLASS = 'w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20';