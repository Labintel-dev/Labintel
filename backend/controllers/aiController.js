'use strict';
const { translateTextToHindi } = require('../services/aiService');
const { MsEdgeTTS } = require('edge-tts-node');
const logger = require('../logger');

/**
 * POST /api/v1/ai/voice-summary
 * Request body: { text: string }
 * Premium Human Female Voice (Edge Neural / OpenAI Nova)
 */
async function getVoiceSummary(req, res) {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }

  try {
    logger.info('Voice summary generation started (Human Voice)');
    
    // 1. Translate to Pure Hindi (No English)
    const hindiText = await translateTextToHindi(text);
    
    let audioBase64 = '';

    // 2. Try Premium OpenAI TTS if key exists (The "Fresh New API" for best human quality)
    if (process.env.OPENAI_API_KEY) {
      try {
        const OpenAI = require('openai');
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const mp3 = await openai.audio.speech.create({
          model: "tts-1",
          voice: "nova", // High-quality female voice
          input: hindiText,
        });
        const buffer = Buffer.from(await mp3.arrayBuffer());
        audioBase64 = buffer.toString('base64');
        logger.info('Voice generated via OpenAI Nova (Premium)');
      } catch (err) {
        logger.warn(`OpenAI TTS failed, falling back to Edge: ${err.message}`);
      }
    }

    // 3. High-Quality Google TTS (Reliable & Works everywhere)
    if (!audioBase64) {
      try {
        const googleTTS = require('google-tts-api');
        // split text into chunks of 200 chars for google-tts-api
        const results = googleTTS.getAllAudioUrls(hindiText, {
          lang: 'hi',
          slow: false,
          host: 'https://translate.google.com',
        });
        
        const axios = require('axios');
        const buffers = [];
        for (const res of results) {
          const ttsRes = await axios.get(res.url, { responseType: 'arraybuffer' });
          buffers.push(Buffer.from(ttsRes.data));
        }
        
        audioBase64 = Buffer.concat(buffers).toString('base64');
        logger.info('Voice generated via Google TTS (Multi-chunk)');
      } catch (err) {
        logger.error(`Google TTS also failed: ${err?.message || err}`);
      }
    }

    res.json({
      hindiText,
      audioData: [audioBase64]
    });
  } catch (err) {
    // Sanitize error to prevent "Cannot read properties of undefined"
    let errMsg = 'Unknown TTS error';
    if (err) {
      if (typeof err === 'string') errMsg = err;
      else if (err.message) errMsg = err.message;
      else {
        try { errMsg = JSON.stringify(err).slice(0, 100); } catch (e) { errMsg = 'Malformed error object'; }
      }
    }

    logger.error(`Voice summary generation failed: ${errMsg}`);
    res.status(500).json({ error: 'Failed to generate voice summary' });
  }
}

module.exports = { getVoiceSummary };
