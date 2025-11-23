"use client";
import React, { useRef, useState } from "react";
import { useDispatch } from "react-redux";
import {
  addMessage,
  setRecording,
  updateMessageText,
  setMessageLoading,
} from "../store/slices/chatSlice";
import { v4 as uuidv4 } from "uuid";

declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

export default function VoiceRecorder() {
  const dispatch = useDispatch();
  const recognitionRef = useRef<any>(null);
  const currentMessageId = useRef<string | null>(null);
  const [supported, setSupported] = useState(true);

  const startRecording = () => {
    // Создаём экземпляр ТОЛЬКО при клике
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSupported(false);
      alert("SpeechRecognition не доступен. В Brave отключите Shields.");
      return;
    }

    const rec = new SpeechRecognition();
    rec.lang = "ru-RU";
    rec.interimResults = true;
    rec.continuous = false;

    rec.onstart = () => {
      dispatch(setRecording(true));
    };

    rec.onresult = (e: any) => {
      let transcript = "";
      for (let i = 0; i < e.results.length; i++) {
        transcript += e.results[i][0].transcript;
      }

      if (currentMessageId.current) {
        dispatch(
          updateMessageText({ id: currentMessageId.current, text: transcript })
        );
      }

      // FINAL RESULT
      if (e.results[e.results.length - 1].isFinal) {
        const id = currentMessageId.current!;
        dispatch(setMessageLoading({ id, loading: true }));

        fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: transcript }),
        })
          .then((r) => r.json())
          .then((data) => {
            dispatch(setMessageLoading({ id, loading: false }));
            dispatch(
              addMessage({
                id: `${id}-reply`,
                role: "assistant",
                text: data?.reply || "Ошибка: пустой ответ от модели",
              })
            );
          })
          .catch((err) => {
            dispatch(setMessageLoading({ id, loading: false }));
            dispatch(
              addMessage({
                id: `${id}-reply`,
                role: "assistant",
                text: "Ошибка при вызове API",
              })
            );
            console.error(err);
          });

        currentMessageId.current = null;
      }
    };

    rec.onerror = (event: any) => {
      console.error("SpeechRecognition error:", event.error);
    };

    rec.onend = () => {
      dispatch(setRecording(false));
      // НЕ обнуляем recognitionRef — это ломает повторный старт
    };

    recognitionRef.current = rec;

    // Создаём новое сообщение
    const id = uuidv4();
    currentMessageId.current = id;
    dispatch(addMessage({ id, role: "user", text: "", loading: false }));

    rec.start();
  };

  const stopRecording = () => {
    recognitionRef.current?.stop();
  };

  return (
    <div>
      {!supported && (
        <div className="text-red-500 mb-2">
          Ваш браузер блокирует Web Speech API. Отключите Brave Shields.
        </div>
      )}
      <div className="flex gap-2">
        <button onClick={startRecording} className="px-4 py-2 border rounded">
          Записать
        </button>
        <button onClick={stopRecording} className="px-4 py-2 border rounded">
          Стоп
        </button>
      </div>
    </div>
  );
}
