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

export const generatePatientPDF = async (patient: Patient & { branchName?: string }, title = 'Patient Registration Record') => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = 210;

  // ── Header band ──────────────────────────────────────────
  doc.setFillColor(0, 74, 173);
  doc.rect(0, 0, W, 38, 'F');

  // Logo
  const logo = await getLogoBase64();
  if (logo) {
    doc.addImage(logo, 'PNG', 8, 4, 15, 30);
  }

  // Clinic name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(255, 255, 255);
  doc.text('REHABLITO', 27, 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(180, 210, 255);
  doc.text('Physio & Autism Center', 27, 22);
  doc.text('Everyone Deserves Trusted Hands', 27, 27);

  // Date top-right
  doc.setFontSize(8);
  doc.setTextColor(200, 225, 255);
  doc.text(`Date: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`, W - 14, 16, { align: 'right' });
  doc.text(`Ref: ${patient.patientId || patient.id}`, W - 14, 22, { align: 'right' });

  // ── Document title strip ──────────────────────────────────
  doc.setFillColor(232, 240, 255);
  doc.rect(0, 38, W, 12, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(0, 74, 173);
  doc.text(title.toUpperCase(), W / 2, 46, { align: 'center' });

  // ── Patient info card ─────────────────────────────────────
  let y = 60;

  // Card background
  doc.setFillColor(248, 250, 255);
  doc.setDrawColor(210, 220, 240);
  doc.roundedRect(10, y, W - 20, 10, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(0, 74, 173);
  doc.text('PATIENT INFORMATION', 14, y + 7);
  y += 16;

  // Two-column info grid
  const leftCol = 14;
  const midCol = 110;
  const labelColor: [number, number, number] = [100, 110, 130];
  const valueColor: [number, number, number] = [20, 25, 35];

  const isAdminView = !!patient.branchName;

  const leftRows = isAdminView ? [
    ['Patient ID',        patient.patientId || patient.id],
    ['Child Name',        patient.name],
    ['Parent / Guardian', patient.parentName || '—'],
    ['Phone Contact',     patient.phone || '—'],
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
    ['Contact No.',       patient.phone || '—'],
    ['Therapy Type',      THERAPY_LABELS[patient.therapyType || ''] || patient.therapyType || '—'],
    ['Onboarding Date',   new Date(patient.onboardedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })],
    ['Status',            'Active'],
    ['Address',           patient.address || '—'],
  ];

  const rowH = 14;
  const maxRows = Math.max(leftRows.length, rightRows.length);

  for (let i = 0; i < maxRows; i++) {
    const rowY = y + i * rowH;

    // Alternating row bg
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

  y += maxRows * rowH + 8;

  // ── Diagnosis section ─────────────────────────────────────
  doc.setFillColor(248, 250, 255);
  doc.setDrawColor(210, 220, 240);
  doc.roundedRect(10, y, W - 20, 10, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(0, 74, 173);
  doc.text('CLINICAL NOTES / DIAGNOSIS', 14, y + 7);
  y += 14;

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(220, 228, 245);
  const diagText = patient.condition || 'No diagnosis recorded.';
  const diagLines = doc.splitTextToSize(diagText, W - 28);
  const diagH = Math.max(diagLines.length * 6 + 8, 20);
  doc.roundedRect(10, y, W - 20, diagH, 2, 2, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...valueColor);
  doc.text(diagLines, 14, y + 7);
  y += diagH + 10;

  // ── Signature section ─────────────────────────────────────
  doc.setDrawColor(200, 210, 230);
  doc.setFillColor(250, 252, 255);
  doc.roundedRect(10, y, 85, 28, 2, 2, 'FD');
  doc.roundedRect(W - 95, y, 85, 28, 2, 2, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(130, 140, 160);
  doc.text('Patient / Guardian Signature', 52, y + 22, { align: 'center' });
  doc.text('Authorized Signatory', W - 52, y + 22, { align: 'center' });

  doc.setDrawColor(180, 190, 210);
  doc.line(18, y + 18, 87, y + 18);
  doc.line(W - 87, y + 18, W - 18, y + 18);

  // ── Footer ────────────────────────────────────────────────
  doc.setFillColor(0, 74, 173);
  doc.rect(0, 282, W, 15, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(180, 210, 255);
  doc.text('Rehablito Physio & Autism Center  |  Confidential Patient Record  |  Not valid without official stamp', W / 2, 291, { align: 'center' });

  return doc;
};
