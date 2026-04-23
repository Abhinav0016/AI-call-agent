const VoiceResponse = require('twilio').twiml.VoiceResponse;
const aiLogic = require('./ai-logic');
const billService = require('./services/bill-service');
const Order = require('./models/Order');

exports.handleIncomingCall = async (req, res) => {
    const twiml = new VoiceResponse();
    
    // Initial greeting in Malayalam
    const greeting = "Paramount restaurant-ilek Swagatham. Ningal Malayalam sansarikkan comfortable aano? atho njan English thudarano?";
    
    twiml.say({
        language: 'ml-IN', // Malayalam (India)
        voice: 'Polly.Aditi' // Example high quality voice if available
    }, greeting);

    twiml.gather({
        input: 'speech',
        action: '/voice/process-language',
        language: 'ml-IN',
        speechTimeout: 'auto',
        enhanced: true
    });

    res.type('text/xml');
    res.send(twiml.toString());
};

exports.handleCallStatus = (req, res) => {
    console.log(`Call Status: ${req.body.CallStatus}`);
    res.sendStatus(200);
};

exports.processLanguageSelection = async (req, res) => {
    const speechResult = req.body.SpeechResult;
    const callSid = req.body.CallSid;
    
    const twiml = new VoiceResponse();
    
    // AI logic to determine if the user wants Malayalam or English
    const languageSelection = await aiLogic.detectLanguagePreference(speechResult);
    
    if (languageSelection === 'english') {
        twiml.say('Great, I will continue in English.');
    } else {
        twiml.say({ language: 'ml-IN' }, 'Shari, njan Malayalam thudarunnu.');
    }
    
    // Start order taking
    twiml.redirect('/voice/take-order');
    
    res.type('text/xml');
    res.send(twiml.toString());
};

exports.takeOrder = async (req, res) => {
    const callSid = req.body.CallSid;
    const twiml = new VoiceResponse();
    const currentState = aiLogic.getOrderDetails(callSid);
    const language = currentState ? currentState.language : 'malayalam';

    twiml.gather({
        input: 'speech',
        action: '/voice/process-order',
        language: language === 'malayalam' ? 'ml-IN' : 'en-IN',
        speechTimeout: 'auto',
        enhanced: true
    });

    res.type('text/xml');
    res.send(twiml.toString());
};

exports.processOrder = async (req, res) => {
    const speechResult = req.body.SpeechResult;
    const callSid = req.body.CallSid;
    const twiml = new VoiceResponse();
    
    const currentState = aiLogic.getOrderDetails(callSid);
    const language = currentState ? currentState.language : 'malayalam';
    
    if (!speechResult) {
        twiml.say(language === 'malayalam' ? 'Njan kettilla, onnu koodi parayumo?' : 'I didn\'t catch that, could you repeat?');
        twiml.redirect('/voice/take-order');
    } else {
        const response = await aiLogic.handleConversation(callSid, speechResult, language);
        
        twiml.say({
            language: language === 'malayalam' ? 'ml-IN' : 'en-US'
        }, response);

        if (response.includes('ORDER_COMPLETED') || currentState.state === 'FINAL_CONFIRM') {
            twiml.redirect('/voice/finalize');
        } else {
            twiml.redirect('/voice/take-order');
        }
    }
    
    res.type('text/xml');
    res.send(twiml.toString());
};

exports.finalizeOrder = async (req, res) => {
    const callSid = req.body.CallSid;
    const twiml = new VoiceResponse();
    
    const orderData = aiLogic.getOrderDetails(callSid);
    
    // Generate bill
    const { billContent, total } = billService.generateBill({
        ...orderData,
        callSid,
        items: orderData.order,
        paymentMethod: orderData.paymentMethod || 'Cash on Delivery',
        phoneNumber: orderData.phoneNumber || '9999999999', // Fallback
        address: orderData.address || 'Takeaway',
        landmark: orderData.landmark || 'None'
    });

    // Save to Database if connected
    try {
        const newOrder = new Order({
            callSid,
            items: orderData.order,
            totalAmount: total,
            address: orderData.address,
            landmark: orderData.landmark,
            phoneNumber: orderData.phoneNumber,
            paymentMethod: orderData.paymentMethod || 'Cash on Delivery',
            status: 'completed'
        });
        await newOrder.save();
        console.log(`Order saved for ${callSid}`);
    } catch (err) {
        console.error('Error saving order:', err);
    }
    
    twiml.say({
        language: orderData.language === 'malayalam' ? 'ml-IN' : 'en-US'
    }, orderData.language === 'malayalam' ? 
        `Nanni, ningalude order sweekarichu. Bill thoka ${total} rupaya aanu. Athu vegathil ethikkunathayirikkum.` : 
        `Thank you, your order has been placed. The bill amount is ${total} rupees. It will be delivered soon.`);
    
    twiml.hangup();
    
    res.type('text/xml');
    res.send(twiml.toString());
};
