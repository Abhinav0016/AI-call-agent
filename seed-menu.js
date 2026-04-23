require('dotenv').config();
const mongoose = require('mongoose');
const Menu = require('./models/Menu');

const MENU_ITEMS = [
    { name: 'Chicken Curry', price: 120, category: 'non-veg' },
    { name: 'Beef Fry', price: 150, category: 'non-veg' },
    { name: 'Porotta', price: 20, category: 'bread' },
    { name: 'Veg Meals', price: 80, category: 'veg' },
    { name: 'Fish Curry', price: 130, category: 'non-veg' }
];

async function seed() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');
        
        await Menu.deleteMany({});
        await Menu.insertMany(MENU_ITEMS);
        
        console.log('Menu seeded successfully');
        process.exit(0);
    } catch (err) {
        console.error('Error seeding menu:', err);
        process.exit(1);
    }
}

seed();
