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

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      // defer setState to next tick to avoid cascading renders
      Promise.resolve().then(() => setSupported(false));
      return;
    }
    const rec = new SpeechRecognition();
    rec.lang = "ru-RU";
    rec.interimResults = true;
    rec.continuous = false;

    rec.onstart = () => {
      dispatch(setRecording(true));
    };
    rec.onend = () => {
      dispatch(setRecording(false));
      recognitionRef.current = null;
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
        // final: send to server
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
            if (data?.reply) {
              dispatch(
                addMessage({
                  id: `${id}-reply`,
                  role: "assistant",
                  text: data.reply,
                })
              );
            } else {
              dispatch(
                addMessage({
                  id: `${id}-reply`,
                  role: "assistant",
                  text: "Ошибка: пустой ответ от модели",
                })
              );
            }
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

    recognitionRef.current = rec;
  }, [dispatch]);

  const startRecording = () => {
    if (!recognitionRef.current) {
      alert("SpeechRecognition не доступен в этом браузере.");
      return;
    }
    const id = uuidv4();
    currentMessageId.current = id;
    dispatch(addMessage({ id, role: "user", text: "", loading: false }));
    recognitionRef.current.start();
  };

  const stopRecording = () => {
    if (recognitionRef.current) recognitionRef.current.stop();
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
