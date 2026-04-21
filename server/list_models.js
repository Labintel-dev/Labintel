const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');
const dotenv = require('dotenv');

// Load env
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

async function listModels() {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) {
    console.error('ERROR: GOOGLE_GEMINI_API_KEY not found in .env');
    return;
  }

  console.log('Using API Key:', apiKey.substring(0, 4) + '...' + apiKey.substring(apiKey.length - 4));
  
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Note: The Node SDK might not have listModels exported directly on the instance in all versions
    // but we can try to find it or use a simple generateContent to probe.
    
    console.log('Probing for authorized models...');
    
    // The most robust way to see if something is missing is to probe a few likely candidates
    const PROBE_LIST = [
        'gemini-1.5-flash',
        'gemini-flash-latest',
        'gemini-2.0-flash',
        'gemini-1.5-flash-8b',
        'gemini-2.5-flash',
        'gemini-2.5-pro',
        'gemini-1.5-pro',
        'gemini-pro'
    ];

    for (const modelName of PROBE_LIST) {
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            // Smallest possible prompt to verify existence
            const result = await model.generateContent('Hi');
            const response = await result.response;
            console.log(`✅ [AVAILABLE]: ${modelName}`);
        } catch (err) {
            const msg = err.message || '';
            if (msg.includes('404') || msg.includes('not found')) {
                console.log(`❌ [NOT FOUND]: ${modelName}`);
            } else if (msg.includes('403') || msg.includes('permission')) {
                console.log(`🚫 [PERMISSION DENIED]: ${modelName}`);
            } else {
                console.log(`⚠️ [OTHER ERROR - ${modelName}]:`, msg.substring(0, 100));
            }
        }
    }

  } catch (error) {
    console.error('CRITICAL DIAGNOSTIC ERROR:', error.message);
  }
}

listModels();
