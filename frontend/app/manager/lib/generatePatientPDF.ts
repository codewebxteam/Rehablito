import { jsPDF } from 'jspdf';
import { Patient } from '../types';

const THERAPY_LABELS: Record<string, string> = {
  physiotherapy: 'Physiotherapy',
  speech_therapy: 'Speech Therapy',
  occupational_therapy: 'Occupational Therapy',
  aba_therapy: 'ABA Therapy',
  autism_therapy: 'Autism Therapy',
};

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

const maskPhone = (phone: string) => {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return 'xxxx' + phone.slice(-4);
  return 'x'.repeat(Math.max(digits.length - 4, 4)) + digits.slice(-4);
};

export const generatePatientPDF = async (patient: Patient & { 
  branchName?: string;
  branchAddress?: string;
  branchPhone?: string;
  branchEmail?: string;
}, title = 'Patient Registration Record') => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = 210;

  // ── Header Section (Official Foundation Letterhead) ──────────
  doc.setFillColor(255, 255, 255); 
  doc.rect(0, 0, W, 55, 'F');

  // Logo (Center-Left)
  const logo = await getLogoBase64();
  if (logo) {
    doc.addImage(logo, 'PNG', 15, 12, 22, 22);
  }

  // Header Text - Center Aligned
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

  // Dynamic Branch Details
  const bName = patient.branchName || 'REHABLITO PHYSIO & AUTISM CENTER';
  const bAddress = patient.branchAddress || 'Rajendra Nagar Road, (BC) Patna, Bihar, 800016';
  const bPhone = patient.branchPhone || '9204786220';
  const bEmail = patient.branchEmail || 'rehablito@gmail.com';

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(0, 74, 173);
  doc.text(bName.toUpperCase(), centerX, 33, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(50, 60, 70);
  doc.text(bAddress, centerX, 38, { align: 'center' });
  doc.text(`Mobile: ${bPhone}   |   Email: ${bEmail}`, centerX, 43, { align: 'center' });

  // Divider Line
  doc.setDrawColor(0, 74, 173);
  doc.setLineWidth(0.5);
  doc.line(12, 48, W - 12, 48);

  // Date & Reference ID
  doc.setFontSize(8);
  doc.setTextColor(100, 110, 130);
  doc.text(`Ref: ${patient.patientId || patient.id}`, 12, 53, { align: 'left' });
  doc.text(`Date: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`, W - 12, 53, { align: 'right' });

  // ── Document title strip ──────────────────────────────────
  doc.setFillColor(232, 240, 255); 
  doc.rect(10, 56, W - 20, 10, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(0, 74, 173);
  doc.text(title.toUpperCase(), W / 2, 63, { align: 'center' });

  // ── Patient Info Card ─────────────────────────────────────
  let y = 72;

  // Card background
  doc.setFillColor(248, 250, 255);
  doc.setDrawColor(210, 220, 240);
  doc.roundedRect(10, y, W - 20, 10, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(0, 74, 173);
  doc.text('PATIENT INFORMATION', 14, y + 7);
  y += 16;

  const leftCol = 14;
  const midCol = 110;
  const labelColor: [number, number, number] = [100, 110, 130];
  const valueColor: [number, number, number] = [20, 25, 35];

  const isAdminView = !!patient.branchName;

  const leftRows = isAdminView ? [
    ['Patient ID',        patient.patientId || patient.id],
    ['Child Name',        patient.name],
    ['Parent / Guardian', patient.parentName || '—'],
    ['Phone Contact',     maskPhone(patient.phone || '')],
  ] : [
    ['Patient ID',        patient.patientId || patient.id],
    ['Patient Name',      patient.name],
    ['Parent / Guardian', patient.parentName || '—'],
    ['Age',               `${patient.age} Years`],
    ['Gender',            patient.gender ? patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1) : '—'],
  ];

  const rightRows = isAdminView ? [
    ['Service / Therapy', THERAPY_LABELS[patient.therapyType || ''] || patient.therapyType || '—'],
    ['Branch',            patient.branchName || '—'],
    ['Address',           patient.address || '—'],
    ['Onboarding Date',   new Date(patient.onboardedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })],
  ] : [
    ['Contact No.',       maskPhone(patient.phone || '')],
    ['Therapy Type',      THERAPY_LABELS[patient.therapyType || ''] || patient.therapyType || '—'],
    ['Onboarding Date',   new Date(patient.onboardedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })],
    ['Status',            'Active'],
    ['Address',           patient.address || '—'],
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
      doc.text(String(leftRows[i][1]), leftCol + 42, rowY + 4);
    }

    if (rightRows[i]) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(...labelColor);
      doc.text(rightRows[i][0], midCol, rowY + 4);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...valueColor);
      const val = doc.splitTextToSize(String(rightRows[i][1]), 44);
      doc.text(val, midCol + 30, rowY + 4);
    }
  }

  y += maxRows * rowH + 10;

  // ── Center Guidelines & Declaration Section (Filling Space Perfectly) ──
  doc.setFillColor(248, 250, 255);
  doc.setDrawColor(210, 220, 240);
  doc.roundedRect(10, y, W - 20, 10, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(0, 74, 173);
  doc.text('RULES, REGULATIONS & GUARDIAN DECLARATION', 14, y + 7);
  y += 14;

  const guidelines = [
    '1. Confidentiality: All evaluation notes, case charts, and session tracking logs are properties of the foundation and strictly protected under medical confidentiality laws.',
    '2. Session Punctuality: Guardians must ensure the child arrives at least 5 minutes prior to the scheduled therapy session time. Late arrivals will not receive extended sessions.',
    '3. Leave & Cancellations: Any planned absence or rescheduling request must be informed to the center administration at least 24 hours in advance, or the session may be lapsed.',
    '4. Clinical Protocols: Therapy progress timelines and methods vary per child. The foundation reserves the right to review and alter therapist assignments based on clinical evaluation requirements.',
    '5. Official Declaration: I hereby declare that all the information and historical records provided during the onboarding of this patient are correct, absolute, and verified to the best of my knowledge.'
  ];

  const guideBoxY = y;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(60, 70, 80);

  let currentTextY = y + 6;
  guidelines.forEach((line) => {
    const splitLine = doc.splitTextToSize(line, W - 28);
    doc.text(splitLine, 14, currentTextY);
    currentTextY += splitLine.length * 4.5 + 2.5; // Smooth layout line gaps
  });

  const guideBoxH = currentTextY - guideBoxY + 1;
  doc.setDrawColor(210, 220, 240);
  doc.roundedRect(10, guideBoxY, W - 20, guideBoxH, 2, 2, 'D');

  // ── Signature section (Fixed at the bottom of the page) ──
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

  // ── Footer ────────────────────────────────────────────────
  doc.setFillColor(0, 74, 173);
  doc.rect(0, 282, W, 15, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(180, 210, 255);
  doc.text('Rehablito Charitable Foundation  |  Confidential Record  |  Not valid without official stamp', W / 2, 291, { align: 'center' });

  return doc;
};