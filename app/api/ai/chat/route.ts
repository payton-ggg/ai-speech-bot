import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ reply: "" });
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.GOOGLE_API_KEY,
    });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: text,
    });

    let result = "";
    if (response?.text) {
      result = response.text;
    }

    return NextResponse.json({ reply: result });
  } catch (err) {
    console.error("AI API ERROR:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
