"use client";
import { useState, useRef, useEffect } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  Printer,
  FileText,
  ShieldCheck,
  ChevronDown,
  Check
} from 'lucide-react';
import { Patient } from '../types';
import { cn } from '../lib/utils';
import React from 'react';
import api from '@/lib/api';
import { generatePatientPDF } from '../lib/generatePatientPDF';
import { useAuth } from '@/app/context/AuthContext';

interface ServiceOption {
  _id: string;
  name: string;
  price: number;
  unit: 'session' | 'month';
}

const GENDER_OPTIONS = [
  { value: 'male',   label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other',  label: 'Other' },
];

// ── Custom Dropdown ──
interface SelectOption { value: string; label: string; icon?: string }
function CustomSelect({
  value, onChange, options, placeholder, error
}: {
  value: string;
  onChange: (v: string) => void;
  options: SelectOption[];
  placeholder: string;
  error?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find(o => o.value === value);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(p => !p)}
        className={cn(
          'w-full flex items-center justify-between gap-3 px-5 py-4 rounded-2xl border bg-surface-container-lowest transition-all outline-none',
          open ? 'border-primary ring-4 ring-primary/10' : error ? 'border-error' : 'border-outline-variant/30',
          'hover:border-primary/50'
        )}
      >
        <div className={cn('flex items-center gap-2.5 flex-1 min-w-0 text-sm font-medium', selected ? 'text-on-surface' : 'text-on-surface-variant/50')}>
          {selected ? (
            <>
              {selected.icon && <span className="text-base leading-none shrink-0">{selected.icon}</span>}
              <span className="truncate text-left block w-full">{selected.label}</span>
            </>
          ) : <span className="truncate text-left block w-full">{placeholder}</span>}
        </div>
        <ChevronDown size={16} className={cn('text-on-surface-variant transition-transform shrink-0', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-outline-variant/15 z-50 overflow-hidden">
          <div className="h-0.5 bg-gradient-to-r from-primary via-secondary to-primary/30" />
          <div className="py-1.5">
            {options.map((opt, i) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={cn(
                  'w-full flex items-center justify-between gap-3 px-5 py-3 text-sm transition-all text-left group',
                  value === opt.value
                    ? 'bg-primary/8 text-primary font-semibold'
                    : 'text-on-surface font-medium hover:bg-surface-container-low hover:pl-6'
                )}
              >
                <span className="flex items-center gap-3">
                  {opt.icon && (
                    <span className={cn(
                      'w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0',
                      value === opt.value ? 'bg-primary/15 text-primary' : 'bg-surface-container-low text-on-surface-variant'
                    )}>{opt.icon}</span>
                  )}
                  {opt.label}
                </span>
                {value === opt.value && <Check size={14} className="text-primary shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface PatientOnboardingProps {
  onOnboard: (patient: Patient) => void;
}

export default function PatientOnboardingView({ onOnboard }: PatientOnboardingProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    patientId: '',
    name: '',
    parentName: '',
    age: '',
    gender: '',
    serviceId: '',
    therapyType: '',
    diagnosis: '',
    address: '',
    branchId: '',
    phone: ''
  });
  const [branches, setBranches] = useState<{ _id: string; name: string }[]>([]);
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastOnboarded, setLastOnboarded] = useState<Patient | null>(null);

  // Derived: selected service object
  const selectedService = services.find(s => s._id === formData.serviceId) || null;

  useEffect(() => {
    api.get('/manager/branches').then(({ data }) => {
      if (data.success) setBranches(data.data);
    }).catch(() => {});

    api.get('/manager/services').then(({ data }) => {
      if (data.success) setServices(data.data);
    }).catch(() => {});

    // Auto-generate patient ID
    const id = `RX-${Date.now().toString().slice(-6)}`;
    setFormData(prev => ({ ...prev, patientId: id, branchId: user?.branchId || prev.branchId }));
  }, [user]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name) newErrors.name = 'Patient name is required';
    if (!formData.parentName) newErrors.parentName = 'Parent name is required';
    if (!formData.age) newErrors.age = 'Age is required';
    if (!formData.gender) newErrors.gender = 'Gender is required';
    if (!formData.serviceId) newErrors.serviceId = 'Service is required';
    if (!formData.address) newErrors.address = 'Address is required';
    if (!formData.branchId) newErrors.branchId = 'Branch is required';
    if (!formData.phone) {
      newErrors.phone = 'Contact number is required';
    } else if (!/^\d{10}$/.test(formData.phone)) {
      newErrors.phone = 'Enter exactly 10 digits';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      const payload = {
        patientId: formData.patientId,
        name: formData.name,
        parentName: formData.parentName,
        age: parseInt(formData.age),
        gender: formData.gender.toLowerCase(),
        therapyType: selectedService ? [selectedService.name.toLowerCase().replace(/ /g, '_')] : [],
        serviceId: formData.serviceId || undefined,
        totalFee: selectedService ? selectedService.price : 0,
        diagnosis: formData.diagnosis,
        address: formData.address,
        branchId: formData.branchId,
        parentPhone: `+91${formData.phone}`,
      };
      const { data } = await api.post('/manager/patients', payload);
      if (!data.success) { setErrors({ form: data.message || 'Failed to onboard patient' }); return; }

      const newPatient: Patient = {
        id: data.data._id,
        patientId: data.data.patientId || formData.patientId,
        name: data.data.name,
        parentName: data.data.parentName,
        age: data.data.age ?? parseInt(formData.age),
        gender: formData.gender,
        therapyType: selectedService?.name || formData.serviceId,
        condition: data.data.diagnosis ?? formData.diagnosis,
        address: data.data.address ?? formData.address,
        phone: data.data.parentPhone ?? `+91${formData.phone}`,
        onboardedAt: data.data.admissionDate || data.data.createdAt || new Date().toISOString(),
        totalFee: data.data.totalFee ?? (selectedService ? selectedService.price : 0),
        serviceId: formData.serviceId || undefined,
      };

      onOnboard(newPatient);
      setLastOnboarded(newPatient);
      const newId = `RX-${Date.now().toString().slice(-6)}`;
      setFormData({ patientId: newId, name: '', parentName: '', age: '', gender: '', serviceId: '', therapyType: '', diagnosis: '', address: '', branchId: '', phone: '' });

      const doc = await generatePatientPDF(newPatient, 'Patient Onboarding Record');
      doc.save(`Onboarding_${newPatient.name.replace(/\s/g, '_')}.pdf`);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setErrors({ form: axiosErr?.response?.data?.message || 'Failed to onboard patient' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownload = async () => {
    if (lastOnboarded) {
      const doc = await generatePatientPDF(lastOnboarded, 'Patient Onboarding Record');
      doc.save(`Onboarding_${lastOnboarded.name.replace(/\s/g, '_')}.pdf`);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 mb-8 md:mb-12">
        <div>
          <span className="text-xs font-bold tracking-widest text-secondary uppercase block mb-2">New Entry</span>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-on-surface">Patient Onboarding</h1>
        </div>
        <div className="text-left md:text-right">
          <p className="text-on-surface-variant text-sm font-medium">Session ID: <span className="font-mono">#RX-9921-A</span></p>
          <p className="text-on-surface-variant/60 text-xs">Clinical RMS v2.4.0</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* Form Section */}
        <div className="xl:col-span-7 bg-white rounded-3xl p-6 md:p-10 shadow-sm border border-outline-variant/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110 duration-700"></div>
          
          <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
            {/* Patient ID - read only */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider px-1">Patient ID</label>
              <input
                type="text"
                value={formData.patientId}
                readOnly
                className="w-full bg-surface-container-low border border-outline-variant/30 rounded-2xl px-5 py-4 font-mono text-sm text-on-surface-variant cursor-not-allowed"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider px-1">Patient Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className={cn(
                    "w-full bg-surface-container-lowest border rounded-2xl px-5 py-4 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all placeholder:text-on-surface-variant/40",
                    errors.name ? "border-error" : "border-outline-variant/30"
                  )}
                  placeholder="e.g. Aryan Sharma"
                />
                {errors.name && <p className="text-[10px] text-error font-medium flex items-center gap-1 mt-1 px-1"><AlertCircle size={14} />{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider px-1">Parent Name</label>
                <input
                  type="text"
                  value={formData.parentName}
                  onChange={e => setFormData(prev => ({ ...prev, parentName: e.target.value }))}
                  className={cn(
                    "w-full bg-surface-container-lowest border rounded-2xl px-5 py-4 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all placeholder:text-on-surface-variant/40",
                    errors.parentName ? "border-error" : "border-outline-variant/30"
                  )}
                  placeholder="e.g. Rajesh Sharma"
                />
                {errors.parentName && <p className="text-[10px] text-error font-medium flex items-center gap-1 mt-1 px-1"><AlertCircle size={14} />{errors.parentName}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider px-1">Phone Number</label>
                <div className={cn(
                  "w-full bg-surface-container-lowest border rounded-2xl px-5 py-4 flex items-center gap-3 focus-within:ring-4 focus-within:ring-primary/10 focus-within:border-primary transition-all",
                  errors.phone ? "border-error" : "border-outline-variant/30"
                )}>
                  <span className="text-on-surface font-semibold">+91</span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={formData.phone}
                    onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                    className="w-full bg-transparent outline-none"
                    placeholder="9876543210"
                  />
                </div>
                {errors.phone && <p className="text-[10px] text-error font-medium flex items-center gap-1 mt-1 px-1"><AlertCircle size={14} />{errors.phone}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider px-1">Service / Therapy</label>
                <CustomSelect
                  value={formData.serviceId}
                  onChange={v => setFormData(prev => ({ ...prev, serviceId: v }))}
                  options={services.map(s => ({ value: s._id, label: `${s.name} — ₹${s.price.toLocaleString()} / ${s.unit}` }))}
                  placeholder={services.length === 0 ? 'No services available' : 'Select service'}
                  error={!!errors.serviceId}
                />
                {errors.serviceId && <p className="text-[10px] text-error font-medium flex items-center gap-1 mt-1 px-1"><AlertCircle size={14} />{errors.serviceId}</p>}
                {selectedService && (
                  <div className="mt-2 px-4 py-3 rounded-xl bg-secondary/8 border border-secondary/20 flex items-center justify-between">
                    <span className="text-xs font-bold text-secondary">Total Fee</span>
                    <span className="text-base font-black text-on-surface">₹{selectedService.price.toLocaleString()} <span className="text-xs font-normal text-on-surface-variant">/ {selectedService.unit}</span></span>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider px-1">Age</label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={e => setFormData(prev => ({ ...prev, age: e.target.value }))}
                  className={cn(
                    "w-full bg-surface-container-lowest border rounded-2xl px-5 py-4 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all",
                    errors.age ? "border-error" : "border-outline-variant/30"
                  )}
                  placeholder="e.g. 8"
                />
                {errors.age && <p className="text-[10px] text-error font-medium flex items-center gap-1 mt-1 px-1"><AlertCircle size={14} />{errors.age}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider px-1">Gender</label>
                <CustomSelect
                  value={formData.gender}
                  onChange={v => setFormData(prev => ({ ...prev, gender: v }))}
                  options={GENDER_OPTIONS}
                  placeholder="Select gender"
                  error={!!errors.gender}
                />
                {errors.gender && <p className="text-[10px] text-error font-medium flex items-center gap-1 mt-1 px-1"><AlertCircle size={14} />{errors.gender}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider px-1">Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))}
                className={cn(
                  "w-full bg-surface-container-lowest border rounded-2xl px-5 py-4 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all placeholder:text-on-surface-variant/40",
                  errors.address ? "border-error" : "border-outline-variant/30"
                )}
                placeholder="e.g. 12, MG Road, Delhi"
              />
              {errors.address && <p className="text-[10px] text-error font-medium flex items-center gap-1 mt-1 px-1"><AlertCircle size={14} />{errors.address}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider px-1">Diagnosis / Condition</label>
              <textarea
                rows={3}
                value={formData.diagnosis}
                onChange={e => setFormData(prev => ({ ...prev, diagnosis: e.target.value }))}
                className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all resize-none"
                placeholder="Brief diagnosis or clinical notes..."
              />
            </div>

            <div className="pt-4 space-y-3">
              {errors.form && (
                <p className="text-xs text-error font-semibold flex items-center gap-2">
                  <AlertCircle size={14} />
                  {errors.form}
                </p>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-secondary to-secondary-container text-white font-bold py-5 rounded-2xl text-lg flex items-center justify-center gap-3 hover:shadow-xl hover:shadow-secondary/20 active:scale-[0.98] transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileText className="group-hover:translate-x-1 transition-transform" size={24} />
                {isSubmitting ? 'Saving...' : 'Onboard Patient & Generate PDF'}
              </button>
            </div>
          </form>
        </div>

        {/* Sidebar Section */}
        <div className="xl:col-span-5 space-y-8">
          <div className="bg-surface-container-low rounded-3xl p-8 border border-outline-variant/10 relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-secondary/10 p-3 rounded-2xl">
                  <CheckCircle2 className="text-secondary" size={24} />
                </div>
                <h3 className="text-xl font-bold">Registration Preview</h3>
              </div>
              
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm space-y-4 border border-outline-variant/5">
                  <div className="flex justify-between border-b border-surface-container-low pb-3">
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-tighter">Draft ID</span>
                    <span className="text-xs font-mono font-semibold">{lastOnboarded ? lastOnboarded.id : 'T-9002'}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] text-on-surface-variant/60 uppercase">Status</p>
                      <p className="text-sm font-semibold text-secondary">{lastOnboarded ? 'Completed' : 'Pending Submit'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-on-surface-variant/60 uppercase">Data Quality</p>
                      <p className="text-sm font-semibold text-primary">High (92%)</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={handleDownload}
                    disabled={!lastOnboarded}
                    className="flex-1 bg-surface-container-highest text-on-surface-variant font-bold py-4 rounded-2xl text-sm flex items-center justify-center gap-2 hover:bg-surface-container-high transition-colors disabled:opacity-50"
                  >
                    <Download size={20} />
                    Download PDF
                  </button>
                  <button 
                    onClick={() => window.print()}
                    disabled={!lastOnboarded}
                    className="flex-1 bg-surface-container-highest text-on-surface-variant font-bold py-4 rounded-2xl text-sm flex items-center justify-center gap-2 hover:bg-surface-container-high transition-colors disabled:opacity-50"
                  >
                    <Printer size={20} />
                    Print Form
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="relative group cursor-pointer overflow-hidden rounded-3xl h-64">
            <img 
              src="https://picsum.photos/seed/therapy/800/600" 
              alt="Therapy" 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-on-surface/80 via-transparent to-transparent flex flex-col justify-end p-8">
              <p className="text-white/60 text-[10px] uppercase font-bold tracking-widest mb-1">Clinical Standard</p>
              <h4 className="text-white text-xl font-bold leading-tight">Empowering recovery through precise digital management.</h4>
            </div>
            <div className="absolute top-6 right-6 bg-white/20 backdrop-blur-xl p-3 rounded-2xl border border-white/30">
              <ShieldCheck className="text-white" size={24} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

