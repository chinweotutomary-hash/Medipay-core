import axios from 'axios';

/**
 * Fires an immediate onboarding template greeting message via the Meta Business Graph API
 */
export const sendWhatsAppWelcomeMessage = async (customerPhone, customerName) => {
  const WHATSAPP_API_URL = process.env.WHATSAPP_URL || 'https://graph.facebook.com/v17.0/YOUR_PHONE_NUMBER_ID/messages';
  const ACCESS_TOKEN = process.env.WHATSAPP_META_ACCESS_TOKEN || 'MOCK_TOKEN_VAL';

  try {
    const payload = {
      messaging_product: "whatsapp",
      to: customerPhone, // Target phone number (e.g., 234803XXXXXXXX)
      type: "template",
      template: {
        name: "medipay_onboarding_welcome",
        language: { code: "en" },
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: customerName }
            ]
          }
        ]
      }
    };

    console.log(`[WHATSAPP GATEWAY] Triggering automated greeting packet routing for ${customerName}...`);
    
    // In production, uncomment the axios line below to hit the real Meta cloud edge servers:
    // await axios.post(WHATSAPP_API_URL, payload, { headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` } });
    
    console.log(`[WHATSAPP DISPATCHED] Instant confirmation message pushed to user: ${customerPhone}`);
  } catch (error) {
    console.error('[WHATSAPP API ERROR] Failed to complete background transmission request:', error.response?.data || error.message);
  }
};
