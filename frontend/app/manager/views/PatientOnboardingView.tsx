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
  Check,
  X,
  UploadCloud
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

interface MultiSelectOption {
  value: string;
  label: string;
  price?: number;
}

function CustomMultiSelect({
  selectedValues,
  onChange,
  options,
  placeholder,
  error
}: {
  selectedValues: string[];
  onChange: (values: string[]) => void;
  options: MultiSelectOption[];
  placeholder: string;
  error?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const toggleOption = (val: string) => {
    if (selectedValues.includes(val)) {
      onChange(selectedValues.filter(v => v !== val));
    } else {
      onChange([...selectedValues, val]);
    }
  };

  const selectedLabels = options
    .filter(o => selectedValues.includes(o.value))
    .map(o => o.label);

  const displayLabel = selectedLabels.length > 0
    ? selectedLabels.join(', ')
    : placeholder;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(p => !p)}
        className={cn(
          'w-full flex items-center justify-between gap-3 px-5 py-4 rounded-2xl border bg-surface-container-lowest transition-all outline-none text-left',
          open ? 'border-primary ring-4 ring-primary/10' : error ? 'border-error' : 'border-outline-variant/30',
          'hover:border-primary/50'
        )}
      >
        <span className={cn('text-sm font-medium truncate flex-1 block', selectedValues.length > 0 ? 'text-on-surface' : 'text-on-surface-variant/50')}>
          {displayLabel}
        </span>
        <ChevronDown size={16} className={cn('text-on-surface-variant transition-transform shrink-0', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-outline-variant/15 z-50 overflow-hidden max-h-60 overflow-y-auto">
          <div className="h-0.5 bg-gradient-to-r from-primary via-secondary to-primary/30" />
          <div className="py-1.5">
            {options.length === 0 ? (
              <p className="text-xs text-on-surface-variant/50 italic px-5 py-3">No services available...</p>
            ) : (
              options.map((opt) => {
                const isSelected = selectedValues.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => toggleOption(opt.value)}
                    className={cn(
                      'w-full flex items-center justify-between gap-3 px-5 py-3 text-sm transition-all text-left group',
                      isSelected
                        ? 'bg-primary/8 text-primary font-semibold'
                        : 'text-on-surface font-medium hover:bg-surface-container-low'
                    )}
                  >
                    <span className="flex items-center gap-3">
                      <div className={cn(
                        "w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0",
                        isSelected 
                          ? "border-primary bg-primary text-white" 
                          : "border-outline-variant/50 bg-white"
                      )}>
                        {isSelected && <Check size={12} strokeWidth={3} className="text-white" />}
                      </div>
                      <span>{opt.label}</span>
                    </span>
                    {opt.price !== undefined && (
                      <span className={cn('text-xs font-semibold shrink-0', isSelected ? 'text-primary' : 'text-on-surface-variant')}>
                        ₹{opt.price.toLocaleString()}
                      </span>
                    )}
                  </button>
                );
              })
            )}
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
    serviceIds: [] as string[],
    therapyType: '',
    diagnosis: '',
    address: '',
    branchId: '',
    phone: '',
    parentEmail: '',    // 🔥 NEW
    parentPassword: ''  // 🔥 NEW
  });
  
  // Changed to any[] to hold full branch data (address, phone, email) if available
  const [branches, setBranches] = useState<any[]>([]);
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [therapyDiscounts, setTherapyDiscounts] = useState<Record<string, number>>({});
  
  // 🔥 NEW: Document Upload States
  const [diagnosisReport, setDiagnosisReport] = useState<File | null>(null);
  const [consentForm, setConsentForm] = useState<File | null>(null);
  const [uploadingDocs, setUploadingDocs] = useState(false);
  
  // Changed to any so it can hold the branchName for PDF generation
  const [lastOnboarded, setLastOnboarded] = useState<any>(null);

  // Derived: selected services and calculated total fee
  const selectedServices = services.filter(s => formData.serviceIds.includes(s._id));
  const totalFee = selectedServices.reduce((sum, s) => {
    const discount = therapyDiscounts[s._id] || 0;
    return sum + Math.max(0, s.price - discount);
  }, 0);

  useEffect(() => {
    api.get('/manager/branches').then(({ data }) => {
      if (data.success) setBranches(data.data);
    }).catch(() => {});

    api.get('/manager/services').then(({ data }) => {
      if (data.success) setServices(data.data);
    }).catch(() => {});

    // Auto-generate patient ID
    const year = new Date().getFullYear().toString().slice(-2);
    const id = `RHBT${year}XXXX`;
    setFormData(prev => ({ ...prev, patientId: id, branchId: user?.branchId || prev.branchId }));
  }, [user]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name) newErrors.name = 'Patient name is required';
    if (!formData.parentName) newErrors.parentName = 'Parent name is required';
    if (!formData.age) newErrors.age = 'Age is required';
    if (!formData.gender) newErrors.gender = 'Gender is required';
    if (formData.serviceIds.length === 0) newErrors.serviceIds = 'At least one service is required';
    if (!formData.address) newErrors.address = 'Address is required';
    if (!formData.branchId) newErrors.branchId = 'Branch is required';
    if (!formData.phone) {
      newErrors.phone = 'Contact number is required';
    } else if (!/^\d{10}$/.test(formData.phone)) {
      newErrors.phone = 'Enter exactly 10 digits';
    }
    if (formData.parentEmail && !formData.parentPassword) {
      newErrors.parentPassword = 'Password required if creating parent portal';
    }
    if (formData.parentPassword && !formData.parentEmail) {
      newErrors.parentEmail = 'Email required if creating parent portal';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', '/rehablito/documents');
    const { data } = await api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    if (data.success) return data.url;
    throw new Error(data.message || 'Upload failed');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    setUploadingDocs(true);
    try {
      let diagnosisReportUrl;
      let consentFormUrl;
      
      try {
        if (diagnosisReport) diagnosisReportUrl = await uploadFile(diagnosisReport);
        if (consentForm) consentFormUrl = await uploadFile(consentForm);
      } catch (uploadErr) {
        setErrors({ form: 'Failed to upload documents. Please try again.' });
        return;
      } finally {
        setUploadingDocs(false);
      }

      const payload = {
        // Do NOT send patientId — let the backend auto-generate RHBT format
        name: formData.name,
        parentName: formData.parentName,
        age: parseInt(formData.age),
        gender: formData.gender.toLowerCase(),
        therapyType: selectedServices.map(s => s.name.toLowerCase().replace(/ /g, '_')),
        therapyDetails: selectedServices.map(s => ({
          therapy: s.name.toLowerCase().replace(/ /g, '_'),
          discount: therapyDiscounts[s._id] || 0
        })),
        serviceId: formData.serviceIds.length > 0 ? formData.serviceIds[0] : undefined,
        totalFee: totalFee,
        diagnosis: formData.diagnosis,
        address: formData.address,
        branchId: formData.branchId,
        parentPhone: `+91${formData.phone}`,
        parentEmail: formData.parentEmail || undefined,       // 🔥 NEW
        parentPassword: formData.parentPassword || undefined, // 🔥 NEW
        diagnosisReportUrl, // 🔥 NEW
        consentFormUrl, // 🔥 NEW
      };
      
      const { data } = await api.post('/manager/patients', payload);
      if (!data.success) { setErrors({ form: data.message || 'Failed to onboard patient' }); return; }

      const newPatient: Patient = {
        id: data.data._id,
        patientId: data.data.patientId, // Use server-generated RHBT ID
        name: data.data.name,
        parentName: data.data.parentName,
        age: data.data.age ?? parseInt(formData.age),
        gender: formData.gender,
        therapyType: selectedServices.map(s => s.name.toLowerCase().replace(/ /g, '_')),
        therapyDetails: selectedServices.map(s => ({
          therapy: s.name.toLowerCase().replace(/ /g, '_'),
          discount: therapyDiscounts[s._id] || 0
        })),
        condition: data.data.diagnosis ?? formData.diagnosis,
        diagnosis: data.data.diagnosis ?? formData.diagnosis, // 🔥 NEW
        diagnosisReportUrl: data.data.diagnosisReportUrl ?? diagnosisReportUrl, // 🔥 NEW
        consentFormUrl: data.data.consentFormUrl ?? consentFormUrl, // 🔥 NEW
        address: data.data.address ?? formData.address,
        phone: data.data.parentPhone ?? `+91${formData.phone}`,
        onboardedAt: data.data.admissionDate || data.data.createdAt || new Date().toISOString(),
        totalFee: data.data.totalFee ?? totalFee,
        serviceId: formData.serviceIds.length > 0 ? formData.serviceIds[0] : undefined,
      };

      // ── FIXED: Added Branch Details to the PDF payload ──
      const selectedBranch = branches.find(b => b._id === formData.branchId) || branches.find(b => b._id === user?.branchId);
      
      const pdfPayload = {
        ...newPatient,
        branchName: selectedBranch?.name || 'REHABLITO PHYSIO & AUTISM CENTER',
        branchAddress: selectedBranch?.address || '',
        branchPhone: selectedBranch?.phone || '',
        branchEmail: selectedBranch?.email || '',
      };

      onOnboard(newPatient);
      setLastOnboarded(pdfPayload);
      
      const year = new Date().getFullYear().toString().slice(-2);
      const newId = `RHBT${year}XXXX`;
      setFormData({ patientId: newId, name: '', parentName: '', age: '', gender: '', serviceIds: [], therapyType: '', diagnosis: '', address: '', branchId: '', phone: '', parentEmail: '', parentPassword: '' });
      setTherapyDiscounts({});
      setDiagnosisReport(null); // 🔥 NEW
      setConsentForm(null);     // 🔥 NEW

      const doc = await generatePatientPDF(pdfPayload as any, 'Patient Onboarding Record', { hidePhone: true });
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
      const doc = await generatePatientPDF(lastOnboarded, 'Patient Onboarding Record', { hidePhone: true });
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

            {/* Parent Portal Setup - Optional */}
            <div className="p-5 rounded-2xl bg-brand-sage/5 border border-brand-sage/20 space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <ShieldCheck className="w-5 h-5 text-brand-sage" />
                <h3 className="text-sm font-bold text-on-background">Parent Portal Account <span className="text-xs font-medium text-on-surface-variant ml-2">(Optional)</span></h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider px-1">Parent Email</label>
                  <input
                    type="email"
                    value={formData.parentEmail}
                    onChange={e => setFormData(prev => ({ ...prev, parentEmail: e.target.value }))}
                    className={cn(
                      "w-full bg-white border rounded-2xl px-5 py-4 focus:ring-4 focus:ring-brand-sage/10 focus:border-brand-sage outline-none transition-all",
                      errors.parentEmail ? "border-error" : "border-outline-variant/30"
                    )}
                    placeholder="parent@example.com"
                  />
                  {errors.parentEmail && <p className="text-[10px] text-error font-medium flex items-center gap-1 mt-1 px-1"><AlertCircle size={14} />{errors.parentEmail}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider px-1">Set Password</label>
                  <input
                    type="password"
                    value={formData.parentPassword}
                    onChange={e => setFormData(prev => ({ ...prev, parentPassword: e.target.value }))}
                    className={cn(
                      "w-full bg-white border rounded-2xl px-5 py-4 focus:ring-4 focus:ring-brand-sage/10 focus:border-brand-sage outline-none transition-all",
                      errors.parentPassword ? "border-error" : "border-outline-variant/30"
                    )}
                    placeholder="Minimum 6 characters"
                  />
                  {errors.parentPassword && <p className="text-[10px] text-error font-medium flex items-center gap-1 mt-1 px-1"><AlertCircle size={14} />{errors.parentPassword}</p>}
                </div>
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
                <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider px-1">Select Services / Therapies *</label>
                <CustomMultiSelect
                  selectedValues={formData.serviceIds}
                  onChange={values => setFormData(prev => ({ ...prev, serviceIds: values }))}
                  options={services.map(s => ({ value: s._id, label: s.name, price: s.price }))}
                  placeholder="Select services / therapies"
                  error={!!errors.serviceIds}
                />
                {errors.serviceIds && <p className="text-[10px] text-error font-medium flex items-center gap-1 mt-1 px-1"><AlertCircle size={14} />{errors.serviceIds}</p>}
                
                {selectedServices.length > 0 && (
                  <div className="space-y-3 mt-4 p-4 rounded-2xl bg-surface-container-low border border-outline-variant/20">
                    <h4 className="text-[11px] font-black uppercase text-secondary tracking-wider">Service Discounts</h4>
                    <div className="space-y-2.5">
                      {selectedServices.map(s => (
                        <div key={s._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-white border border-outline-variant/10">
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-on-surface truncate">{s.name}</p>
                            <p className="text-xs text-on-surface-variant/70">Catalog Price: ₹{s.price.toLocaleString()}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs font-bold text-on-surface-variant">Discount (₹):</span>
                            <input
                              type="number"
                              min={0}
                              max={s.price}
                              value={therapyDiscounts[s._id] ?? ''}
                              onChange={e => {
                                const val = Math.min(s.price, Math.max(0, Number(e.target.value) || 0));
                                setTherapyDiscounts(prev => ({ ...prev, [s._id]: val }));
                              }}
                              className="w-24 bg-surface-container-lowest border border-outline-variant/30 rounded-lg py-1 px-2 text-sm text-right focus:outline-none focus:border-secondary transition-all"
                              placeholder="0"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-outline-variant/10">
                      <span className="text-xs font-bold text-secondary">Final Combined Total Fee</span>
                      <span className="text-base font-black text-on-surface">₹{totalFee.toLocaleString()}</span>
                    </div>
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

            {/* 🔥 NEW: Optional Document Uploads */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/20">
              
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider px-1">Diagnosis Report <span className="lowercase text-on-surface-variant/60">(optional PDF/Image)</span></label>
                {diagnosisReport ? (
                  <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                      <span className="text-sm font-bold text-emerald-700 truncate">{diagnosisReport.name}</span>
                    </div>
                    <button type="button" onClick={() => setDiagnosisReport(null)} className="text-emerald-600 hover:text-emerald-800 p-1">
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="file"
                      accept=".pdf,image/*"
                      onChange={e => setDiagnosisReport(e.target.files?.[0] || null)}
                      className="w-full bg-white border border-outline-variant/30 rounded-2xl px-4 py-3 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-all text-on-surface-variant cursor-pointer"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider px-1">Signed Consent Form <span className="lowercase text-on-surface-variant/60">(optional PDF/Image)</span></label>
                {consentForm ? (
                  <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                      <span className="text-sm font-bold text-emerald-700 truncate">{consentForm.name}</span>
                    </div>
                    <button type="button" onClick={() => setConsentForm(null)} className="text-emerald-600 hover:text-emerald-800 p-1">
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="file"
                      accept=".pdf,image/*"
                      onChange={e => setConsentForm(e.target.files?.[0] || null)}
                      className="w-full bg-white border border-outline-variant/30 rounded-2xl px-4 py-3 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-all text-on-surface-variant cursor-pointer"
                    />
                  </div>
                )}
              </div>

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
                disabled={isSubmitting || uploadingDocs}
                className="w-full bg-gradient-to-r from-secondary to-secondary-container text-white font-bold py-5 rounded-2xl text-lg flex items-center justify-center gap-3 hover:shadow-xl hover:shadow-secondary/20 active:scale-[0.98] transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileText className="group-hover:translate-x-1 transition-transform" size={24} />
                {uploadingDocs ? 'Uploading Documents...' : isSubmitting ? 'Saving...' : 'Onboard Patient & Generate PDF'}
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
                    <span className="text-xs font-mono font-semibold">{lastOnboarded ? (lastOnboarded.patientId || lastOnboarded.id) : 'T-9002'}</span>
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