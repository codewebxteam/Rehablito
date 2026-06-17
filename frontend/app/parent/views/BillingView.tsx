import React, { useState, useEffect, useRef } from 'react';
import { CreditCard, CheckCircle, Clock, AlertCircle, X, QrCode, Upload, Download, Landmark } from 'lucide-react';
import { toast } from 'sonner';
import { AnimatePresence, motion } from 'motion/react';
import api from '@/lib/api';
import { generateAndPrintReceipt } from '@/lib/receiptHelper';
import { cn } from '@/lib/utils';

export default function BillingView({ data, onRefresh }: { data: any, onRefresh: () => void }) {
  if (!data) return null;

  const [isProcessing, setIsProcessing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { history, totalDue, totalFee, totalPaid } = data;

  useEffect(() => {
    setMounted(true);
  }, []);

  const allTransactions = React.useMemo(() => {
    const txs: any[] = [];
    history?.forEach((record: any) => {
      if (record.transactions && record.transactions.length > 0) {
        record.transactions.forEach((tx: any) => {
          txs.push({
            ...tx,
            invoiceDescription: record.description || 'Therapy Fee',
            receiptNumber: record.receiptNumber,
            invoiceId: record._id
          });
        });
      } else {
        // Skip auto-generated unpaid invoices
        if (record.status === 'pending' && Number(record.amount) === Number(record.dueAmount)) {
          return;
        }
        txs.push({
          amountPaid: record.amountPaid || record.amount || 0,
          date: record.paymentDate || record.createdAt,
          method: record.method || 'cash',
          transactionId: record.receiptNumber || record._id,
          invoiceDescription: record.description || 'Therapy Fee',
          receiptNumber: record.receiptNumber,
          invoiceId: record._id,
          status: record.approvalStatus === 'pending' ? 'pending' : 'approved'
        });
      }
    });
    return txs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [history]);

  // Find an active invoice to attach the payment to.
  const activeInvoice = history?.find((r: any) => r.dueAmount > 0 && r.approvalStatus !== 'pending');
  const isPendingApproval = history?.some((r: any) => r.approvalStatus === 'pending');

  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [amountToPay, setAmountToPay] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'qr_scan' | 'bank_transfer' | ''>('');
  const [transactionId, setTransactionId] = useState<string>('');
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const TX_PER_PAGE = 10;

  const totalPages = Math.ceil(allTransactions.length / TX_PER_PAGE);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [allTransactions.length, totalPages, currentPage]);

  const pagedTransactions = React.useMemo(() => {
    const start = (currentPage - 1) * TX_PER_PAGE;
    return allTransactions.slice(start, start + TX_PER_PAGE);
  }, [allTransactions, currentPage]);

  const openPaymentModal = () => {
    if (!activeInvoice) {
      toast.error("No pending invoice available to attach payment. If this is an error, contact support.");
      return;
    }
    setAmountToPay('');
    setPaymentMethod('');
    setTransactionId('');
    setScreenshotFile(null);
    setQrModalOpen(true);
  };

  const handleManualPayment = async () => {
    if (!activeInvoice) return;
    const parsedAmount = parseFloat(amountToPay);
    if (isNaN(parsedAmount) || parsedAmount <= 0 || parsedAmount > totalDue) {
      toast.error(`Please enter a valid amount between ₹1 and ₹${totalDue.toLocaleString()}`);
      return;
    }
    if (!paymentMethod) {
      toast.error('Please select a payment method');
      return;
    }
    if (!transactionId.trim()) {
      toast.error('Please enter the Transaction ID / Reference Number');
      return;
    }
    if (!screenshotFile) {
      toast.error('Please upload a screenshot of the payment');
      return;
    }

    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('feePaymentId', activeInvoice._id);
      formData.append('amount', parsedAmount.toString());
      formData.append('method', paymentMethod);
      formData.append('transactionId', transactionId.trim());
      formData.append('screenshot', screenshotFile);

      const res = await api.post('/payments/manual', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res.data.success) {
        toast.success('Payment submitted for approval!');
        setQrModalOpen(false);
        onRefresh();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || 'Payment submission failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl md:text-3xl font-headline font-bold text-on-background">Billing & Payments</h1>
        <p className="text-on-surface-variant font-medium mt-1">Manage your therapy fees and view history.</p>
      </header>

      {/* Due Card */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-outline-variant/20 shadow-sm">
        <div className="grid grid-cols-3 gap-4 mb-6 text-center">
          <div>
            <p className="text-[10px] md:text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Total Fee</p>
            <p className="text-xl md:text-3xl font-bold text-on-surface">₹{(totalFee || 0).toLocaleString()}</p>
          </div>
          <div className="border-l border-r border-outline-variant/20">
            <p className="text-[10px] md:text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Total Paid</p>
            <p className="text-xl md:text-3xl font-bold text-brand-sage">₹{(totalPaid || 0).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-[10px] md:text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Total Dues</p>
            <p className="text-xl md:text-3xl font-black text-error">₹{(totalDue || 0).toLocaleString()}</p>
          </div>
        </div>

        <div className="flex justify-center border-t border-outline-variant/20 pt-6">
          {isPendingApproval ? (
            <div className="px-6 py-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-3 text-blue-700 w-full md:w-auto">
              <AlertCircle size={24} className="animate-pulse" />
              <div>
                <p className="font-bold text-sm">Verification Pending</p>
                <p className="text-xs opacity-80 mt-0.5">A payment is currently under review by the manager.</p>
              </div>
            </div>
          ) : totalDue > 0 ? (
            <button
              onClick={openPaymentModal}
              className="w-full md:w-auto px-8 py-3.5 bg-secondary text-white font-black rounded-xl shadow-md hover:bg-secondary/90 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <QrCode size={18} /> Pay via QR / Bank Transfer
            </button>
          ) : (
            <div className="px-6 py-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 text-green-700 w-full md:w-auto">
              <CheckCircle size={24} />
              <div>
                <p className="font-bold text-sm">All dues cleared!</p>
                <p className="text-xs opacity-80 mt-0.5">You have no pending payments at the moment.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-3xl border border-outline-variant/20 shadow-sm overflow-hidden mt-8">
        <div className="px-6 py-5 border-b border-outline-variant/10">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Clock className="w-5 h-5 text-secondary" /> Transaction History
          </h2>
        </div>

        {allTransactions.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-on-surface-variant font-medium">No payment history found.</p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-outline-variant/10">
              {pagedTransactions.map((tx: any, idx: number) => {
                const isPending = tx.status === 'pending' || tx.transactionId === 'pending_approval';
                const isReceiptAvailable = !isPending && tx.invoiceId;

                return (
                  <div key={tx._id || idx} className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-surface-container-lowest transition-colors">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-bold text-on-surface text-lg">₹{(tx.amountPaid || 0).toLocaleString()}</span>
                        {isPending ? (
                          <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 shadow-sm animate-pulse">
                            <AlertCircle size={10} /> Verification Pending
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-100">
                            <CheckCircle size={10} /> Approved
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-on-surface-variant/70 mt-1">
                        Date: {mounted ? new Date(tx.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                        {!isPending && tx.transactionId && ` • Ref: ${tx.transactionId}`}
                      </p>
                    </div>

                    {isReceiptAvailable && (
                      <button
                        onClick={() => {
                          const invoiceData = history?.find((h: any) => h._id === tx.invoiceId);
                          if (invoiceData) {
                            generateAndPrintReceipt(
                              invoiceData,
                              { allPayments: history },
                              (isProc) => { if (isProc) toast.loading("Generating receipt..."); else toast.dismiss(); },
                              tx
                            );
                          } else {
                            toast.error("Receipt data unavailable");
                          }
                        }}
                        className="px-4 py-2 bg-white border border-brand-sage text-brand-sage font-bold rounded-xl shadow-sm hover:bg-brand-sage/5 transition-colors flex items-center justify-center gap-2 whitespace-nowrap text-xs"
                      >
                        <Download size={14} /> Download Receipt
                      </button>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="px-6 py-4 flex items-center justify-between border-t border-outline-variant/10">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-xl border border-outline-variant/30 text-xs font-bold hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:pointer-events-none"
                >
                  Previous
                </button>
                <span className="text-xs text-on-surface-variant font-bold">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded-xl border border-outline-variant/30 text-xs font-bold hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:pointer-events-none"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Payment Modal */}
      <AnimatePresence>
        {qrModalOpen && activeInvoice && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isProcessing && setQrModalOpen(false)}
              className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 12 }}
              className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl p-6 md:p-8 z-10 max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => setQrModalOpen(false)}
                disabled={isProcessing}
                className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full transition-colors disabled:opacity-50"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>

              <div className="space-y-6">
                <h3 className="text-xl font-black text-on-background flex items-center gap-2 text-center justify-center border-b border-outline-variant/20 pb-4">
                  <CreditCard className="text-secondary" /> Payment Options
                </h3>

                {/* Outstanding Dues Banner */}
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-200/50 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-amber-700/80 uppercase tracking-wider">Outstanding Dues</p>
                    <p className="text-[10px] text-amber-600/70 font-medium mt-0.5">Please pay this amount to settle your dues.</p>
                  </div>
                  <p className="text-xl font-black text-amber-800">₹{activeInvoice.dueAmount.toLocaleString()}</p>
                </div>

                {/* Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Select Payment Option</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('qr_scan')}
                      className={cn(
                        "p-4 rounded-xl border-2 text-center transition-all flex flex-col items-center justify-center gap-2",
                        paymentMethod === 'qr_scan'
                          ? "border-secondary bg-secondary/5 font-black text-secondary"
                          : "border-outline-variant/30 hover:border-outline-variant font-bold text-on-surface-variant"
                      )}
                    >
                      <QrCode size={20} />
                      <span>UPI / QR Code</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('bank_transfer')}
                      className={cn(
                        "p-4 rounded-xl border-2 text-center transition-all flex flex-col items-center justify-center gap-2",
                        paymentMethod === 'bank_transfer'
                          ? "border-secondary bg-secondary/5 font-black text-secondary"
                          : "border-outline-variant/30 hover:border-outline-variant font-bold text-on-surface-variant"
                      )}
                    >
                      <Landmark size={20} />
                      <span>Bank Transfer</span>
                    </button>
                  </div>
                </div>

                {/* Conditional Content */}
                <div className="min-h-[220px]">
                  {paymentMethod === 'qr_scan' && (
                    <div className="bg-surface-container-low p-6 rounded-2xl flex flex-col items-center justify-center border border-outline-variant/20 animate-in fade-in zoom-in-95 duration-200">
                      <p className="text-sm font-bold text-on-surface mb-4 flex items-center gap-2"><QrCode size={18} className="text-secondary" /> Scan UPI QR Code</p>
                      <img src="https://ik.imagekit.io/5glnyqfxu/rehablitoqr.png?updatedAt=1781548948953" alt="Clinic QR Code" className="w-44 h-44 object-contain mx-auto border-4 border-white rounded-xl shadow-md bg-white" />
                      <p className="text-xs font-semibold text-on-surface-variant mt-4 text-center">Scan QR code using Google Pay, PhonePe, Paytm, or any UPI app.</p>
                    </div>
                  )}

                  {paymentMethod === 'bank_transfer' && (
                    <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/20 animate-in fade-in zoom-in-95 duration-200">
                      <p className="text-sm font-bold text-on-surface mb-5 flex items-center gap-2"><Landmark size={18} className="text-secondary" /> Bank Transfer Details</p>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">Account Name</p>
                            <p className="text-sm font-black text-on-surface">Rehablito Charitable Foundation</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">Account Number</p>
                            <p className="text-sm font-black text-on-surface font-mono">00000044127771371</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">IFSC Code</p>
                            <p className="text-sm font-black text-on-surface font-mono">SBIN0000152</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">Bank Name</p>
                            <p className="text-sm font-black text-on-surface">State Bank of India</p>
                          </div>
                        </div>
                        <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
                          <p className="text-[10px] font-bold text-yellow-800 leading-relaxed">⚠️ Please cross check the account name <span className="font-black">Rehablito Charitable Foundation</span> before making the transfer.</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {paymentMethod === '' && (
                    <div className="h-48 bg-surface-container-low/50 rounded-2xl flex flex-col items-center justify-center border border-dashed border-outline-variant/20 text-on-surface-variant/40">
                      <CreditCard className="w-12 h-12 mb-3 opacity-30 animate-pulse" />
                      <p className="text-sm font-bold">Please select a payment option above to proceed.</p>
                    </div>
                  )}
                </div>

                <div className="text-left space-y-4 pt-4 border-t border-outline-variant/20">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Amount Paid (₹)</label>
                      <input
                        type="number"
                        min="1"
                        max={totalDue}
                        value={amountToPay}
                        onChange={(e) => setAmountToPay(e.target.value)}
                        disabled={isProcessing}
                        className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/30 rounded-xl font-bold focus:outline-none focus:border-secondary transition-colors"
                        placeholder="e.g. 5000"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Transaction ID / UTR No / Reference No</label>
                      <input
                        type="text"
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        disabled={isProcessing}
                        className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/30 rounded-xl font-bold focus:outline-none focus:border-secondary transition-colors"
                        placeholder="UTR / Ref Number"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Upload Screenshot Proof</label>
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      onChange={(e) => setScreenshotFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full px-4 py-3 bg-surface-container-low border-2 border-dashed border-outline-variant/40 rounded-xl cursor-pointer hover:bg-surface-container transition-colors flex items-center justify-center gap-2"
                    >
                      <Upload className="text-secondary w-5 h-5" />
                      <span className="text-sm font-medium text-on-surface-variant truncate">
                        {screenshotFile ? screenshotFile.name : 'Select screenshot image'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={() => setQrModalOpen(false)}
                    disabled={isProcessing}
                    className="px-4 py-3.5 bg-surface-container text-on-surface font-bold rounded-xl hover:bg-surface-container-high transition-all text-sm disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleManualPayment}
                    disabled={isProcessing || !amountToPay || !paymentMethod || !screenshotFile || !transactionId}
                    className="px-4 py-3.5 bg-secondary text-white font-black rounded-xl shadow-md hover:bg-secondary/90 transition-all text-sm flex items-center justify-center disabled:opacity-50"
                  >
                    {isProcessing ? 'Submitting...' : 'Submit Verification'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
