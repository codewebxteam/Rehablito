const cron = require('node-cron');
const Patient = require('../models/Patient');
const FeePayment = require('../models/FeePayment');
const Service = require('../models/Service');

// Run every day at 1:00 AM
cron.schedule('0 1 * * *', async () => {
    console.log('Running daily billing cron job...');
    try {
        const today = new Date();
        const currentDay = today.getDate();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();

        // Find active patients
        const patients = await Patient.find({ status: 'active' });

        let billsCreated = 0;

        for (const patient of patients) {
            const hasTherapyDetails = Array.isArray(patient.therapyDetails) && patient.therapyDetails.length > 0;

            if (!hasTherapyDetails) {
                // Legacy fallback: Admission-based patient billing for patient.totalFee
                if (!patient.admissionDate || !(patient.totalFee > 0)) continue;

                const admissionDay = patient.admissionDate.getDate();
                const admissionMonth = patient.admissionDate.getMonth();
                const admissionYear = patient.admissionDate.getFullYear();

                const lastDayOfCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
                let billingDay = admissionDay;
                if (billingDay > lastDayOfCurrentMonth) {
                    billingDay = lastDayOfCurrentMonth;
                }

                const isAnniversaryDay = currentDay === billingDay;
                const isSameMonthAndYear = (currentMonth === admissionMonth && currentYear === admissionYear);

                if (isAnniversaryDay && !isSameMonthAndYear) {
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
                continue;
            }

            // Modern: Bill each therapy on its own anniversary
            for (const td of patient.therapyDetails) {
                // Only bill if the therapy is currently active in therapyType list
                if (!patient.therapyType || !patient.therapyType.includes(td.therapy)) continue;

                const addedAt = new Date(td.addedAt);
                const addedDay = addedAt.getDate();
                const addedMonth = addedAt.getMonth();
                const addedYear = addedAt.getFullYear();

                const lastDayOfCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
                let billingDay = addedDay;
                if (billingDay > lastDayOfCurrentMonth) {
                    billingDay = lastDayOfCurrentMonth;
                }

                const isAnniversaryDay = currentDay === billingDay;
                const isSameMonthAndYear = (currentMonth === addedMonth && currentYear === addedYear);

                if (isAnniversaryDay && !isSameMonthAndYear) {
                    const therapyName = td.therapy;
                    const serviceNameQuery = new RegExp('^' + therapyName.replace(/_/g, ' ') + '$', 'i');
                    const service = await Service.findOne({ name: { $regex: serviceNameQuery } });

                    if (service && service.price > 0) {
                        const startOfDay = new Date(currentYear, currentMonth, currentDay, 0, 0, 0);
                        const endOfDay = new Date(currentYear, currentMonth, currentDay, 23, 59, 59);

                        const existingBill = await FeePayment.findOne({
                            patientId: patient._id,
                            paymentDate: { $gte: startOfDay, $lte: endOfDay },
                            description: `Monthly Recurring Fee: ${service.name}`
                        });

                        if (!existingBill) {
                            const discount = td.discount || 0;
                            const finalPrice = Math.max(0, service.price - discount);
                            if (finalPrice > 0) {
                                await FeePayment.create({
                                    patientId: patient._id,
                                    branchId: patient.branchId,
                                    amount: finalPrice,
                                    dueAmount: finalPrice,
                                    status: 'pending',
                                    description: `Monthly Recurring Fee: ${service.name}`,
                                    paymentDate: new Date()
                                });
                                billsCreated++;
                            }
                        }
                    }
                }
            }
        }

        console.log(`Cron completed. Generated ${billsCreated} monthly invoices.`);
    } catch (error) {
        console.error('Error running billing cron job:', error);
    }
});
