// pdf-parse ships CJS types without a callable default; require is the correct import style
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse") as (
  buffer: Buffer,
) => Promise<{ text: string; numpages: number; info: unknown }>;
import { GoogleGenerativeAI } from "@google/generative-ai";

import { createUserScopedClient } from "../lib/supabase";

export class ResumeServiceError extends Error {
  constructor(
    message: string,
    public statusCode: number,
  ) {
    super(message);
    this.name = "ResumeServiceError";
  }
}

const EXTRACTION_PROMPT = `You are a resume parser. Extract structured information from the resume text below and return ONLY valid JSON with no markdown fences or explanation.

Use this exact schema:
{
  "name": string | null,
  "email": string | null,
  "phone": string | null,
  "location": string | null,
  "linkedin": string | null,
  "summary": string | null,
  "skills": string[],
  "experience": [
    {
      "company": string,
      "title": string,
      "start_date": string,
      "end_date": string | null,
      "bullets": string[]
    }
  ],
  "education": [
    {
      "institution": string,
      "degree": string,
      "field": string | null,
      "start_date": string | null,
      "end_date": string | null,
      "gpa": string | null
    }
  ],
  "projects": [
    {
      "name": string,
      "description": string,
      "technologies": string[]
    }
  ],
  "certifications": string[]
}

Resume text:
`;

export async function extractAndSaveResume(
  pdfBuffer: Buffer,
  userId: string,
  accessToken: string,
): Promise<{ structured: unknown; raw_text: string }> {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) {
    throw new ResumeServiceError("Gemini API key not configured.", 500);
  }

  // Step 1: Extract text from PDF via pdf-parse
  let rawText: string;
  try {
    const parsed = await pdfParse(pdfBuffer);
    rawText = parsed.text;
  } catch {
    throw new ResumeServiceError(
      "Failed to parse PDF. Ensure the file is a valid PDF document.",
      422,
    );
  }

  if (!rawText.trim()) {
    throw new ResumeServiceError(
      "PDF contains no extractable text. Image-only PDFs are not supported.",
      422,
    );
  }

  // Step 2: Pass extracted text to Gemini for structured extraction
  let structured: unknown;
  try {
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(EXTRACTION_PROMPT + rawText);
    const responseText = result.response.text().trim();
    // Strip markdown code fences in case Gemini wraps the JSON
    const jsonStr = responseText
      .replace(/^```(?:json)?\s*\n?/, "")
      .replace(/\n?```\s*$/, "");
    structured = JSON.parse(jsonStr);
  } catch {
    throw new ResumeServiceError(
      "Failed to extract structured data from resume via Gemini.",
      502,
    );
  }

  // Step 3: Upsert structured data into Supabase resume_profiles table
  const supabase = createUserScopedClient(accessToken);
  const { error } = await supabase.from("resume_profiles").upsert(
    {
      user_id: userId,
      raw_text: rawText,
      structured,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) {
    throw new ResumeServiceError(`Failed to save resume: ${error.message}`, 500);
  }

  return { structured, raw_text: rawText };
}
