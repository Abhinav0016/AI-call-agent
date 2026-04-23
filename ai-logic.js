const { OpenAI } = require('openai');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const MENU = [
    { name: 'Chicken Curry', price: 120, category: 'non-veg' },
    { name: 'Beef Fry', price: 150, category: 'non-veg' },
    { name: 'Porotta', price: 20, category: 'bread' },
    { name: 'Veg Meals', price: 80, category: 'veg' },
    { name: 'Fish Curry', price: 130, category: 'non-veg' }
];

const callState = {};

exports.detectLanguagePreference = async (speechResult) => {
    if (!speechResult) return 'malayalam';
    
    // Simple heuristic or LLM call
    const prompt = `Based on this text: "${speechResult}", does the user want to speak in Malayalam or English? Respond with only the language name.`;
    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 10
        });
        const choice = response.choices[0].message.content.toLowerCase();
        return choice.includes('english') ? 'english' : 'malayalam';
    } catch (err) {
        console.warn('OpenAI language detection failed, defaulting to English for test.');
        return 'english';
    }
};

exports.handleConversation = async (callSid, speechResult, language) => {
    if (!callState[callSid]) {
        callState[callSid] = {
            state: 'ORDERING',
            order: [],
            language: language,
            history: []
        };
    }

    const currentState = callState[callSid];
    currentState.history.push({ role: 'user', content: speechResult });

    const systemPrompt = `
    You are an AI voice assistant for "Paramount Restaurant".
    Current Status: ${currentState.state}
    Language: ${language}
    Menu: ${JSON.stringify(MENU)}
    
    STRICT RULES:
    1. Be polite and clear.
    2. Confirm every item and quantity.
    3. If item not in menu, suggest categories (veg, non-veg, curry, etc.).
    4. Follow these steps: ORDERING -> ADDRESS_COLLECTION -> CONTACT_CONFIRM -> PAYMENT_METHOD -> FINAL_CONFIRM.
    5. Always wait for input.
    6. Answer questions about food (spicy, preparation, etc.).
    7. If state is FINAL_CONFIRM, output the order JSON at the end.

    Current order: ${JSON.stringify(currentState.order)}
    `;

    let aiMessage;
    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: [
                { role: 'system', content: systemPrompt },
                ...currentState.history
            ]
        });
        aiMessage = response.choices[0].message.content;
    } catch (err) {
        console.warn('OpenAI API error, using mock response:', err.message);
        aiMessage = getMockResponse(currentState, speechResult);
    }
    
    currentState.history.push({ role: 'assistant', content: aiMessage });

    // Update state based on AI response
    if (aiMessage.toLowerCase().includes('deliver') || aiMessage.toLowerCase().includes('address')) {
        currentState.state = 'ADDRESS_COLLECTION';
    } else if (aiMessage.toLowerCase().includes('phone number')) {
        currentState.state = 'CONTACT_CONFIRM';
    } else if (aiMessage.toLowerCase().includes('payment')) {
        currentState.state = 'PAYMENT_METHOD';
    }

    // Try to extract JSON if present
    const jsonMatch = aiMessage.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        try {
            const extractedData = JSON.parse(jsonMatch[0]);
            currentState.order = extractedData.items || currentState.order;
            currentState.address = extractedData.address || currentState.address;
            currentState.landmark = extractedData.landmark || currentState.landmark;
            currentState.phoneNumber = extractedData.phone_number || currentState.phoneNumber;
            currentState.paymentMethod = extractedData.payment_method || currentState.paymentMethod;
            
            if (currentState.paymentMethod && currentState.address && currentState.order.length > 0) {
                currentState.state = 'FINAL_CONFIRM';
            }
        } catch (e) {
            console.error('Failed to parse AI JSON:', e);
        }
    }

    return aiMessage;
};

function getMockResponse(state, input) {
    const inputLower = input.toLowerCase();
    if (state.state === 'ORDERING') {
        if (inputLower.includes('chicken') || inputLower.includes('curry')) {
            return "Sure, 2 Chicken Curries added. Anything else or should we deliver this?";
        }
        return "Welcome to Paramount! What would you like to have? We have Chicken Curry, Beef Fry, and Porotta.";
    }
    if (state.state === 'ADDRESS_COLLECTION') {
        return "Noted. Where should we deliver this? Please provide a landmark too.";
    }
    if (state.state === 'CONTACT_CONFIRM' || state.state === 'PAYMENT_METHOD') {
        return `Got it. Total is 336 rupees. Payment method: Online or COD?
        {
            "items": [{"name": "Chicken Curry", "quantity": 2, "price": 120}, {"name": "Porotta", "quantity": 4, "price": 20}],
            "address": "MG Road",
            "landmark": "Near Hospital",
            "phone_number": "9876543210",
            "payment_method": "Online"
        }`;
    }
    return "Thank you! Your order is placed.";
}

exports.getOrderDetails = (callSid) => {
    return callState[callSid];
};
