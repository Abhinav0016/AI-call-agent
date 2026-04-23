const mongoose = require('mongoose');

const menuSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: String, enum: ['curry', 'vegies', 'non-veg', 'bread', 'meals'], required: true },
    description: { type: String }
});

module.exports = mongoose.model('Menu', menuSchema);
