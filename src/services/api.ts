import { getAccessToken } from "./supabase";
import type { Difficulty, PracticeQuestion } from "@/types";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL!; // e.g. https://statsolve-api.vercel.app
const TIMEOUT_MS = 15000; // 15 seconds — fail fast instead of hanging

/** Wraps fetch with an AbortController timeout. */
function fetchWithTimeout(url: string, options: RequestInit, ms = TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(id));
}

/**
 * Builds a fetch request with the Supabase JWT in the Authorization header.
 */
async function authFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await getAccessToken();
  if (!token) throw new Error("Not authenticated. Please log in.");

  return fetchWithTimeout(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
}

// ─── Solve ────────────────────────────────────────────────────────────────────

interface SolvePayload {
  question: string;
  topic?: string;
  imageBase64?: string;
}

/**
 * Opens an SSE connection to /api/solve using XMLHttpRequest (onprogress),
 * which React Native supports for streaming unlike fetch's response.body.
 */
export async function streamSolve(
  payload: SolvePayload,
  callbacks: {
    onDelta: (text: string) => void;
    onValidation: (passed: boolean) => void;
    onDone: () => void;
    onError: (msg: string) => void;
  }
): Promise<void> {
  const token = await getAccessToken();
  if (!token) { callbacks.onError("Not authenticated. Please log in."); return; }

  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${BASE_URL}/api/solve`);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.timeout = 60000; // 60s total

    let processedLength = 0;

    function parseSSEChunk(chunk: string) {
      const lines = chunk.split("\n");
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        try {
          const event = JSON.parse(line.slice(6));
          if (event.type === "delta")      callbacks.onDelta(event.text);
          if (event.type === "validation") callbacks.onValidation(event.result?.passed ?? false);
          if (event.type === "done")       callbacks.onDone();
          if (event.type === "error")      callbacks.onError(event.message);
        } catch { /* skip malformed */ }
      }
    }

    xhr.onprogress = () => {
      const newChunk = xhr.responseText.slice(processedLength);
      processedLength = xhr.responseText.length;
      if (newChunk) parseSSEChunk(newChunk);
    };

    xhr.onload = () => {
      // Parse any remaining buffered data
      const remaining = xhr.responseText.slice(processedLength);
      if (remaining) parseSSEChunk(remaining);
      resolve();
    };

    xhr.onerror   = () => { callbacks.onError("Network error — check your connection."); resolve(); };
    xhr.ontimeout = () => { callbacks.onError("Request timed out. Try again."); resolve(); };

    xhr.send(JSON.stringify(payload));
  });
}

// ─── Tutorial ─────────────────────────────────────────────────────────────────

export async function streamTutorial(
  topic: string,
  difficulty: Difficulty,
  callbacks: {
    onDelta: (text: string) => void;
    onDone: () => void;
    onError: (msg: string) => void;
  }
): Promise<void> {
  const token = await getAccessToken();
  if (!token) { callbacks.onError("Not authenticated."); return; }

  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${BASE_URL}/api/tutorial`);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.timeout = 60000;

    let processedLength = 0;

    function parseChunk(chunk: string) {
      const lines = chunk.split("\n");
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        try {
          const event = JSON.parse(line.slice(6));
          if (event.type === "delta") callbacks.onDelta(event.text);
          if (event.type === "done")  callbacks.onDone();
          if (event.type === "error") callbacks.onError(event.message);
        } catch {}
      }
    }

    xhr.onprogress = () => {
      const newChunk = xhr.responseText.slice(processedLength);
      processedLength = xhr.responseText.length;
      if (newChunk) parseChunk(newChunk);
    };

    xhr.onload    = () => { const r = xhr.responseText.slice(processedLength); if (r) parseChunk(r); resolve(); };
    xhr.onerror   = () => { callbacks.onError("Network error."); resolve(); };
    xhr.ontimeout = () => { callbacks.onError("Request timed out."); resolve(); };

    xhr.send(JSON.stringify({ topic, difficulty }));
  });
}

// ─── Practice ─────────────────────────────────────────────────────────────────

export async function fetchPracticeQuestions(
  topic: string,
  difficulty: Difficulty,
  count = 5
): Promise<PracticeQuestion[]> {
  const response = await authFetch("/api/practice", {
    method: "POST",
    body: JSON.stringify({ topic, difficulty, count }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error ?? `Server error ${response.status}`);
  }

  const data = await response.json();
  return data.questions as PracticeQuestion[];
}
