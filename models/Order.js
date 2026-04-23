const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    callSid: { type: String, required: true },
    items: [
        {
            name: { type: String },
            quantity: { type: Number },
            price: { type: Number }
        }
    ],
    totalAmount: { type: Number },
    address: { type: String },
    landmark: { type: String },
    phoneNumber: { type: String },
    paymentMethod: { type: String, enum: ['Online', 'Cash on Delivery'] },
    isPaymentConfirmed: { type: Boolean, default: false },
    status: { type: String, default: 'pending' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);
