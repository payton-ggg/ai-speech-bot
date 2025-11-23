"use client";
import { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../store";
import ReactMarkdown from "react-markdown";

export default function ChatWindow() {
  const messages = useSelector((s: RootState) => s.chat.messages);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const lastAssistantRef = useRef<string>("");

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (!lastMsg || lastMsg.role !== "assistant") return;
    if (lastMsg.text === lastAssistantRef.current) return;

    lastAssistantRef.current = lastMsg.text;
    (
      window.speechSynthesis.speak ||
      ((t: string) => {
        const u = new SpeechSynthesisUtterance(t);
        u.lang = "ru-RU";
        u.rate = 1;
        u.pitch = 1;
        const v = window.speechSynthesis
          .getVoices()
          .find((v) => v.lang.startsWith("ru"));
        if (v) u.voice = v;
        window.speechSynthesis.speak(u);
      })
    )(new SpeechSynthesisUtterance(lastMsg.text));
  }, [messages]);

  const speakTextNatural = (text: string) => {
    if (!text) return;

    const sentences = text.match(/[^.!?]+[.!?]?/g) || [text];

    sentences.forEach((sentence) => {
      const utterance = new SpeechSynthesisUtterance(sentence.trim());

      utterance.lang = "ru-RU";
      utterance.rate = 0.95 + Math.random() * 0.1; // чуть медленнее с лёгкими вариациями
      utterance.pitch = 1 + Math.random() * 0.1; // небольшие колебания высоты

      const voices = window.speechSynthesis.getVoices();
      const russianVoice = voices.find(
        (v) =>
          v.lang.startsWith("ru") && v.name.toLowerCase().includes("oksana") // пример: Оксана в Chrome
      );
      if (russianVoice) utterance.voice = russianVoice;

      window.speechSynthesis.speak(utterance);
    });
  };

  // Остановить текущую озвучку
  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
  };

  return (
    <div className="mb-6 border border-gray-800 rounded-2xl p-6 h-96 overflow-y-auto bg-gray-950 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
      {messages.length === 0 && (
        <div className="flex items-center justify-center h-full text-gray-500 text-sm">
          Начните разговор с помощью голосового ввода
        </div>
      )}

      {messages.map((m) => (
        <div
          key={m.id}
          className={`mb-4 flex ${
            m.role === "user" ? "justify-end" : "justify-start"
          }`}
        >
          <div
            className={`
              max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed
              ${
                m.role === "user"
                  ? "bg-blue-600 text-white rounded-tr-sm"
                  : "bg-gray-800 text-gray-100 rounded-tl-sm border border-gray-700"
              }
            `}
          >
            <ReactMarkdown skipHtml={false}>{m.text}</ReactMarkdown>
            {m.loading && (
              <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
                <span className="animate-bounce">●</span>
                <span className="animate-bounce delay-100">●</span>
                <span className="animate-bounce delay-200">●</span>
              </div>
            )}
            {m.role === "assistant" && !m.loading && (
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => speakTextNatural(m.text)}
                  className="px-2 py-1 bg-green-600 hover:bg-green-500 rounded text-xs"
                >
                  🔊 Воспроизвести
                </button>
                <button
                  onClick={stopSpeaking}
                  className="px-2 py-1 bg-red-600 hover:bg-red-500 rounded text-xs"
                >
                  ⏹ Стоп
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
      <div ref={chatEndRef} />
    </div>
  );
}
