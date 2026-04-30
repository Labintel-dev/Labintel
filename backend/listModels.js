require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function main() {
  if (!process.env.GEMINI_API_KEY) {
    console.error("No API key found in process.env");
    process.exit(1);
  }
  
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  console.log("Fetching models...");
  
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
    const data = await response.json();
    
    if (data.models) {
      console.log("Available models:");
      data.models.forEach(m => {
        if (m.supportedGenerationMethods.includes('generateContent')) {
          console.log(`- ${m.name} (supports generateContent)`);
        } else {
          console.log(`- ${m.name}`);
        }
      });
    } else {
      console.error("Error fetching models:", data);
    }
  } catch (error) {
    console.error("Failed to list models:", error);
  }
}

main();
