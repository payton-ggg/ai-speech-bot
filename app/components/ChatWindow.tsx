"use client";
import React, { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../store";
import ReactMarkdown from "react-markdown";

export default function ChatWindow() {
  const messages = useSelector((s: RootState) => s.chat.messages);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
          </div>
        </div>
      ))}
      <div ref={chatEndRef} />
    </div>
  );
}
