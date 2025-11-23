import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { spawnSync } from "child_process";
import ffmpegPath from "ffmpeg-static";

export async function POST(req: NextRequest) {
  const { text } = await req.json();
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const response = await ai.models.generateContentStream({
    model: "gemini-2.5-pro-preview-tts",
    config: {
      temperature: 1,
      responseModalities: ["audio"],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: "Algenib" } },
      },
    },
    contents: [{ role: "user", parts: [{ text }] }],
  });

  // eslint-disable-next-line prefer-const
  let audioData: Uint8Array[] = [];
  for await (const chunk of response) {
    const part = chunk.candidates?.[0]?.content?.parts?.[0];
    if (part?.inlineData?.data) {
      audioData.push(Buffer.from(part.inlineData.data, "base64"));
    }
  }

  // Конкатенируем WAV-данные
  const wavBuffer = Buffer.concat(audioData);

  // Конвертируем WAV → MP3 через ffmpeg
  const ffmpeg = spawnSync(
    ffmpegPath!,
    ["-i", "pipe:0", "-f", "mp3", "-b:a", "192k", "pipe:1"],
    { input: wavBuffer }
  );

  if (ffmpeg.status !== 0) {
    console.error(ffmpeg.stderr.toString());
    return new NextResponse("Ошибка конвертации аудио", { status: 500 });
  }

  const mp3Buffer = ffmpeg.stdout;
  return new NextResponse(mp3Buffer, {
    headers: { "Content-Type": "audio/mpeg" },
  });
}
