"use client";
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Pencil, Trash2, X, Check, Stethoscope, Loader2, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/api';

interface Branch { _id: string; name: string; }
interface Service {
  _id: string;
  name: string;
  price: number;
  unit: 'session' | 'month';
  description?: string;
  branchIds: Branch[];
}

const EMPTY_FORM = { name: '', price: '', unit: 'session' as 'session' | 'month', description: '', branchIds: [] as string[] };

export const ServicesView = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
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
      const { data } = await api.get('/admin/services');
      if (data.success) setServices(data.data);
    } catch { setError('Failed to load services'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchServices();
    api.get('/admin/branches').then(({ data }) => {
      if (data.success) setBranches(data.data);
    }).catch(() => {});
  }, [fetchServices]);

  // ── Branch multi-select toggle ──
  const toggleBranch = (id: string, form: typeof EMPTY_FORM, setForm: (f: typeof EMPTY_FORM) => void) => {
    setForm({
      ...form,
      branchIds: form.branchIds.includes(id)
        ? form.branchIds.filter(b => b !== id)
        : [...form.branchIds, id],
    });
  };

  // ── Add ──
  const handleAdd = async () => {
    if (!addForm.name.trim()) { setAddError('Service name is required'); return; }
    if (!addForm.price || isNaN(Number(addForm.price))) { setAddError('Valid price is required'); return; }
    setAddSaving(true);
    try {
      const { data } = await api.post('/admin/services', {
        name: addForm.name.trim(),
        price: parseFloat(addForm.price),
        unit: addForm.unit,
        description: addForm.description.trim(),
        branchIds: addForm.branchIds,
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
    setEditForm({ name: s.name, price: String(s.price), unit: s.unit, description: s.description || '', branchIds: s.branchIds.map(b => b._id) });
    setEditError('');
  };

  const saveEdit = async () => {
    if (!editForm.name.trim() || !editForm.price) { setEditError('Name and price are required'); return; }
    setEditSaving(true);
    try {
      const { data } = await api.put(`/admin/services/${editingId}`, {
        name: editForm.name.trim(),
        price: parseFloat(editForm.price),
        unit: editForm.unit,
        description: editForm.description.trim(),
        branchIds: editForm.branchIds,
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
      await api.delete(`/admin/services/${id}`);
      setServices(prev => prev.filter(s => s._id !== id));
    } catch { alert('Failed to delete service'); }
  };

  const branchLabel = (s: Service) =>
    s.branchIds.length === 0
      ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary/10 text-secondary text-[10px] font-bold">All Branches</span>
      : s.branchIds.map(b => (
          <span key={b._id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/8 text-primary text-[10px] font-bold mr-1">{b.name}</span>
        ));

  // ── Branch chips component ──
  const BranchSelector = ({ form, setForm }: { form: typeof EMPTY_FORM, setForm: (f: typeof EMPTY_FORM) => void }) => (
    <div className="space-y-1.5">
      <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5">
        <Building2 size={12} /> Branch Availability
        <span className="text-on-surface-variant/50 font-normal normal-case tracking-normal">(leave empty = all branches)</span>
      </label>
      <div className="flex flex-wrap gap-2">
        {branches.map(b => (
          <button
            key={b._id}
            type="button"
            onClick={() => toggleBranch(b._id, form, setForm)}
            className={cn(
              'px-3 py-1.5 rounded-xl text-xs font-bold border transition-all',
              form.branchIds.includes(b._id)
                ? 'bg-primary text-white border-primary'
                : 'bg-surface-container-low text-on-surface-variant border-outline-variant/20 hover:border-primary/50'
            )}
          >{b.name}</button>
        ))}
        {branches.length === 0 && <p className="text-xs text-on-surface-variant/50">No branches found</p>}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 lg:space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/10">
        <div>
          <h1 className="text-2xl font-black font-headline text-on-surface">Therapy Services</h1>
          <p className="text-sm font-medium text-on-surface-variant opacity-80 mt-1">Manage global therapy offerings and base pricing.</p>
        </div>
        <button
          onClick={() => { setShowAdd(true); setAddError(''); }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-bold shadow-lg shadow-primary/20 hover:opacity-90 hover:-translate-y-0.5 transition-all w-fit"
        >
          <Plus size={18} /> Add Service
        </button>
      </div>

      {/* Table */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/10 overflow-hidden">
        {/* Table header */}
        <div className="hidden sm:grid grid-cols-12 px-6 py-4 bg-surface-container-low/30 border-b border-outline-variant/10">
          <span className="col-span-1 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider opacity-70">#</span>
          <span className="col-span-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider opacity-70">Therapy / Service</span>
          <span className="col-span-2 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider opacity-70">Base Price (₹)</span>
          <span className="col-span-3 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider opacity-70">Branch</span>
          <span className="col-span-2 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider opacity-70 text-right">Actions</span>
        </div>

        {loading ? (
          <div className="py-16 flex items-center justify-center gap-3 text-on-surface-variant">
            <Loader2 className="animate-spin" size={24} />
            <span className="text-sm font-bold">Loading services...</span>
          </div>
        ) : error ? (
          <div className="py-16 text-center text-error text-sm font-bold">{error}</div>
        ) : services.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-surface-container-low mx-auto flex items-center justify-center mb-4">
              <Stethoscope className="text-on-surface-variant opacity-50" size={32} />
            </div>
            <p className="text-on-surface-variant text-sm font-bold opacity-70">No services configured yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-surface-container-low/50">
            {services.map((service, idx) => (
              <motion.div
                key={service._id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                className="grid grid-cols-1 sm:grid-cols-12 items-center gap-4 sm:gap-0 px-6 py-5 hover:bg-surface-container-low/20 transition-colors group"
              >
                <span className="hidden sm:block col-span-1 text-sm font-black text-on-surface-variant opacity-40">{idx + 1}</span>
                <div className="col-span-1 sm:col-span-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Stethoscope size={20} className="text-primary" />
                  </div>
                  <div>
                    <span className="text-base font-bold text-on-surface">{service.name}</span>
                    {service.description && <p className="text-xs text-on-surface-variant/60 mt-0.5">{service.description}</p>}
                  </div>
                </div>
                <div className="col-span-1 sm:col-span-2 flex items-baseline gap-1">
                  <span className="text-sm font-medium text-on-surface-variant sm:hidden">Price:</span>
                  <span className="text-base font-black text-on-surface">₹{service.price.toLocaleString()}</span>
                  <span className="text-xs font-bold text-on-surface-variant opacity-60 uppercase">/ {service.unit}</span>
                </div>
                <div className="col-span-1 sm:col-span-3 flex flex-wrap gap-1">
                  {branchLabel(service)}
                </div>
                <div className="col-span-1 sm:col-span-2 flex items-center justify-start sm:justify-end gap-2 mt-2 sm:mt-0">
                  <button onClick={() => startEdit(service)}
                    className="p-2.5 rounded-xl bg-surface-container text-on-surface-variant hover:text-primary hover:bg-primary/10 transition-colors border border-outline-variant/10">
                    <Pencil size={18} />
                  </button>
                  <button onClick={() => deleteService(service._id)}
                    className="p-2.5 rounded-xl bg-surface-container text-on-surface-variant hover:text-error hover:bg-error/10 transition-colors border border-outline-variant/10">
                    <Trash2 size={18} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Footer summary */}
        {!loading && services.length > 0 && (
          <div className="px-6 py-4 bg-surface-container-low/20 border-t border-outline-variant/10 flex flex-wrap gap-4 items-center justify-between">
            <span className="text-xs font-black text-on-surface-variant opacity-70 uppercase tracking-wider">{services.length} Total Services</span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-on-surface-variant">Average rate:</span>
              <span className="text-sm font-black text-on-surface bg-white px-3 py-1 rounded-lg border border-outline-variant/10 shadow-sm">
                ₹{Math.round(services.reduce((s, x) => s + x.price, 0) / services.length).toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Edit Service Modal */}
      <AnimatePresence>
        {editingId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setEditingId(null)} className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 16 }}
              className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 z-10 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Edit Entry</p>
                  <h2 className="text-xl font-extrabold text-on-surface mt-0.5">Edit Service</h2>
                </div>
                <button onClick={() => setEditingId(null)} className="p-2 hover:bg-surface-container-low rounded-xl transition-colors">
                  <X size={18} className="text-on-surface-variant" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Therapy Name</label>
                  <input autoFocus type="text" value={editForm.name}
                    onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                    className="w-full border border-outline-variant/30 rounded-xl px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all bg-surface-container-lowest" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Description (optional)</label>
                  <input type="text" value={editForm.description}
                    onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))}
                    placeholder="Brief description"
                    className="w-full border border-outline-variant/30 rounded-xl px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all bg-surface-container-lowest" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Price (₹)</label>
                  <div className="flex items-center border border-outline-variant/30 rounded-xl overflow-hidden focus-within:ring-4 focus-within:ring-primary/10 focus-within:border-primary transition-all bg-surface-container-lowest">
                    <span className="px-4 py-3 text-sm font-bold text-on-surface-variant border-r border-outline-variant/20">₹</span>
                    <input type="number" value={editForm.price}
                      onChange={e => setEditForm(p => ({ ...p, price: e.target.value }))}
                      className="flex-1 px-4 py-3 text-sm outline-none bg-transparent" />
                    <select value={editForm.unit}
                      onChange={e => setEditForm(p => ({ ...p, unit: e.target.value as 'session' | 'month' }))}
                      className="px-3 py-3 text-[13px] font-medium outline-none bg-surface-container-low/50 border-l border-outline-variant/20 appearance-none cursor-pointer">
                      <option value="session">/ session</option>
                      <option value="month">/ month</option>
                    </select>
                  </div>
                </div>
                <BranchSelector form={editForm} setForm={setEditForm} />
                {editError && <p className="text-xs text-error font-medium">{editError}</p>}
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setEditingId(null)}
                  className="flex-1 py-3 rounded-xl border border-outline-variant/30 text-on-surface-variant font-bold text-sm hover:bg-surface-container-low transition-colors">
                  Cancel
                </button>
                <button onClick={saveEdit} disabled={editSaving}
                  className="flex-1 py-3 rounded-xl bg-primary text-white font-bold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-60">
                  {editSaving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />} Save Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Service Modal */}
      <AnimatePresence>
        {showAdd && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowAdd(false)} className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 16 }}
              className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl p-8 z-10 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-[10px] font-bold text-secondary uppercase tracking-widest">New Entry</p>
                  <h2 className="text-xl font-extrabold text-on-surface mt-0.5">Add Service</h2>
                </div>
                <button onClick={() => setShowAdd(false)} className="p-2 hover:bg-surface-container-low rounded-xl transition-colors">
                  <X size={18} className="text-on-surface-variant" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Therapy Name</label>
                  <input type="text" value={addForm.name}
                    onChange={e => { setAddForm(p => ({ ...p, name: e.target.value })); setAddError(''); }}
                    placeholder="e.g. Physiotherapy"
                    className="w-full border border-outline-variant/30 rounded-xl px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all bg-surface-container-lowest" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Description (optional)</label>
                  <input type="text" value={addForm.description}
                    onChange={e => setAddForm(p => ({ ...p, description: e.target.value }))}
                    placeholder="Brief description"
                    className="w-full border border-outline-variant/30 rounded-xl px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all bg-surface-container-lowest" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Price per Session (₹)</label>
                  <div className="flex items-center border border-outline-variant/30 rounded-xl overflow-hidden focus-within:ring-4 focus-within:ring-primary/10 focus-within:border-primary transition-all bg-surface-container-lowest">
                    <span className="px-4 py-3 text-sm font-bold text-on-surface-variant border-r border-outline-variant/20">₹</span>
                    <input type="number" value={addForm.price}
                      onChange={e => { setAddForm(p => ({ ...p, price: e.target.value })); setAddError(''); }}
                      placeholder="0"
                      className="flex-1 px-4 py-3 text-sm outline-none bg-transparent" />
                    <select value={addForm.unit}
                      onChange={e => setAddForm(p => ({ ...p, unit: e.target.value as 'session' | 'month' }))}
                      className="px-3 py-3 text-[13px] font-medium outline-none bg-surface-container-low/50 border-l border-outline-variant/20 appearance-none cursor-pointer">
                      <option value="session">/ session</option>
                      <option value="month">/ month</option>
                    </select>
                  </div>
                </div>
                <BranchSelector form={addForm} setForm={setAddForm} />
                {addError && <p className="text-xs text-error font-medium">{addError}</p>}
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowAdd(false)}
                  className="flex-1 py-3 rounded-xl border border-outline-variant/30 text-on-surface-variant font-bold text-sm hover:bg-surface-container-low transition-colors">
                  Cancel
                </button>
                <button onClick={handleAdd} disabled={addSaving}
                  className="flex-1 py-3 rounded-xl bg-primary text-white font-bold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-60">
                  {addSaving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Add Service
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
