const PDFDocument = require('pdfkit');

/**
 * Generate a Patient Registration PDF
 * @param {Object} patient - Populated patient document
 * @param {Object} branch  - Populated branch document
 * @returns {Promise<Buffer>} PDF buffer
 */
const generatePatientRegistrationPDF = (patient, branch) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: 'A4',
                margin: 50,
                info: {
                    Title: `Patient Registration - ${patient.name}`,
                    Author: 'Rehablito Clinic',
                    Subject: 'Patient Registration Form',
                }
            });

            const buffers = [];
            doc.on('data', (chunk) => buffers.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            doc.on('error', reject);

            // ── Header ──
            doc.fontSize(22).font('Helvetica-Bold')
                .text('REHABLITO', { align: 'center' });
            doc.fontSize(10).font('Helvetica')
                .text('Rehabilitation & Therapy Center', { align: 'center' });
            doc.moveDown(0.3);

            // Branch info
            if (branch) {
                doc.fontSize(9).fillColor('#555555')
                    .text(`Branch: ${branch.name} | ${branch.address}, ${branch.city}`, { align: 'center' })
                    .text(`Phone: ${branch.phone}${branch.email ? ' | Email: ' + branch.email : ''}`, { align: 'center' });
            }

            // Horizontal line
            doc.moveDown(0.5);
            doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#2563eb');
            doc.moveDown(0.5);

            // ── Title ──
            doc.fontSize(16).font('Helvetica-Bold').fillColor('#1e40af')
                .text('PATIENT REGISTRATION FORM', { align: 'center' });
            doc.moveDown(0.3);

            // Registration number & date
            const regDate = new Date(patient.admissionDate || patient.createdAt);
            const regNumber = `REG-${patient._id.toString().slice(-8).toUpperCase()}`;
            doc.fontSize(9).font('Helvetica').fillColor('#333333')
                .text(`Registration No: ${regNumber}    |    Date: ${regDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}`, { align: 'center' });

            doc.moveDown(1);

            // ── Patient Details Section ──
            drawSectionHeader(doc, 'Patient Information');

            const patientDetails = [
                ['Name', patient.name],
                ['Date of Birth', patient.dob ? new Date(patient.dob).toLocaleDateString('en-IN') : 'N/A'],
                ['Age', patient.age ? `${patient.age} years` : 'N/A'],
                ['Gender', patient.gender ? patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1) : 'N/A'],
                ['Diagnosis', patient.diagnosis || 'N/A'],
                ['Status', patient.status ? patient.status.replace('_', ' ').toUpperCase() : 'Active'],
            ];
            drawTable(doc, patientDetails);

            doc.moveDown(0.8);

            // ── Parent / Guardian Details ──
            drawSectionHeader(doc, 'Parent / Guardian Information');

            const parentDetails = [
                ['Parent Name', patient.parentName || 'N/A'],
                ['Phone Number', patient.parentPhone || 'N/A'],
                ['Email', patient.parentEmail || 'N/A'],
            ];
            drawTable(doc, parentDetails);

            doc.moveDown(0.8);

            // ── Therapy Details ──
            drawSectionHeader(doc, 'Therapy Details');

            const therapyTypes = (patient.therapyType || []).map(t =>
                t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
            ).join(', ') || 'N/A';

            const therapistName = patient.assignedTherapist?.name || 'Not Assigned';

            const therapyDetails = [
                ['Therapy Type(s)', therapyTypes],
                ['Assigned Therapist', therapistName],
                ['Admission Date', regDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })],
            ];
            drawTable(doc, therapyDetails);

            doc.moveDown(1.5);

            // ── Signature Area ──
            doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#cccccc');
            doc.moveDown(1);

            const sigY = doc.y;
            doc.fontSize(9).font('Helvetica').fillColor('#555555');
            doc.text('Parent/Guardian Signature', 50, sigY, { width: 200, align: 'center' });
            doc.text('Authorized Signature', 345, sigY, { width: 200, align: 'center' });

            doc.moveTo(50, sigY - 5).lineTo(250, sigY - 5).stroke('#999999');
            doc.moveTo(345, sigY - 5).lineTo(545, sigY - 5).stroke('#999999');

            // ── Footer ──
            doc.moveDown(2);
            doc.fontSize(8).fillColor('#999999')
                .text('This is a computer-generated document. No physical signature is required for digital records.', { align: 'center' })
                .text(`Generated on: ${new Date().toLocaleString('en-IN')}`, { align: 'center' });

            doc.end();
        } catch (err) {
            reject(err);
        }
    });
};

/**
 * Generate a Payment Invoice / Receipt PDF
 * @param {Object} payment  - Populated FeePayment document
 * @param {Object} patient  - Populated Patient document
 * @param {Object} branch   - Populated Branch document
 * @returns {Promise<Buffer>} PDF buffer
 */
