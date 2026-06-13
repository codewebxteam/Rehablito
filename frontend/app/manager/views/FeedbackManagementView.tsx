"use client";

import React, { useState, useEffect } from 'react';
import { MessageSquare, Clock, CheckCircle2, AlertCircle, Search, Filter } from 'lucide-react';
import { cn } from '../lib/utils';
import api from '@/lib/api';

export default function FeedbackManagementView() {
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ total: 0, pending: 0, inProgress: 0, resolved: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [newStatus, setNewStatus] = useState('');

  const fetchFeedbacks = async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get(`/manager/feedbacks?status=${filter}`);
      if (data.success) {
        setFeedbacks(data.data);
        setStats(data.stats);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, [filter]);

  const handleReply = async (id: string) => {
    try {
      const payload: any = {};
      if (replyText) payload.adminReply = replyText;
      if (newStatus) payload.status = newStatus;

      const { data } = await api.put(`/manager/feedbacks/${id}`, payload);
      if (data.success) {
        setReplyingTo(null);
        setReplyText('');
        setNewStatus('');
        fetchFeedbacks();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-outline-variant/20 text-on-surface-variant rounded-full"><Clock className="w-3 h-3" /> Pending</span>;
      case 'in_progress': return <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary rounded-full"><Activity className="w-3 h-3" /> Reviewing</span>;
      case 'resolved': return <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-brand-sage/10 text-brand-sage rounded-full"><CheckCircle2 className="w-3 h-3" /> Resolved</span>;
      case 'closed': return <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-error/10 text-error rounded-full"><AlertCircle className="w-3 h-3" /> Closed</span>;
      default: return null;
    }
  };

  const filteredFeedbacks = feedbacks.filter(f => 
    f.subject.toLowerCase().includes(search.toLowerCase()) || 
    f.patientId?.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 mb-8">
        <div>
          <span className="text-xs font-bold tracking-widest text-secondary uppercase block mb-2">Communication</span>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-on-surface">Parent Feedbacks</h1>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-3xl border border-outline-variant/20 shadow-sm">
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Total Tickets</p>
          <p className="text-3xl font-black text-on-background">{stats.total}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-outline-variant/20 shadow-sm">
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Pending</p>
          <p className="text-3xl font-black text-on-background">{stats.pending}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-outline-variant/20 shadow-sm">
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">In Progress</p>
          <p className="text-3xl font-black text-primary">{stats.inProgress}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-outline-variant/20 shadow-sm">
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Resolved</p>
          <p className="text-3xl font-black text-brand-sage">{stats.resolved}</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-outline-variant/20 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-outline-variant/10 flex flex-col sm:flex-row gap-4 items-center justify-between bg-surface-container-lowest">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
            <input
              type="text"
              placeholder="Search by subject or patient name..."
              className="w-full pl-9 pr-4 py-2 bg-surface-container-low border border-outline-variant/30 rounded-xl text-sm focus:outline-none focus:border-primary transition-colors"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-on-surface-variant" />
            <select
              className="bg-surface-container-low border border-outline-variant/30 rounded-xl px-3 py-2 text-sm font-medium outline-none flex-1 sm:flex-none focus:border-primary transition-colors"
              value={filter}
              onChange={e => setFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>

        <div className="divide-y divide-outline-variant/10">
          {isLoading ? (
            <div className="p-8 text-center text-on-surface-variant font-medium">Loading feedbacks...</div>
          ) : filteredFeedbacks.length === 0 ? (
            <div className="p-12 text-center">
              <MessageSquare className="w-12 h-12 text-outline mx-auto mb-4" />
              <h3 className="text-lg font-bold text-on-background">No feedbacks found</h3>
              <p className="text-on-surface-variant text-sm mt-1">Try adjusting your filters or search query.</p>
            </div>
          ) : (
            filteredFeedbacks.map(item => (
              <div key={item._id} className="p-6 hover:bg-surface-container-lowest/50 transition-colors">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-surface-container-low text-on-surface-variant border border-outline-variant/20">{item.type}</span>
                      {getStatusBadge(item.status)}
                      <span className="text-xs text-on-surface-variant ml-2">{new Date(item.createdAt).toLocaleDateString()}</span>
                    </div>
                    <h3 className="text-lg font-bold text-on-background">{item.subject}</h3>
                    <p className="text-sm font-medium text-on-surface-variant/80">From: <span className="text-on-background">{item.parentUserId?.name}</span> (Patient: {item.patientId?.name})</p>
                    <p className="text-on-surface-variant text-sm mt-3 bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/10">{item.message}</p>
                  </div>
                  
                  <div className="md:w-72 shrink-0">
                    {item.adminReply && replyingTo !== item._id ? (
                      <div className="bg-brand-sage/5 border border-brand-sage/20 rounded-xl p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[10px] font-bold text-brand-sage uppercase tracking-wider">Your Reply</span>
                          <span className="text-[10px] text-brand-sage/60">{new Date(item.repliedAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm text-on-surface-variant mb-3">{item.adminReply}</p>
                        <button onClick={() => { setReplyingTo(item._id); setReplyText(item.adminReply); setNewStatus(item.status); }} className="text-xs font-bold text-primary hover:underline">Edit Reply</button>
                      </div>
                    ) : replyingTo === item._id ? (
                      <div className="bg-surface-container-low rounded-xl p-4 border border-outline-variant/20 space-y-3">
                        <textarea
                          rows={3}
                          className="w-full text-sm p-3 rounded-lg border border-outline-variant/30 outline-none focus:border-primary resize-none bg-white"
                          placeholder="Type your reply here..."
                          value={replyText}
                          onChange={e => setReplyText(e.target.value)}
                        />
                        <select 
                          className="w-full text-sm p-2 rounded-lg border border-outline-variant/30 outline-none bg-white"
                          value={newStatus}
                          onChange={e => setNewStatus(e.target.value)}
                        >
                          <option value="" disabled>Update Status (Optional)</option>
                          <option value="pending">Pending</option>
                          <option value="in_progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                          <option value="closed">Closed</option>
                        </select>
                        <div className="flex gap-2">
                          <button onClick={() => handleReply(item._id)} className="flex-1 bg-primary text-white text-xs font-bold py-2 rounded-lg hover:bg-primary/90">Send</button>
                          <button onClick={() => setReplyingTo(null)} className="flex-1 bg-surface-container-high text-on-surface text-xs font-bold py-2 rounded-lg hover:bg-outline-variant/20">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <button 
                        onClick={() => { setReplyingTo(item._id); setReplyText(''); setNewStatus(item.status); }}
                        className="w-full py-3 border border-outline-variant/30 rounded-xl text-sm font-bold text-on-surface hover:bg-surface-container-low hover:border-outline-variant/50 transition-colors"
                      >
                        Reply & Update Status
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
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
