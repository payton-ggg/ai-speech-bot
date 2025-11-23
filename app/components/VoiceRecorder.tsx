"use client";
import React, { useEffect, useRef, useState } from "react";
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
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef<any>(null);
  const currentMessageId = useRef<string | null>(null);
  const manualStopRef = useRef(false);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      Promise.resolve().then(() => setSupported(false));
      return;
    }
  }, []);

  const startRecording = () => {
    manualStopRef.current = false;

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSupported(false);
      alert("SpeechRecognition не доступен. Попробуйте Chrome/Chromium.");
      return;
    }

    const rec = new SpeechRecognition();
    rec.lang = "ru-RU";
    rec.interimResults = true;
    rec.continuous = true;

    const id = uuidv4();
    currentMessageId.current = id;
    dispatch(addMessage({ id, role: "user", text: "", loading: false }));

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
    };

    rec.onend = async () => {
      dispatch(setRecording(false));

      // Если остановка была вручную — отправляем текст на сервер
      if (manualStopRef.current && currentMessageId.current) {
        const id = currentMessageId.current;
        const element =
          document.querySelector(`#message-${id}`)?.textContent || "";

        dispatch(setMessageLoading({ id, loading: true }));

        try {
          const res = await fetch("/api/ai/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: element }),
          });
          const data = await res.json();

          dispatch(setMessageLoading({ id, loading: false }));
          dispatch(
            addMessage({
              id: `${id}-reply`,
              role: "assistant",
              text: data?.reply || "Ошибка: пустой ответ от модели",
            })
          );
        } catch (err) {
          dispatch(setMessageLoading({ id, loading: false }));
          dispatch(
            addMessage({
              id: `${id}-reply`,
              role: "assistant",
              text: "Ошибка при вызове API",
            })
          );
          console.error(err);
        }

        currentMessageId.current = null;
        return;
      }

      // Если остановка автоматическая (пауза речи) — перезапускаем
      if (!manualStopRef.current) {
        rec.start();
      }
    };

    rec.onerror = (event: any) => {
      console.error("SpeechRecognition error:", event.error);
    };

    recognitionRef.current = rec;
    rec.start();
  };

  const stopRecording = () => {
    manualStopRef.current = true;
    recognitionRef.current?.stop();
  };

  return (
    <div>
      {!supported && (
        <div className="text-red-600 mb-2">
          Ваш браузер не поддерживает Web Speech API. Используйте
          Chrome/Chromium.
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
