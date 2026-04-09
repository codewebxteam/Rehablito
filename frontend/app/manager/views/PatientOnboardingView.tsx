"use client";
import { useState } from 'react';
import { 
  UserPlus, 
  AlertCircle, 
  CheckCircle2, 
  Download, 
  Printer, 
  FileText,
  ShieldCheck
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { Patient } from '../types';
import { cn } from '../lib/utils';
import React from 'react';

interface PatientOnboardingProps {
  onOnboard: (patient: Patient) => void;
}

export default function PatientOnboardingView({ onOnboard }: PatientOnboardingProps) {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: '',
    condition: '',
    phone: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastOnboarded, setLastOnboarded] = useState<Patient | null>(null);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name) newErrors.name = 'Full legal name is required';
    if (!formData.age) newErrors.age = 'Age is required';
    if (!formData.gender) newErrors.gender = 'Gender selection is required';
    if (!formData.condition) newErrors.condition = 'Medical condition summary is required';
    if (!formData.phone) {
      newErrors.phone = 'Contact number is required';
    } else if (!/^\d{10}$/.test(formData.phone)) {
      newErrors.phone = 'Enter exactly 10 digits';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generatePDF = (patient: Patient) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(0, 74, 198); // Primary color
    doc.text('REHABLITO CLINICAL OPS', 20, 20);
    
    doc.setFontSize(12);
    doc.setTextColor(67, 70, 85); // On-surface variant
    doc.text('Patient Onboarding Record', 20, 30);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 35);
    doc.text(`Session ID: #RX-${Math.floor(Math.random() * 10000)}-A`, 20, 40);
    
    // Divider
    doc.setDrawColor(195, 198, 215); // Outline variant
    doc.line(20, 45, 190, 45);
    
    // Patient Details
    doc.setFontSize(14);
    doc.setTextColor(25, 28, 30); // On-surface
    doc.text('Patient Information', 20, 55);
    
    doc.setFontSize(11);
    doc.text(`Name: ${patient.name}`, 20, 65);
    doc.text(`Age: ${patient.age}`, 20, 72);
    doc.text(`Gender: ${patient.gender}`, 20, 79);
    doc.text(`Contact: ${patient.phone}`, 20, 86);
    
    doc.text('Medical Condition Summary:', 20, 96);
    doc.setFontSize(10);
    const splitCondition = doc.splitTextToSize(patient.condition, 160);
    doc.text(splitCondition, 20, 103);
    
    // Footer
    doc.setFontSize(9);
    doc.setTextColor(115, 118, 134);
    doc.text('St. Jude Medical Center - Central Management', 20, 280);
    
    return doc;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    
    // Simulate API delay
    setTimeout(() => {
      const newPatient: Patient = {
        id: `P-${Math.floor(Math.random() * 100000)}`,
        name: formData.name,
        age: parseInt(formData.age),
        gender: formData.gender,
        condition: formData.condition,
        phone: `+91${formData.phone}`,
        onboardedAt: new Date().toISOString()
      };
      
      onOnboard(newPatient);
      setLastOnboarded(newPatient);
      setIsSubmitting(false);
      setFormData({ name: '', age: '', gender: '', condition: '', phone: '' });
      
      // Auto-download PDF as requested
      const doc = generatePDF(newPatient);
      doc.save(`Onboarding_${newPatient.name.replace(/\s/g, '_')}.pdf`);
    }, 1000);
  };

  const handleDownload = () => {
    if (lastOnboarded) {
      const doc = generatePDF(lastOnboarded);
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider px-1">Full Legal Name</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className={cn(
                    "w-full bg-surface-container-lowest border rounded-2xl px-5 py-4 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all placeholder:text-on-surface-variant/40",
                    errors.name ? "border-error" : "border-outline-variant/30"
                  )}
                  placeholder="e.g. Sarah J. Mitchell"
                />
                {errors.name && (
                  <p className="text-[10px] text-error font-medium flex items-center gap-1 mt-1 px-1">
                    <AlertCircle size={14} />
                    {errors.name}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider px-1">Contact Number</label>
                <div
                  className={cn(
                    "w-full bg-surface-container-lowest border rounded-2xl px-5 py-4 flex items-center gap-3 focus-within:ring-4 focus-within:ring-primary/10 focus-within:border-primary transition-all",
                    errors.phone ? "border-error" : "border-outline-variant/30"
                  )}
                >
                  <span className="text-on-surface font-semibold">+91</span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={formData.phone}
                    onChange={e => {
                      const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setFormData(prev => ({ ...prev, phone: digitsOnly }));
                    }}
                    className="w-full bg-transparent outline-none"
                    placeholder="9876543210"
                  />
                </div>
                {errors.phone && (
                  <p className="text-[10px] text-error font-medium flex items-center gap-1 mt-1 px-1">
                    <AlertCircle size={14} />
                    {errors.phone}
                  </p>
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
                  placeholder="24"
                />
                {errors.age && (
                  <p className="text-[10px] text-error font-medium flex items-center gap-1 mt-1 px-1">
                    <AlertCircle size={14} />
                    {errors.age}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider px-1">Assigned Gender</label>
                <select 
                  value={formData.gender}
                  onChange={e => setFormData(prev => ({ ...prev, gender: e.target.value }))}
                  className={cn(
                    "w-full bg-surface-container-lowest border rounded-2xl px-5 py-4 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all appearance-none",
                    errors.gender ? "border-error" : "border-outline-variant/30"
                  )}
                >
                  <option value="" disabled>Select option</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other / Prefer not to say</option>
                </select>
                {errors.gender && (
                  <p className="text-[10px] text-error font-medium flex items-center gap-1 mt-1 px-1">
                    <AlertCircle size={14} />
                    {errors.gender}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider px-1">Medical Condition Summary</label>
              <textarea 
                rows={4}
                value={formData.condition}
                onChange={e => setFormData(prev => ({ ...prev, condition: e.target.value }))}
                className={cn(
                  "w-full bg-surface-container-lowest border rounded-2xl px-5 py-4 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all resize-none",
                  errors.condition ? "border-error" : "border-outline-variant/30"
                )}
                placeholder="Detail symptoms, duration, and any pre-existing clinical notes..."
              />
              {errors.condition && (
                <p className="text-[10px] text-error font-medium flex items-center gap-1 mt-1 px-1">
                  <AlertCircle size={14} />
                  {errors.condition}
                </p>
              )}
            </div>

            <div className="pt-4">
              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-secondary to-secondary-container text-white font-bold py-5 rounded-2xl text-lg flex items-center justify-center gap-3 hover:shadow-xl hover:shadow-secondary/20 active:scale-[0.98] transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileText className="group-hover:translate-x-1 transition-transform" size={24} />
                {isSubmitting ? 'Processing...' : 'Onboard Patient & Generate PDF'}
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

