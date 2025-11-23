"use client";
import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "../store";
import ReactMarkdown from "react-markdown";

export default function ChatWindow() {
  const messages = useSelector((s: RootState) => s.chat.messages);

  return (
    <div className="mb-4 border rounded p-4 h-96 overflow-y-auto">
      {messages.map((m) => (
        <div
          key={m.id}
          className={`mb-3 ${m.role === "user" ? "text-right" : "text-left"}`}
        >
          <div
            className="inline-block p-2 rounded-md text-sm text-black text-justify"
            style={{ background: m.role === "user" ? "#e6f7ff" : "#f1f1f1" }}
          >
            <ReactMarkdown skipHtml={false}>{m.text}</ReactMarkdown>
            {m.loading && (
              <div className="text-xs text-gray-500">...загрузка</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
