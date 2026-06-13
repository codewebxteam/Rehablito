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
              
              <div className="flex items-start gap-3 pt-2 border-t border-outline-variant/10">
                <Stethoscope className="w-5 h-5 text-on-surface-variant mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Therapist</p>
                  <p className="font-medium text-on-background">{patient.therapist?.name || 'Not Assigned'}</p>
                  <p className="text-sm text-on-surface-variant">{patient.therapist?.designation}</p>
                </div>
              </div>
              
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
