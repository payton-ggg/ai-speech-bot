import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type Message = {
  id: string;
  role: "user" | "assistant" | "system";
  text: string;
  loading?: boolean;
};

interface ChatState {
  messages: Message[];
  isRecording: boolean;
}

const initialState: ChatState = {
  messages: [],
  isRecording: false,
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    addMessage(state, action: PayloadAction<Message>) {
      state.messages.push(action.payload);
    },
    setRecording(state, action: PayloadAction<boolean>) {
      state.isRecording = action.payload;
    },
    updateMessageText(
      state,
      action: PayloadAction<{ id: string; text: string }>
    ) {
      const m = state.messages.find((x) => x.id === action.payload.id);
      if (m) m.text = action.payload.text;
    },
    setMessageLoading(
      state,
      action: PayloadAction<{ id: string; loading: boolean }>
    ) {
      const m = state.messages.find((x) => x.id === action.payload.id);
      if (m) m.loading = action.payload.loading;
    },
    clearMessages(state) {
      state.messages = [];
    },
  },
});

export const {
  addMessage,
  setRecording,
  updateMessageText,
  setMessageLoading,
  clearMessages,
} = chatSlice.actions;
export default chatSlice.reducer;
