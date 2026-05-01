import { create } from "zustand";
import type { SolvedQuestion } from "@/types";

interface SolverState {
  // Current question being solved
  question: string;
  selectedTopic: string | null;
  imageUri: string | null;
  imageBase64: string | null;

  // Streaming state
  solution: string;        // accumulated text so far
  isStreaming: boolean;
  isVerified: boolean | null;  // null = pending, true/false = result
  errorMessage: string | null;

  // Timer
  timerSeconds: number;
  timerActive: boolean;

  // Saved question ID after solving
  savedQuestionId: number | null;

  // Actions
  setQuestion: (text: string) => void;
  setTopic: (topic: string | null) => void;
  setImage: (uri: string, base64: string) => void;
  clearImage: () => void;
  appendSolutionChunk: (text: string) => void;
  setStreaming: (v: boolean) => void;
  setVerified: (v: boolean) => void;
  setError: (msg: string | null) => void;
  setSavedId: (id: number) => void;
  tickTimer: () => void;
  startTimer: () => void;
  stopTimer: () => void;
  reset: () => void;
}

export const useSolverStore = create<SolverState>((set) => ({
  question: "",
  selectedTopic: null,
  imageUri: null,
  imageBase64: null,
  solution: "",
  isStreaming: false,
  isVerified: null,
  errorMessage: null,
  timerSeconds: 0,
  timerActive: false,
  savedQuestionId: null,

  setQuestion: (text) => set({ question: text }),
  setTopic:    (topic) => set({ selectedTopic: topic }),
  setImage:    (uri, base64) => set({ imageUri: uri, imageBase64: base64 }),
  clearImage:  () => set({ imageUri: null, imageBase64: null }),

  appendSolutionChunk: (text) =>
    set((state) => ({ solution: state.solution + text })),

  setStreaming: (v) => set({ isStreaming: v }),
  setVerified:  (v) => set({ isVerified: v }),
  setError:     (msg) => set({ errorMessage: msg, isStreaming: false }),
  setSavedId:   (id) => set({ savedQuestionId: id }),

  tickTimer: () =>
    set((state) =>
      state.timerActive
        ? { timerSeconds: state.timerSeconds + 1 }
        : {}
    ),
  startTimer: () => set({ timerActive: true }),
  stopTimer:  () => set({ timerActive: false }),

  reset: () =>
    set({
      question: "",
      selectedTopic: null,
      imageUri: null,
      imageBase64: null,
      solution: "",
      isStreaming: false,
      isVerified: null,
      errorMessage: null,
      timerSeconds: 0,
      timerActive: false,
      savedQuestionId: null,
    }),
}));
