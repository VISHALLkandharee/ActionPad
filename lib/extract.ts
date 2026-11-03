import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

const ai = new GoogleGenAI({}); // reads GEMINI_API_KEY automatically

const ActionItem = z.object({
  task: z.string(),
  owner: z.string().nullable(),
  due: z.string().nullable(),
  priority: z.enum(["low", "medium", "high"]),
});

const Extraction = z.object({
  title: z.string(),
  summary: z.string(),
  actionItems: z.array(ActionItem),
});

export type Extraction = z.infer<typeof Extraction>;

const SYSTEM = `You turn messy notes into structured data.
Reply with ONLY a JSON object, no markdown, in exactly this shape:
{"title": string, "summary": string (max 3 sentences),
 "actionItems": [{"task": string, "owner": string or null,
 "due": string or null, "priority": "low" | "medium" | "high"}]}
Use null when the owner or due date is not stated. Never invent facts.`;

export async function extractFromNotes(text: string): Promise<Extraction> {
  const response = await ai.models.generateContent({
    model: process.env.GEMINI_MODEL!,
    contents: text,
    config: {
      systemInstruction: SYSTEM,
      responseMimeType: "application/json", // ask for JSON back
    },
  });

  const raw = response.text;
  if (!raw) throw new Error("Empty reply from AI");

  // Models sometimes wrap JSON in ``` fences. Strip them.
  const cleaned = raw.replace(/```json|```/g, "").trim();
  return Extraction.parse(JSON.parse(cleaned));
}