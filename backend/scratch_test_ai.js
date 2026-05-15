const { translateTextToHindi } = require('./services/aiService');

async function test() {
  const sample = "The report indicates high cholesterol (Hyperlipidemia). You should eat oats and green vegetables. Avoid fried food. Exercise for 30 minutes daily. Do not take any medicine without consulting a doctor.";
  console.log("Original:", sample);
  const hindi = await translateTextToHindi(sample);
  console.log("Hindi Translation:", hindi);
}

test();
