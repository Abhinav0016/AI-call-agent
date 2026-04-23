const fs = require('fs');
const path = require('path');

exports.generateBill = (order) => {
    const gstRate = 0.05;
    const subtotal = order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const gst = subtotal * gstRate;
    const total = subtotal + gst;

    const billContent = `
========================================
         PARAMOUNT RESTAURANT
========================================
PAYMENT: ${order.paymentMethod.toUpperCase()}
${order.paymentMethod === 'Online' ? '*** PAYMENT DONE ***' : ''}
----------------------------------------
Phone: ${order.phoneNumber}
Address: ${order.address}
Landmark: ${order.landmark}
----------------------------------------
ITEMS:
${order.items.map(item => `${item.name.padEnd(20)} x${item.quantity}   ₹${(item.price * item.quantity).toFixed(2)}`).join('\n')}
----------------------------------------
Subtotal:          ₹${subtotal.toFixed(2)}
GST (5%):          ₹${gst.toFixed(2)}
TOTAL:             ₹${total.toFixed(2)}
========================================
   Thank you for ordering with us!
========================================
    `;

    const filename = `bill_${order.callSid}.txt`;
    const filePath = path.join(__dirname, '..', 'orders', filename);
    
    // Ensure orders directory exists
    if (!fs.existsSync(path.join(__dirname, '..', 'orders'))) {
        fs.mkdirSync(path.join(__dirname, '..', 'orders'));
    }

    fs.writeFileSync(filePath, billContent);
    return { filePath, billContent, total };
};
