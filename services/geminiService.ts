
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Goal } from "../types";

const LOCAL_STORAGE_KEY = 'bingoGeminiApiKey';

const getApiKey = () => {
    return localStorage.getItem(LOCAL_STORAGE_KEY) || '';
};

// Helper to remove markdown code fences if present
const cleanJsonText = (text: string) => {
  return text.replace(/^```json\s*/, '').replace(/\s*```$/, '');
};

// DRY Helper for generating JSON content
async function generateJsonContent<T>(prompt: string, schema: Schema): Promise<T | []> {
    const apiKey = getApiKey();
    if (!apiKey) {
        throw new Error("MISSING_API_KEY");
    }

    // Initialize AI instance dynamically with the current key
    const ai = new GoogleGenAI({ apiKey });

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema
            }
        });
        
        const text = response.text;
        if (!text) return [];
        
        const jsonText = cleanJsonText(text);
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Gemini Generation Error:", error);
        throw error;
    }
}

export const getGoalAdvice = async (goal: Goal): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) return "請先點擊右上角設定，輸入 Gemini API Key。";

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are a supportive but practical life coach. 
      The user has a yearly goal: "${goal.title}".
      Description/Details: "${goal.description}".
      Structure Type: ${goal.structure?.type || 'Standard'}.
      Target: 100 points.
      Current Score: ${goal.currentScore}.
      
      Please provide a short, actionable piece of advice (under 50 words) on how to achieve this consistency or break it down into smaller steps. 
      
      IMPORTANT: Respond in Traditional Chinese (Taiwan usage, 繁體中文). Be encouraging!`,
    });
    return response.text || "加油！你可以做到的。";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "暫時無法取得建議，請檢查 API Key 或網路。";
  }
};

export const analyzeProgress = async (goal: Goal): Promise<string> => {
    const apiKey = getApiKey();
    if (!apiKey) return "請先設定 API Key。";
    const ai = new GoogleGenAI({ apiKey });
  
    try {
      const logsText = goal.logs.map(l => `- ${l.date}: ${l.content}`).join('\n');
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `The user has a goal: "${goal.title}".
        Here are their recent progress logs:
        ${logsText}
        
        Based on these logs, give a very brief (one sentence) encouragement or observation about their momentum.
        
        IMPORTANT: Respond in Traditional Chinese (Taiwan usage, 繁體中文).`,
      });
      return response.text || "進度不錯喔！";
    } catch (error) {
      console.error("Gemini API Error:", error);
      return "持續記錄你的進度！";
    }
  };

// Interface for the new suggestion structure
export interface GoalSuggestion {
    title: string;
    description: string;
    type: 'step' | 'habit'; 
    targetScore: number;
    breakdown: string; // Explanation string
    // Structured habit data
    frequency?: 'weekly' | 'monthly' | 'yearly';
    periodCount?: number;
    unit?: string;
    totalCount?: number;
}

export const generateGoalSuggestions = async (interest: string): Promise<GoalSuggestion[]> => {
    const prompt = `Generate 6 distinct, quantifiable yearly personal goals based on the user's interest: "${interest}".
    The goals MUST be suitable for a Bingo game where users track scores out of 100.
    
    Provide a mix of these 2 types:
    1. 'step': Goals broken into milestones (e.g. Phase 1, Phase 2, Final).
    2. 'habit': Recurring goals (e.g. 3 times per week, 2 books per month).

    IMPORTANT: 
    - 'title', 'description', and 'breakdown' MUST be in Traditional Chinese (Taiwan usage, 繁體中文).
    - For 'habit' type, you MUST provide structured data:
      - 'frequency': 'weekly', 'monthly', or 'yearly'
      - 'periodCount': How many times per period (e.g. 3)
      - 'unit': The unit string (e.g. "次", "小時", "本")
      - 'totalCount': The calculated yearly total (e.g. 3 * 52 = 156)
    
    Return ONLY a valid JSON array of objects.`;

    const schema: Schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                type: { type: Type.STRING, enum: ['step', 'habit'] },
                targetScore: { type: Type.NUMBER },
                breakdown: { type: Type.STRING },
                frequency: { type: Type.STRING, enum: ['weekly', 'monthly', 'yearly'], nullable: true },
                periodCount: { type: Type.NUMBER, nullable: true },
                unit: { type: Type.STRING, nullable: true },
                totalCount: { type: Type.NUMBER, nullable: true }
            }
        }
    };

    try {
        const result = await generateJsonContent<GoalSuggestion[]>(prompt, schema);
        return Array.isArray(result) ? result : [];
    } catch (e: any) {
        if (e.message === 'MISSING_API_KEY') throw new Error("請先設定 API Key");
        throw e;
    }
};

export const generatePenaltySuggestions = async (keyword: string): Promise<string[]> => {
    const prompt = `Generate 5 fun, safe-for-work, but slightly challenging punishments for a social game between friends. 
    Context/Tone: ${keyword || "General mixed fun/exercise/treats"}.
    Examples of style (but output in Chinese): "Run 5km", "No bubble tea for a month", "Buy everyone dinner".
    
    IMPORTANT: The strings MUST be in Traditional Chinese (Taiwan usage, 繁體中文).
    
    Return ONLY a valid JSON array of strings.`;

    const schema: Schema = {
        type: Type.ARRAY,
        items: { type: Type.STRING }
    };

    try {
        const result = await generateJsonContent<string[]>(prompt, schema);
        return Array.isArray(result) ? result : [];
    } catch (e: any) {
        if (e.message === 'MISSING_API_KEY') throw new Error("請先設定 API Key");
        throw e;
    }
};
