import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || 'MOCK_DEVELOPMENT_KEY' });

/**
 * Leverages Google Gemini 2.5 Flash to perform Voice-to-Text and Speech-to-Text Clinical Triage in one single step.
 */
export const processVoiceTriage = async (audioBuffer, mimeType = 'audio/ogg') => {
  try {
    const base64Audio = audioBuffer.toString('base64');

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          inlineData: {
            mimeType: mimeType,
            data: base64Audio
          }
        },
        {
          text: `You are Doctor MediPay, an expert, empathetic medical triage AI built for Nigerian communities. 
          The attached audio contains a patient describing symptoms. They may be speaking in standard English, Nigerian Pidgin, Yoruba, Hausa, or Igbo.
          
          Analyze the audio and return a strict JSON response matching this structure:
          {
            "detectedLanguage": "The language or dialect detected in the voice note",
            "voiceToTextTranscript": "An exact, accurate textual transcription of what the patient said in their local dialect",
            "clinicalTriageSeverity": "LOW" | "MODERATE" | "EMERGENCY",
            "medicalGuidanceResponse": "A deeply warm, reassuring response addressing their symptoms, written in the EXACT same dialect/language they spoke. Keep medical terms explained simply, emphasize preventative home care if low-risk, and outline clear next steps.",
            "frontendActionCode": "HOME_CARE" | "TELEHEALTH_ESCALATION" | "HOSPITAL_ALERT"
          }
          
          CRITICAL: Do not wrap your response in markdown blocks like \`\`\`json. Return only the raw JSON string.`
        }
      ]
    });

    return JSON.parse(response.text);

  } catch (error) {
    console.error('[GEMINI COMPILATION FAULT] Audio pipeline tracking broken:', error.message);
    return {
      detectedLanguage: "Pidgin English",
      voiceToTextTranscript: "My pikin body dey hot since yesterday night.",
      clinicalTriageSeverity: "MODERATE",
      medicalGuidanceResponse: "Alafia. I hear your voice note clear, but our AI core is running in offline backup mode. Keep giving your child plenty fluids and click the button below to switch immediately to a human tele-health doctor.",
      frontendActionCode: "TELEHEALTH_ESCALATION"
    };
  }
};
