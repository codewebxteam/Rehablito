"use client";
import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import React from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';

import { useBranch } from '../components/BranchContext';

export const PaymentsView = () => {
  const { selectedBranchId } = useBranch();
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const [isLoadingPending, setIsLoadingPending] = useState(false);
  const [selectedPending, setSelectedPending] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingPage, setPendingPage] = useState(1);
  const TX_PER_PAGE = 10;

  useEffect(() => {
    fetchPendingApprovals();
  }, [selectedBranchId]);

  const fetchPendingApprovals = async () => {
    setIsLoadingPending(true);
    try {
      const branchParam = selectedBranchId ? `?branch=${selectedBranchId}` : '';
      const res = await api.get(`/admin/fees/pending-approvals${branchParam}`);
      if (res.data.success) {
        setPendingApprovals(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load pending approvals');
    } finally {
      setIsLoadingPending(false);
    }
  };

  const handleApprove = async (id: string) => {
    if (!window.confirm('Are you sure you want to approve this payment?')) return;
    setIsProcessing(true);
    try {
      const res = await api.put(`/admin/fees/${id}/approve-manual`);
      if (res.data.success) {
        toast.success('Payment approved successfully');
        setPendingApprovals(prev => prev.filter(p => p._id !== id));
        setSelectedPending(null);
      }
    } catch (err) {
      toast.error('Approval failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (id: string) => {
    if (!window.confirm('Are you sure you want to reject this payment?')) return;
    setIsProcessing(true);
    try {
      const res = await api.put(`/admin/fees/${id}/reject-manual`);
      if (res.data.success) {
        toast.success('Payment rejected');
        setPendingApprovals(prev => prev.filter(p => p._id !== id));
        setSelectedPending(null);
      }
    } catch (err) {
      toast.error('Rejection failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatINR = (amount: number | string) => `\u20B9${amount}`;
  const formatDate = (isoStr: string) => {
    return new Date(isoStr).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-on-surface">Payment Approvals</h2>
          <p className="text-on-surface-variant font-medium mt-1 text-sm md:text-base">Review and approve manual payments submitted by parents.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 items-start">
        {/* Left Column: List */}
        <div className="col-span-12 md:col-span-12 space-y-8">
          {/* Table / Cards */}
          <div className="bg-surface-container-low rounded-xl overflow-hidden shadow-sm">
            <div className="p-6 flex justify-between items-center bg-surface-container-high/50">
              <h4 className="font-bold text-lg">Pending Approvals</h4>
              <span className="text-xs font-bold text-on-surface-variant">{pendingApprovals.length} records</span>
            </div>
            
            {isLoadingPending ? (
              <div className="py-20 flex flex-col items-center justify-center">
                <div className="w-10 h-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin mb-3"></div>
                <p className="text-sm text-on-surface-variant font-medium">Loading pending approvals...</p>
              </div>
            ) : pendingApprovals.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center text-center">
                <CheckCircle className="w-12 h-12 text-secondary mb-3 opacity-50" />
                <p className="text-on-surface-variant font-medium">No pending approvals</p>
              </div>
            ) : (
              <>
                <div className="divide-y divide-outline-variant/10">
                  {pendingApprovals.slice((pendingPage - 1) * TX_PER_PAGE, pendingPage * TX_PER_PAGE).map((record) => (
                    <div 
                      key={record._id} 
                      onClick={() => setSelectedPending(record)}
                      className={cn(
                        "p-4 sm:p-6 space-y-4 cursor-pointer transition-colors",
                        selectedPending?._id === record._id ? "bg-primary/5" : "bg-surface-container-lowest hover:bg-surface-container-low"
                      )}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary shrink-0">
                            <AlertCircle size={20} />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-on-surface truncate">{record.patientId?.name || 'Unknown'}</h4>
                            <p className="text-xs text-on-surface-variant">{formatDate(record.createdAt)}</p>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700">
                          Review Required
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest mb-1">Paid Amount</p>
                          <p className="font-bold text-on-surface">{formatINR(record.amountPaid?.toLocaleString() || record.amount?.toLocaleString() || 0)}</p>
                        </div>
                        <div className="flex justify-end items-center gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleApprove(record._id); }}
                            disabled={isProcessing}
                            className="p-2 bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors disabled:opacity-50"
                            title="Approve"
                          >
                            <CheckCircle size={18} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleReject(record._id); }}
                            disabled={isProcessing}
                            className="p-2 bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition-colors disabled:opacity-50"
                            title="Reject"
                          >
                            <XCircle size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {pendingApprovals.length > TX_PER_PAGE && (
                  <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3.5 border-t border-outline-variant/10 bg-surface-container-lowest">
                    <p className="text-xs font-medium text-on-surface-variant">
                      Showing <span className="font-bold text-on-surface">{(pendingPage - 1) * TX_PER_PAGE + 1}–{Math.min(pendingPage * TX_PER_PAGE, pendingApprovals.length)}</span> of <span className="font-bold text-on-surface">{pendingApprovals.length}</span>
                    </p>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setPendingPage(p => Math.max(1, p - 1))} disabled={pendingPage === 1}
                        className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-low disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                        ‹
                      </button>
                      {Array.from({ length: Math.ceil(pendingApprovals.length / TX_PER_PAGE) }, (_, i) => i + 1).map(p => (
                        <button key={p} onClick={() => setPendingPage(p)}
                          className={cn('w-8 h-8 rounded-lg text-xs font-bold transition-colors',
                            pendingPage === p ? 'bg-primary text-white' : 'text-on-surface-variant hover:bg-surface-container-low'
                          )}>{p}</button>
                      ))}
                      <button onClick={() => setPendingPage(p => Math.min(Math.ceil(pendingApprovals.length / TX_PER_PAGE), p + 1))} disabled={pendingPage === Math.ceil(pendingApprovals.length / TX_PER_PAGE)}
                        className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-low disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                        ›
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Right Column: Receipt Preview / Pending View */}
        {/* Receipt / Pending Modals */}
        <AnimatePresence>
        {selectedPending && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative"
            >
              <button 
                onClick={() => {
                  setSelectedPending(null);
                }}
                className="absolute top-4 right-4 p-2 bg-surface-container hover:bg-surface-container-high rounded-full transition-colors"
              >
                <XCircle size={24} className="text-on-surface-variant" />
              </button>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-base text-on-surface">Review Payment</h4>
              </div>
              <div className="bg-surface-container-lowest rounded-2xl shadow-xl border border-outline-variant/10 overflow-hidden">
                <div className="bg-amber-50 px-5 py-4 border-b border-amber-100">
                  <h5 className="font-bold text-amber-800 text-sm">Payment Verification</h5>
                  <p className="text-amber-700/80 text-xs mt-1">Please verify the payment screenshot and amount.</p>
                </div>
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-bold text-on-surface-variant uppercase">Patient</p>
                      <p className="font-semibold text-sm">{selectedPending.patientId?.name || 'Unknown'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-on-surface-variant uppercase">Amount</p>
                      <p className="font-bold text-primary text-sm">{formatINR(selectedPending.amountPaid?.toLocaleString() || selectedPending.amount?.toLocaleString() || 0)}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-on-surface-variant uppercase mb-2">Screenshot Proof</p>
                    {selectedPending.screenshot ? (
                      <div className="border border-outline-variant/20 rounded-xl overflow-hidden bg-surface-container">
                        <img 
                          src={selectedPending.screenshot.startsWith('http') ? selectedPending.screenshot : `http://localhost:5000${selectedPending.screenshot}`} 
                          alt="Payment Proof" 
                          className="w-full object-contain max-h-[400px]"
                        />
                      </div>
                    ) : (
                      <div className="p-4 bg-surface-container rounded-xl text-center text-sm text-on-surface-variant">
                        No screenshot provided
                      </div>
                    )}
                  </div>
                </div>
                <div className="p-4 bg-surface-container-low border-t border-outline-variant/10 flex gap-3">
                  <button
                    onClick={() => handleReject(selectedPending._id)}
                    disabled={isProcessing}
                    className="flex-1 py-2.5 bg-error-container text-on-error-container font-bold rounded-xl shadow-sm hover:opacity-90 transition-all disabled:opacity-50 text-sm"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleApprove(selectedPending._id)}
                    disabled={isProcessing}
                    className="flex-1 py-2.5 bg-primary text-white font-bold rounded-xl shadow-md hover:opacity-90 transition-all disabled:opacity-50 text-sm flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={16} /> Approve
                  </button>
                </div>
              </div>
            </div>
      </motion.div></div>)}
      </AnimatePresence>
      </div>
    </div>
  );
}
