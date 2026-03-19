import { GoogleGenAI } from "@google/genai";
import { CHARACTERS, Character } from "../constants";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function matchCharacter(prompt: string): Promise<Character> {
  const model = "gemini-3-flash-preview";
  
  const systemInstruction = `
    You are an expert in cinema and emotional intelligence. 
    Your task is to analyze a user's emotional prompt and match it to the most fitting movie character from the provided list.
    
    Characters:
    ${CHARACTERS.map(c => `- ${c.id}: ${c.name} from ${c.film}. Archetype: ${c.archetype}. Comfort Style: ${c.comfortStyle}`).join("\n")}
    
    Analyze the prompt for:
    - Emotional tone (e.g., grief, anxiety, burnout, loneliness)
    - Life theme (e.g., identity, courage, hope, loss)
    - Support style needed (e.g., firm wisdom, gentle hope, whimsical perspective)
    
    Respond ONLY with the character ID.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      systemInstruction,
      temperature: 0.2,
    },
  });

  const matchedId = response.text?.trim().toLowerCase() || CHARACTERS[0].id;
  return CHARACTERS.find(c => c.id === matchedId) || CHARACTERS[0];
}

export async function generateLetter(prompt: string, character: Character, language: 'en' | 'zh'): Promise<string> {
  const model = "gemini-3.1-pro-preview";
  
  const systemInstruction = `
    You are writing a letter as ${character.name} from the film "${character.film}".
    
    Character Profile:
    - Archetype: ${character.archetype}
    - Voice Qualities: ${character.voiceQualities}
    - Comfort Style: ${character.comfortStyle}
    
    Guidelines:
    - Write a literary, atmospheric, and deeply personal letter.
    - Capture the character's unique worldview and emotional logic.
    - Do NOT use generic AI clichés or clinical therapy language.
    - Do NOT use catchphrases excessively; focus on the soul of the character.
    - The tone should be healing, intimate, and comforting.
    - Length: 250-400 words.
    - Format as a letter (Dear..., Sincerely...).
    - Address the user's specific struggle: "${prompt}"
    - LANGUAGE: Write the entire letter in ${language === 'zh' ? 'Chinese (Simplified)' : 'English'}.
    
    Safety: If the prompt indicates self-harm or crisis, pivot to a gentle, supportive message that encourages seeking professional help, while maintaining the character's warmth.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: `Write a letter to someone who says: "${prompt}"`,
    config: {
      systemInstruction,
      temperature: 0.7,
    },
  });

  return response.text || (language === 'zh' ? "屏幕依然黑暗，但温暖的气息萦绕。请再试一次。" : "The screen remains dark, but the warmth of a presence lingers. Please try again.");
}

export async function generateFollowUp(
  history: { role: "user" | "model"; text: string }[],
  character: Character,
  language: 'en' | 'zh'
): Promise<string> {
  const model = "gemini-3-flash-preview";
  
  const systemInstruction = `
    You are ${character.name} from the film "${character.film}".
    Continue the conversation with the user who received your letter.
    
    Keep the tone consistent with your character: ${character.voiceQualities}.
    Be gentle, observant, and comforting.
    Avoid standard chatbot patterns. Speak as if you are sitting across from them or writing another short note.
    LANGUAGE: Respond in ${language === 'zh' ? 'Chinese (Simplified)' : 'English'}.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: {
        parts: history.map(h => ({ text: h.text }))
    },
    config: {
      systemInstruction,
      temperature: 0.8,
    },
  });

  return response.text || "...";
}
