import { GoogleGenAI } from "@google/genai";

const getAIClient = () => {
  if (!process.env.API_KEY) {
    console.error("API_KEY is missing from environment variables.");
    throw new Error("API Key missing");
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

// Transcribe audio using gemini-3-flash-preview
export const transcribeAudio = async (base64Audio: string, mimeType: string = 'audio/mp3'): Promise<string> => {
  try {
    const ai = getAIClient();
    const model = 'gemini-3-flash-preview';
    
    // Remove header if present (data:audio/xyz;base64,)
    const cleanBase64 = base64Audio.split(',')[1] || base64Audio;

    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: cleanBase64
            }
          },
          {
            text: "Transcribe this audio file exactly as spoken. Return only the transcript text."
          }
        ]
      }
    });

    return response.text || "Transcription failed.";
  } catch (error) {
    console.error("Gemini Transcription Error:", error);
    return "Error transcribing audio.";
  }
};

// Analyze video using gemini-3-pro-preview
export const analyzeVideo = async (base64Video: string, mimeType: string = 'video/mp4'): Promise<{ transcript: string; summary: string }> => {
  try {
    const ai = getAIClient();
    const model = 'gemini-3-pro-preview';
    
    // Remove header if present
    const cleanBase64 = base64Video.split(',')[1] || base64Video;

    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: cleanBase64
            }
          },
          {
            text: `Analyze this video. 
            1. Provide a full transcript of speech if available.
            2. Provide a short summary (3-5 sentences) of the visual and audio content.
            
            Return the result in JSON format: { "transcript": "...", "summary": "..." }`
          }
        ]
      },
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text || "{}";
    try {
        const json = JSON.parse(text);
        return {
            transcript: json.transcript || "No transcript available.",
            summary: json.summary || "No summary available."
        };
    } catch (e) {
        return {
            transcript: text,
            summary: "Could not parse JSON response."
        };
    }

  } catch (error) {
    console.error("Gemini Video Analysis Error:", error);
    return { transcript: "Error", summary: "Error analyzing video." };
  }
};
