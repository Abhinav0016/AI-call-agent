require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const twilioHandler = require('./twilio-handler');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Routes
app.post('/voice', twilioHandler.handleIncomingCall);
app.post('/voice/process-language', twilioHandler.processLanguageSelection);
app.post('/voice/take-order', twilioHandler.takeOrder);
app.post('/voice/process-order', twilioHandler.processOrder);
app.post('/voice/finalize', twilioHandler.finalizeOrder);
app.post('/voice/status', twilioHandler.handleCallStatus);

// Health check
app.get('/', (req, res) => {
    res.send('AI Restaurant Call Agent is running!');
});

// Database Connection
if (process.env.MONGODB_URI) {
    mongoose.connect(process.env.MONGODB_URI)
        .then(() => console.log('Connected to MongoDB'))
        .catch(err => console.error('MongoDB connection error:', err));
} else {
    console.warn('MONGODB_URI not found in .env. Persistence will not work.');
}

app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});
