import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.GOOGLE_AI_STUDIO_KEY;
const MODEL = process.env.GOOGLE_AI_MODEL || "gemini-1.5-pro";

// ВАЖНО: не логируем ключи
export async function POST(req: NextRequest) {
  if (!API_KEY) {
    return NextResponse.json(
      { error: "Server misconfigured: missing API key" },
      { status: 500 }
    );
  }

  const body = await req.json();
  const text: string = body?.text;
  if (!text)
    return NextResponse.json({ error: "No text provided" }, { status: 400 });

  try {
    // Пример вызова Gemini API через официальный REST (используйте нужный endpoint/модель)
    // Этот пример использует Gemini Developer API (Gemini API docs). При необходимости замените URL по вашим данным.
    const endpoint = `https://api.ai.google/v1/models/${MODEL}:generateContent`; // если ваш endpoint другой — замените
    const payload = {
      // структура payload зависит от того, какой API вы используете (SDK/REST)
      // здесь — минимальный пример: запрос на сгенерировать текст
      input: {
        text: text,
      },
      // можно добавить настройки: temperature, max_output_tokens и т.п.
    };

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const txt = await res.text();
      console.error("Google AI error:", txt);
      return NextResponse.json(
        { error: "AI request failed", details: txt },
        { status: 502 }
      );
    }

    const data = await res.json();
    // Важно: структура ответа зависит от endpoint. Здесь мы пытаемся безопасно извлечь текст.
    // Попробуйте: data?.candidates?.[0]?.content или data?.output[0]?.content — в зависимости от API.
    let reply = "";

    // Попытки извлечь наиболее частые поля
    if (data?.candidates && data.candidates[0]?.content) {
      // new-style
      reply = data.candidates[0].content;
    } else if (data?.output && data.output[0]?.content) {
      reply = data.output[0].content;
    } else if (data?.text) {
      reply = data.text;
    } else {
      // fallback: stringify small preview
      reply = JSON.stringify(data).slice(0, 1000);
    }

    return NextResponse.json({ reply });
  } catch (err) {
    console.error("Server error calling AI:", err);
    return NextResponse.json(
      { error: "Server error", details: String(err) },
      { status: 500 }
    );
  }
}
