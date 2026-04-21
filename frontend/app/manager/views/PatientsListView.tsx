"use client";
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search, Filter, MoreVertical, Phone, Calendar,
  FileText, CreditCard, User, Eye, Pencil, Trash2,
  X, Download, MapPin, Users, Activity, AlertCircle
} from 'lucide-react';
import { Patient, BillingRecord } from '../types';
import { cn } from '../lib/utils';
import { generatePatientPDF } from '../lib/generatePatientPDF';

const THERAPY_LABELS: Record<string, string> = {
  physiotherapy: 'Physiotherapy',
  speech_therapy: 'Speech Therapy',
  occupational_therapy: 'Occupational Therapy',
  aba_therapy: 'ABA Therapy',
  autism_therapy: 'Autism Therapy',
};

const THERAPY_OPTIONS = Object.entries(THERAPY_LABELS);

interface PatientsListViewProps {
  patients: Patient[];
  billing: BillingRecord[];
  onDelete: (id: string) => void;
  onUpdate: (patient: Patient) => void;
  onAddPayment: (input: any) => Promise<any>;
}

// ── Dropdown Menu ──
function CardMenu({ onView, onEdit, onDelete, onPay }: { onView: () => void; onEdit: () => void; onDelete: () => void; onPay: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(p => !p)} className="text-on-surface-variant hover:text-primary transition-colors p-1 -mr-1 rounded-lg hover:bg-surface-container-low">
        <MoreVertical size={16} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.1 }}
            className="absolute right-0 top-8 z-50 bg-white rounded-xl shadow-xl border border-outline-variant/20 w-40 overflow-hidden"
          >
            {[
              { label: 'Add Payment', icon: CreditCard, action: onPay, cls: 'text-secondary' },
              { label: 'View', icon: Eye, action: onView, cls: 'text-primary' },
              { label: 'Edit', icon: Pencil, action: onEdit, cls: 'text-on-surface' },
              { label: 'Delete', icon: Trash2, action: onDelete, cls: 'text-error' },
            ].map(({ label, icon: Icon, action, cls }) => (
              <button
                key={label}
                onClick={() => { action(); setOpen(false); }}
                className={cn('w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold hover:bg-surface-container-low transition-colors', cls)}
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const maskPhone = (phone: string) => {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return 'xxxxxx' + phone.slice(-4);
  return 'xxxxxx' + digits.slice(-4);
};

// ── View Modal — PDF style ──
function ViewModal({ patient, billing, onClose }: { patient: Patient; billing: BillingRecord[]; onClose: () => void }) {
  const stats = billing.filter(b => b.patientName.toLowerCase() === patient.name.toLowerCase());
  const totalPaid = stats.reduce((s, b) => s + b.amountPaid, 0);
  const totalDue = stats.reduce((s, b) => s + b.dueAmount, 0);

  const downloadPDF = async () => {
    const doc = await generatePatientPDF(patient, 'Patient Registration Record');
    doc.save(`Patient_${patient.name.replace(/\s/g, '_')}.pdf`);
  };

  const rows = [
    { label: 'Patient ID',       value: patient.patientId || patient.id, mono: true },
    { label: 'Patient Name',     value: patient.name },
    { label: 'Parent / Guardian',value: patient.parentName || '—' },
    { label: 'Age',              value: `${patient.age} Years` },
    { label: 'Gender',           value: patient.gender ? patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1) : '—' },
    { label: 'Contact No.',      value: patient.phone || '—' },
    { label: 'Therapy Type',     value: THERAPY_LABELS[patient.therapyType || ''] || patient.therapyType || '—' },
    { label: 'Address',          value: patient.address || '—' },
    { label: 'Onboarding Date',  value: new Date(patient.onboardedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) },
    { label: 'Status',           value: 'Active', badge: true },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <motion.div initial={{ scale: 0.95, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 16 }}
        className="relative w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden z-10 max-h-[92vh] flex flex-col bg-white">

        {/* PDF-style header band */}
        <div className="bg-[#004aad] px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl overflow-hidden flex items-center justify-center shrink-0">
              <img src="/logo.jpeg" alt="Rehablito" className="w-full h-full object-contain" />
            </div>
            <div>
              <p className="text-white font-extrabold text-base leading-tight">REHABLITO</p>
              <p className="text-blue-200 text-[10px] font-medium">Physio & Autism Center</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-blue-200 text-[10px]">{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
            <p className="text-blue-100 text-[10px] font-mono">{patient.patientId || patient.id}</p>
          </div>
          <button onClick={onClose} className="ml-4 p-1.5 hover:bg-white/20 rounded-lg transition-colors">
            <X size={18} className="text-white" />
          </button>
        </div>

        {/* Title strip */}
        <div className="bg-blue-50 px-6 py-2.5 border-b border-blue-100">
          <p className="text-[#004aad] font-extrabold text-xs uppercase tracking-widest text-center">Patient Registration Record</p>
        </div>

        {/* Info grid */}
        <div className="overflow-y-auto flex-1">
          {/* Section header */}
          <div className="bg-blue-50 border-b border-blue-100 px-6 py-2">
            <p className="text-[#004aad] font-bold text-[10px] uppercase tracking-widest">Patient Information</p>
          </div>

          <div className="divide-y divide-gray-100">
            {rows.map((row, i) => (
              <div key={row.label} className={cn('grid grid-cols-2 px-6 py-2.5', i % 2 === 0 ? 'bg-blue-50/40' : 'bg-white')}>
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">{row.label}</span>
                {row.badge
                  ? <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full w-fit">Active</span>
                  : <span className={cn('text-xs font-semibold text-gray-800', row.mono && 'font-mono text-[#004aad]')}>{row.value}</span>
                }
              </div>
            ))}
          </div>

          {/* Diagnosis */}
          <div className="bg-blue-50 border-y border-blue-100 px-6 py-2">
            <p className="text-[#004aad] font-bold text-[10px] uppercase tracking-widest">Clinical Notes / Diagnosis</p>
          </div>
          <div className="px-6 py-3 bg-white">
            <p className="text-xs text-gray-700 leading-relaxed">{patient.condition || 'No diagnosis recorded.'}</p>
          </div>

          {/* Billing */}
          <div className="grid grid-cols-2 gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
            <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Total Paid</p>
              <p className="text-lg font-extrabold text-[#004aad]">₹{totalPaid.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Total Due</p>
              <p className={cn('text-lg font-extrabold', totalDue > 0 ? 'text-red-500' : 'text-gray-400')}>₹{totalDue.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* PDF-style footer */}
        <div className="bg-[#004aad] px-6 py-2.5 flex items-center justify-between">
          <p className="text-blue-200 text-[9px]">Rehablito Physio & Autism Center — Confidential</p>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors">
              Close
            </button>
            <button onClick={downloadPDF} className="px-4 py-1.5 rounded-lg bg-white text-[#004aad] text-xs font-bold flex items-center gap-1.5 hover:bg-blue-50 transition-colors">
              <Download size={13} /> Download PDF
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ── Quick Pay Modal ──
function QuickPayModal({ patient, currentDue, currentPaid, onClose, onSave }: { patient: Patient; currentDue: number; currentPaid: number; onClose: () => void; onSave: (amount: number, due: number, method: string) => Promise<void> }) {
  const [amount, setAmount] = useState('');
  const [dueAmount, setDueAmount] = useState(String(currentDue));
  const [method, setMethod] = useState('cash');
  const [isProcessing, setIsProcessing] = useState(false);

  const fee = patient.totalFee ?? 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;
    setIsProcessing(true);
    try {
      await onSave(parseFloat(amount), parseFloat(dueAmount || '0'), method);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 z-[100]">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm" />
      <motion.div initial={{ scale: 0.95, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 16 }}
        className="relative bg-white w-full max-w-sm rounded-3xl shadow-2xl p-8 z-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-[10px] font-bold text-secondary uppercase tracking-widest">Update Ledger</p>
            <h2 className="text-xl font-extrabold text-on-surface mt-0.5">Quick Payment</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-surface-container-low rounded-xl transition-colors">
            <X size={18} className="text-on-surface-variant" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-4 bg-surface-container-lowest rounded-xl border border-outline-variant/20 shadow-sm">
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">Patient</p>
            <p className="font-bold text-on-surface">{patient.name}</p>
            {fee > 0 && (
              <div className="mt-2 flex items-center justify-between text-sm py-1.5 px-3 bg-secondary/10 text-secondary rounded-lg font-bold border border-secondary/20">
                <span className="text-[11px]">Total: ₹{fee} • Paid: ₹{currentPaid}</span>
                <span className="uppercase text-xs font-black">Due: ₹{currentDue.toLocaleString()}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Amount Paid</label>
              <input type="number" required min={0} value={amount}
                onChange={e => {
                  const paid = parseFloat(e.target.value) || 0;
                  const newDue = currentDue > 0 ? Math.max(0, currentDue - paid) : undefined;
                  setAmount(e.target.value);
                  if (newDue !== undefined) setDueAmount(String(newDue));
                }}
                className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20" placeholder="0" />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Due Amount</label>
              <input type="number" min={0} value={dueAmount} onChange={e => setDueAmount(e.target.value)}
                className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20" placeholder="0" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Method</label>
            <select value={method} onChange={e => setMethod(e.target.value)} className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 cursor-pointer appearance-none">
              <option value="cash">Cash</option>
              <option value="upi">UPI</option>
              <option value="card">Card</option>
              <option value="bank_transfer">Bank Transfer</option>
            </select>
          </div>

          <div className="pt-4 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-outline-variant/30 text-on-surface-variant font-bold text-sm hover:bg-surface-container-low transition-colors">Cancel</button>
            <button type="submit" disabled={isProcessing || !amount} className="flex-1 py-3 rounded-xl bg-secondary text-white font-bold text-sm hover:bg-secondary/90 disabled:opacity-50 transition-colors">
              {isProcessing ? 'Saving...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ── Edit Modal ──
function EditModal({ patient, onClose, onSave }: { patient: Patient; onClose: () => void; onSave: (p: Patient) => void }) {
  const [form, setForm] = useState({ ...patient });
  const set = (k: keyof Patient, v: string | number) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm" />
      <motion.div initial={{ scale: 0.95, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 16 }}
        className="relative bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden z-10 max-h-[90vh] flex">

        {/* Left branding panel */}
        <div className="hidden md:flex w-56 shrink-0 bg-gradient-to-b from-secondary to-primary flex-col items-center justify-between py-10 px-6">
          <div className="flex flex-col items-center gap-4">
            <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-lg overflow-hidden">
              <img src="/logo.jpeg" alt="Rehablito" className="w-full h-full object-contain" />
            </div>
            <div className="text-center">
              <p className="text-white font-extrabold text-lg leading-tight">Rehablito</p>
              <p className="text-white/70 text-[10px] font-bold tracking-widest uppercase mt-1">Physio & Autism</p>
            </div>
          </div>

          <div className="space-y-3 w-full">
            {[
              { label: 'Patient', value: patient.name },
              { label: 'ID', value: patient.patientId || '—' },
              { label: 'Onboarded', value: new Date(patient.onboardedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }) },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white/10 rounded-xl px-3 py-2">
                <p className="text-white/60 text-[9px] font-bold uppercase tracking-wider">{label}</p>
                <p className="text-white text-xs font-bold truncate mt-0.5">{value}</p>
              </div>
            ))}
          </div>

          <p className="text-white/40 text-[9px] text-center">Everyone Deserves Trusted Hands</p>
        </div>

        {/* Right form panel */}
        <div className="flex flex-col flex-1 min-h-0">
          <div className="px-8 py-6 border-b border-outline-variant/10 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-secondary uppercase tracking-widest">Edit Record</p>
              <h2 className="text-xl font-extrabold text-on-surface mt-0.5">Update Patient Info</h2>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-surface-container-low rounded-xl transition-colors">
              <X size={20} className="text-on-surface-variant" />
            </button>
          </div>

          <div className="overflow-y-auto flex-1 px-8 py-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Patient Name', key: 'name', type: 'text', placeholder: 'Patient name' },
                { label: 'Parent Name', key: 'parentName', type: 'text', placeholder: 'Parent name' },
                { label: 'Phone Number', key: 'phone', type: 'tel', placeholder: '+91XXXXXXXXXX' },
                { label: 'Age', key: 'age', type: 'number', placeholder: 'Age' },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key} className="space-y-1.5">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">{label}</label>
                  <input type={type} value={String((form as Record<string, unknown>)[key] ?? '')}
                    onChange={e => set(key as keyof Patient, type === 'number' ? parseInt(e.target.value) || 0 : e.target.value)}
                    placeholder={placeholder}
                    className="w-full border border-outline-variant/30 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all bg-surface-container-lowest" />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Gender</label>
                <select value={form.gender.toLowerCase()} onChange={e => set('gender', e.target.value)}
                  className="w-full border border-outline-variant/30 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none appearance-none bg-surface-container-lowest">
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Therapy</label>
                <select value={form.therapyType || ''} onChange={e => set('therapyType', e.target.value)}
                  className="w-full border border-outline-variant/30 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none appearance-none bg-surface-container-lowest">
                  <option value="">Select therapy</option>
                  {THERAPY_OPTIONS.map(([val, lbl]) => <option key={val} value={val}>{lbl}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Address</label>
              <input type="text" value={form.address || ''} onChange={e => set('address', e.target.value)}
                placeholder="Address"
                className="w-full border border-outline-variant/30 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all bg-surface-container-lowest" />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Diagnosis</label>
              <textarea rows={3} value={form.condition || ''} onChange={e => set('condition', e.target.value)}
                placeholder="Diagnosis / condition notes"
                className="w-full border border-outline-variant/30 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all resize-none bg-surface-container-lowest" />
            </div>
          </div>

          <div className="px-8 py-5 border-t border-outline-variant/10 flex gap-3">
            <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-outline-variant/30 text-on-surface-variant font-bold text-sm hover:bg-surface-container-low transition-colors">
              Cancel
            </button>
            <button onClick={() => { onSave(form); onClose(); }}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-secondary to-primary text-white font-bold text-sm hover:opacity-90 transition-opacity">
              Save Changes
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ── Delete Confirm ──
function DeleteConfirm({ name, onClose, onConfirm }: { name: string; onClose: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm" />
      <motion.div initial={{ scale: 0.95, opacity: 0, y: 16 }} animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 16 }}
        className="relative bg-white w-full max-w-sm rounded-3xl shadow-2xl p-8 z-10 text-center space-y-5">
        <div className="w-14 h-14 bg-error/10 rounded-2xl flex items-center justify-center mx-auto">
          <AlertCircle size={28} className="text-error" />
        </div>
        <div>
          <h3 className="text-xl font-extrabold text-on-surface">Delete Patient?</h3>
          <p className="text-sm text-on-surface-variant mt-1">This will permanently remove <span className="font-bold text-on-surface">{name}</span> from records.</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={onClose} className="py-3 rounded-xl border border-outline-variant/30 text-on-surface-variant font-bold text-sm hover:bg-surface-container-low transition-colors">Cancel</button>
          <button onClick={() => { onConfirm(); onClose(); }} className="py-3 rounded-xl bg-error text-white font-bold text-sm hover:opacity-90 transition-opacity">Delete</button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Main View ──
export default function PatientsListView({ patients, billing, onDelete, onUpdate, onAddPayment }: PatientsListViewProps) {
  const [search, setSearch] = useState('');
  const [viewPatient, setViewPatient] = useState<Patient | null>(null);
  const [editPatient, setEditPatient] = useState<Patient | null>(null);
  const [payPatient, setPayPatient] = useState<Patient | null>(null);
  const [deleteId, setDeleteId] = useState<{ id: string; name: string } | null>(null);

  const handleQuickPay = async (amount: number, dueAmount: number, method: string) => {
    if (!payPatient) return;
    await onAddPayment({
      patientId: payPatient.id,
      patientName: payPatient.name,
      amount,
      dueAmount,
      description: 'Quick Payment',
      method: method as any
    });
    setPayPatient(null);
  };

  const filtered = patients.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.parentName || '').toLowerCase().includes(search.toLowerCase())
  );

  const getBillingStats = (name: string) => {
    const bills = billing.filter(b => b.patientName.toLowerCase() === name.toLowerCase());
    return {
      totalPaid: bills.reduce((s, b) => s + b.amountPaid, 0),
      totalDue: bills.reduce((s, b) => s + b.dueAmount, 0),
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-on-surface font-headline tracking-tight">Patient Directory</h1>
          <p className="text-sm text-on-surface-variant font-medium">View all registered patients and billing summaries</p>
        </div>
        <div className="flex w-full md:w-auto items-center gap-3">
          <div className="flex-1 md:flex-none flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-outline-variant/20 shadow-sm">
            <Search size={16} className="text-on-surface-variant" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search patients..." className="bg-transparent border-none focus:ring-0 text-sm w-full md:w-48 placeholder:text-on-surface-variant/60" />
          </div>
          <button className="p-2.5 bg-white border border-outline-variant/20 rounded-xl hover:bg-surface-container-low transition-colors text-on-surface shadow-sm">
            <Filter size={18} />
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-outline-variant/20 text-center shadow-sm">
          <Users className="mx-auto h-12 w-12 text-outline-variant opacity-50 mb-4" />
          <h3 className="text-lg font-bold text-on-surface mb-2">{search ? 'No results found' : 'No Patients Found'}</h3>
          <p className="text-on-surface-variant text-sm">{search ? 'Try a different search term.' : 'Go to Patient Onboarding to add your first patient.'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((patient, idx) => {
            const stats = getBillingStats(patient.name);
            return (
              <motion.div key={patient.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white rounded-2xl border border-outline-variant/20 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
                <div className="p-5 border-b border-outline-variant/10 flex justify-between items-start bg-secondary/5">
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-lg text-on-surface leading-tight">{patient.name}</h3>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-on-surface-variant font-medium">
                      <span>{patient.age} yrs • {patient.gender}</span>
                      <span className="flex items-center gap-1"><Phone size={10} />{maskPhone(patient.phone || '')}</span>
                    </div>
                  </div>
                  <CardMenu
                    onView={() => setViewPatient(patient)}
                    onEdit={() => setEditPatient(patient)}
                    onDelete={() => setDeleteId({ id: patient.id, name: patient.name })}
                    onPay={() => setPayPatient(patient)}
                  />
                </div>

                <div className="p-5 flex-1 space-y-3">
                  {patient.therapyType && (
                    <div>
                      <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1 block">Therapy</span>
                      <p className="text-sm font-semibold text-secondary bg-secondary/5 inline-block px-2.5 py-1 rounded-md">
                        {THERAPY_LABELS[patient.therapyType] || patient.therapyType}
                      </p>
                    </div>
                  )}
                  <div>
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1 block">Condition</span>
                    <p className="text-sm font-semibold text-on-surface bg-surface-container-low inline-block px-2.5 py-1 rounded-md">
                      {patient.condition || 'Not specified'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-on-surface-variant">
                    <Calendar size={14} className="text-primary/70" />
                    Onboarded: {new Date(patient.onboardedAt).toLocaleDateString()}
                  </div>
                </div>

                <div className="p-5 pt-4 border-t border-outline-variant/10 bg-surface-container-lowest grid grid-cols-3 gap-2 sm:gap-4">
                  <div className="space-y-1">
                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                      <FileText size={12} className="text-on-surface-variant" /> Total
                    </span>
                    <p className="text-lg font-extrabold text-on-surface-variant">₹{(patient.totalFee || 0).toLocaleString()}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                      <CreditCard size={12} className="text-secondary" /> Paid
                    </span>
                    <p className="text-lg font-extrabold text-secondary">₹{stats.totalPaid.toLocaleString()}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                      <AlertCircle size={12} className="text-error" /> Due
                    </span>
                    <p className={cn('text-lg font-extrabold', stats.totalDue > 0 ? 'text-error' : 'text-on-surface-variant')}>
                      ₹{stats.totalDue.toLocaleString()}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {payPatient && (
          <QuickPayModal 
            patient={payPatient} 
            currentDue={getBillingStats(payPatient.id).totalDue}
            currentPaid={getBillingStats(payPatient.id).totalPaid}
            onClose={() => setPayPatient(null)} 
            onSave={handleQuickPay} 
          />
        )}
        {viewPatient && <ViewModal patient={viewPatient} billing={billing} onClose={() => setViewPatient(null)} />}
        {editPatient && <EditModal patient={editPatient} onClose={() => setEditPatient(null)} onSave={onUpdate} />}
        {deleteId && <DeleteConfirm name={deleteId.name} onClose={() => setDeleteId(null)} onConfirm={() => onDelete(deleteId.id)} />}
      </AnimatePresence>
    </div>
  );
}
