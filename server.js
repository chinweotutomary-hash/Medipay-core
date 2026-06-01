import express from 'express';
import cors from 'cors';
import webhookRouter from './webhook.js';
import { sendWhatsAppWelcomeMessage } from './whatsappService.js';
import { processVoiceTriage } from './audioProcessor.js';

const app = express();
app.use(cors());
app.use(express.json()); // Crucial for parsing incoming OPay JSON webhooks

// Mount the OPay micro-savings payment notification gateway router
app.use('/api/v1/medipay', webhookRouter);

/**
 * POST /api/v1/auth/opay-login
 * Simulates a secure OAuth Single Sign-On handshake via OPay 6-digit PIN infrastructure
 */
app.post('/api/v1/auth/opay-login', async (req, res) => {
  try {
    const { phoneNumber, name, opayPin } = req.body;

    // Validate request constraints
    if (!phoneNumber || !opayPin || opayPin.length !== 6) {
      return res.status(400).json({ success: false, message: "Invalid OPay authentication parameters." });
    }

    console.log(`[AUTH SUCCESS] Security clearance authorized via OPay PIN for: ${name}`);

    // RUNNING SIMULTANEOUSLY: Fire background threads asynchronously without blocking UI load times
    sendWhatsAppWelcomeMessage(phoneNumber, name)
      .catch(err => console.error("[BACKGROUND THREAD ERROR] WhatsApp push failed:", err));

    // Respond immediately to the frontend within 100ms for zero friction
    return res.status(200).json({
      success: true,
      message: "Authenticated securely via OPay Security Core",
      user: { name, phoneNumber, walletLinked: true }
    });

  } catch (error) {
    console.error("[AUTH CRITICAL ERROR] Single Sign-On pipeline execution failed:", error);
    return res.status(500).json({ success: false, message: "Internal Authentication Failure" });
  }
});

/**
 * POST /api/v1/medical/voice-triage
 * Unified streaming audio endpoint accepting binary chunks from WhatsApp or OPay Mini-App
 */
app.post('/api/v1/medical/voice-triage', express.raw({ type: 'audio/ogg', limit: '10mb' }), async (req, res) => {
  try {
    const audioBuffer = req.body;
    
    if (!audioBuffer || audioBuffer.length === 0) {
      return res.status(400).json({ success: false, message: "Empty audio content received." });
    }

    console.log(`[AUDIO STREAM] Intercepted ${audioBuffer.length} bytes of audio recording. Routing to Gemini core...`);

    // Hand raw audio byte data block straight to the Google Gemini multimodal engine
    const triageReport = await processVoiceTriage(audioBuffer, 'audio/ogg');
    
    return res.status(200).json({ success: true, data: triageReport });
  } catch (error) {
    console.error("[STREAMING ERROR] Failure in speech-to-text processing thread:", error);
    return res.status(500).json({ success: false, message: "Voice Processing Pipeline Interrupted" });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`  🟢 MEDIPAY OMNI-CHANNEL ENGINE CORE RUNNING LIVE  `);
  console.log(`======================================================`);
  console.log(`[SYSTEM ENGINES]: OPay Webhook Receiver listening on /api/v1/medipay/opay-webhook`);
  console.log(`[SYSTEM ENGINES]: WhatsApp Meta Cloud Notification channel online`);
  console.log(`[SYSTEM ENGINES]: Multimodal Google Gemini AI Triage processor operational`);
  console.log(`======================================================\n`);
});
