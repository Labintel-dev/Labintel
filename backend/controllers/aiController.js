'use strict';
const { translateTextToHindi } = require('../services/aiService');
const googleTTS = require('google-tts-api');
const logger = require('../logger');

/**
 * POST /api/v1/ai/voice-summary
 * Request body: { text: string }
 */
async function getVoiceSummary(req, res) {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }

  try {
    logger.info('Voice summary generation started');
    
    // 1. Translate to Hindi
    const hindiText = await translateTextToHindi(text);
    
    // 2. Generate Audio Base64 (handles long text by splitting)
    const results = await googleTTS.getAllAudioBase64(hindiText, {
      lang: 'hi',
      slow: false,
      host: 'https://translate.google.com',
    });

    logger.info('Voice summary generation completed', { chunks: results.length });

    res.json({
      hindiText,
      audioData: results.map(r => r.base64)
    });
  } catch (err) {
    logger.error(`Voice summary generation failed: ${err.message}`);
    res.status(500).json({ error: 'Failed to generate voice summary' });
  }
}

module.exports = { getVoiceSummary };