const generateInvoicePDF = (payment, patient, branch) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: 'A4',
                margin: 50,
                info: {
                    Title: `Invoice - ${payment.receiptNumber}`,
                    Author: 'Rehablito Clinic',
                    Subject: 'Payment Invoice',
                }
            });

            const buffers = [];
            doc.on('data', (chunk) => buffers.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            doc.on('error', reject);

            // ── Header ──
            doc.fontSize(22).font('Helvetica-Bold')
                .text('REHABLITO', { align: 'center' });
            doc.fontSize(10).font('Helvetica')
                .text('Rehabilitation & Therapy Center', { align: 'center' });
            doc.moveDown(0.3);

            if (branch) {
                doc.fontSize(9).fillColor('#555555')
                    .text(`Branch: ${branch.name} | ${branch.address}, ${branch.city}`, { align: 'center' })
                    .text(`Phone: ${branch.phone}${branch.email ? ' | Email: ' + branch.email : ''}`, { align: 'center' });
            }

            doc.moveDown(0.5);
            doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#2563eb');
            doc.moveDown(0.5);

            // ── Invoice Title ──
            const isPaid = payment.status === 'paid';
            doc.fontSize(16).font('Helvetica-Bold').fillColor(isPaid ? '#16a34a' : '#dc2626')
                .text(isPaid ? 'PAYMENT RECEIPT' : 'PAYMENT INVOICE', { align: 'center' });
            doc.moveDown(0.5);

            // ── Invoice Meta ──
            doc.fontSize(10).font('Helvetica').fillColor('#333333');
            doc.text(`Receipt No: ${payment.receiptNumber}`, 50);
            doc.text(`Date: ${new Date(payment.paymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}`, 350, doc.y - 14);
            doc.moveDown(1);

            // ── Patient Info ──
            drawSectionHeader(doc, 'Patient Details');
            const patientInfo = [
                ['Patient Name', patient?.name || 'N/A'],
                ['Parent Name', patient?.parentName || 'N/A'],
                ['Contact', patient?.parentPhone || 'N/A'],
            ];
            drawTable(doc, patientInfo);

            doc.moveDown(0.8);

            // ── Payment Info ──
            drawSectionHeader(doc, 'Payment Details');
            const paymentInfo = [
                ['Amount Paid', `₹ ${payment.amount.toLocaleString('en-IN')}`],
                ['Outstanding Dues', `₹ ${(payment.dueAmount || 0).toLocaleString('en-IN')}`],
                ['Payment Method', payment.method.replace(/_/g, ' ').toUpperCase()],
                ['Payment Status', payment.status.toUpperCase()],
                ['Description', payment.description || 'Therapy session payment'],
            ];

            if (payment.dueDate) {
                paymentInfo.push(['Due Date', new Date(payment.dueDate).toLocaleDateString('en-IN')]);
            }

            drawTable(doc, paymentInfo);

            doc.moveDown(1.5);

            // ── Total Box ──
            const boxY = doc.y;
            doc.rect(345, boxY, 200, 50).fill('#f0f9ff').stroke('#2563eb');
            doc.fontSize(11).font('Helvetica-Bold').fillColor('#1e40af')
                .text('TOTAL PAID', 355, boxY + 8)
                .fontSize(18)
                .text(`₹ ${payment.amount.toLocaleString('en-IN')}`, 355, boxY + 25);

            doc.y = boxY + 60;

            // ── Signatures ──
            doc.moveDown(1);
            doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke('#cccccc');
            doc.moveDown(1);

            const sigY = doc.y;
            doc.fontSize(9).font('Helvetica').fillColor('#555555');
            doc.text('Patient/Guardian Signature', 50, sigY, { width: 200, align: 'center' });
            doc.text('Authorized Signature', 345, sigY, { width: 200, align: 'center' });

            doc.moveTo(50, sigY - 5).lineTo(250, sigY - 5).stroke('#999999');
            doc.moveTo(345, sigY - 5).lineTo(545, sigY - 5).stroke('#999999');

            // ── Footer ──
            doc.moveDown(2);
            doc.fontSize(8).fillColor('#999999')
                .text('This is a computer-generated receipt. No physical signature is required for digital records.', { align: 'center' })
                .text(`Generated on: ${new Date().toLocaleString('en-IN')}`, { align: 'center' });

            doc.end();
        } catch (err) {
            reject(err);
        }
    });
};

// ── Helper Functions ──

function drawSectionHeader(doc, title) {
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#1e40af')
        .text(title);
    doc.moveTo(50, doc.y + 2).lineTo(250, doc.y + 2).stroke('#93c5fd');
    doc.moveDown(0.5);
}

function drawTable(doc, rows) {
    const labelX = 60;
    const valueX = 220;

    rows.forEach(([label, value], i) => {
        const bgColor = i % 2 === 0 ? '#f8fafc' : '#ffffff';
        const rowY = doc.y;

        doc.rect(50, rowY - 2, 495, 18).fill(bgColor);

        doc.fontSize(10).font('Helvetica-Bold').fillColor('#374151')
            .text(label, labelX, rowY, { width: 150 });
        doc.fontSize(10).font('Helvetica').fillColor('#111827')
            .text(value || 'N/A', valueX, rowY, { width: 300 });

        doc.y = rowY + 18;
    });
}

module.exports = {
    generatePatientRegistrationPDF,
    generateInvoicePDF,
};
