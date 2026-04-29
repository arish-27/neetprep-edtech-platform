/**
 * Gemini AI Service
 * API key stored in VITE_GEMINI_API_KEY (.env)
 * Model: gemini-1.5-flash (free tier: 15 RPM, 1M TPM, 1500 RPD)
 */

const GEMINI_API_KEY = (import.meta as any).env?.VITE_GEMINI_API_KEY as string ?? "";
const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent";

export type GeminiRole = "user" | "model";

export type GeminiMessage = {
  role: GeminiRole;
  parts: { text: string }[];
};

type GeminiResponse = {
  candidates: {
    content: { parts: { text: string }[]; role: string };
    finishReason: string;
  }[];
};

/** Core call — matches the exact curl format, with retry on 429 */
async function callGemini(body: object, retries = 3): Promise<GeminiResponse> {
  if (!GEMINI_API_KEY) {
    throw new Error("Gemini API key not set. Add VITE_GEMINI_API_KEY to your .env file.");
  }

  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(GEMINI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-goog-api-key": GEMINI_API_KEY,
      },
      body: JSON.stringify(body),
    });

    if (res.status === 429 && attempt < retries) {
      // Rate limited — wait with exponential backoff then retry
      const wait = 2 ** attempt * 1500; // 1.5s, 3s, 6s
      await new Promise((r) => setTimeout(r, wait));
      continue;
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as any)?.error?.message ?? `Gemini error ${res.status}`);
    }

    return res.json() as Promise<GeminiResponse>;
  }

  throw new Error("Gemini rate limit exceeded. Please wait a moment and try again.");
}

export async function geminiGenerate(prompt: string): Promise<string> {
  const data = await callGemini({
    contents: [{ parts: [{ text: prompt }] }],
  });
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

/** Multi-turn chat — keeps conversation history */
export async function geminiChat(
  messages: GeminiMessage[],
  newUserText: string,
): Promise<string> {
  const contents: GeminiMessage[] = [
    ...messages,
    { role: "user", parts: [{ text: newUserText }] },
  ];
  const data = await callGemini({ contents });
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

// ── Typed helpers used across the app ────────────────────────────────────────

/** NEET study assistant — answers questions about Physics/Chemistry/Biology */
export async function askNEETAssistant(
  question: string,
  subject = "General",
): Promise<string> {
  const prompt = `You are an expert NEET (National Eligibility cum Entrance Test) tutor for Indian medical students.
Subject context: ${subject}
Student question: ${question}

Give a clear, concise answer suitable for NEET preparation. Include key formulas or mnemonics if relevant. Keep it under 200 words.`;
  return geminiGenerate(prompt);
}

/** Generate NEET MCQ questions for a topic */
export async function generateNEETQuestions(
  topic: string,
  subject: string,
  count = 5,
  difficulty: "Easy" | "Medium" | "Hard" = "Medium",
): Promise<{ question: string; options: string[]; answer: number; explanation: string }[]> {
  const prompt = `Generate ${count} NEET-style MCQ questions on "${topic}" (${subject}).
Difficulty: ${difficulty}
Format each question as JSON array:
[{"question":"...","options":["A","B","C","D"],"answer":0,"explanation":"..."}]
Only return the JSON array, no extra text.`;

  const raw = await geminiGenerate(prompt);
  try {
    const cleaned = raw.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return [];
  }
}

/** Get AI study suggestions for a topic */
export async function getStudySuggestions(
  topic: string,
  subject: string,
): Promise<string[]> {
  const prompt = `For NEET preparation on "${topic}" (${subject}), give 4 short, actionable study tips.
Return as a JSON array of strings: ["tip1","tip2","tip3","tip4"]
Only return the JSON array.`;

  const raw = await geminiGenerate(prompt);
  try {
    const cleaned = raw.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return [];
  }
}

/** Explain a concept in simple terms */
export async function explainConcept(concept: string, subject: string): Promise<string> {
  const prompt = `Explain "${concept}" (${subject}) in simple terms for a NEET student. 
Use an analogy if helpful. Keep it under 100 words.`;
  return geminiGenerate(prompt);
}

/** Analyze student performance and give AI insights */
export async function analyzePerformance(
  avgScore: number,
  weakTopics: string[],
  subject: string,
): Promise<string> {
  const prompt = `A NEET student has:
- Average score: ${avgScore}%
- Subject: ${subject}
- Weak topics: ${weakTopics.join(", ") || "none identified"}

Give 3 specific, actionable improvement suggestions in 2-3 sentences total. Be direct and encouraging.`;
  return geminiGenerate(prompt);
}

/** Generate a doubt answer */
export async function answerDoubt(
  question: string,
  subject: string,
  topic: string,
): Promise<string> {
  const prompt = `NEET student doubt:
Subject: ${subject}
Topic: ${topic}
Question: ${question}

Provide a clear, step-by-step answer. Include the key concept and any relevant formula. Max 150 words.`;
  return geminiGenerate(prompt);
}
