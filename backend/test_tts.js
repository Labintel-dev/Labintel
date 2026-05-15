const { MsEdgeTTS } = require('edge-tts-node');

async function test() {
  try {
    const tts = new MsEdgeTTS();
    await tts.setMetadata('hi-IN-SwaraNeural', 'audio-24khz-48kbitrate-mono-mp3');
    const audioBuffer = await tts.toAudio('नमस्ते, आप कैसे हैं?');
    console.log('Success! Audio buffer length:', audioBuffer.length);
  } catch (err) {
    console.error('Error:', err.message);
    if (err.stack) console.log(err.stack);
  }
}

test();
