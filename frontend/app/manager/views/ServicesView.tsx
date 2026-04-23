"use client";
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Pencil, Trash2, X, Check, Stethoscope, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import api from '@/lib/api';

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
      } else { setEditError(data.message || 'Failed to save'); }
    } catch (e: any) { setEditError(e?.response?.data?.message || 'Failed to save'); }
    finally { setEditSaving(false); }
  };

  // ── Delete ──
  const deleteService = async (id: string) => {
    if (!window.confirm('Delete this service?')) return;
    try {
      await api.delete(`/manager/services/${id}`);
      setServices(prev => prev.filter(s => s._id !== id));
    } catch { alert('Failed to delete service'); }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-on-surface">Services</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">Manage therapy services and their pricing for your branch.</p>
        </div>
        <button
          onClick={() => { setShowAdd(true); setAddError(''); }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:opacity-90 transition-opacity w-fit"
        >
          <Plus size={16} /> Add Service
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-outline-variant/10 shadow-sm overflow-hidden">
        <div className="grid grid-cols-12 px-6 py-3 bg-surface-container-low/60 border-b border-outline-variant/10">
          <span className="col-span-1 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">#</span>
          <span className="col-span-6 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Therapy / Service</span>
          <span className="col-span-3 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Price (₹)</span>
          <span className="col-span-2 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest text-right">Actions</span>
        </div>

        {loading ? (
          <div className="py-16 flex items-center justify-center gap-3 text-on-surface-variant">
            <Loader2 className="animate-spin" size={22} />
            <span className="text-sm font-medium">Loading services...</span>
          </div>
        ) : error ? (
          <div className="py-16 text-center text-error text-sm font-bold">{error}</div>
        ) : services.length === 0 ? (
          <div className="py-16 text-center">
            <Stethoscope className="mx-auto mb-3 text-outline-variant/50" size={36} />
            <p className="text-on-surface-variant text-sm font-medium">No services added yet.<br/>Click <strong>Add Service</strong> to get started.</p>
          </div>
        ) : (
          <div className="divide-y divide-outline-variant/10">
            {services.map((service, idx) => (
              <motion.div
                key={service._id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                className="grid grid-cols-12 items-center px-6 py-4 hover:bg-surface-container-low/40 transition-colors group"
              >
                <span className="col-span-1 text-sm font-bold text-on-surface-variant/50">{idx + 1}</span>
                <div className="col-span-6 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-secondary/10 flex items-center justify-center shrink-0">
                    <Stethoscope size={14} className="text-secondary" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-on-surface">{service.name}</span>
                    {service.description && <p className="text-[10px] text-on-surface-variant/50 mt-0.5">{service.description}</p>}
                  </div>
                </div>
                <span className="col-span-3 text-sm font-bold text-on-surface">
                  ₹{service.price.toLocaleString()}
                  <span className="text-[10px] font-normal text-on-surface-variant ml-1 uppercase">/ {service.unit}</span>
                </span>
                <div className="col-span-2 flex items-center justify-end gap-2">
                  <button onClick={() => startEdit(service)}
                    className="p-2 rounded-lg bg-primary/8 text-primary hover:bg-primary/15 transition-colors">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => deleteService(service._id)}
                    className="p-2 rounded-lg bg-error/8 text-error hover:bg-error/15 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {!loading && services.length > 0 && (
          <div className="px-6 py-3 bg-surface-container-low/40 border-t border-outline-variant/10 flex items-center justify-between">
            <span className="text-xs font-bold text-on-surface-variant">{services.length} service{services.length !== 1 ? 's' : ''}</span>
            <span className="text-xs font-bold text-on-surface-variant">
              Avg: ₹{Math.round(services.reduce((s, x) => s + x.price, 0) / services.length).toLocaleString()} / session
            </span>
          </div>
        )}
      </div>

      {/* Service Form Modal (shared for add + edit) */}
      {[
        { open: !!editingId, title: 'Edit Service', badge: 'Edit Entry', badgeColor: 'text-primary',
          form: editForm, setForm: setEditForm, error: editError, saving: editSaving,
          onSubmit: saveEdit, onClose: () => setEditingId(null), submitLabel: 'Save Changes', submitIcon: <Check size={15} /> },
        { open: showAdd, title: 'Add Service', badge: 'New Entry', badgeColor: 'text-secondary',
          form: addForm, setForm: setAddForm, error: addError, saving: addSaving,
          onSubmit: handleAdd, onClose: () => setShowAdd(false), submitLabel: 'Add Service', submitIcon: <Plus size={16} /> },
      ].map(({ open, title, badge, badgeColor, form, setForm, error: formError, saving, onSubmit, onClose, submitLabel, submitIcon }) => (
        <AnimatePresence key={title}>
          {open && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={onClose} className="fixed inset-0 bg-on-surface/40 backdrop-blur-sm" />
              <motion.div initial={{ scale: 0.95, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 16 }}
                className="relative bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 sm:p-8 z-10">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className={cn('text-[10px] font-bold uppercase tracking-widest', badgeColor)}>{badge}</p>
                    <h2 className="text-xl font-extrabold text-on-surface mt-0.5">{title}</h2>
                  </div>
                  <button onClick={onClose} className="p-2 hover:bg-surface-container-low rounded-xl transition-colors">
                    <X size={18} className="text-on-surface-variant" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Therapy Name</label>
                    <input type="text" value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      placeholder="e.g. Physiotherapy"
                      className="w-full border border-outline-variant/30 rounded-xl px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all bg-surface-container-lowest" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Description (optional)</label>
                    <input type="text" value={form.description}
                      onChange={e => setForm({ ...form, description: e.target.value })}
                      placeholder="Brief description"
                      className="w-full border border-outline-variant/30 rounded-xl px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all bg-surface-container-lowest" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Price (₹)</label>
                    <div className="flex items-center border border-outline-variant/30 rounded-xl overflow-hidden focus-within:ring-4 focus-within:ring-primary/10 focus-within:border-primary transition-all bg-surface-container-lowest">
                      <span className="px-4 py-3 text-sm font-bold text-on-surface-variant border-r border-outline-variant/20">₹</span>
                      <input type="number" value={form.price}
                        onChange={e => setForm({ ...form, price: e.target.value })}
                        placeholder="0"
                        className="flex-1 px-4 py-3 text-sm outline-none bg-transparent" />
                      <select value={form.unit}
                        onChange={e => setForm({ ...form, unit: e.target.value as 'session' | 'month' })}
                        className="px-3 py-3 text-[13px] font-medium outline-none bg-surface-container-low/50 border-l border-outline-variant/20 appearance-none cursor-pointer">
                        <option value="session">/ session</option>
                        <option value="month">/ month</option>
                      </select>
                    </div>
                  </div>
                  {formError && <p className="text-xs text-error font-medium">{formError}</p>}
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={onClose}
                    className="flex-1 py-3 rounded-xl border border-outline-variant/30 text-on-surface-variant font-bold text-sm hover:bg-surface-container-low transition-colors">
                    Cancel
                  </button>
                  <button onClick={onSubmit} disabled={saving}
                    className="flex-1 py-3 rounded-xl bg-primary text-white font-bold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-60">
                    {saving ? <Loader2 size={15} className="animate-spin" /> : submitIcon} {submitLabel}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      ))}
    </div>
  );
}
