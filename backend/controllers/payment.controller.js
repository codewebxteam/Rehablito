const Razorpay = require('razorpay');
const crypto = require('crypto');
const path = require('path');
const FeePayment = require('../models/FeePayment');
const ImageKit = require('imagekit');

const imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY || "public_WLfL24xlJbdNIpk+5F3PgakGSCM=",
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY || "private_b+6zHi1L6gBxZXbQ9Scq+VTdPG0=",
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || "https://ik.imagekit.io/5glnyqfxu"
});

const instance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret',
});

// 1. Create Order
exports.createOrder = async (req, res) => {
    try {
        const { amount, feePaymentId } = req.body;

        if (!amount || !feePaymentId) {
            return res.status(400).json({ error: 'Amount and feePaymentId are required' });
        }

        const options = {
            amount: amount * 100, // amount in the smallest currency unit (paise)
            currency: 'INR',
            receipt: feePaymentId,
        };

        // Test Mode Bypass
        if (process.env.RAZORPAY_KEY_ID === 'rzp_test_placeholder' || !process.env.RAZORPAY_KEY_ID) {
            return res.json({
                success: true, 
                order: {
                    id: 'order_test_' + options.amount + '_' + Date.now(),
                    amount: options.amount,
                    currency: 'INR',
                    receipt: options.receipt
                }
            });
        }

        const order = await instance.orders.create(options);

        if (!order) {
            return res.status(500).json({ error: 'Some error occurred while creating order' });
        }

        res.json({ success: true, order });
    } catch (error) {
        console.error('Razorpay Create Order Error:', error);
        res.status(500).json({ error: error.message });
    }
};

// 2. Verify Payment
exports.verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, feePaymentId } = req.body;

        // Test Mode Bypass
        const isTestMode = process.env.RAZORPAY_KEY_ID === 'rzp_test_placeholder' || !process.env.RAZORPAY_KEY_ID;
        let isAuthentic = false;

        if (isTestMode) {
            isAuthentic = true;
        } else {
            const body = razorpay_order_id + "|" + razorpay_payment_id;
            const expectedSignature = crypto
                .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'placeholder_secret')
                .update(body.toString())
                .digest('hex');
            isAuthentic = expectedSignature === razorpay_signature;
        }

        if (isAuthentic) {
            // If it was partial, logic might vary. Let's assume full payment for the due amount
            const feePayment = await FeePayment.findById(feePaymentId);
            if (!feePayment) {
                return res.status(404).json({ error: 'Fee payment not found' });
            }

            // Fetch the order from Razorpay to know exactly how much was paid (bypass in test mode)
            let paidAmount = 0;
            if (isTestMode) {
                if (razorpay_order_id.startsWith('order_test_')) {
                    // Extract amount from order_test_AMOUNT_TIMESTAMP
                    const parts = razorpay_order_id.split('_');
                    const paise = parseInt(parts[2]);
                    if (!isNaN(paise)) {
                        paidAmount = paise / 100;
                    } else {
                        paidAmount = feePayment.dueAmount;
                    }
                } else {
                    paidAmount = feePayment.dueAmount;
                }
            } else {
                const order = await instance.orders.fetch(razorpay_order_id);
                paidAmount = order.amount / 100; // convert paise back to INR
            }

            feePayment.dueAmount -= paidAmount;
            if (feePayment.dueAmount <= 0) {
                feePayment.dueAmount = 0;
                feePayment.status = 'paid';
            } else {
                feePayment.status = 'partial';
            }
            feePayment.amountPaid = (feePayment.amountPaid || 0) + paidAmount;
            feePayment.method = 'card'; // Default online payment method

            // Record this transaction
            feePayment.transactions.push({
                amountPaid: paidAmount,
                date: new Date(),
                method: 'online',
                transactionId: razorpay_payment_id || 'test_transaction_' + Date.now()
            });

            await feePayment.save();

            res.json({ success: true, message: 'Payment verified successfully' });
        } else {
            res.status(400).json({ success: false, error: 'Invalid signature' });
        }
    } catch (error) {
        console.error('Razorpay Verify Error:', error);
        res.status(500).json({ error: error.message });
    }
};

// 3. Submit Manual QR Payment
exports.submitManualPayment = async (req, res) => {
    try {
        const { amount, feePaymentId, transactionId } = req.body;

        if (!amount || !feePaymentId) {
            return res.status(400).json({ error: 'Amount and feePaymentId are required' });
        }

        if (!req.file) {
            return res.status(400).json({ error: 'Payment screenshot is required' });
        }

        const feePayment = await FeePayment.findById(feePaymentId);
        if (!feePayment) {
            return res.status(404).json({ error: 'Fee payment not found' });
        }

        // Upload the file buffer to ImageKit
        const uploadResponse = await new Promise((resolve, reject) => {
            imagekit.upload({
                file: req.file.buffer.toString('base64'),
                fileName: `payment_${feePaymentId}_${Date.now()}${path.extname(req.file.originalname) || '.png'}`,
                folder: '/rehablito/payments'
            }, function(error, result) {
                if(error) reject(error);
                else resolve(result);
            });
        });

        feePayment.method = 'qr_scan';
        feePayment.approvalStatus = 'pending';
        feePayment.screenshot = uploadResponse.url;

        // Push a transaction record marking it as pending approval
        feePayment.transactions.push({
            amountPaid: Number(amount),
            date: new Date(),
            method: 'qr_scan',
            transactionId: transactionId || 'pending_approval'
        });

        await feePayment.save();

        res.json({ success: true, message: 'Manual payment submitted for approval' });
    } catch (error) {
        console.error('Manual Payment Error:', error);
        res.status(500).json({ error: error.message });
    }
};
