import React, { useState } from 'react';
import { MessageSquare, Plus, Clock, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { cn } from '../../manager/lib/utils';
import api from '@/lib/api';

export default function FeedbackView({ feedbacks, onRefresh, patientId }: { feedbacks: any[], onRefresh: () => void, patientId?: string }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ type: 'feedback', subject: '', message: '' });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-outline-variant/20 text-on-surface-variant rounded-full"><Clock className="w-3 h-3" /> Pending</span>;
      case 'in_progress':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary rounded-full"><Activity className="w-3 h-3" /> Reviewing</span>;
      case 'resolved':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-brand-sage/10 text-brand-sage rounded-full"><CheckCircle2 className="w-3 h-3" /> Resolved</span>;
      case 'closed':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-error/10 text-error rounded-full"><AlertCircle className="w-3 h-3" /> Closed</span>;
      default:
        return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { data } = await api.post('/parent/feedbacks', formData);
      if (data.success) {
        setIsModalOpen(false);
        setFormData({ type: 'feedback', subject: '', message: '' });
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <header>
          <h1 className="text-2xl md:text-3xl font-headline font-bold text-on-background">Feedback</h1>
          <p className="text-on-surface-variant font-medium mt-1">Communicate with branch management.</p>
        </header>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-brand-sage hover:bg-brand-sage/90 text-white p-3 rounded-full md:rounded-xl md:px-4 md:py-2 flex items-center gap-2 transition-all shadow-md shadow-brand-sage/20"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden md:inline font-bold">New Message</span>
        </button>
      </div>

      <div className="space-y-4">
        {feedbacks.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-outline-variant/20 shadow-sm">
            <div className="w-16 h-16 bg-surface-container-low rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-8 h-8 text-outline" />
            </div>
            <h3 className="text-lg font-bold">No feedback yet</h3>
            <p className="text-on-surface-variant text-sm mt-1 max-w-xs mx-auto">You haven't submitted any feedback or requests yet.</p>
          </div>
        ) : (
          feedbacks.map((item) => (
            <div key={item._id} className="bg-white rounded-2xl border border-outline-variant/20 shadow-sm p-5 overflow-hidden relative">
              {item.status === 'resolved' && <div className="absolute top-0 left-0 w-1.5 h-full bg-brand-sage" />}
              {item.status === 'in_progress' && <div className="absolute top-0 left-0 w-1.5 h-full bg-primary" />}
              {item.status === 'pending' && <div className="absolute top-0 left-0 w-1.5 h-full bg-outline-variant" />}
              
              <div className="flex justify-between items-start mb-3">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-on-surface-variant">{item.type}</span>
                  <h3 className="font-bold text-lg leading-tight text-on-background">{item.subject}</h3>
                </div>
                {getStatusBadge(item.status)}
              </div>
              
              <p className="text-on-surface-variant text-sm mb-4">{item.message}</p>
              
              <div className="flex items-center gap-2 text-xs text-on-surface-variant font-medium pt-3 border-t border-outline-variant/10">
                <Clock className="w-3.5 h-3.5" /> {new Date(item.createdAt).toLocaleDateString()}
              </div>

              {item.adminReply && (
                <div className="mt-4 bg-brand-sage/5 border border-brand-sage/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-5 h-5 rounded-full bg-brand-sage/20 flex items-center justify-center">
                      <span className="text-[8px] font-bold text-brand-sage">RM</span>
                    </div>
                    <span className="text-xs font-bold text-brand-sage">Rehablito Management</span>
                    <span className="text-[10px] text-on-surface-variant/70 ml-auto">{new Date(item.repliedAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-on-surface-variant">{item.adminReply}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* New Feedback Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 md:p-6 border-b border-outline-variant/10 flex justify-between items-center bg-surface">
              <h3 className="font-bold text-xl">New Message</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-on-surface-variant hover:text-error transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-4 overflow-y-auto">
              <div className="space-y-1.5">
                <label className="text-sm font-bold ml-1">Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {['feedback', 'request', 'complaint'].map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setFormData({...formData, type: t})}
                      className={cn(
                        "py-2 px-3 text-xs font-bold uppercase tracking-wider rounded-xl transition-all",
                        formData.type === t ? "bg-primary/10 text-primary border-primary/20 border" : "bg-surface-container-low text-on-surface-variant hover:bg-outline-variant/20 border border-transparent"
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold ml-1">Subject</label>
                <input
                  type="text"
                  required
                  placeholder="E.g., Therapy timing change"
                  className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant/30 rounded-xl focus:border-brand-sage outline-none focus:ring-4 focus:ring-brand-sage/10 transition-all text-sm"
                  value={formData.subject}
                  onChange={e => setFormData({...formData, subject: e.target.value})}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold ml-1">Message</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Describe your request or feedback in detail..."
                  className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant/30 rounded-xl focus:border-brand-sage outline-none focus:ring-4 focus:ring-brand-sage/10 transition-all text-sm resize-none"
                  value={formData.message}
                  onChange={e => setFormData({...formData, message: e.target.value})}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-brand-sage text-white font-bold rounded-xl shadow-lg shadow-brand-sage/20 disabled:opacity-50 hover:bg-brand-sage/90 transition-all active:scale-[0.98] mt-2"
              >
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Activity(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
    </svg>
  );
}
