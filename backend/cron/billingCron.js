const cron = require('node-cron');
const Patient = require('../models/Patient');
const FeePayment = require('../models/FeePayment');

// Run every day at 1:00 AM
cron.schedule('0 1 * * *', async () => {
    console.log('Running daily billing cron job...');
    try {
        const today = new Date();
        const currentDay = today.getDate();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();

        // Find active patients with a non-zero total fee
        const patients = await Patient.find({ status: 'active', totalFee: { $gt: 0 } });

        let billsCreated = 0;

        for (const patient of patients) {
            if (!patient.admissionDate) continue;

            const admissionDay = patient.admissionDate.getDate();
            const admissionMonth = patient.admissionDate.getMonth();
            const admissionYear = patient.admissionDate.getFullYear();

            // Check if today is the anniversary day of admission
            // Handle edge cases like admission on 31st and current month has 30 days
            const lastDayOfCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
            let billingDay = admissionDay;
            if (billingDay > lastDayOfCurrentMonth) {
                billingDay = lastDayOfCurrentMonth;
            }

            // Only bill if it's the exact anniversary day, AND it's not the exact same month/year they joined
            const isAnniversaryDay = currentDay === billingDay;
            const isSameMonthAndYear = (currentMonth === admissionMonth && currentYear === admissionYear);

            if (isAnniversaryDay && !isSameMonthAndYear) {
                // Check if a bill was already generated for this exact day (to prevent duplicates if server restarts)
                const startOfDay = new Date(currentYear, currentMonth, currentDay, 0, 0, 0);
                const endOfDay = new Date(currentYear, currentMonth, currentDay, 23, 59, 59);

                const existingBill = await FeePayment.findOne({
                    patientId: patient._id,
                    paymentDate: { $gte: startOfDay, $lte: endOfDay },
                    description: 'Monthly Recurring Fee'
                });

                if (!existingBill) {
                    await FeePayment.create({
                        patientId: patient._id,
                        branchId: patient.branchId,
                        amount: patient.totalFee,
                        dueAmount: patient.totalFee,
                        status: 'pending',
                        description: 'Monthly Recurring Fee',
                        paymentDate: new Date()
                    });
                    billsCreated++;
                }
            }
        }

        console.log(`Cron completed. Generated ${billsCreated} monthly invoices.`);
    } catch (error) {
        console.error('Error running billing cron job:', error);
    }
});
