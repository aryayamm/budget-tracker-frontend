import Tesseract from 'tesseract.js';
import { GoogleGenAI } from '@google/genai';
import { ParsedReceipt, Category, Summary } from '@/types';

function getClient() {
  const key = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!key) throw new Error('NEXT_PUBLIC_GEMINI_API_KEY is not set');
  return new GoogleGenAI({ apiKey: key });
}

export async function parseReceiptWithGemini(file: File): Promise<ParsedReceipt> {
  // Step 1: OCR — extract text from image using Tesseract (free, runs in browser)
  const { data: { text } } = await Tesseract.recognize(file, 'eng', {
    logger: () => {},
  });

  if (!text || text.trim().length < 5) {
    throw new Error('Could not read text from image');
  }

  // Step 2: Send extracted text to Gemini for parsing
  const ai = getClient();
  const response = await ai.models.generateContent({
  model: "gemini-2.5-flash",
  contents: `You are a receipt parser. Here is the raw text extracted from a receipt:

    "${text}"

    Based on this text, extract the transaction details.

    Return ONLY a valid JSON object with exactly these fields, no markdown, no extra text:
    {
    "type": "expense",
    "amount": <total amount as a number>,
    "category": <one of: Food, Transport, Shopping, Entertainment, Health, Housing, Education, Utilities, Other>,
    "description": <short description of what was purchased, max 60 characters>,
    "date": <date in YYYY-MM-DD format if visible, otherwise null>
    }`
    });

  const raw = response.text ?? '';
  const clean = raw.replace(/```json|```/g, '').trim();
  const parsed = JSON.parse(clean) as ParsedReceipt;
  parsed.amount = Math.abs(Number(parsed.amount)) || 0;

  const valid: Category[] = ['Food','Transport','Shopping','Entertainment','Health','Housing','Education','Utilities','Other'];
  if (!valid.includes(parsed.category as Category)) parsed.category = 'Other';

  return parsed;
}

export async function getSpendingInsights(summary: Summary): Promise<string[]> {
  const ai = getClient();

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-preview-tts',
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: `Based on this personal finance data, give exactly 3 short actionable insights about spending habits.
Be specific, friendly, and encouraging. Keep each under 2 sentences.
Return ONLY a JSON array of 3 strings, no markdown.
Example: ["insight one", "insight two", "insight three"]
Data: ${JSON.stringify(summary)}`
          }
        ]
      }
    ]
  });

  const raw = response.text ?? '';
  const clean = raw.replace(/```json|```/g, '').trim();
  return JSON.parse(clean) as string[];
}