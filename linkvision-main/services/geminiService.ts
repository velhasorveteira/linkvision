
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { AnalysisResult, Language, VideoQuality, RacketSpec, ImageSize, AspectRatio, FeedbackType } from "../types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

const fetchWithRetry = async <T>(fn: () => Promise<T>, retries = 5, delay = 3000): Promise<T> => {
  try {
    return await fn();
  } catch (error: any) {
    const errorMsg = error.message || "";
    const status = error.status || (error.response?.status);

    const is404 = errorMsg.includes("Requested entity was not found") || status === 404;
    if (is404 && typeof window !== 'undefined' && (window as any).aistudio?.openSelectKey) {
      (window as any).aistudio.openSelectKey();
    }

    // Explicitly handle 429 and RESOURCE_EXHAUSTED errors
    const isRateLimit = errorMsg.includes('429') ||
      status === 429 ||
      errorMsg.includes('RESOURCE_EXHAUSTED') ||
      errorMsg.includes('quota');

    if (retries > 0 && isRateLimit) {
      console.warn(`Rate limit hit (RESOURCE_EXHAUSTED). Retrying in ${delay}ms... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, delay + Math.random() * 2000));
      return fetchWithRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
};

export const analyzeGameplayVideo = async (
  videoBase64: string,
  mimeType: string,
  lang: Language,
  quality: VideoQuality
): Promise<AnalysisResult> => {
  const ai = getAI();
  const model = 'gemini-3-pro-preview';
  let normalizedMime = mimeType;
  if (mimeType.includes('quicktime')) normalizedMime = 'video/mp4';

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      summary: {
        type: Type.OBJECT,
        properties: {
          successRate: { type: Type.NUMBER },
          errorRate: { type: Type.NUMBER },
          totalSuccesses: { type: Type.NUMBER },
          totalErrors: { type: Type.NUMBER },
          totalEvents: { type: Type.NUMBER },
        },
        required: ['successRate', 'errorRate', 'totalSuccesses', 'totalErrors', 'totalEvents'],
      },
      events: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            timestamp: { type: Type.STRING },
            type: { type: Type.STRING, enum: ['success', 'error'] },
            movement: { type: Type.STRING },
            location: { type: Type.STRING },
            callType: { type: Type.STRING, enum: ['IN', 'OUT', 'NET'] },
            description: { type: Type.STRING },
          },
          required: ['timestamp', 'type', 'description', 'movement', 'location', 'callType'],
        },
      },
      sportType: { type: Type.STRING }
    }
  };

  const prompt = `Analise detalhadamente este vídeo de tênis (${quality}) em ${lang}. 
  Identifique cada golpe importante, classificando-o como sucesso ou erro.`;

  const response = await fetchWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
    model,
    contents: {
      parts: [
        { inlineData: { data: videoBase64, mimeType: normalizedMime } },
        { text: prompt }
      ],
    },
    config: {
      systemInstruction: "Você é um Juiz de Elite e Analista Biomecânico de Tênis. Output apenas JSON.",
      responseMimeType: "application/json",
      responseSchema,
    },
  }));

  const text = response.text || "{}";
  const parsed = JSON.parse(text);
  return {
    ...parsed,
    events: (parsed.events || []).map((e: any) => ({ ...e, id: crypto.randomUUID() })),
    id: crypto.randomUUID(),
    date: new Date().toLocaleString(),
  };
};

export const fetchTennisNews = async (lang: Language): Promise<{ articles: any[] }> => {
  const ai = getAI();
  const response = await fetchWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [{ role: 'user', parts: [{ text: `Get 5 top stories in professional tennis from today. For each story, provide: title, summary (as 'description'), sourceName, and sourceUrl. Output strictly a JSON object with an 'articles' array in ${lang}.` }] }],
    config: {
      systemInstruction: "You are a professional tennis news aggregator. Use Google Search to find real, current news. Output only the JSON object, no markdown or extra text.",
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          articles: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                sourceUrl: { type: Type.STRING },
                sourceName: { type: Type.STRING }
              },
              required: ['title', 'description', 'sourceUrl', 'sourceName']
            }
          }
        },
        required: ['articles']
      }
    }
  }));

  try {
    const rawText = response.text || '{"articles": []}';
    // More robust JSON extraction
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    const cleanJson = jsonMatch ? jsonMatch[0] : rawText;
    return JSON.parse(cleanJson);
  } catch (e) {
    console.error("Failed to parse news JSON", e);
    return { articles: [] };
  }
};

export const generateNewsIllustration = async (title: string, desc: string): Promise<string> => {
  const ai = getAI();
  const prompt = `A comical, high-quality cartoon illustration of a tennis-related scene inspired by: "${title}". Vibrant colors, expressive characters, humorous and non-offensive sports caricature style. High quality, sharp lines, NO text or logos.`;
  const response = await fetchWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts: [{ text: prompt }] }
  }));
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
  }
  return "";
};

export const search_racket_image = async (brand: string, name: string): Promise<string> => {
  const ai = getAI();
  const prompt = `Search for a direct, high-quality, professional product image of the tennis racket: "${brand} ${name}". 
  The image should be on a clean white background and look like a catalog photo. 
  Provide ONLY the direct HTTPS URL to the image file (ending in .jpg, .png, or .webp). 
  Do not include any other text or markdown.`;

  try {
    const response = await fetchWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }]
      }
    }));

    const text = response.text || "";
    const urlPattern = /(https?:\/\/[^\s"'<>]+\.(?:jpg|jpeg|png|webp|avif)(?:\?[^\s"'<>]*)?)/i;
    const match = text.match(urlPattern);
    return match ? match[0] : "";
  } catch (e) {
    console.error("Search failed for", name, e);
    return "";
  }
};

export const generate_racket_image = async (prompt: string, size: ImageSize, aspectRatio: AspectRatio): Promise<string> => {
  const ai = getAI();
  const isProModel = size === '2K' || size === '4K';
  const model = isProModel ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';

  let supportedAspectRatio: "1:1" | "3:4" | "4:3" | "9:16" | "16:9" = "1:1";
  if (['1:1', '3:4', '4:3', '9:16', '16:9'].includes(aspectRatio)) supportedAspectRatio = aspectRatio as any;

  const response = await fetchWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
    model,
    contents: { parts: [{ text: prompt }] },
    config: {
      imageConfig: {
        aspectRatio: supportedAspectRatio,
        ...(model.includes('pro') ? { imageSize: size as any } : {})
      }
    }
  }));
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
  }
  return "";
};

export const translateInterface = async (lang: Language, ui: any): Promise<any> => {
  const ai = getAI();
  const response = await fetchWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Translate the following UI labels into ${lang}. Keep JSON structure identical: ${JSON.stringify(ui)}`,
    config: { responseMimeType: "application/json" }
  }));
  try {
    return JSON.parse(response.text || '{}');
  } catch (e) {
    return ui;
  }
};

