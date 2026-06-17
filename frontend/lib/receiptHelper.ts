import api from '@/lib/api';

export const generateAndPrintReceipt = async (
  selectedInvoice: any,
  selectedPatientContext: any,
  isProcessingCallback: (processing: boolean) => void,
  selectedTransaction?: any
) => {
  isProcessingCallback(true);
  try {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const W = 210;

    // ── Patient Details & Services Fetching ──────────────────────────
    let patientData: any = null;
    let patientIdValue = typeof selectedInvoice.patientId === 'object' 
      ? selectedInvoice.patientId?._id 
      : selectedInvoice.patientId;

    if (patientIdValue) {
      try {
        const isSuperAdmin = typeof window !== 'undefined' && window.location.pathname.includes('/super-admin');
        const isManager = typeof window !== 'undefined' && window.location.pathname.includes('/manager');
        if (isSuperAdmin) {
          const res = await api.get(`/admin/patients/${patientIdValue}`);
          if (res.data?.success) {
            patientData = res.data.data;
          }
        } else if (isManager) {
          const res = await api.get(`/manager/patients/${patientIdValue}`);
          if (res.data?.success) {
            patientData = res.data.data;
          }
        } else {
          const res = await api.get('/parent/profile');
          if (res.data?.success && res.data.data?.patient) {
            patientData = res.data.data.patient;
          }
        }
      } catch (err) {
        console.error("Failed to fetch patient details", err);
      }
    }

    const patientObj = patientData || (typeof selectedInvoice.patientId === 'object' ? selectedInvoice.patientId : null);
    
    // Calculate Total Service Fee and discounts based on assigned services
    let totalBasePrice = 0;
    let totalDiscount = 0;
    const therapyTypes = patientObj?.therapyType || [];
    const therapyDetails = patientObj?.therapyDetails || [];
    
    const isSuperAdmin = typeof window !== 'undefined' && window.location.pathname.includes('/super-admin');
    const isManager = typeof window !== 'undefined' && window.location.pathname.includes('/manager');
    
    if (typeof window !== 'undefined' && (isSuperAdmin || isManager) && therapyTypes.length > 0) {
      try {
        const servicesRes = await api.get(isSuperAdmin ? '/admin/services' : '/manager/services');
        if (servicesRes.data?.success && servicesRes.data.data) {
          const servicesList = servicesRes.data.data;
          totalBasePrice = servicesList
            .filter((s: any) => {
              const val = s.name.toLowerCase().replace(/ /g, '_');
              return therapyTypes.includes(val);
            })
            .reduce((sum: number, s: any) => sum + s.price, 0);
            
          totalDiscount = therapyDetails
            .filter((d: any) => therapyTypes.includes(d.therapy))
            .reduce((sum: number, d: any) => sum + (Number(d.discount) || 0), 0);
        }
      } catch (err) {
        console.error("Failed to calculate service fee from catalog", err);
      }
    }
    
    if (!totalBasePrice) {
      totalBasePrice = patientObj?.totalFee || selectedInvoice.patientId?.totalFee || selectedInvoice.amount || 0;
      totalDiscount = therapyDetails.reduce((sum: number, d: any) => sum + (Number(d.discount) || 0), 0);
      if (totalDiscount > 0) {
        totalBasePrice = totalBasePrice + totalDiscount;
      }
    }

    // Fetch payment history
    // Fetch payment history
    let patientAllPayments = selectedPatientContext?.allPayments || [];
    
    // Check if the passed payments are mapped BillingRecords (which don't have MongoDB's _id or transactions)
    // or if the list is empty. If they are mapped, we want to fetch the raw FeePayment documents to have accurate transaction history.
    const isMapped = patientAllPayments.length > 0 && patientAllPayments.some((p: any) => p.id && !p._id);

    if ((!patientAllPayments || patientAllPayments.length === 0 || isMapped) && patientIdValue) {
      try {
        const isSuperAdmin = typeof window !== 'undefined' && window.location.pathname.includes('/super-admin');
        const isManager = typeof window !== 'undefined' && window.location.pathname.includes('/manager');
        let url = '/parent/billing';
        if (isSuperAdmin) {
          url = `/admin/fees?patientId=${patientIdValue}`;
        } else if (isManager) {
          url = `/manager/billing?patientId=${patientIdValue}`;
        }
        const feesRes = await api.get(url);
        if (feesRes.data?.success) {
          patientAllPayments = (isSuperAdmin || isManager) ? feesRes.data.data : feesRes.data.data.history;
        }
      } catch (e) {
        console.error("Failed to fetch patient payments history", e);
      }
    }
    
    if (!patientAllPayments || patientAllPayments.length === 0) {
      patientAllPayments = [selectedInvoice];
    }

    // Resolve mapped selectedInvoice to its raw DB counterpart if available
    if (selectedInvoice && selectedInvoice.id && !selectedInvoice._id && patientAllPayments.length > 0) {
      const matchedRaw = patientAllPayments.find((p: any) => p._id === selectedInvoice.id);
      if (matchedRaw) {
        selectedInvoice = matchedRaw;
      }
    }

    const getLogoBase64 = async (): Promise<string | null> => {
      try {
        const res = await fetch('/logo.jpeg');
        const blob = await res.blob();
        return await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      } catch {
        return null;
      }
    };

    // ── Header Section (Official Foundation Letterhead) ──────────
    doc.setFillColor(255, 255, 255); 
    doc.rect(0, 0, W, 55, 'F');

    const logo = await getLogoBase64();
    if (logo) {
      doc.addImage(logo, 'PNG', 15, 12, 22, 22);
    }

    const centerX = W / 2;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(0, 74, 173); // Brand Blue
    doc.text('REHABLITO CHARITABLE FOUNDATION', centerX, 16, { align: 'center' });

    doc.setFontSize(10);
    doc.text('(PHYSIO & AUTISM CENTER)', centerX, 21, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(50, 60, 70);
    doc.text('CIN - U86900BR2025NPL075408   |   PAN NO.: AAOCR5682E', centerX, 26, { align: 'center' });

    const bName = selectedInvoice.branchId?.name || 'REHABLITO PHYSIO & AUTISM CENTER';
    const bAddress = selectedInvoice.branchId?.address || 'Rajendra Nagar Road, (BC) Patna, Bihar, 800016';
    const bPhone = selectedInvoice.branchId?.phone || '9204786220';
    const bEmail = selectedInvoice.branchId?.email || 'rehablito@gmail.com';

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(0, 74, 173);
    doc.text(bName.toUpperCase(), centerX, 33, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(50, 60, 70);
    doc.text(bAddress, centerX, 38, { align: 'center' });
    doc.text(`Mobile: ${bPhone}   |   Email: ${bEmail}`, centerX, 43, { align: 'center' });

    doc.setDrawColor(0, 74, 173);
    doc.setLineWidth(0.5);
    doc.line(12, 48, W - 12, 48);

    // Define receipt details dynamically
    let receiptNo = selectedInvoice.receiptNumber || selectedInvoice._id?.slice(-8).toUpperCase() || 'N/A';
    let method = selectedInvoice.method ? selectedInvoice.method.replace(/_/g, ' ').toUpperCase() : 'CASH';
    const dateStr = selectedInvoice.date || selectedInvoice.paymentDate || selectedInvoice.createdAt;
    let formattedDate = dateStr ? new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleDateString('en-IN');

    // Amount paid this transaction
    let amountPaidThisTx = selectedInvoice.amount || 0;

    if (selectedTransaction) {
      amountPaidThisTx = selectedTransaction.amountPaid || selectedTransaction.amount || 0;
      method = (selectedTransaction.method || method).replace(/_/g, ' ').toUpperCase();
      if (selectedTransaction.date) {
        formattedDate = new Date(selectedTransaction.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      }
      if (selectedTransaction.transactionId && selectedTransaction.status !== 'pending' && !selectedTransaction.transactionId.startsWith('approved_')) {
        receiptNo = selectedTransaction.transactionId;
      }
    } else if (selectedInvoice.transactions && selectedInvoice.transactions.length > 0) {
      // Default to the last approved transaction if no specific transaction is passed
      const approvedTxs = selectedInvoice.transactions.filter((t: any) => t.status !== 'pending');
      if (approvedTxs.length > 0) {
        const sortedApproved = [...approvedTxs].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
        amountPaidThisTx = sortedApproved[0].amountPaid || 0;
        method = (sortedApproved[0].method || method).replace(/_/g, ' ').toUpperCase();
        if (sortedApproved[0].date) {
          formattedDate = new Date(sortedApproved[0].date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        }
        if (sortedApproved[0].transactionId && !sortedApproved[0].transactionId.startsWith('approved_')) {
          receiptNo = sortedApproved[0].transactionId;
        }
      } else {
        const lastTx = selectedInvoice.transactions[selectedInvoice.transactions.length - 1];
        amountPaidThisTx = lastTx.amountPaid || 0;
        method = (lastTx.method || method).replace(/_/g, ' ').toUpperCase();
        if (lastTx.date) {
          formattedDate = new Date(lastTx.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        }
      }
    } else if (selectedInvoice.amountPaid !== undefined) {
      amountPaidThisTx = selectedInvoice.amountPaid;
    }

    doc.setFontSize(8);
    doc.setTextColor(100, 110, 130);
    doc.text(`Receipt No: ${receiptNo}`, 12, 53, { align: 'left' });
    doc.text(`Date: ${formattedDate}`, W - 12, 53, { align: 'right' });

    // ── Document title strip ──────────────────────────────────
    doc.setFillColor(232, 240, 255); 
    doc.rect(10, 56, W - 20, 10, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(0, 74, 173);
    doc.text('PAYMENT RECEIPT', W / 2, 63, { align: 'center' });

    // ── Transaction Details Card ─────────────────────────────────────
    let y = 72;

    doc.setFillColor(248, 250, 255);
    doc.setDrawColor(210, 220, 240);
    doc.roundedRect(10, y, W - 20, 10, 2, 2, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(0, 74, 173);
    doc.text('TRANSACTION DETAILS', 14, y + 7);
    y += 16;

    const leftCol = 14;
    const midCol = 110;
    const labelColor: [number, number, number] = [100, 110, 130];
    const valueColor: [number, number, number] = [20, 25, 35];

    const desc = selectedInvoice.description || selectedInvoice.items?.[0]?.description || 'Therapy Fee';

    const patientName = selectedInvoice.patientName || patientObj?.name || selectedInvoice.patientId?.name || 'Unknown';
    const patientId = patientObj?.patientId || selectedInvoice.patientId?.patientId || 'N/A';
    const statusVal = selectedInvoice.status ? selectedInvoice.status.toUpperCase() : 'N/A';

    let servicesVal = 'None';
    if (patientObj?.therapyType && patientObj.therapyType.length > 0) {
      servicesVal = patientObj.therapyType.map((t: string) => t.replace(/_/g, ' ').toUpperCase()).join(', ');
    }

    const ageVal = patientObj?.age ? `${patientObj.age} Years` : '—';
    const genderVal = patientObj?.gender ? patientObj.gender.charAt(0).toUpperCase() + patientObj.gender.slice(1) : '—';

    const leftRows = [
      ['Patient ID', patientId],
      ['Patient Name', patientName],
      ['Payment Method', method],
      ['Services', servicesVal],
      ['Age', ageVal],
    ];

    const rightRows = [
      ['Receipt No', receiptNo],
      ['Date', formattedDate],
      ['Description', desc],
      ['Status', statusVal],
      ['Gender', genderVal],
    ];

    const rowH = 14;
    const maxRows = Math.max(leftRows.length, rightRows.length);

    for (let i = 0; i < maxRows; i++) {
      const rowY = y + i * rowH;

      if (i % 2 === 0) {
        doc.setFillColor(240, 245, 255);
        doc.rect(10, rowY - 4, W - 20, rowH, 'F');
      }

      if (leftRows[i]) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(...labelColor);
        doc.text(leftRows[i][0], leftCol, rowY + 4);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...valueColor);
        const val = doc.splitTextToSize(String(leftRows[i][1]), 55);
        doc.text(val, leftCol + 35, rowY + 4);
      }

      if (rightRows[i]) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(...labelColor);
        doc.text(rightRows[i][0], midCol, rowY + 4);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...valueColor);
        const val = doc.splitTextToSize(String(rightRows[i][1]), 50);
        doc.text(val, midCol + 30, rowY + 4);
      }
    }

    let currentPage = 1;

    const drawPageDecorations = (pageNumber: number) => {
      doc.setFillColor(0, 74, 173);
      doc.rect(0, 282, W, 15, 'F');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(180, 210, 255);
      doc.text('Rehablito Charitable Foundation  |  Official Payment Receipt  |  Not valid without official stamp', W / 2, 291, { align: 'center' });

      // Page number
      doc.setFontSize(8);
      doc.setTextColor(130, 140, 160);
      doc.text(`Page ${pageNumber}`, W - 15, 275, { align: 'right' });
    };

    const drawSubsequentPageHeader = (pageNumber: number) => {
      doc.setFillColor(232, 240, 255); 
      doc.rect(10, 10, W - 20, 10, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(0, 74, 173);
      doc.text(`PAYMENT RECEIPT - Page ${pageNumber}`, W / 2, 16, { align: 'center' });
      
      doc.setDrawColor(0, 74, 173);
      doc.setLineWidth(0.3);
      doc.line(12, 22, W - 12, 22);
    };

    y += maxRows * rowH + 10;

    const allTxs: any[] = [];
    patientAllPayments.forEach((p: any) => {
      if (p.transactions && p.transactions.length > 0) {
         p.transactions.forEach((tx: any) => {
            allTxs.push({ ...tx, parentReceipt: p.receiptNumber || p._id });
         });
      } else {
         allTxs.push({ 
            amountPaid: p.amountPaid || p.amount, 
            date: p.paymentDate || p.createdAt, 
            method: p.method, 
            parentReceipt: p.receiptNumber || p._id 
         });
      }
    });

    // Sort by date desc
    allTxs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const displayTxs = allTxs; // Print ALL transactions

    if (displayTxs.length > 0) {
      doc.setFillColor(248, 250, 255);
      doc.setDrawColor(210, 220, 240);
      doc.roundedRect(10, y, W - 20, 10, 2, 2, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(0, 74, 173);
      doc.text('RECENT TRANSACTIONS', 14, y + 7);
      y += 16;

      // Table Header
      doc.setFillColor(232, 240, 255);
      doc.rect(10, y - 4, W - 20, 10, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(0, 74, 173);
      doc.text('Date', 14, y + 2);
      doc.text('Time', 45, y + 2);
      doc.text('Receipt / Txn', 75, y + 2);
      doc.text('Method', 125, y + 2);
      doc.text('Amount Paid', W - 14, y + 2, { align: 'right' });
      y += 10;

      displayTxs.forEach((tx: any, i: number) => {
         // Page break check (recent transactions table row)
         if (y > 220) {
            drawPageDecorations(currentPage);
            doc.addPage();
            currentPage += 1;
            drawSubsequentPageHeader(currentPage);
            y = 32;

            // Redraw columns header
            doc.setFillColor(232, 240, 255);
            doc.rect(10, y - 4, W - 20, 10, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8.5);
            doc.setTextColor(0, 74, 173);
            doc.text('Date', 14, y + 2);
            doc.text('Time', 45, y + 2);
            doc.text('Receipt / Txn', 75, y + 2);
            doc.text('Method', 125, y + 2);
            doc.text('Amount Paid', W - 14, y + 2, { align: 'right' });
            y += 10;
         }

         if (i % 2 === 0) {
            doc.setFillColor(248, 250, 255);
            doc.rect(10, y - 4, W - 20, 10, 'F');
         }
         doc.setFont('helvetica', 'normal');
         doc.setFontSize(8.5);
         doc.setTextColor(50, 60, 70);

         const txDate = tx.date ? new Date(tx.date).toLocaleDateString('en-IN') : 'N/A';
         const txTime = tx.date 
           ? new Date(tx.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) 
           : 'N/A';
         const txRef = tx.transactionId || tx.parentReceipt?.slice(-8) || 'N/A';
         const txMethod = tx.method ? tx.method.replace(/_/g, ' ').toUpperCase() : 'N/A';
         const txAmount = `Rs. ${(tx.amountPaid || 0).toLocaleString()}`;

         doc.text(txDate, 14, y + 2);
         doc.text(txTime, 45, y + 2);
         doc.text(txRef, 75, y + 2);
         doc.text(txMethod, 125, y + 2);
         doc.text(txAmount, W - 14, y + 2, { align: 'right' });
         y += 10;
      });
      y += 10;
    }

    // ── Payment Summary ─────────────────────────────────────
    if (y + 90 > 220) {
       drawPageDecorations(currentPage);
       doc.addPage();
       currentPage += 1;
       drawSubsequentPageHeader(currentPage);
       y = 32;
    }

    doc.setFillColor(248, 250, 255);
    doc.setDrawColor(210, 220, 240);
    doc.roundedRect(10, y, W - 20, 10, 2, 2, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(0, 74, 173);
    doc.text('PAYMENT SUMMARY', 14, y + 7);
    y += 16;

    const discountedFee = Math.max(0, totalBasePrice - totalDiscount);
    const remainingBalance = selectedInvoice.dueAmount ?? 0;
    const totalPaidToDate = Math.max(0, discountedFee - remainingBalance);

    const summaryRows = [
      ['Total Base Fee', `Rs. ${totalBasePrice.toLocaleString()}`, false],
      ['Discount Applied', `- Rs. ${totalDiscount.toLocaleString()}`, false],
      ['Total Service Fee', `Rs. ${discountedFee.toLocaleString()}`, false],
      ['Amount Paid (This Tx)', `Rs. ${amountPaidThisTx.toLocaleString()}`, true],
      ['Total Paid to Date', `Rs. ${totalPaidToDate.toLocaleString()}`, false],
      ['Remaining Balance', `Rs. ${remainingBalance.toLocaleString()}`, false, true],
    ];

    summaryRows.forEach(([label, val, highlight, red], i) => {
      const sy = y + i * 14;
      if (i % 2 === 0) {
        doc.setFillColor(240, 245, 255);
        doc.rect(10, sy - 4, W - 20, 14, 'F');
      }
      doc.setFont('helvetica', 'bold'); 
      doc.setFontSize(10); 
      doc.setTextColor(...labelColor);
      doc.text(String(label), 14, sy + 5);

      let r = 20, g = 25, b = 35;
      let fontSize = 10;
      if (red) {
        r = 200; g = 0; b = 0;
        fontSize = 11;
      } else if (highlight) {
        r = 0; g = 74; b = 173;
        fontSize = 11;
      } else if (String(label).includes('Discount')) {
        r = 16; g = 124; b = 65; // Green for discount
        fontSize = 10;
      }
      doc.setTextColor(r, g, b);
      doc.setFontSize(fontSize);
      doc.text(String(val), W - 14, sy + 5, { align: 'right' });
    });

    y += summaryRows.length * 14 + 10;

    // ── Signature section ──────────────────────────────────────────
    if (y > 230) {
       drawPageDecorations(currentPage);
       doc.addPage();
       currentPage += 1;
       drawSubsequentPageHeader(currentPage);
       y = 32;
    }

    const sigY = 240; 
    
    doc.setDrawColor(200, 210, 230);
    doc.setFillColor(250, 252, 255);
    doc.roundedRect(10, sigY, 85, 28, 2, 2, 'FD');
    doc.roundedRect(W - 95, sigY, 85, 28, 2, 2, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(130, 140, 160);
    doc.text('Patient / Guardian Signature', 52, sigY + 22, { align: 'center' });
    doc.text('Authorized Signatory', W - 52, sigY + 22, { align: 'center' });

    doc.setDrawColor(180, 190, 210);
    doc.line(18, sigY + 18, 87, sigY + 18);
    doc.line(W - 87, sigY + 18, W - 18, sigY + 18);

    drawPageDecorations(currentPage);

    doc.save(`Receipt_${receiptNo}.pdf`);
  } catch (err) {
    console.error("PDF generation failed", err);
  } finally { 
    isProcessingCallback(false); 
  }
};
