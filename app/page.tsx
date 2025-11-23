"use client";
import ChatWindow from "./components/ChatWindow";
import VoiceRecorder from "./components/VoiceRecorder";

export default function Page() {
  return (
    <main className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Voice AI Chat</h1>
      <ChatWindow />
      <VoiceRecorder />
    </main>
  );
}