export const identify_racket_from_image = async (imageBase64: string): Promise<Partial<RacketSpec>> => {
  const ai = getAI();
  const base64Data = imageBase64.split(',')[1] || imageBase64;
  const mimeType = imageBase64.match(/data:([^;]+);/)?.[1] || 'image/jpeg';
  const response = await fetchWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { data: base64Data, mimeType } },
        { text: "Precisely identify this tennis racket using Google Search to be 100% sure. Return exact technical details in JSON format. Provide the price formatted in its native currency (e.g. $249.00)." }
      ]
    },
    config: {
      systemInstruction: "Você é um especialista em equipamentos de tênis de elite. Use Google Search para validar os modelos. Não tente converter preços para reais, retorne o valor real encontrado.",
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          brand: { type: Type.STRING },
          summary: { type: Type.STRING },
          powerLevel: { type: Type.NUMBER },
          controlLevel: { type: Type.NUMBER },
          comfortLevel: { type: Type.NUMBER },
          priceDisplay: { type: Type.STRING, description: "Formatted price string from source (e.g. $249)" },
          pros: { type: Type.ARRAY, items: { type: Type.STRING } },
          cons: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ['name', 'brand']
      }
    }
  }));
  try { return JSON.parse(response.text || "{}"); } catch (e) { return {}; }
};

