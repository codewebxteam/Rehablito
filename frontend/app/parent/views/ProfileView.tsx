import React from 'react';
import { User, Phone, Mail, MapPin, CalendarDays, Stethoscope } from 'lucide-react';

export default function ProfileView({ data }: { data: any }) {
  if (!data) return null;
  const { parent, patient } = data;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl md:text-3xl font-headline font-bold text-on-background">Profile</h1>
        <p className="text-on-surface-variant font-medium mt-1">Manage parent and patient details.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Parent Profile */}
        <div className="bg-white rounded-3xl border border-outline-variant/20 shadow-sm overflow-hidden">
          <div className="bg-surface-container-low p-6 border-b border-outline-variant/10 flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center border-4 border-white shadow-sm">
              <User className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-on-background">{parent.name}</h2>
              <p className="text-xs font-bold text-primary uppercase tracking-wider">Parent Account</p>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-on-surface-variant mt-0.5" />
              <div>
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Email Address</p>
                <p className="font-medium text-on-background">{parent.email}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-on-surface-variant mt-0.5" />
              <div>
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Mobile Number</p>
                <p className="font-medium text-on-background">{parent.phone || 'Not provided'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Patient Profile */}
        {patient && (
          <div className="bg-white rounded-3xl border border-outline-variant/20 shadow-sm overflow-hidden">
            <div className="bg-surface-container-low p-6 border-b border-outline-variant/10 flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-brand-sage/10 flex items-center justify-center border-4 border-white shadow-sm">
                <span className="text-2xl font-black text-brand-sage">{patient.name.charAt(0)}</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-on-background">{patient.name}</h2>
                <p className="text-xs font-bold text-brand-sage uppercase tracking-wider">Patient Details</p>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Patient ID</p>
                  <p className="font-medium text-on-background">{patient.patientId}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Age & Gender</p>
                  <p className="font-medium text-on-background">{patient.age} / {patient.gender}</p>
                </div>
              </div>
              
              {patient.therapist?.name && (
                <div className="flex items-start gap-3 pt-2 border-t border-outline-variant/10">
                  <Stethoscope className="w-5 h-5 text-on-surface-variant mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Therapist</p>
                    <p className="font-medium text-on-background">{patient.therapist.name}</p>
                    {patient.therapist.designation && <p className="text-sm text-on-surface-variant">{patient.therapist.designation}</p>}
                  </div>
                </div>
              )}
              
              <div className="flex items-start gap-3 pt-2 border-t border-outline-variant/10">
                <CalendarDays className="w-5 h-5 text-on-surface-variant mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Admission Date</p>
                  <p className="font-medium text-on-background">{new Date(patient.admissionDate).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 pt-2 border-t border-outline-variant/10">
                <MapPin className="w-5 h-5 text-on-surface-variant mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Branch</p>
                  <p className="font-medium text-on-background">{patient.branch?.name}</p>
                  <p className="text-sm text-on-surface-variant">{patient.branch?.address}</p>
                  <p className="text-sm text-on-surface-variant">{patient.branch?.phone}</p>
                </div>
              </div>

              {/* Download Buttons */}
              <div className="pt-4 border-t border-outline-variant/10">
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={async () => {
                      try {
                        const { generatePatientPDF } = await import('@/app/manager/lib/generatePatientPDF');
                        const pdfData = {
                          id: patient._id || patient.patientId,
                          patientId: patient.patientId,
                          name: patient.name,
                          parentName: parent.name,
                          age: patient.age,
                          gender: patient.gender,
                          therapyType: patient.therapyType || [],
                          condition: patient.diagnosis || '',
                          diagnosis: patient.diagnosis || '',
                          address: patient.address || '',
                          phone: parent.phone || '',
                          parentEmail: parent.email || '',
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
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-sage/10 text-brand-sage font-bold hover:bg-brand-sage/20 transition-colors border border-brand-sage/20"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    Download Registration Form
                  </button>

                  {patient.diagnosisReportUrl && (
                    <a 
                      href={patient.diagnosisReportUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary/10 text-primary font-bold hover:bg-primary/20 transition-colors border border-primary/20"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                      View Diagnosis Report
                    </a>
                  )}

                  {patient.consentFormUrl && (
                    <a 
                      href={patient.consentFormUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary/10 text-primary font-bold hover:bg-primary/20 transition-colors border border-primary/20"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                      View Consent Form
                    </a>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}
