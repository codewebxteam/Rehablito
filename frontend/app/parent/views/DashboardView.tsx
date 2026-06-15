import React from 'react';
import { motion } from 'motion/react';
import { Calendar, CheckCircle2, Activity, User, Award, Clock, Phone, MessageSquare as MessageSquareIcon } from 'lucide-react';

export default function DashboardView({ data, messages = [] }: { data: any, messages?: any[] }) {
  if (!data) return null;

  const { patient, stats } = data;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl md:text-3xl font-headline font-bold text-on-background">Hi, {patient.name}'s Parent!</h1>
        <p className="text-on-surface-variant font-medium mt-1">Here is the latest progress for your child.</p>
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