export const compare_rackets = async (query: string, lang: Language): Promise<{ rackets: RacketSpec[] }> => {
  const ai = getAI();
  const prompt = `Research and list tennis racket models based on the query: "${query}". 
  Include professional tennis rackets from major brands (Wilson, Babolat, Head, Yonex, Prince, Dunlop, Technifibre) 
  released from 2010 to present if they match the search. 
  
  For each racket, provide: name, brand, weight (g), head size (sq in), string pattern, balance (mm), swingweight, stiffness (RA), 
  power level (1-10), control level (1-10), comfort level (1-10), player type, recommended level, release year, and a brief technical summary. 
  IMPORTANT: Provide the actual market price as a formatted string (e.g. "$259.00") found online. Do not perform any currency conversion to Reais (BRL).
  Respond in ${lang} in JSON format.`;

  const response = await fetchWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      systemInstruction: "You are an elite tennis equipment database. Return strictly JSON data. Use Google Search for up-to-date specs. Return prices in their original found currency.",
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          rackets: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                brand: { type: Type.STRING },
                weight: { type: Type.STRING },
                headSize: { type: Type.STRING },
                stringPattern: { type: Type.STRING },
                balance: { type: Type.STRING },
                swingweight: { type: Type.STRING },
                stiffness: { type: Type.STRING },
                powerLevel: { type: Type.NUMBER },
                controlLevel: { type: Type.NUMBER },
                comfortLevel: { type: Type.NUMBER },
                playerType: { type: Type.STRING },
                recommendedLevel: { type: Type.STRING },
                year: { type: Type.NUMBER, description: "Year of release (e.g. 2024)" },
                summary: { type: Type.STRING },
                priceDisplay: { type: Type.STRING, description: "Formatted price string (e.g. $249 or €220)" },
                priceValue: { type: Type.NUMBER, description: "Numeric value for sorting only" }
              },
              required: ['name', 'brand', 'weight', 'headSize', 'powerLevel', 'controlLevel', 'comfortLevel', 'year']
            }
          }
        },
        required: ['rackets']
      }
    }
  }));

  try {
    const data = JSON.parse(response.text || '{"rackets": []}');
    return { rackets: (data.rackets || []).map((r: any) => ({ ...r, id: crypto.randomUUID(), priceValue: r.priceValue || 0 })) };
  } catch (e) {
    console.error("Failed to parse compare_rackets JSON", e);
    return { rackets: [] };
  }
};

export const findNearbyCourts = async (lat: number, lng: number, lang: Language): Promise<{ sources: any[] }> => {
  const ai = getAI();
  const response = await fetchWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: "Find all tennis courts and tennis clubs nearby. Use Google Maps to identify them.",
    config: {
      tools: [{ googleMaps: {} }],
      toolConfig: { retrievalConfig: { latLng: { latitude: lat, longitude: lng } } }
    }
  }));
  return { sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || [] };
};

export const searchCourtsByText = async (query: string, lang: Language): Promise<{ sources: any[] }> => {
  const ai = getAI();
  const response = await fetchWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Locate tennis courts, clubs, or professionals at: ${query}. Provide locations in ${lang}.`,
    config: {
      tools: [{ googleMaps: {} }, { googleSearch: {} }]
    }
  }));
  return { sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || [] };
};

export const processUserFeedback = async (type: FeedbackType, message: string, lang: Language): Promise<string> => {
  const ai = getAI();
  const response = await fetchWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `User provided ${type} feedback: "${message}". Please provide a helpful and professional response in ${lang}.`,
  }));
  return response.text || "";
};

export const generateCoachChat = async (message: string, history: any[], useThinking: boolean): Promise<{ text: string, sources: any[] }> => {
  const ai = getAI();
  const model = 'gemini-3-pro-preview';
  const contents = history.map(h => ({
    role: h.role === 'user' ? 'user' : 'model',
    parts: [{ text: h.content }]
  }));
  contents.push({ role: 'user', parts: [{ text: message }] });
  const config: any = { tools: [{ googleSearch: {} }] };
  if (useThinking) config.thinkingConfig = { thinkingBudget: 16000 };
  const response = await fetchWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
    model,
    contents,
    config
  }));
  return { text: response.text || "", sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || [] };
};

export const editTennisImage = async (base64Image: string, prompt: string): Promise<string> => {
  const ai = getAI();
  const model = 'gemini-2.5-flash-image';
  const base64Data = base64Image.split(',')[1] || base64Image;
  const mimeType = base64Image.match(/data:([^;]+);/)?.[1] || 'image/jpeg';
  const response = await fetchWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
    model,
    contents: { parts: [{ inlineData: { data: base64Data, mimeType } }, { text: prompt }] }
  }));
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
  }
  throw new Error("Editing failed.");
};

export const animateTennisPhoto = async (imageSource: string, prompt: string, aspectRatio: '16:9' | '9:16'): Promise<string> => {
  const ai = getAI();
  const base64Data = imageSource.split(',')[1] || imageSource;
  const mimeType = imageSource.match(/data:([^;]+);/)?.[1] || 'image/png';
  let operation = await ai.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt: prompt || 'Animate this tennis scene realistically',
    image: { imageBytes: base64Data, mimeType: mimeType },
    config: { numberOfVideos: 1, resolution: '1080p', aspectRatio: aspectRatio }
  });
  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 10000));
    operation = await ai.operations.getVideosOperation({ operation: operation });
  }
  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  return `${downloadLink}&key=${process.env.API_KEY}`;
};

export const transcribeCoachAudio = async (base64Audio: string): Promise<string> => {
  const ai = getAI();
  const response = await fetchWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { data: base64Audio, mimeType: 'audio/wav' } },
        { text: "Transcribe the following tennis coaching instructions." }
      ]
    }
  }));
  return response.text || "";
};
