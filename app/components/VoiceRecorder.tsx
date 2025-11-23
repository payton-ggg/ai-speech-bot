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
  const [recording, setRecordingState] = useState(false);
  const recognitionRef = useRef<any>(null);
  const currentMessageId = useRef<string | null>(null);
  const manualStopRef = useRef(false);
  const finalTranscriptRef = useRef<string>("");

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      Promise.resolve().then(() => setSupported(false));
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
    finalTranscriptRef.current = "";

    dispatch(addMessage({ id, role: "user", text: "", loading: false }));

    rec.onstart = () => {
      dispatch(setRecording(true));
      setRecordingState(true);
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
      if (e.results[e.results.length - 1].isFinal) {
        finalTranscriptRef.current = transcript;
      }
    };

    rec.onend = async () => {
      setRecordingState(false);
      dispatch(setRecording(false));

      if (manualStopRef.current && currentMessageId.current) {
        const id = currentMessageId.current;
        const textToSend = finalTranscriptRef.current || "";

        dispatch(setMessageLoading({ id, loading: true }));

        try {
          const res = await fetch("/api/ai/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: textToSend }),
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
        finalTranscriptRef.current = "";
        return;
      }

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
    <div className="p-8 bg-gray-900 border border-gray-800 rounded-2xl max-w-md mx-auto">
      {!supported && (
        <div className="mb-6 p-4 bg-red-950 border border-red-800 rounded-xl text-red-200 text-sm">
          Ваш браузер не поддерживает Web Speech API. Используйте
          Chrome/Chromium.
        </div>
      )}

      <div className="flex flex-col items-center gap-8">
        {/* Mic indicator */}
        <div className="relative">
          <div
            className={`w-28 h-28 rounded-full flex items-center justify-center 
            transition-all duration-300 border-4
            ${
              recording
                ? "bg-red-600 border-red-400 shadow-lg shadow-red-500/50"
                : "bg-gray-800 border-gray-700"
            }`}
          >
            <svg
              className="w-12 h-12 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M7 4a3 3 0 016 0v6a3 3 0 11-6 0V4z" />
              <path d="M5.5 9.643a.75.75 0 00-1.5 0V10c0 3.06 2.29 5.585 5.25 5.954V17.5h-1.5a.75.75 0 000 1.5h4.5a.75.75 0 000-1.5h-1.5v-1.546A6.001 6.001 0 0016 10v-.357a.75.75 0 00-1.5 0V10a4.5 4.5 0 01-9 0v-.357z" />
            </svg>
          </div>

          {recording && (
            <div className="absolute inset-0 rounded-full border-4 border-red-500 animate-ping" />
          )}
        </div>

        {/* Status text */}
        <div className="text-center">
          <p className="text-gray-400 text-sm">
            {recording ? "Запись..." : "Нажмите для начала записи"}
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-4">
          <button
            onClick={startRecording}
            disabled={recording}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 
            disabled:text-gray-500 text-white font-medium rounded-xl 
            transition-all duration-200 shadow-lg hover:shadow-xl
            disabled:cursor-not-allowed"
          >
            Записать
          </button>
          <button
            onClick={stopRecording}
            disabled={!recording}
            className="px-8 py-3 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 
            disabled:text-gray-600 text-white font-medium rounded-xl 
            transition-all duration-200 shadow-lg hover:shadow-xl
            disabled:cursor-not-allowed"
          >
            Стоп
          </button>
        </div>
      </div>
    </div>
  );
}
