import React from 'react';
import { motion } from 'motion/react';
import { Calendar, CheckCircle2, Activity, User, Award, Clock, Phone, MessageSquare as MessageSquareIcon } from 'lucide-react';

export default function DashboardView({ data, messages = [] }: { data: any, messages?: any[] }) {
  if (!data) return null;

  const { patient, stats } = data;

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-outline-variant/10 shadow-lg shadow-primary/5">
        <div>
          <h1 className="text-2xl md:text-3xl font-headline font-bold text-on-background">Hi, {patient.name}'s Parent!</h1>
          <p className="text-on-surface-variant font-medium mt-1 text-sm md:text-base">Here is the latest progress for your child.</p>
        </div>
        {patient.patientId && (
          <div className="bg-brand-sage/10 border border-brand-sage/20 px-5 py-2.5 rounded-2xl flex flex-col justify-center items-start sm:items-end w-fit">
            <span className="text-[10px] font-bold text-brand-sage uppercase tracking-wider">Patient ID</span>
            <span className="text-lg font-black text-brand-sage font-mono leading-none mt-1">{patient.patientId}</span>
          </div>
        )}
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div whileHover={{ y: -2 }} className="bg-white p-5 rounded-3xl border border-outline-variant/10 shadow-lg shadow-primary/5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mb-3 border border-primary/10">
            <Activity className="w-6 h-6 text-primary" />
          </div>
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Total Sessions</p>
          <p className="text-3xl font-black text-on-background tracking-tight">{stats.totalSessions}</p>
        </motion.div>
        <motion.div whileHover={{ y: -2 }} className="bg-white p-5 rounded-3xl border border-outline-variant/10 shadow-lg shadow-brand-sage/5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-sage/10 to-brand-sage/5 flex items-center justify-center mb-3 border border-brand-sage/10">
            <CheckCircle2 className="w-6 h-6 text-brand-sage" />
          </div>
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Attended</p>
          <p className="text-3xl font-black text-on-background tracking-tight">{stats.completedSessions}</p>
        </motion.div>
        <motion.div whileHover={{ y: -2 }} className="bg-white p-5 rounded-3xl border border-outline-variant/10 shadow-lg shadow-secondary/5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-secondary/10 to-secondary/5 flex items-center justify-center mb-3 border border-secondary/10">
            <Clock className="w-6 h-6 text-secondary" />
          </div>
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Days Enrolled</p>
          <p className="text-3xl font-black text-on-background tracking-tight">{stats.daysSinceAdmission}</p>
        </motion.div>
        <motion.div whileHover={{ y: -2 }} className="bg-white p-5 rounded-3xl border border-outline-variant/10 shadow-lg shadow-error/5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-error/10 to-error/5 flex items-center justify-center mb-3 border border-error/10">
            <MessageSquareIcon className="w-6 h-6 text-error" />
          </div>
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Pending Feedbacks</p>
          <p className="text-3xl font-black text-on-background tracking-tight">{stats.pendingFeedbacks}</p>
        </motion.div>
      </div>

      {/* Therapy Details */}
      <div className="bg-white rounded-3xl border border-outline-variant/20 shadow-sm p-6">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-brand-sage" /> Current Therapy Plan
        </h2>
        <div className="space-y-4">
          <div className="flex justify-between items-center py-3 border-b border-outline-variant/10">
            <span className="text-on-surface-variant font-medium">Therapy Type</span>
            <span className="font-bold capitalize">{(Array.isArray(patient.therapyType) ? patient.therapyType.join(', ') : patient.therapyType)?.replace(/_/g, ' ') || 'Not assigned'}</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-outline-variant/10">
            <span className="text-on-surface-variant font-medium">Condition / Diagnosis</span>
            <span className="font-bold">{patient.diagnosis || 'N/A'}</span>
          </div>
          <div className="flex justify-between items-center py-3 border-b border-outline-variant/10">
            <span className="text-on-surface-variant font-medium">Branch</span>
            <div className="flex items-center gap-3">
              <span className="font-bold">{patient.branch?.name || 'N/A'}</span>
              {patient.branch?.phone && (
                <a href={`tel:${patient.branch.phone}`} className="flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold hover:bg-primary/20 transition-colors">
                  <Phone size={12} /> Call Branch
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 🔥 NEW: Registration & Documents */}
      <div className="bg-white rounded-3xl border border-outline-variant/20 shadow-sm p-6">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>
          Registration & Documents
        </h2>
        <div className="flex flex-col sm:flex-row flex-wrap gap-4">
          <button 
            onClick={async () => {
              try {
                const { generatePatientPDF } = await import('@/app/manager/lib/generatePatientPDF');
                const pdfData = {
                  id: patient._id || patient.patientId,
                  patientId: patient.patientId,
                  name: patient.name,
                  parentName: patient.parentName || "Parent",
                  age: patient.age,
                  gender: patient.gender,
                  therapyType: patient.therapyType || [],
                  condition: patient.diagnosis || '',
                  diagnosis: patient.diagnosis || '',
                  address: patient.address || '',
                  phone: patient.parentPhone || '',
                  parentEmail: patient.parentEmail || '',
                  onboardedAt: patient.admissionDate || new Date().toISOString(),
                  branchName: patient.branch?.name,
                  branchAddress: patient.branch?.address,
                  branchPhone: patient.branch?.phone,
                  branchEmail: patient.branch?.email || 'rehablito@gmail.com',
                  diagnosisReportUrl: patient.diagnosisReportUrl,
                  consentFormUrl: patient.consentFormUrl,
                };
                const doc = await generatePatientPDF(pdfData as any, 'Patient Registration Record', { hidePhone: false });
                doc.save(`Registration_${patient.name.replace(/\s/g, '_')}.pdf`);
              } catch (error) {
                console.error("Failed to generate PDF:", error);
              }
            }}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-brand-sage/10 text-brand-sage font-bold hover:bg-brand-sage/20 transition-colors border border-brand-sage/20"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Download Registration Form
          </button>
          
          {patient.diagnosisReportUrl && (
            <a 
              href={patient.diagnosisReportUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-primary/10 text-primary font-bold hover:bg-primary/20 transition-colors border border-primary/20"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              View Diagnosis Report
            </a>
          )}
          
          {patient.consentFormUrl && (
            <a 
              href={patient.consentFormUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-primary/10 text-primary font-bold hover:bg-primary/20 transition-colors border border-primary/20"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              View Consent Form
            </a>
          )}
        </div>
      </div>

      {/* Announcements */}
      {messages.length > 0 && (
        <div className="bg-primary/5 rounded-3xl border border-primary/20 shadow-sm p-6 mt-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-primary">
            <MessageSquareIcon className="w-5 h-5" /> Announcements from Manager
          </h2>
          <div className="space-y-4">
            {messages.map((msg: any) => (
              <div key={msg._id} className="bg-white p-4 rounded-xl border border-outline-variant/20 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-on-surface-variant bg-surface-container-low px-2 py-1 rounded-md">{msg.senderName || 'Manager'}</span>
                  <span className="text-[10px] text-on-surface-variant">{new Date(msg.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-sm text-on-surface">{msg.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


