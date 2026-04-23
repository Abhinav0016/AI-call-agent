/**
 * Mock Testing Script for AI Call Agent
 * This script simulates the interaction between Twilio and the AI backend.
 */
require('dotenv').config();
const aiLogic = require('./ai-logic');
const twilioHandler = require('./twilio-handler');

async function simulateCall() {
    const callSid = 'CA' + Math.random().toString(36).substring(7);
    console.log(`--- Starting Mock Call: ${callSid} ---`);

    // 1. Initial Greeting (Done in Twilio handler, we skip to language selection)
    const languageInput = "I am comfortable with English"; 
    console.log(`User: ${languageInput}`);
    const language = await aiLogic.detectLanguagePreference(languageInput);
    console.log(`AI: (Detected Language: ${language}) Great, I will continue in English.`);

    // 2. Take Order
    const userInputs = [
        "I want to order two chicken curries and four porottas",
        "Yes, my address is MG Road, Flat 4B, near City Hospital",
        "My phone number is 9876543210",
        "I'll pay online"
    ];

    for (const input of userInputs) {
        console.log(`\nUser: ${input}`);
        const aiResponse = await aiLogic.handleConversation(callSid, input, language);
        console.log(`AI: ${aiResponse}`);
    }

    console.log('\n--- Finalizing Order ---');
    await twilioHandler.finalizeOrder({ body: { CallSid: callSid } }, { 
        type: () => {}, 
        send: (content) => console.log('TwiML Response:', content),
        sendStatus: () => {}
    });
    
    const orderData = aiLogic.getOrderDetails(callSid);
    console.log('Final Order Data:', JSON.stringify(orderData, null, 2));
}

if (!process.env.OPENAI_API_KEY) {
    console.error('Error: OPENAI_API_KEY is missing in .env file.');
} else {
    simulateCall();
}
