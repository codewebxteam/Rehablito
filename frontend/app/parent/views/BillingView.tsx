import React, { useState, useEffect } from 'react';
import { CreditCard, CheckCircle, Clock, AlertCircle, X } from 'lucide-react';
import { toast } from 'sonner';
import { AnimatePresence, motion } from 'motion/react';
import api from '@/lib/api';

export default function BillingView({ data, onRefresh }: { data: any, onRefresh: () => void }) {
  if (!data) return null;

  const [isProcessing, setIsProcessing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { history, totalDue } = data;

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
            receiptNumber: record.receiptNumber
          });
        });
      }
    });
    return txs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [history]);

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [amountToPay, setAmountToPay] = useState<number>(0);

  const openPaymentModal = (record: any) => {
    setSelectedInvoice(record);
    setAmountToPay(record.dueAmount);
    setPaymentModalOpen(true);
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayNow = async (amount: number, feePaymentId: string) => {
    setIsProcessing(true);
    try {
      const res = await loadRazorpayScript();
      if (!res) {
        toast.error('Failed to load Razorpay SDK. Check your connection.');
        setIsProcessing(false);
        return;
      }

      // Create Order on Backend
      const orderRes = await api.post('/payments/order', { amount, feePaymentId });
      if (!orderRes.data.success) throw new Error('Order creation failed');

      const { order } = orderRes.data;

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_placeholder', // Should be in frontend env or passed from backend
        amount: order.amount,
        currency: order.currency,
        name: 'Rehablito',
        description: 'Therapy Fee Payment',
        order_id: order.id,
        handler: async function (response: any) {
          try {
            // Verify Payment
            const verifyRes = await api.post('/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              feePaymentId,
            });

            if (verifyRes.data.success) {
              toast.success('Payment Successful!');
              setPaymentModalOpen(false);
              onRefresh(); // Reload data
            }
          } catch (err) {
            toast.error('Payment verification failed');
          }
        },
        prefill: {
          name: 'Parent Name',
        },
        theme: {
          color: '#004aad',
        },
      };

      // Test Mode Bypass
      if (options.key === 'rzp_test_placeholder') {
          setTimeout(() => {
              options.handler({
                  razorpay_order_id: order.id,
                  razorpay_payment_id: 'pay_test_' + Date.now(),
                  razorpay_signature: 'test_signature'
              });
          }, 1000); // Simulate network delay
          return;
      }

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.open();

    } catch (err: any) {
      toast.error(err.message || 'Payment initiation failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmPayment = () => {
    if (!selectedInvoice) return;
    if (amountToPay <= 0 || amountToPay > selectedInvoice.dueAmount) {
        toast.error(`Please enter a valid amount between ₹1 and ₹${selectedInvoice.dueAmount.toLocaleString()}`);
        return;
    }
    handlePayNow(amountToPay, selectedInvoice._id);
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl md:text-3xl font-headline font-bold text-on-background">Billing & Payments</h1>
        <p className="text-on-surface-variant font-medium mt-1">Manage your therapy fees and view history.</p>
      </header>

      {/* Due Card */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-outline-variant/20 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <p className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-1">Total Outstanding Due</p>
          <p className="text-4xl font-black text-error">₹{totalDue.toLocaleString()}</p>
        </div>
        {totalDue > 0 && (
          <div className="text-sm text-error/80 max-w-xs md:text-right">
            Please clear the individual pending invoices listed below.
          </div>
        )}
      </div>

      {/* Invoice History */}
      <div className="bg-white rounded-3xl border border-outline-variant/20 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-outline-variant/10">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-secondary" /> Invoices & Payment History
          </h2>
        </div>
        
        {history.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-on-surface-variant font-medium">No billing records found.</p>
          </div>
        ) : (
          <div className="divide-y divide-outline-variant/10">
            {history.map((record: any) => (
              <div key={record._id} className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-surface-container-lowest transition-colors">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-bold text-on-surface text-lg">₹{(record.amount || 0).toLocaleString()}</span>
                    {record.status === 'paid' ? (
                      <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-100">
                        <CheckCircle size={10} /> Paid
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-100">
                        <Clock size={10} /> Pending
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-on-surface-variant font-medium">{record.description || 'Therapy Fee'}</p>
                  <p className="text-xs text-on-surface-variant/70 mt-1">
                    Generated: {mounted ? new Date(record.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}
                    {record.receiptNumber && ` • ${record.receiptNumber}`}
                  </p>
                </div>

                {record.status !== 'paid' && record.dueAmount > 0 && (
                  <button
                    onClick={() => openPaymentModal(record)}
                    className="w-full md:w-auto px-6 py-2.5 bg-secondary text-white font-bold rounded-xl shadow-sm hover:bg-secondary/90 transition-colors"
                  >
                    Pay Due
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Payments History */}
      <div className="bg-white rounded-3xl border border-outline-variant/20 shadow-sm overflow-hidden mt-8">
        <div className="px-6 py-5 border-b border-outline-variant/10">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-brand-sage" /> Recent Payments
          </h2>
        </div>
        
        {allTransactions.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-on-surface-variant font-medium">No payment history found.</p>
          </div>
        ) : (
          <div className="divide-y divide-outline-variant/10">
            {allTransactions.map((tx: any, idx: number) => (
              <div key={tx._id || idx} className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-surface-container-lowest transition-colors">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-bold text-on-surface text-lg text-brand-sage">+₹{(tx.amountPaid || 0).toLocaleString()}</span>
                    <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-sage/10 text-brand-sage border border-brand-sage/20">
                      Successful
                    </span>
                  </div>
                  <p className="text-sm text-on-surface-variant font-medium">Towards: {tx.invoiceDescription}</p>
                  <p className="text-xs text-on-surface-variant/70 mt-1">
                    Paid on: {mounted ? new Date(tx.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                    {tx.transactionId && ` • Txn ID: ${tx.transactionId}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Partial Payment Modal */}
      <AnimatePresence>
        {paymentModalOpen && selectedInvoice && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isProcessing && setPaymentModalOpen(false)}
              className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 12 }}
              className="relative bg-white w-full max-w-sm rounded-3xl shadow-2xl p-8 z-10"
            >
              <button
                onClick={() => setPaymentModalOpen(false)}
                disabled={isProcessing}
                className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full transition-colors disabled:opacity-50"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>

              <div className="space-y-6 text-center">
                <div className="w-14 h-14 bg-secondary/10 rounded-2xl flex items-center justify-center mx-auto">
                  <CreditCard className="w-7 h-7 text-secondary" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-on-background">Pay Invoice</h3>
                  <p className="text-sm text-on-surface-variant font-medium mt-1">Total Due: ₹{selectedInvoice.dueAmount.toLocaleString()}</p>
                </div>
                
                <div className="text-left space-y-2">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Amount to Pay (₹)</label>
                    <input 
                        type="number"
                        min="1"
                        max={selectedInvoice.dueAmount}
                        value={amountToPay}
                        onChange={(e) => setAmountToPay(Number(e.target.value))}
                        disabled={isProcessing}
                        className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/30 rounded-xl font-bold focus:outline-none focus:border-secondary transition-colors"
                    />
                    <p className="text-[10px] text-on-surface-variant mt-1">You can pay partially or the full amount.</p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={() => setPaymentModalOpen(false)}
                    disabled={isProcessing}
                    className="px-4 py-3 bg-surface-container text-on-surface font-bold rounded-xl hover:bg-surface-container-high transition-all text-sm disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmPayment}
                    disabled={isProcessing || amountToPay <= 0 || amountToPay > selectedInvoice.dueAmount}
                    className="px-4 py-3 bg-secondary text-white font-bold rounded-xl shadow-md hover:bg-secondary/90 transition-all text-sm flex items-center justify-center disabled:opacity-50"
                  >
                    {isProcessing ? 'Processing...' : 'Proceed'}
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
