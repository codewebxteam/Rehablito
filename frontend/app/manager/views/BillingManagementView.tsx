"use client";
import { useState, useMemo, useEffect } from 'react';
import { 
  TrendingUp, 
  AlertCircle, 
  FileText, 
  Download, 
  Printer, 
  Edit, 
  Trash2, 
  Plus,
  Filter,
  CheckCircle,
  XCircle,
  Eye
} from 'lucide-react';
import { BillingRecord, NewPaymentInput, Patient } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import React from 'react';
import { SearchableSelect } from '../../components/SearchableSelect';
import { exportToCSV } from '../lib/csvExport';
import { Button } from '../components/ui/Button';
import api from '@/lib/api';
import { toast } from 'sonner';
import { generateAndPrintReceipt } from '@/lib/receiptHelper';

interface BillingManagementProps {
  billing: BillingRecord[];
  patients: Patient[];
  onAddPayment: (input: NewPaymentInput) => Promise<BillingRecord | null>;
  onDeleteBilling: (id: string) => void;
  onUpdateBilling: (record: BillingRecord) => void;
  isLoading?: boolean;
}

export default function BillingManagementView({ billing, patients, onAddPayment, onDeleteBilling, onUpdateBilling, isLoading = false }: BillingManagementProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'pending'>('all');
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const [isLoadingPending, setIsLoadingPending] = useState(false);
  const [selectedPending, setSelectedPending] = useState<any>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<BillingRecord | null>(billing[0] || null);

  useEffect(() => {
    if (activeTab === 'pending') {
      fetchPendingApprovals();
    }
  }, [activeTab]);

  const fetchPendingApprovals = async () => {
    setIsLoadingPending(true);
    try {
      const res = await api.get('/manager/billing/pending-approvals');
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
      const res = await api.put(`/manager/billing/${id}/approve-manual`);
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
      const res = await api.put(`/manager/billing/${id}/reject-manual`);
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
  
  const selectedPatientContext = useMemo(() => {
    if (!selectedInvoice) return null;
    const p = patients.find(pat => (pat.id && pat.id === selectedInvoice.patientId) || pat.name.toLowerCase() === selectedInvoice.patientName.toLowerCase());
    if (!p) return null;
    const allPatientBills = billing
      .filter(b => (b.patientId && b.patientId === p.id) || b.patientName?.toLowerCase() === p.name.toLowerCase());
      
    // Filter to only show bills that happened BEFORE or AT the same time as the selected one
    const patientBills = allPatientBills.filter(b => {
      const bDate = new Date(b.date).getTime();
      const sDate = new Date(selectedInvoice.date).getTime();
      if (bDate < sDate) return true;
      if (bDate === sDate) {
        // If same day, we assume the one with HIGHER dueAmount came earlier (or is the current one)
        return b.dueAmount >= selectedInvoice.dueAmount;
      }
      return false;
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
    const totalFee = p.totalFee || 0;
    const paidAtTime = Math.max(0, totalFee - selectedInvoice.dueAmount);
    
    const therapyDetails = p.therapyDetails || [];
    const totalDiscount = therapyDetails.reduce((sum: number, d: any) => sum + (Number(d.discount) || 0), 0);
    const totalBasePrice = totalFee + totalDiscount;
    
    return {
      patient: p,
      totalFee,
      totalBasePrice,
      totalDiscount,
      totalPaidAtTime: paidAtTime,
      outstandingAtTime: selectedInvoice.dueAmount,
      allPayments: patientBills
    };
  }, [selectedInvoice, patients, billing]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [editingRecord, setEditingRecord] = useState<BillingRecord | null>(null);
  const [txPage, setTxPage] = useState(1);
  const TX_PER_PAGE = 10;
  const [newPayment, setNewPayment] = useState({
    patientId: '',
    amount: '',
    dueAmount: '',
    description: 'General Consultation',
    method: 'cash' as NonNullable<BillingRecord['method']>,
  });
  const formatINR = (amount: number | string) => `\u20B9${amount}`;

  const getPendingAmount = (record: any) => {
    if (!record) return 0;
    const pendingTx = record.transactions?.find((tx: any) => tx.status === 'pending' || tx.transactionId === 'pending_approval');
    return pendingTx ? pendingTx.amountPaid : (record.amountPaid || record.amount || 0);
  };

  // Derived: selected patient's total fee
  // Derived: selected patient's current due
  const currentDueForSelected = useMemo(() => {
    const p = patients.find(p => p.id === newPayment.patientId);
    if (!p) return 0;
    const alreadyPaid = billing
      .filter(b => b.patientId === p.id || b.patientName.toLowerCase() === p.name.toLowerCase())
      .reduce((s, b) => s + b.amountPaid, 0);
    return Math.max(0, (p.totalFee || 0) - alreadyPaid);
  }, [patients, newPayment.patientId, billing]);

  const stats = useMemo(() => {
    const total = billing.reduce((acc, curr) => acc + curr.amountPaid, 0);
    const pending = patients.reduce((acc, p) => {
      const patientPaid = billing
        .filter(b => (b.patientId && b.patientId === p.id) || b.patientName.toLowerCase() === p.name.toLowerCase())
        .reduce((sum, b) => sum + b.amountPaid, 0);
      return acc + Math.max(0, (p.totalFee || 0) - patientPaid);
    }, 0);
    const overdueCount = billing.filter(b => (b.dueAmount ?? 0) > 0).length;
    const activePlans = new Set(
      billing.map(b => b.patientId).filter((id): id is string => Boolean(id))
    ).size;
    return {
      total: total.toLocaleString(),
      pending: pending.toLocaleString(),
      transactions: billing.length,
      overdueCount,
      activePlans,
    };
  }, [billing]);

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(newPayment.amount);
    const dueAmount = newPayment.dueAmount ? parseFloat(newPayment.dueAmount) : 0;
    if (!newPayment.patientId || isNaN(amount)) return;

    const patient = patients.find(p => p.id === newPayment.patientId);
    setIsProcessing(true);
    try {
      const record = await onAddPayment({
        patientId: newPayment.patientId,
        patientName: patient?.name || '',
        amount,
        dueAmount,
        description: newPayment.description || undefined,
        method: newPayment.method,
      });
      if (record) {
        setIsModalOpen(false);
        setNewPayment({ patientId: '', amount: '', dueAmount: '', description: 'General Consultation', method: 'cash' });
        setSelectedInvoice(record);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateBilling = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRecord) {
      setIsProcessing(true);
      setTimeout(() => {
        onUpdateBilling(editingRecord);
        setIsEditModalOpen(false);
        setEditingRecord(null);
        if (selectedInvoice?.id === editingRecord.id) {
          setSelectedInvoice(editingRecord);
        }
        setIsProcessing(false);
      }, 800);
    }
  };

  const handleDeleteBilling = (id: string) => {
    if (window.confirm('Are you sure you want to delete this billing record?')) {
      onDeleteBilling(id);
      if (selectedInvoice?.id === id) {
        setSelectedInvoice(billing.find(b => b.id !== id) || null);
      }
    }
  };

  const handleExportCSV = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const exportData = billing.map(record => ({
        'Invoice ID': record.id,
        'Patient Name': record.patientName,
        'Amount Paid': record.amountPaid,
        'Due Amount': record.dueAmount,
        Date: record.date
      }));
      exportToCSV(exportData, `Billing_Export_${new Date().toISOString().split('T')[0]}`);
      setIsProcessing(false);
    }, 1000);
  };

  return (
    <div className="max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-on-surface">Financial Ledger</h2>
          <p className="text-on-surface-variant font-medium mt-1 text-sm md:text-base">Manage patient accounts and rehabilitation invoicing.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <Button 
            variant="surface"
            onClick={handleExportCSV}
            isLoading={isProcessing}
            className="flex-1 sm:flex-none"
          >
            <Download size={20} />
            Export CSV
          </Button>
          <Button 
            variant="primary"
            onClick={() => setIsModalOpen(true)}
            className="flex-1 sm:flex-none bg-gradient-to-br from-primary to-primary-container"
          >
            <Plus size={20} />
            Add Payment
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 items-start">
        {/* Left Column: List */}
        <div className="col-span-12 md:col-span-7 space-y-8">
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/10 shadow-sm">
              {isLoading ? (
                <div className="w-full h-16 bg-slate-200/60 animate-pulse rounded-lg" />
              ) : (
                <>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60 mb-2">Total Collected</p>
                  <h3 className="text-xl md:text-2xl font-extrabold text-on-surface">{formatINR(stats.total)}</h3>
                  <div className="flex items-center gap-1 mt-2 text-secondary font-bold text-[10px]">
                    <TrendingUp size={12} />
                    {stats.transactions} transactions
                  </div>
                </>
              )}
            </div>
            <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/10 shadow-sm">
              {isLoading ? (
                <div className="w-full h-16 bg-slate-200/60 animate-pulse rounded-lg" />
              ) : (
                <>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60 mb-2">Pending Dues</p>
                  <h3 className="text-xl md:text-2xl font-extrabold text-error">{formatINR(stats.pending)}</h3>
                  <div className="flex items-center gap-1 mt-2 text-error font-bold text-[10px]">
                    <AlertCircle size={12} />
                    {stats.overdueCount} with dues
                  </div>
                </>
              )}
            </div>
            <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/10 shadow-sm">
              {isLoading ? (
                <div className="w-full h-16 bg-slate-200/60 animate-pulse rounded-lg" />
              ) : (
                <>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60 mb-2">Active Plans</p>
                  <h3 className="text-xl md:text-2xl font-extrabold text-primary">{stats.activePlans}</h3>
                  <div className="flex items-center gap-1 mt-2 text-on-surface-variant font-bold text-[10px]">
                    Unique patients billed
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 border-b border-outline-variant/20">
            <button
              onClick={() => { setActiveTab('all'); setSelectedPending(null); }}
              className={cn("pb-3 px-2 text-sm font-bold border-b-2 transition-colors", activeTab === 'all' ? "border-primary text-primary" : "border-transparent text-on-surface-variant hover:text-on-surface")}
            >
              All Transactions
            </button>
            <button
              onClick={() => { setActiveTab('pending'); setSelectedInvoice(null); }}
              className={cn("pb-3 px-2 text-sm font-bold border-b-2 transition-colors flex items-center gap-2", activeTab === 'pending' ? "border-primary text-primary" : "border-transparent text-on-surface-variant hover:text-on-surface")}
            >
              Pending Approvals
              {pendingApprovals.length > 0 && (
                <span className="bg-error text-white text-[10px] px-1.5 py-0.5 rounded-full">{pendingApprovals.length}</span>
              )}
            </button>
          </div>

          {/* Table / Cards */}
          <div className="bg-surface-container-low rounded-xl overflow-hidden shadow-sm">
            {activeTab === 'all' ? (
              <>
            <div className="p-6 flex justify-between items-center bg-surface-container-high/50">
              <h4 className="font-bold text-lg">Transaction History</h4>
              <span className="text-xs font-bold text-on-surface-variant">{billing.length} records</span>
            </div>
            
            {/* Desktop/Tablet Table View (> 640px) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left min-w-[600px]">
                <thead className="bg-surface-container-low">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant/60">Patient</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant/60">Amount Paid</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant/60">Due Amount</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant/60">Date</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant/60">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="py-20 text-center">
                        <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin mx-auto mb-4"></div>
                        <p className="text-on-surface-variant font-medium">Loading transactions...</p>
                      </td>
                    </tr>
                  ) : (
                    billing.slice((txPage - 1) * TX_PER_PAGE, txPage * TX_PER_PAGE).map((record) => (
                      <tr 
                        key={record.uniqueKey || record.id} 
                      onClick={() => setSelectedInvoice(record)}
                      className={cn(
                        "cursor-pointer transition-colors group",
                        (selectedInvoice?.uniqueKey || selectedInvoice?.id) === (record.uniqueKey || record.id) ? "bg-primary/5" : "bg-surface-container-lowest hover:bg-surface-container-low"
                      )}
                    >
                      <td className="px-6 py-5">
                        <span className="font-semibold text-on-surface">{record.patientName}</span>
                      </td>
                      <td className="px-6 py-5">
                        <span className="inline-flex items-center gap-1 bg-secondary/10 text-secondary font-bold text-sm px-3 py-1.5 rounded-xl">
                          {formatINR(record.amountPaid.toLocaleString())}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <span className={cn(
                          "inline-flex items-center gap-1 font-bold text-sm px-3 py-1.5 rounded-xl",
                          record.dueAmount > 0 ? "bg-error/10 text-error" : "bg-surface-container-low text-on-surface-variant/40"
                        )}>
                          {formatINR(record.dueAmount.toLocaleString())}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-on-surface-variant text-sm">{record.date}</td>
                      <td className="px-6 py-5">
                        <span className={cn(
                          "inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                          record.dueAmount === 0 ? "bg-secondary-container/30 text-on-secondary-container" : "bg-error-container/30 text-on-error-container"
                        )}>
                          {record.dueAmount === 0 ? 'Paid' : 'Pending'}
                        </span>
                      </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View (< 640px) */}
            <div className="sm:hidden divide-y divide-outline-variant/10">
              {isLoading ? (
                <div className="py-20 flex flex-col items-center justify-center">
                  <div className="w-10 h-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin mb-3"></div>
                  <p className="text-sm text-on-surface-variant font-medium">Loading transactions...</p>
                </div>
              ) : (
                billing.slice((txPage - 1) * TX_PER_PAGE, txPage * TX_PER_PAGE).map((record) => (
                  <div 
                    key={record.uniqueKey || record.id} 
                  onClick={() => setSelectedInvoice(record)}
                  className={cn(
                    "p-4 sm:p-6 space-y-4 cursor-pointer transition-colors",
                    (selectedInvoice?.uniqueKey || selectedInvoice?.id) === (record.uniqueKey || record.id) ? "bg-primary/5" : "bg-surface-container-lowest"
                  )}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-primary font-bold text-sm shrink-0">
                        {record.patientName.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-on-surface truncate">{record.patientName}</h4>
                        <p className="text-xs text-on-surface-variant">{record.date}</p>
                      </div>
                    </div>
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider",
                      record.dueAmount === 0 ? "bg-secondary-container/30 text-on-secondary-container" : "bg-error-container/30 text-on-error-container"
                    )}>
                      {record.dueAmount === 0 ? 'Paid' : 'Pending'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest mb-1">Paid</p>
                      <p className="font-bold text-on-surface">{formatINR(record.amountPaid.toLocaleString())}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest mb-1">Due</p>
                      <p className={cn("font-bold", record.dueAmount > 0 ? "text-error" : "text-on-surface-variant/40")}>
                        {formatINR(record.dueAmount.toLocaleString())}
                      </p>
                    </div>
                  </div>
                </div>
                ))
              )}
            </div>

            {/* Pagination */}
            {billing.length > TX_PER_PAGE && (
              <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3.5 border-t border-outline-variant/10 bg-surface-container-lowest">
                <p className="text-xs font-medium text-on-surface-variant">
                  Showing <span className="font-bold text-on-surface">{(txPage - 1) * TX_PER_PAGE + 1}–{Math.min(txPage * TX_PER_PAGE, billing.length)}</span> of <span className="font-bold text-on-surface">{billing.length}</span>
                </p>
                <div className="flex items-center gap-1">
                  <button onClick={() => setTxPage(p => Math.max(1, p - 1))} disabled={txPage === 1}
                    className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-low disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                    ‹
                  </button>
                  {Array.from({ length: Math.ceil(billing.length / TX_PER_PAGE) }, (_, i) => i + 1).map(p => (
                    <button key={p} onClick={() => setTxPage(p)}
                      className={cn('w-8 h-8 rounded-lg text-xs font-bold transition-colors',
                        txPage === p ? 'bg-primary text-white' : 'text-on-surface-variant hover:bg-surface-container-low'
                      )}>{p}</button>
                  ))}
                  <button onClick={() => setTxPage(p => Math.min(Math.ceil(billing.length / TX_PER_PAGE), p + 1))} disabled={txPage === Math.ceil(billing.length / TX_PER_PAGE)}
                    className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-low disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                    ›
                  </button>
                </div>
              </div>
            )}
            </>
            ) : (
              <>
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
                  <div className="divide-y divide-outline-variant/10">
                    {pendingApprovals.map((record) => (
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
                              <h4 className="font-bold text-on-surface truncate">
                                {record.patientId?.name || 'Unknown'}
                                {record.patientId?.patientId ? ` (${record.patientId.patientId})` : ''}
                              </h4>
                              <p className="text-xs text-on-surface-variant">{new Date(record.createdAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <span className="px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700">
                            Review Required
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-4 items-center">
                          <div>
                            <p className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest mb-1">Paid Amount</p>
                            <p className="font-bold text-on-surface text-xs sm:text-sm">{formatINR(getPendingAmount(record).toLocaleString())}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest mb-1">Transaction ID / UTR</p>
                            <p className="font-mono font-semibold text-xs text-on-surface truncate">
                              {record.transactions?.find((t: any) => t.status === 'pending')?.transactionId || 'N/A'}
                            </p>
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
                )}
              </>
            )}
          </div>
        </div>

        {/* Right Column: Receipt Preview / Pending View */}
        <div className="col-span-12 md:col-span-5 md:sticky md:top-24">
          {activeTab === 'pending' && selectedPending ? (
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
                      <p className="font-semibold text-sm">
                        {selectedPending.patientId?.name || 'Unknown'}
                        {selectedPending.patientId?.patientId ? ` (${selectedPending.patientId.patientId})` : ''}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-on-surface-variant uppercase">Amount</p>
                      <p className="font-bold text-primary text-sm">{formatINR(getPendingAmount(selectedPending).toLocaleString())}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-on-surface-variant uppercase">Payment Method</p>
                      <p className="font-semibold text-sm">
                        {(() => {
                          const method = selectedPending.transactions?.find((t: any) => t.status === 'pending')?.method || selectedPending.method;
                          if (method === 'qr_scan') return 'UPI / QR Code';
                          if (method === 'bank_transfer') return 'Bank Transfer';
                          return method ? method.replace(/_/g, ' ').toUpperCase() : 'N/A';
                        })()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-on-surface-variant uppercase">Transaction ID / UTR</p>
                      <p className="font-mono font-semibold text-sm text-slate-600">
                        {selectedPending.transactions?.find((t: any) => t.status === 'pending')?.transactionId || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-on-surface-variant uppercase mb-2">Screenshot Proof</p>
                    {selectedPending.screenshot ? (
                      <div className="border border-outline-variant/20 rounded-xl overflow-hidden bg-surface-container hover:opacity-90 transition-opacity">
                        <a 
                          href={selectedPending.screenshot.startsWith('http') ? selectedPending.screenshot : `http://localhost:5000${selectedPending.screenshot}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          title="Click to view full image and zoom"
                          className="cursor-zoom-in block"
                        >
                          <img 
                            src={selectedPending.screenshot.startsWith('http') ? selectedPending.screenshot : `http://localhost:5000${selectedPending.screenshot}`} 
                            alt="Payment Proof" 
                            className="w-full object-contain max-h-[400px]"
                          />
                        </a>
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
          ) : activeTab === 'all' && selectedInvoice ? (
            <div className="space-y-4">
              {/* Action bar */}
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-base text-on-surface">Receipt Preview</h4>
                <div className="flex gap-2">
                  <button onClick={() => { setEditingRecord(selectedInvoice); setIsEditModalOpen(true); }}
                    className="bg-surface-container-high p-2 rounded-lg text-on-surface-variant hover:text-primary transition-all">
                    <Edit size={16} />
                  </button>
                  <button onClick={() => handleDeleteBilling(selectedInvoice.id)}
                    className="bg-surface-container-high p-2 rounded-lg text-on-surface-variant hover:text-error transition-all">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* PDF-style receipt card */}
              <div id="receipt-print-area" className="rounded-2xl overflow-hidden shadow-xl border border-outline-variant/10">

                {/* Blue header band */}
                <div className="bg-[#004aad] px-5 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-white rounded-xl overflow-hidden flex items-center justify-center shrink-0">
                      <img src="/logo.jpeg" alt="Rehablito" className="w-full h-full object-contain" />
                    </div>
                    <div>
                      <p className="text-white font-extrabold text-sm leading-tight">REHABLITO</p>
                      <p className="text-blue-200 text-[10px]">Physio & Autism Center</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-blue-200 text-[10px]">{selectedInvoice.date}</p>
                    <p className="text-blue-100 text-[10px] font-mono">{selectedInvoice.receiptNumber || selectedInvoice.id.slice(-8).toUpperCase()}</p>
                  </div>
                </div>

                {/* Title strip */}
                <div className="bg-blue-50 px-5 py-2 border-b border-blue-100">
                  <p className="text-[#004aad] font-extrabold text-xs uppercase tracking-widest text-center">Payment Receipt</p>
                </div>

                {/* Info rows */}
                <div className="bg-white">
                  <div className="bg-blue-50 border-b border-blue-100 px-5 py-2">
                    <p className="text-[#004aad] font-bold text-[10px] uppercase tracking-widest">Transaction Details</p>
                  </div>
                  {[
                    { label: 'Receipt No.',   value: selectedInvoice.receiptNumber || selectedInvoice.id.slice(-8).toUpperCase(), mono: true },
                    { label: 'Patient Name',  value: selectedInvoice.patientName },
                    { label: 'Date',          value: selectedInvoice.date },
                    { label: 'Method',        value: selectedInvoice.method ? selectedInvoice.method.replace('_', ' ').toUpperCase() : 'CASH' },
                    { label: 'Description',   value: selectedInvoice.description || selectedInvoice.items?.[0]?.description || 'General Consultation' },
                    { label: 'Status',        value: selectedInvoice.dueAmount === 0 ? 'Paid' : 'Partial', badge: true },
                  ].map((row, i) => (
                    <div key={row.label} className={cn('grid grid-cols-2 px-5 py-2.5', i % 2 === 0 ? 'bg-blue-50/40' : 'bg-white')}>
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">{row.label}</span>
                      {row.badge
                        ? <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full w-fit',
                            selectedInvoice.dueAmount === 0 ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600')}>
                            {row.value}
                          </span>
                        : <span className={cn('text-xs font-semibold text-gray-800', row.mono && 'font-mono text-[#004aad]')}>{row.value}</span>
                      }
                    </div>
                  ))}

                  {/* History section */}
                  {selectedPatientContext?.allPayments && selectedPatientContext.allPayments.length > 0 && (
                    <>
                      <div className="bg-blue-50 border-y border-blue-100 px-5 py-2">
                        <p className="text-[#004aad] font-bold text-[10px] uppercase tracking-widest">Payment History Breakdown</p>
                      </div>
                      <div className="px-5 py-3 space-y-1.5 bg-white">
                        {selectedPatientContext.allPayments.map((p, idx) => {
                          const isCurrent = (p.uniqueKey || p.id) === (selectedInvoice.uniqueKey || selectedInvoice.id);
                          return (
                            <div key={p.uniqueKey || p.id} className={cn(
                              "flex justify-between text-[11px] p-2 rounded-lg border transition-colors",
                              isCurrent ? "bg-blue-50 border-blue-200" : "bg-gray-50 border-gray-100"
                            )}>
                              <div className="flex flex-col">
                                <span className={cn("font-bold", isCurrent ? "text-blue-700" : "text-gray-700")}>
                                  {isCurrent ? "Current Payment" : `Payment #${idx + 1}`}
                                </span>
                                <span className="text-[9px] text-gray-400">{p.date}</span>
                              </div>
                              <span className={cn("font-black", isCurrent ? "text-blue-700" : "text-gray-900")}>
                                {formatINR(p.amountPaid.toLocaleString())}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}

                  {/* Amount section */}
                  <div className="bg-blue-50 border-y border-blue-100 px-5 py-2">
                    <p className="text-[#004aad] font-bold text-[10px] uppercase tracking-widest">Payment Summary</p>
                  </div>
                  <div className="px-5 py-3 bg-white space-y-2">
                    {selectedInvoice.items?.length > 0 && selectedInvoice.items.map((item, i) => (
                      <div key={i} className="flex justify-between text-xs">
                        <span className="text-gray-500">{item.description} × {item.sessions}</span>
                        <span className="font-bold text-gray-800">{formatINR(item.price.toLocaleString())}</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-xs pt-1 border-t border-gray-100">
                      <span className="font-bold text-gray-500">Total Base Fee</span>
                      <span className="font-bold text-gray-800">{formatINR((selectedPatientContext?.totalBasePrice || 0).toLocaleString())}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-gray-500">Discount Applied</span>
                      <span className="font-bold text-green-600">- {formatINR((selectedPatientContext?.totalDiscount || 0).toLocaleString())}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-gray-500">Total Service Fee</span>
                      <span className="font-bold text-gray-800">{formatINR((selectedPatientContext?.totalFee || 0).toLocaleString())}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-gray-500">Amount Paid (This Tx)</span>
                      <span className="font-black text-[#004aad] text-sm">{formatINR(selectedInvoice.amountPaid.toLocaleString())}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-gray-500">Total Paid to Date</span>
                      <span className="font-bold text-gray-800">{formatINR((selectedPatientContext?.totalPaidAtTime || 0).toLocaleString())}</span>
                    </div>
                    {(selectedPatientContext?.outstandingAtTime || 0) > 0 && (
                      <div className="flex justify-between text-xs">
                        <span className="font-bold text-gray-500">Remaining Balance</span>
                        <span className="font-black text-red-500">{formatINR((selectedPatientContext?.outstandingAtTime || 0).toLocaleString())}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Blue footer */}
                <div className="bg-[#004aad] px-5 py-2.5">
                  <p className="text-blue-200 text-[9px] text-center">Rehablito Physio & Autism Center — Official Receipt</p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={async () => {
                    if (!selectedInvoice) return;
                    generateAndPrintReceipt(
                      selectedInvoice,
                      selectedPatientContext,
                      (isProc) => {
                        setIsProcessing(isProc);
                        if (isProc) toast.loading("Generating PDF receipt...");
                        else toast.dismiss();
                      },
                      selectedInvoice.rawTx
                    );
                  }}
                  disabled={isProcessing}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl bg-[#004aad] text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-60"
                >
                  <Download size={15} /> Download PDF
                </button>
                <button
                  onClick={async () => {
                    if (!selectedInvoice) return;
                    generateAndPrintReceipt(
                      selectedInvoice,
                      selectedPatientContext,
                      (isProc) => {
                        setIsProcessing(isProc);
                        if (isProc) toast.loading("Preparing print layout...");
                        else toast.dismiss();
                      },
                      selectedInvoice.rawTx
                    );
                  }}
                  disabled={isProcessing}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl border border-[#004aad] text-[#004aad] text-sm font-bold hover:bg-blue-50 transition-colors disabled:opacity-60"
                >
                  <Printer size={15} /> Print Receipt
                </button>
              </div>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-on-surface-variant/50 bg-surface-container-lowest rounded-2xl border border-dashed border-outline-variant/20">
              <FileText size={48} className="mb-4 opacity-50" />
              <p className="font-medium text-sm">Select a record to view details</p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {/* Add Payment Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl"
            >
              <h3 className="text-xl font-bold mb-6">Record New Payment</h3>
              <form onSubmit={handleAddPayment} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Patient</label>
                  <SearchableSelect
                    options={patients.map(p => ({
                      value: p.id || '',
                      label: p.name,
                      subLabel: p.id + (p.totalFee ? ` — ₹${p.totalFee.toLocaleString()} total` : '')
                    }))}
                    value={newPayment.patientId}
                    onChange={pid => {
                      const pat = patients.find(p => p.id === pid);
                      if (pat) {
                        const alreadyPaid = billing
                          .filter(b => (b.patientId && b.patientId === pat.id) || b.patientName.toLowerCase() === pat.name.toLowerCase())
                          .reduce((s, b) => s + b.amountPaid, 0);
                        const currentDue = Math.max(0, (pat.totalFee || 0) - alreadyPaid);
                        setNewPayment(prev => ({
                          ...prev,
                          patientId: pid,
                          dueAmount: String(currentDue),
                        }));
                      } else {
                        setNewPayment(prev => ({ ...prev, patientId: pid, dueAmount: '' }));
                      }
                    }}
                    placeholder="Select a patient"
                  />
                  {currentDueForSelected > 0 && (
                    <div className="mt-1.5 flex items-center justify-between px-3 py-2 rounded-lg bg-secondary/8 border border-secondary/20">
                      <span className="text-[10px] font-bold text-secondary uppercase tracking-wider">Current Due</span>
                      <span className="text-sm font-black text-on-surface">₹{currentDueForSelected.toLocaleString()}</span>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Amount Paid (₹)</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={newPayment.amount}
                      onChange={e => {
                        const paid = parseFloat(e.target.value) || 0;
                        const due = Math.max(0, currentDueForSelected - paid);
                        setNewPayment(prev => ({
                          ...prev,
                          amount: e.target.value,
                          dueAmount: String(due),
                        }));
                      }}
                      className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20"
                      placeholder="1200"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Due Amount (₹)</label>
                    <input
                      type="number"
                      min={0}
                      value={newPayment.dueAmount}
                      onChange={e => setNewPayment(prev => ({ ...prev, dueAmount: e.target.value }))}
                      className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20"
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Method</label>
                  <select
                    value={newPayment.method}
                    onChange={e => setNewPayment(prev => ({ ...prev, method: e.target.value as NonNullable<BillingRecord['method']> }))}
                    className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="cash">Cash</option>
                    <option value="upi">UPI</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="card">Card</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Description</label>
                  <input
                    type="text"
                    value={newPayment.description}
                    onChange={e => setNewPayment(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20"
                    placeholder="e.g. Physiotherapy Session"
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <Button 
                    type="button"
                    variant="ghost"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    isLoading={isProcessing}
                    className="flex-1"
                  >
                    Record Payment
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Edit Billing Modal */}
        {isEditModalOpen && editingRecord && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl"
            >
              <h3 className="text-xl font-bold mb-6">Edit Billing Record</h3>
              <form onSubmit={handleUpdateBilling} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Patient Name</label>
                  <input 
                    type="text" 
                    required
                    value={editingRecord.patientName}
                    onChange={e => setEditingRecord(prev => prev ? ({ ...prev, patientName: e.target.value }) : null)}
                    className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Amount Paid (₹)</label>
                  <input 
                    type="number" 
                    required
                    value={editingRecord.amountPaid}
                    onChange={e => setEditingRecord(prev => prev ? ({ ...prev, amountPaid: parseFloat(e.target.value) }) : null)}
                    className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Due Amount (₹)</label>
                  <input 
                    type="number" 
                    required
                    value={editingRecord.dueAmount}
                    onChange={e => setEditingRecord(prev => prev ? ({ ...prev, dueAmount: parseFloat(e.target.value) }) : null)}
                    className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <Button 
                    type="button"
                    variant="ghost"
                    onClick={() => setIsEditModalOpen(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    isLoading={isProcessing}
                    className="flex-1"
                  >
                    Save Changes
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

