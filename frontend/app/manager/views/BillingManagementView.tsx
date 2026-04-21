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
import { jsPDF } from 'jspdf';
import { BillingRecord, NewPaymentInput, Patient } from '../types';
import api from '@/lib/api';
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [editingRecord, setEditingRecord] = useState<BillingRecord | null>(null);
  const [newPayment, setNewPayment] = useState({
    patientId: '',
    amount: '',
    dueAmount: '',
    description: 'General Consultation',
    method: 'cash' as NonNullable<BillingRecord['method']>,
  });
  const formatINR = (amount: number | string) => `\u20B9${amount}`;

  // Derived: selected patient's total fee
  const selectedPatient = patients.find(p => p.id === newPayment.patientId) || null;
  const patientTotalFee = selectedPatient?.totalFee ?? 0;

  const stats = useMemo(() => {
    const total = billing.reduce((acc, curr) => acc + curr.amountPaid, 0);
    const pending = billing.reduce((acc, curr) => acc + curr.dueAmount, 0);
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

  const generateInvoicePDF = (record: BillingRecord) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(0, 74, 198);
    doc.text('Rehablito RMS INVOICE', 20, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('Anisabad - Jagdeo Path Rd, Federal Colony,', 20, 30);
    doc.text('Haroon Colony Sector-II, Phulwari Sharif, Patna, Bihar 800002', 20, 35);
    doc.text('rehablito@gmail.com', 20, 40);
    
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text(`Invoice #${record.id}`, 140, 20);
    doc.setFontSize(10);
    doc.text(`Date: ${record.date}`, 140, 28);
    
    // Bill To
    doc.setFontSize(12);
    doc.text('Bill To:', 20, 60);
    doc.setFontSize(14);
    doc.text(record.patientName, 20, 68);
    
    // Items Table
    doc.setDrawColor(200);
    doc.line(20, 80, 190, 80);
    doc.setFontSize(10);
    doc.text('Description', 20, 88);
    doc.text('Sessions', 120, 88);
    doc.text('Price', 160, 88);
    doc.line(20, 92, 190, 92);
    
    let y = 102;
    if (record.items.length > 0) {
      record.items.forEach(item => {
        doc.text(item.description, 20, y);
        doc.text(item.sessions.toString(), 125, y);
        doc.text(`$${item.price.toFixed(2)}`, 160, y);
        y += 10;
      });
    } else {
      doc.text('General Medical Services', 20, y);
      doc.text('1', 125, y);
      doc.text(`$${record.amountPaid.toFixed(2)}`, 160, y);
      y += 10;
    }
    
    // Totals
    doc.line(20, y, 190, y);
    y += 10;
    doc.setFontSize(12);
    doc.text('Total Paid:', 130, y);
    doc.text(`$${record.amountPaid.toFixed(2)}`, 160, y);
    y += 8;
    doc.text('Due Amount:', 130, y);
    doc.setTextColor(200, 0, 0);
    doc.text(`$${record.dueAmount.toFixed(2)}`, 160, y);
    
    doc.save(`Invoice_${record.id}.pdf`);
  };

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
              <button className="text-primary text-sm font-bold flex items-center gap-1">
                Filter
                <Filter size={14} />
              </button>
            </div>
            
            {/* Desktop/Tablet Table View (> 640px) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left min-w-[600px]">
                <thead className="bg-surface-container-low">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant/60">Patient</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant/60 text-right">Amount Paid</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant/60 text-right">Due Amount</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant/60">Date</th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant/60">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {billing.map((record) => (
                    <tr 
                      key={record.id} 
                      onClick={() => setSelectedInvoice(record)}
                      className={cn(
                        "cursor-pointer transition-colors group",
                        selectedInvoice?.id === record.id ? "bg-primary/5" : "bg-surface-container-lowest hover:bg-surface-container-low"
                      )}
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center text-primary font-bold text-xs">
                            {record.patientName.split(' ').map(n => n[0]).join('')}
                          </div>
                          <span className="font-semibold text-on-surface">{record.patientName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right font-bold text-on-surface">{formatINR(record.amountPaid.toLocaleString())}</td>
                      <td className={cn("px-6 py-5 text-right font-bold", record.dueAmount > 0 ? "text-error" : "text-on-surface-variant/40")}>
                        {formatINR(record.dueAmount.toLocaleString())}
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
              {billing.map((record) => (
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
          </div>
        </div>

        {/* Right Column: Preview */}
        <div className="col-span-12 md:col-span-5 md:sticky md:top-24">
          {selectedInvoice ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-lg text-on-surface">Invoice Preview</h4>
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      setEditingRecord(selectedInvoice);
                      setIsEditModalOpen(true);
                    }}
                    className="bg-surface-container-high p-2 rounded-lg text-on-surface-variant hover:text-primary transition-all"
                  >
                    <Edit size={18} />
                  </button>
                  <button 
                    onClick={() => handleDeleteBilling(selectedInvoice.id)}
                    className="bg-surface-container-high p-2 rounded-lg text-on-surface-variant hover:text-error transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div className="bg-white p-6 md:p-10 rounded-sm shadow-xl relative overflow-hidden invoice-paper">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary via-secondary to-primary-container"></div>
                
                <div className="flex flex-col sm:flex-row justify-between items-start gap-8 mb-12">
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-10 h-10 bg-primary flex items-center justify-center rounded-lg">
                        <FileText className="text-white" size={24} />
                      </div>
                      <span className="text-xl font-bold tracking-tighter text-primary">Rehablito RMS</span>
                    </div>
                    <p className="text-xs text-on-surface-variant max-w-[180px]">
                      Anisabad - Jagdeo Path Rd, Federal Colony,<br/>
                      Haroon Colony Sector-II, Phulwari Sharif,<br/>
                      Patna, Bihar 800002<br/>
                      rehablito@gmail.com
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <h1 className="text-3xl font-extrabold text-on-surface-variant/20 uppercase tracking-tighter leading-none mb-4">Invoice</h1>
                    <p className="text-sm font-bold text-on-surface">#{selectedInvoice.id}</p>
                    <p className="text-xs text-on-surface-variant/60">Date: {selectedInvoice.date}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-12">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60 mb-2">Patient Details</p>
                    <h5 className="font-bold text-on-surface">{selectedInvoice.patientName}</h5>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      Patient ID: P-{selectedInvoice.id.slice(-5)}<br/>
                      Physical Therapy Wing<br/>
                      Recovery Phase: 2
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60 mb-2">Payment Status</p>
                    <div className={cn(
                      "inline-flex items-center gap-2 font-bold text-sm",
                      selectedInvoice.dueAmount === 0 ? "text-secondary" : "text-error"
                    )}>
                      <span className={cn("w-2 h-2 rounded-full", selectedInvoice.dueAmount === 0 ? "bg-secondary" : "bg-error")}></span>
                      {selectedInvoice.dueAmount === 0 ? 'FULLY SETTLED' : 'PARTIAL PAYMENT'}
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full mb-12 min-w-[300px]">
                    <thead>
                      <tr className="border-b border-outline-variant/10">
                        <th className="py-3 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60 text-left">Description</th>
                        <th className="py-3 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60 text-center">Sessions</th>
                        <th className="py-3 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60 text-right">Price</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {selectedInvoice.items.length > 0 ? selectedInvoice.items.map((item, i) => (
                        <tr key={i} className="border-b border-outline-variant/5">
                          <td className="py-4 font-medium text-on-surface">{item.description}</td>
                          <td className="py-4 text-center">{item.sessions}</td>
                          <td className="py-4 text-right font-bold">{formatINR(item.price.toLocaleString())}</td>
                        </tr>
                      )) : (
                        <tr className="border-b border-outline-variant/5">
                          <td className="py-4 font-medium text-on-surface">General Medical Services</td>
                          <td className="py-4 text-center">1</td>
                          <td className="py-4 text-right font-bold">{formatINR(selectedInvoice.amountPaid.toLocaleString())}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end">
                  <div className="w-full max-w-[200px] space-y-3">
                    <div className="flex justify-between text-sm text-on-surface-variant">
                      <span>Subtotal</span>
                      <span>{formatINR(selectedInvoice.amountPaid.toLocaleString())}</span>
                    </div>
                    <div className="flex justify-between text-sm text-on-surface-variant">
                      <span>Tax (0%)</span>
                      <span>{formatINR('0.00')}</span>
                    </div>
                    <div className="pt-3 border-t border-outline-variant/20 flex justify-between font-bold text-on-surface">
                      <span className="text-lg">Total</span>
                      <span className="text-lg">{formatINR(selectedInvoice.amountPaid.toLocaleString())}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-16 pt-8 border-t border-outline-variant/10 text-center">
                  <p className="text-[10px] text-on-surface-variant/60 italic">Thank you for choosing Rehablito. Your health is our primary capital.</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={async () => {
                    setIsProcessing(true);
                    try {
                      const res = await api.get(`/manager/billing/${selectedInvoice.id}/invoice`, { responseType: 'blob' });
                      const url = window.URL.createObjectURL(res.data);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = `Invoice_${selectedInvoice.receiptNumber || selectedInvoice.id}.pdf`;
                      document.body.appendChild(link);
                      link.click();
                      link.remove();
                      window.URL.revokeObjectURL(url);
                    } catch (err) {
                      console.error('Invoice download failed, falling back to local PDF:', err);
                      generateInvoicePDF(selectedInvoice);
                    } finally {
                      setIsProcessing(false);
                    }
                  }}
                  isLoading={isProcessing}
                  className="flex-1 bg-on-surface text-white"
                >
                  <Download size={20} />
                  Download PDF
                </Button>
                <Button 
                  variant="secondary"
                  onClick={() => window.print()}
                  className="flex-1"
                >
                  <Printer size={20} />
                  Print Receipt
                </Button>
              </div>
            </div>
          ) : (
            <div className="h-96 flex flex-col items-center justify-center text-on-surface-variant/40 bg-surface-container-low rounded-xl border-2 border-dashed border-outline-variant/20">
              <FileText size={48} className="mb-4" />
              <p className="font-bold">Select an invoice to preview</p>
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
                      const fee = pat?.totalFee ?? 0;
                      setNewPayment(prev => ({
                        ...prev,
                        patientId: pid,
                        // Auto-fill due as totalFee when patient changes
                        dueAmount: fee > 0 ? String(fee) : prev.dueAmount,
                      }));
                    }}
                    className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">Select a patient</option>
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>{p.name}{p.totalFee ? ` — ₹${p.totalFee.toLocaleString()} total` : ''}</option>
                    ))}
                  </select>
                  {patientTotalFee > 0 && (
                    <div className="mt-1.5 flex items-center justify-between px-3 py-2 rounded-lg bg-secondary/8 border border-secondary/20">
                      <span className="text-[10px] font-bold text-secondary uppercase tracking-wider">Service Fee (Reference)</span>
                      <span className="text-sm font-black text-on-surface">₹{patientTotalFee.toLocaleString()}</span>
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
                        const due = patientTotalFee > 0 ? Math.max(0, patientTotalFee - paid) : undefined;
                        setNewPayment(prev => ({
                          ...prev,
                          amount: e.target.value,
                          dueAmount: due !== undefined ? String(due) : prev.dueAmount,
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

