"use client";
import { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  AlertCircle, 
  FileText, 
  Download, 
  Printer, 
  Edit, 
  Trash2, 
  Plus,
  Filter
} from 'lucide-react';
import { BillingRecord, NewPaymentInput, Patient } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import React from 'react';
import { exportToCSV } from '../lib/csvExport';
import { Button } from '../components/ui/Button';

interface BillingManagementProps {
  billing: BillingRecord[];
  patients: Patient[];
  onAddPayment: (input: NewPaymentInput) => Promise<BillingRecord | null>;
  onDeleteBilling: (id: string) => void;
  onUpdateBilling: (record: BillingRecord) => void;
}

export default function BillingManagementView({ billing, patients, onAddPayment, onDeleteBilling, onUpdateBilling }: BillingManagementProps) {
  const [selectedInvoice, setSelectedInvoice] = useState<BillingRecord | null>(billing[0] || null);
  
  const selectedPatientContext = useMemo(() => {
    if (!selectedInvoice) return null;
    const p = patients.find(pat => (pat.id && pat.id === selectedInvoice.patientId) || pat.name.toLowerCase() === selectedInvoice.patientName.toLowerCase());
    if (!p) return null;
    const allPatientBills = billing
      .filter(b => (b.id && b.id === p.id) || b.patientName?.toLowerCase() === p.name.toLowerCase());
      
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
    
    return {
      patient: p,
      totalFee,
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
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60 mb-2">Total Collected</p>
              <h3 className="text-xl md:text-2xl font-extrabold text-on-surface">{formatINR(stats.total)}</h3>
              <div className="flex items-center gap-1 mt-2 text-secondary font-bold text-[10px]">
                <TrendingUp size={12} />
                {stats.transactions} transactions
              </div>
            </div>
            <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/10 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60 mb-2">Pending Dues</p>
              <h3 className="text-xl md:text-2xl font-extrabold text-error">{formatINR(stats.pending)}</h3>
              <div className="flex items-center gap-1 mt-2 text-error font-bold text-[10px]">
                <AlertCircle size={12} />
                {stats.overdueCount} with dues
              </div>
            </div>
            <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/10 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60 mb-2">Active Plans</p>
              <h3 className="text-xl md:text-2xl font-extrabold text-primary">{stats.activePlans}</h3>
              <div className="flex items-center gap-1 mt-2 text-on-surface-variant font-bold text-[10px]">
                Unique patients billed
              </div>
            </div>
          </div>

          {/* Table / Cards */}
          <div className="bg-surface-container-low rounded-xl overflow-hidden shadow-sm">
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
                  {billing.slice((txPage - 1) * TX_PER_PAGE, txPage * TX_PER_PAGE).map((record) => (
                    <tr 
                      key={record.id} 
                      onClick={() => setSelectedInvoice(record)}
                      className={cn(
                        "cursor-pointer transition-colors group",
                        selectedInvoice?.id === record.id ? "bg-primary/5" : "bg-surface-container-lowest hover:bg-surface-container-low"
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
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View (< 640px) */}
            <div className="sm:hidden divide-y divide-outline-variant/10">
              {billing.slice((txPage - 1) * TX_PER_PAGE, txPage * TX_PER_PAGE).map((record) => (
                <div 
                  key={record.id} 
                  onClick={() => setSelectedInvoice(record)}
                  className={cn(
                    "p-4 sm:p-6 space-y-4 cursor-pointer transition-colors",
                    selectedInvoice?.id === record.id ? "bg-primary/5" : "bg-surface-container-lowest"
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
              ))}
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
          </div>
        </div>

        {/* Right Column: Receipt Preview */}
        <div className="col-span-12 md:col-span-5 md:sticky md:top-24">
          {selectedInvoice ? (
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
                          const isCurrent = p.id === selectedInvoice.id;
                          return (
                            <div key={p.id} className={cn(
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
                    {selectedInvoice.items.length > 0 && selectedInvoice.items.map((item, i) => (
                      <div key={i} className="flex justify-between text-xs">
                        <span className="text-gray-500">{item.description} × {item.sessions}</span>
                        <span className="font-bold text-gray-800">{formatINR(item.price.toLocaleString())}</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-xs pt-1 border-t border-gray-100">
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
                    setIsProcessing(true);
                    try {
                      const { jsPDF } = await import('jspdf');
                      const doc = new jsPDF({ unit: 'mm', format: 'a4' });
                      const W = 210;
                      const logo = await fetch('/logo.jpeg').then(r => r.blob()).then(b => new Promise<string>(res => { const fr = new FileReader(); fr.onloadend = () => res(fr.result as string); fr.readAsDataURL(b); })).catch(() => null);
                      const inv = selectedInvoice;
                      const method = inv.method ? inv.method.replace(/_/g,' ').toUpperCase() : 'CASH';
                      const desc = inv.description || inv.items?.[0]?.description || 'General Consultation';

                      // Header band
                      doc.setFillColor(0,74,173); doc.rect(0,0,W,32,'F');
                      if (logo) doc.addImage(logo,'PNG',8,3,13,26);
                      doc.setFont('helvetica','bold'); doc.setFontSize(16); doc.setTextColor(255,255,255);
                      doc.text('REHABLITO',25,13);
                      doc.setFont('helvetica','normal'); doc.setFontSize(7); doc.setTextColor(180,210,255);
                      doc.text('Physio & Autism Center',25,19);
                      doc.text('Everyone Deserves Trusted Hands',25,24);
                      doc.setTextColor(200,225,255);
                      doc.text(`Date: ${inv.date}`, W-12, 13, { align:'right' });
                      doc.text(`Ref: ${inv.receiptNumber || inv.id.slice(-8).toUpperCase()}`, W-12, 19, { align:'right' });

                      // Title strip
                      doc.setFillColor(232,240,255); doc.rect(0,32,W,9,'F');
                      doc.setFont('helvetica','bold'); doc.setFontSize(9); doc.setTextColor(0,74,173);
                      doc.text('PAYMENT RECEIPT', W/2, 38, { align:'center' });

                      // Transaction details section
                      let y = 46;
                      doc.setFillColor(248,250,255); doc.setDrawColor(210,220,240);
                      doc.roundedRect(10,y,W-20,8,1,1,'FD');
                      doc.setFont('helvetica','bold'); doc.setFontSize(8); doc.setTextColor(0,74,173);
                      doc.text('TRANSACTION DETAILS',14,y+5.5); y+=10;

                      const lc: [number,number,number] = [100,110,130];
                      const vc: [number,number,number] = [20,25,35];
                      const rows = [
                        ['Receipt No.', inv.receiptNumber || inv.id.slice(-8).toUpperCase()],
                        ['Patient Name', inv.patientName],
                        ['Date', inv.date],
                        ['Method', method],
                        ['Description', desc],
                        ['Status', inv.dueAmount === 0 ? 'Paid' : 'Partial Payment'],
                      ];
                      const RH = 11; // row height
                      rows.forEach(([label, val], i) => {
                        const ry = y + i * RH;
                        if (i % 2 === 0) { doc.setFillColor(240,245,255); doc.rect(10,ry-2,W-20,RH,'F'); }
                        doc.setFont('helvetica','bold'); doc.setFontSize(8); doc.setTextColor(...lc); doc.text(label,14,ry+4);
                        doc.setFont('helvetica','normal'); doc.setTextColor(...vc); doc.text(String(val),75,ry+4);
                      });
                      y += rows.length * RH + 4;

                      // Payment history
                      if (selectedPatientContext?.allPayments && selectedPatientContext.allPayments.length > 0) {
                        doc.setFillColor(248,250,255); doc.setDrawColor(210,220,240);
                        doc.roundedRect(10,y,W-20,8,1,1,'FD');
                        doc.setFont('helvetica','bold'); doc.setFontSize(8); doc.setTextColor(0,74,173);
                        doc.text('PAYMENT HISTORY',14,y+5.5); y+=10;
                        selectedPatientContext.allPayments.forEach((p, idx) => {
                          const isCurrent = p.id === inv.id;
                          if (isCurrent) { doc.setFillColor(235,245,255); } else { doc.setFillColor(250,250,252); }
                          doc.rect(10,y-1,W-20,8,'F');
                          doc.setFont('helvetica', isCurrent ? 'bold' : 'normal');
                          doc.setFontSize(7.5); doc.setTextColor(isCurrent ? 0 : 80);
                          doc.text(isCurrent ? 'Current Payment' : `Payment #${idx+1}`, 14, y+4.5);
                          doc.setTextColor(140); doc.text(p.date, 70, y+4.5);
                          doc.setTextColor(isCurrent ? 0 : 50);
                          doc.text(`Rs. ${p.amountPaid.toLocaleString()}`, W-12, y+4.5, { align:'right' });
                          y += 11;
                        });
                        y += 3;
                      }

                      // Payment summary
                      doc.setFillColor(248,250,255); doc.setDrawColor(210,220,240);
                      doc.roundedRect(10,y,W-20,8,1,1,'FD');
                      doc.setFont('helvetica','bold'); doc.setFontSize(8); doc.setTextColor(0,74,173);
                      doc.text('PAYMENT SUMMARY',14,y+5.5); y+=10;

                      const hasBalance = (selectedPatientContext?.outstandingAtTime || 0) > 0;
                      const summaryRows = [
                        ['Total Service Fee', `Rs. ${(selectedPatientContext?.totalFee || 0).toLocaleString()}`, false],
                        ['Amount Paid (This Tx)', `Rs. ${inv.amountPaid.toLocaleString()}`, true],
                        ['Total Paid to Date', `Rs. ${(selectedPatientContext?.totalPaidAtTime || 0).toLocaleString()}`, false],
                        ...(hasBalance ? [['Remaining Balance', `Rs. ${(selectedPatientContext?.outstandingAtTime || 0).toLocaleString()}`, false, true]] : []),
                      ];
                      const sumBoxH = summaryRows.length * 11 + 4;
                      doc.setFillColor(255,255,255); doc.setDrawColor(220,228,245);
                      doc.roundedRect(10,y,W-20,sumBoxH,1,1,'FD');
                      summaryRows.forEach(([label, val, highlight, red], i) => {
                        const sy = y + 4 + i * 11;
                        doc.setFont('helvetica','bold'); doc.setFontSize(8); doc.setTextColor(...lc);
                        doc.text(String(label),14,sy+4);
                        doc.setTextColor(red ? 200 : highlight ? 0 : 20, red ? 0 : highlight ? 74 : 25, red ? 0 : highlight ? 173 : 35);
                        doc.setFontSize(highlight ? 9 : 8);
                        doc.text(String(val), W-12, sy+4, { align:'right' });
                      });
                      y += sumBoxH + 5;

                      // Signatures
                      doc.setDrawColor(200,210,230); doc.setFillColor(250,252,255);
                      doc.roundedRect(10,y,85,18,1,1,'FD');
                      doc.roundedRect(W-95,y,85,18,1,1,'FD');
                      doc.setFont('helvetica','normal'); doc.setFontSize(7); doc.setTextColor(130,140,160);
                      doc.text('Patient / Guardian Signature',52,y+13,{align:'center'});
                      doc.text('Authorized Signatory',W-52,y+13,{align:'center'});
                      doc.setDrawColor(180,190,210);
                      doc.line(18,y+10,87,y+10); doc.line(W-87,y+10,W-18,y+10);
                      y += 22;

                      // Footer - pinned to bottom of page
                      doc.setFillColor(0,74,173); doc.rect(0,282,W,15,'F');
                      doc.setFont('helvetica','normal'); doc.setFontSize(7); doc.setTextColor(180,210,255);
                      doc.text('Rehablito Physio & Autism Center  |  Official Payment Receipt  |  Not valid without official stamp', W/2, 291, { align:'center' });

                      doc.save(`Receipt_${inv.receiptNumber || inv.id.slice(-8)}.pdf`);
                    } finally { setIsProcessing(false); }
                  }}
                  disabled={isProcessing}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl bg-[#004aad] text-white text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-60"
                >
                  <Download size={15} /> Download PDF
                </button>
                <button
                  onClick={() => {
                    const inv = selectedInvoice;
                    if (!inv) return;
                    const method = inv.method ? inv.method.replace(/_/g,' ').toUpperCase() : 'CASH';
                    const desc = inv.description || (inv.items && inv.items[0] && inv.items[0].description) || 'General Consultation';
                    const statusText = inv.dueAmount === 0 ? 'Paid' : 'Partial Payment';
                    const receiptNo = inv.receiptNumber || inv.id.slice(-8).toUpperCase();
                    const RH = 11;

                    // Build detail rows HTML - mirrors PDF alternating rows
                    const detailRows = [
                      ['Receipt No.', receiptNo, true],
                      ['Patient Name', inv.patientName, false],
                      ['Date', inv.date, false],
                      ['Method', method, false],
                      ['Description', desc, false],
                      ['Status', statusText, false],
                    ];
                    const detailHtml = detailRows.map(function(r, i) {
                      const bg = i%2===0 ? '#f0f5ff' : '#ffffff';
                      const valStyle = r[2]
                        ? 'font-family:monospace;color:#004aad;font-weight:700'
                        : r[0]==='Status'
                          ? 'color:'+(inv.dueAmount===0?'#16a34a':'#d97706')+';font-weight:700;background:'+(inv.dueAmount===0?'#f0fdf4':'#fffbeb')+';padding:2px 8px;border-radius:999px;font-size:11px'
                          : 'color:#141919;font-weight:600;font-size:14px';
                      return '<div style="display:grid;grid-template-columns:1fr 1fr;padding:13px 20px;background:'+bg+';border-bottom:1px solid #e8f0ff">'
                        + '<span style="color:#6b7280;font-weight:700;font-size:12px;letter-spacing:.5px;text-transform:uppercase;align-self:center">'+r[0]+'</span>'
                        + '<span style="'+valStyle+'">'+r[1]+'</span>'
                        + '</div>';
                    }).join('');

                    // Payment history
                    const payments = (selectedPatientContext && selectedPatientContext.allPayments) || [];
                    const historyHtml = payments.length > 0
                      ? '<div style="background:#eff6ff;padding:7px 16px;color:#004aad;font-size:10px;font-weight:800;letter-spacing:1px;text-transform:uppercase;border-bottom:1px solid #bfdbfe">Payment History</div>'
                        + payments.map(function(p, idx) {
                            const isCurrent = p.id === inv.id;
                            const bg = isCurrent ? '#eff6ff' : (idx%2===0 ? '#f9fafb' : '#ffffff');
                            return '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 16px;background:'+bg+';border-bottom:1px solid #f0f0f0">'
                              + '<div><div style="font-size:11px;font-weight:'+(isCurrent?'800':'600')+';color:'+(isCurrent?'#1d4ed8':'#4b5563')+'">'+(isCurrent?'Current Payment':'Payment #'+(idx+1))+'</div>'
                              + '<div style="font-size:9px;color:#9ca3af">'+p.date+'</div></div>'
                              + '<span style="font-size:12px;font-weight:800;color:'+(isCurrent?'#004aad':'#374151')+'">Rs. '+p.amountPaid.toLocaleString()+'</span>'
                              + '</div>';
                          }).join('')
                      : '';

                    // Summary rows
                    const hasBalance = (selectedPatientContext && (selectedPatientContext.outstandingAtTime || 0) > 0);
                    const summaryRows = [
                      ['Total Service Fee', 'Rs. '+((selectedPatientContext && selectedPatientContext.totalFee) || 0).toLocaleString(), false, false],
                      ['Amount Paid (This Tx)', 'Rs. '+inv.amountPaid.toLocaleString(), true, false],
                      ['Total Paid to Date', 'Rs. '+((selectedPatientContext && selectedPatientContext.totalPaidAtTime) || 0).toLocaleString(), false, false],
                    ];
                    if (hasBalance) summaryRows.push(['Remaining Balance', 'Rs. '+((selectedPatientContext && selectedPatientContext.outstandingAtTime) || 0).toLocaleString(), false, true]);
                    const summaryHtml = summaryRows.map(function(r, i) {
                      const bg = i%2===0 ? '#f0f5ff' : '#ffffff';
                      const valColor = r[3] ? '#dc2626' : r[2] ? '#004aad' : '#141919';
                      const valSize = r[2] ? '18px' : '15px';
                      return '<div style="display:flex;justify-content:space-between;align-items:center;padding:13px 20px;background:'+bg+';border-bottom:1px solid #e8f0ff">'
                        + '<span style="color:#6b7280;font-weight:700;font-size:13px">'+r[0]+'</span>'
                        + '<span style="color:'+valColor+';font-weight:800;font-size:'+valSize+'">'+r[1]+'</span>'
                        + '</div>';
                    }).join('');

                    const html = '<!DOCTYPE html><html><head><title>Receipt - '+receiptNo+'</title><meta charset="utf-8">'
                      + '<style>*{box-sizing:border-box;margin:0;padding:0;-webkit-print-color-adjust:exact !important;print-color-adjust:exact !important;color-adjust:exact !important;}'
                      + 'body{font-family:Arial,Helvetica,sans-serif;background:#e8f0ff;display:flex;justify-content:center;padding:24px 16px;}'
                      + '.card{width:100%;max-width:580px;border-radius:12px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.2);display:flex;flex-direction:column;}'
                      + '.spacer{flex:1;background:#fff;}'
                      + '@media print{'
                      + '@page{size:A4 portrait;margin:0;}'
                      + 'html,body{width:210mm;margin:0;padding:0;background:#fff !important;display:block;}'
                      + '.card{width:210mm !important;max-width:210mm !important;min-height:297mm !important;border-radius:0 !important;box-shadow:none !important;margin:0;padding:0;display:flex;flex-direction:column;}'
                      + '.spacer{flex:1 !important;background:#fff !important;}'
                      + '}'
                      + '</style></head><body><div class="card">'                      // Header - same as PDF
                      + '<div style="background:#004aad;padding:14px 18px;display:flex;align-items:center;justify-content:space-between">'
                      + '<div style="display:flex;align-items:center;gap:10px">'
                      + '<div style="width:36px;height:36px;background:#fff;border-radius:8px;overflow:hidden;flex-shrink:0"><img src="http://localhost:3000/logo.jpeg" style="width:100%;height:100%;object-fit:contain"/></div>'
                      + '<div><div style="color:#fff;font-size:16px;font-weight:800">REHABLITO</div>'
                      + '<div style="color:#bfdbfe;font-size:9px">Physio &amp; Autism Center</div>'
                      + '<div style="color:#93c5fd;font-size:8px">Everyone Deserves Trusted Hands</div></div></div>'
                      + '<div style="text-align:right"><div style="color:#bfdbfe;font-size:9px">'+inv.date+'</div>'
                      + '<div style="color:#e0f2fe;font-size:9px;font-family:monospace">'+receiptNo+'</div></div>'
                      + '</div>'

                      // Title strip
                      + '<div style="background:#eff6ff;padding:12px;text-align:center;color:#004aad;font-size:14px;font-weight:800;letter-spacing:2px;border-bottom:1px solid #bfdbfe">PAYMENT RECEIPT</div>'

                      // Transaction details
                      + '<div style="background:#eff6ff;padding:10px 20px;color:#004aad;font-size:12px;font-weight:800;letter-spacing:1px;text-transform:uppercase;border-bottom:1px solid #bfdbfe">Transaction Details</div>'
                      + detailHtml

                      // History
                      + historyHtml

                      // Payment summary
                      + '<div style="background:#eff6ff;padding:10px 20px;color:#004aad;font-size:12px;font-weight:800;letter-spacing:1px;text-transform:uppercase;border-bottom:1px solid #bfdbfe">Payment Summary</div>'
                      + summaryHtml

                      // Signatures
                      + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;padding:24px 24px;background:#f8faff">'
                      + '<div style="border-top:1.5px solid #94a3b8;padding-top:10px;text-align:center;color:#94a3b8;font-size:11px;font-weight:700;letter-spacing:.5px;text-transform:uppercase">Patient / Guardian Signature</div>'
                      + '<div style="border-top:1.5px solid #94a3b8;padding-top:10px;text-align:center;color:#94a3b8;font-size:11px;font-weight:700;letter-spacing:.5px;text-transform:uppercase">Authorized Signatory</div>'
                      + '</div>'

                      // Spacer fills remaining page height
                      + '<div class="spacer"></div>'

                      // Footer
                      + '<div style="background:#004aad;padding:9px;text-align:center;color:#bfdbfe;font-size:8px">Rehablito Physio &amp; Autism Center &mdash; Official Payment Receipt &mdash; Not valid without official stamp</div>'
                      + '</div></body></html>';

                    const win = window.open('','_blank','width=1,height=1,left=-1000,top=-1000');
                    if (!win) return;
                    win.document.open();
                    win.document.write(html);
                    win.document.close();
                    win.focus();
                    setTimeout(function() { win.print(); win.onafterprint = function() { win.close(); }; }, 600);
                  }}
                                    className="flex items-center justify-center gap-2 py-3 rounded-xl border border-[#004aad] text-[#004aad] text-sm font-bold hover:bg-blue-50 transition-colors"
                >
                  <Printer size={15} /> Print Receipt
                </button>
              </div>
            </div>
          ) : (
            <div className="h-80 flex flex-col items-center justify-center text-on-surface-variant/40 bg-surface-container-low rounded-xl border-2 border-dashed border-outline-variant/20">
              <FileText size={40} className="mb-3" />
              <p className="font-bold text-sm">Click a transaction to preview</p>
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
                  <select
                    required
                    value={newPayment.patientId}
                    onChange={e => {
                      const pid = e.target.value;
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
                    className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">Select a patient</option>
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>{p.name}{p.totalFee ? ` — ₹${p.totalFee.toLocaleString()} total` : ''}</option>
                    ))}
                  </select>
                  {currentDueForSelected > 0 && (
                    <div className="mt-1.5 flex items-center justify-between px-3 py-2 rounded-lg bg-secondary/8 border border-secondary/20">
                      <span className="text-[10px] font-bold text-secondary uppercase tracking-wider">Current Outstanding</span>
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

