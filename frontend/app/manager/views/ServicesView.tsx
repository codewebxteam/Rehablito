"use client";
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Pencil, Trash2, X, Check, Stethoscope } from 'lucide-react';
import { cn } from '../lib/utils';

interface Service {
  id: string;
  name: string;
  price: number;
}

const DEFAULT_SERVICES: Service[] = [
  { id: '1', name: 'Physiotherapy',        price: 800 },
  { id: '2', name: 'Speech Therapy',       price: 1000 },
  { id: '3', name: 'Occupational Therapy', price: 900 },
  { id: '4', name: 'ABA Therapy',          price: 1200 },
  { id: '5', name: 'Autism Therapy',       price: 1100 },
];

export default function ServicesView() {
  const [services, setServices] = useState<Service[]>(DEFAULT_SERVICES);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', price: '' });
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', price: '' });
  const [addError, setAddError] = useState('');

  const startEdit = (s: Service) => {
    setEditingId(s.id);
    setEditForm({ name: s.name, price: String(s.price) });
  };

  const saveEdit = () => {
    if (!editForm.name.trim() || !editForm.price) return;
    setServices(prev => prev.map(s => s.id === editingId
      ? { ...s, name: editForm.name.trim(), price: parseFloat(editForm.price) || 0 }
      : s
    ));
    setEditingId(null);
  };

  const deleteService = (id: string) => {
    setServices(prev => prev.filter(s => s.id !== id));
  };

  const handleAdd = () => {
    if (!addForm.name.trim()) { setAddError('Service name is required'); return; }
    if (!addForm.price || isNaN(Number(addForm.price))) { setAddError('Valid price is required'); return; }
    setServices(prev => [...prev, {
      id: Date.now().toString(),
      name: addForm.name.trim(),
      price: parseFloat(addForm.price),
    }]);
    setAddForm({ name: '', price: '' });
    setAddError('');
    setShowAdd(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-on-surface">Services</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">Manage therapy services and their pricing.</p>
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
        {/* Table header */}
        <div className="grid grid-cols-12 px-6 py-3 bg-surface-container-low/60 border-b border-outline-variant/10">
          <span className="col-span-1 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">#</span>
          <span className="col-span-6 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Therapy / Service</span>
          <span className="col-span-3 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Price (₹)</span>
          <span className="col-span-2 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest text-right">Actions</span>
        </div>

        {services.length === 0 ? (
          <div className="py-16 text-center">
            <Stethoscope className="mx-auto mb-3 text-outline-variant/50" size={36} />
            <p className="text-on-surface-variant text-sm font-medium">No services added yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-outline-variant/10">
            {services.map((service, idx) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                className="grid grid-cols-12 items-center px-6 py-4 hover:bg-surface-container-low/40 transition-colors group"
              >
                  <>
                    <span className="col-span-1 text-sm font-bold text-on-surface-variant/50">{idx + 1}</span>
                    <div className="col-span-6 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-secondary/10 flex items-center justify-center shrink-0">
                        <Stethoscope size={14} className="text-secondary" />
                      </div>
                      <span className="text-sm font-semibold text-on-surface">{service.name}</span>
                    </div>
                    <span className="col-span-3 text-sm font-bold text-on-surface">
                      ₹{service.price.toLocaleString()}
                      <span className="text-[10px] font-normal text-on-surface-variant ml-1">/ session</span>
                    </span>
                    <div className="col-span-2 flex items-center justify-end gap-2">
                      <button onClick={() => startEdit(service)}
                        className="p-2 rounded-lg bg-primary/8 text-primary hover:bg-primary/15 transition-colors">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => deleteService(service.id)}
                        className="p-2 rounded-lg bg-error/8 text-error hover:bg-error/15 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </>
              </motion.div>
            ))}
          </div>
        )}

        {/* Footer summary */}
        <div className="px-6 py-3 bg-surface-container-low/40 border-t border-outline-variant/10 flex items-center justify-between">
          <span className="text-xs font-bold text-on-surface-variant">{services.length} service{services.length !== 1 ? 's' : ''}</span>
          <span className="text-xs font-bold text-on-surface-variant">
            Avg: ₹{services.length ? Math.round(services.reduce((s, x) => s + x.price, 0) / services.length).toLocaleString() : 0} / session
          </span>
        </div>
      </div>

        {/* Edit Service Modal */}
        <AnimatePresence>
          {editingId && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setEditingId(null)} className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm" />
              <motion.div initial={{ scale: 0.95, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 16 }}
                className="relative bg-white w-full max-w-sm rounded-3xl shadow-2xl p-8 z-10">
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
                    <input
                      autoFocus
                      type="text"
                      value={editForm.name}
                      onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))}
                      className="w-full border border-outline-variant/30 rounded-xl px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all bg-surface-container-lowest"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Price per Session (₹)</label>
                    <div className="flex items-center border border-outline-variant/30 rounded-xl overflow-hidden focus-within:ring-4 focus-within:ring-primary/10 focus-within:border-primary transition-all bg-surface-container-lowest">
                      <span className="px-4 py-3 text-sm font-bold text-on-surface-variant border-r border-outline-variant/20">₹</span>
                      <input
                        type="number"
                        value={editForm.price}
                        onChange={e => setEditForm(p => ({ ...p, price: e.target.value }))}
                        className="flex-1 px-4 py-3 text-sm outline-none bg-transparent"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={() => setEditingId(null)}
                    className="flex-1 py-3 rounded-xl border border-outline-variant/30 text-on-surface-variant font-bold text-sm hover:bg-surface-container-low transition-colors">
                    Cancel
                  </button>
                  <button onClick={saveEdit}
                    className="flex-1 py-3 rounded-xl bg-primary text-white font-bold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                    <Check size={15} /> Save Changes
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
              className="relative bg-white w-full max-w-sm rounded-3xl shadow-2xl p-8 z-10">
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
                  <input
                    type="text"
                    value={addForm.name}
                    onChange={e => { setAddForm(p => ({ ...p, name: e.target.value })); setAddError(''); }}
                    placeholder="e.g. Physiotherapy"
                    className="w-full border border-outline-variant/30 rounded-xl px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all bg-surface-container-lowest"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Price per Session (₹)</label>
                  <div className="flex items-center border border-outline-variant/30 rounded-xl overflow-hidden focus-within:ring-4 focus-within:ring-primary/10 focus-within:border-primary transition-all bg-surface-container-lowest">
                    <span className="px-4 py-3 text-sm font-bold text-on-surface-variant border-r border-outline-variant/20">₹</span>
                    <input
                      type="number"
                      value={addForm.price}
                      onChange={e => { setAddForm(p => ({ ...p, price: e.target.value })); setAddError(''); }}
                      placeholder="0"
                      className="flex-1 px-4 py-3 text-sm outline-none bg-transparent"
                    />
                  </div>
                </div>
                {addError && <p className="text-xs text-error font-medium">{addError}</p>}
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowAdd(false)}
                  className="flex-1 py-3 rounded-xl border border-outline-variant/30 text-on-surface-variant font-bold text-sm hover:bg-surface-container-low transition-colors">
                  Cancel
                </button>
                <button onClick={handleAdd}
                  className="flex-1 py-3 rounded-xl bg-primary text-white font-bold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                  <Plus size={16} /> Add Service
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
