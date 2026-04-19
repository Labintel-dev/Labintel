const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function listAllModels() {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) {
    console.error('No API key found in .env');
    return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  try {
    // The SDK uses v1beta by default for listModels usually
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();
    
    console.log('--- MODELS LIST (v1beta) ---');
    if (data.models) {
      data.models.forEach(m => {
        console.log(`- Name: ${m.name}`);
        console.log(`  Methods: ${m.supportedGenerationMethods.join(', ')}`);
      });
    } else {
       console.log('No models found or error:', data);
    }
  } catch (err) {
    console.error('Error listing models:', err);
  }
}

listAllModels();
