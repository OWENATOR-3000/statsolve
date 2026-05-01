import React, { useEffect, useRef, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { fetchPracticeQuestions } from "@/services/api";
import { getTopicById } from "@/utils/topicList";
import { savePracticeSession } from "@/database/practice";
import { MathText } from "@/components/MathText";
import type { Difficulty, PracticeQuestion, PracticeResult } from "@/types";

const DIFF_COLOR: Record<Difficulty, string> = {
  Beginner:     "#10B981",
  Intermediate: "#F59E0B",
  Advanced:     "#EF4444",
};

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

type Phase = "loading" | "question" | "revealed" | "done";

export function PracticeScreen() {
  const navigation = useNavigation<any>();
  const route      = useRoute<any>();
  const { topicId, difficulty } = route.params as { topicId: string; difficulty: Difficulty };

  const topic = getTopicById(topicId);

  const [questions, setQuestions]     = useState<PracticeQuestion[]>([]);
  const [current, setCurrent]         = useState(0);
  const [phase, setPhase]             = useState<Phase>("loading");
  const [error, setError]             = useState<string | null>(null);
  const [results, setResults]         = useState<Record<number, PracticeResult>>({});
  const [questionTime, setQTime]      = useState(0);
  const [totalTime, setTotalTime]     = useState(0);

  const qTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Load questions ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!topic) return;
    setPhase("loading");
    fetchPracticeQuestions(topic.title, difficulty, 5)
      .then((qs) => {
        setQuestions(qs);
        setPhase("question");
        startTimers();
      })
      .catch((err) => {
        setError(err.message ?? "Failed to load questions.");
        setPhase("loading");
      });

    return () => { stopTimers(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startTimers() {
    qTimerRef.current = setInterval(() => setQTime((t) => t + 1), 1000);
    tTimerRef.current = setInterval(() => setTotalTime((t) => t + 1), 1000);
  }

  function stopTimers() {
    if (qTimerRef.current) { clearInterval(qTimerRef.current); qTimerRef.current = null; }
    if (tTimerRef.current) { clearInterval(tTimerRef.current); tTimerRef.current = null; }
  }

  function resetQuestionTimer() {
    setQTime(0);
  }

  // ── Show answer ─────────────────────────────────────────────────────────────
  function handleReveal() {
    // Pause question timer while reviewing answer
    if (qTimerRef.current) { clearInterval(qTimerRef.current); qTimerRef.current = null; }
    setPhase("revealed");
  }

  // ── Record result and advance ────────────────────────────────────────────────
  function handleResult(result: PracticeResult) {
    const updated = { ...results, [current]: result };
    setResults(updated);

    if (current < questions.length - 1) {
      setCurrent((c) => c + 1);
      resetQuestionTimer();
      setPhase("question");
      // Resume question timer
      qTimerRef.current = setInterval(() => setQTime((t) => t + 1), 1000);
    } else {
      // All done
      stopTimers();
      finishSession(updated);
    }
  }

  // ── Save session and navigate to review ─────────────────────────────────────
  async function finishSession(finalResults: Record<number, PracticeResult>) {
    if (!topic) return;
    const scored = questions.map((q, i) => ({
      ...q,
      result: finalResults[i] ?? "skipped",
      time_spent_seconds: questionTime, // approximate
    }));
    const correct = Object.values(finalResults).filter((r) => r === "correct").length;

    try {
      const sessionId = await savePracticeSession({
        topicId: topic.id,
        topic: topic.title,
        difficulty,
        questions: scored,
        score: correct,
        duration_seconds: totalTime,
      });
      setPhase("done");
      navigation.replace("PracticeReview", { sessionId });
    } catch {
      // If save fails, still navigate with -1 as sentinel
      setPhase("done");
      navigation.replace("PracticeReview", { sessionId: -1, fallback: { topicId: topic.id, topic: topic.title, difficulty, questions: scored, score: correct, duration_seconds: totalTime } });
    }
  }

  // ── Skip ────────────────────────────────────────────────────────────────────
  function handleSkip() {
    handleResult("skipped");
  }

  // ── Quit confirm ────────────────────────────────────────────────────────────
  function handleQuit() {
    Alert.alert(
      "Quit practice?",
      "Your progress won't be saved.",
      [
        { text: "Stay", style: "cancel" },
        {
          text: "Quit",
          style: "destructive",
          onPress: () => { stopTimers(); navigation.goBack(); },
        },
      ]
    );
  }

  // ── UI helpers ───────────────────────────────────────────────────────────────
  const q = questions[current];
  const progress = questions.length > 0 ? (current / questions.length) : 0;

  const ResultButton = ({
    label, icon, color, bg, result,
  }: { label: string; icon: string; color: string; bg: string; result: PracticeResult }) => (
    <TouchableOpacity
      className="flex-1 items-center justify-center rounded-2xl py-3 gap-y-1"
      style={{ backgroundColor: bg }}
      onPress={() => handleResult(result)}
      activeOpacity={0.8}
    >
      <Ionicons name={icon as any} size={22} color={color} />
      <Text className="text-xs font-bold" style={{ color }}>{label}</Text>
    </TouchableOpacity>
  );

  // ── Loading state ────────────────────────────────────────────────────────────
  if (phase === "loading") {
    return (
      <SafeAreaView className="flex-1 bg-surface">
        <View className="flex-row items-center px-5 pt-3 pb-2">
          <TouchableOpacity
            className="w-9 h-9 bg-white rounded-full items-center justify-center border border-gray-100"
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={20} color="#1E4D8C" />
          </TouchableOpacity>
          <Text className="flex-1 text-center text-base font-bold text-gray-800">Practice</Text>
          <View className="w-9" />
        </View>
        <View className="flex-1 items-center justify-center px-10">
          {error ? (
            <>
              <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
              <Text className="text-red-500 text-center mt-3 text-sm">{error}</Text>
              <TouchableOpacity
                className="mt-4 bg-primary rounded-xl px-6 py-3"
                onPress={() => navigation.goBack()}
              >
                <Text className="text-white font-semibold">Go back</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <ActivityIndicator size="large" color="#1E4D8C" />
              <Text className="text-gray-400 mt-4 text-sm text-center">
                Generating {difficulty.toLowerCase()} questions on{"\n"}{topic?.title}…
              </Text>
            </>
          )}
        </View>
      </SafeAreaView>
    );
  }

  // ── Done (transitioning) ─────────────────────────────────────────────────────
  if (phase === "done") {
    return (
      <SafeAreaView className="flex-1 bg-surface items-center justify-center">
        <ActivityIndicator size="large" color="#1E4D8C" />
        <Text className="text-gray-400 mt-4">Saving session…</Text>
      </SafeAreaView>
    );
  }

  // ── Main question view ────────────────────────────────────────────────────────
  return (
    <SafeAreaView className="flex-1 bg-surface">
      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <View className="flex-row items-center px-5 pt-3 pb-2">
        <TouchableOpacity
          className="w-9 h-9 bg-white rounded-full items-center justify-center border border-gray-100"
          onPress={handleQuit}
        >
          <Ionicons name="close" size={20} color="#6B7280" />
        </TouchableOpacity>
        <View className="flex-1 items-center">
          <Text className="text-sm font-bold text-gray-800">
            Question {current + 1} of {questions.length}
          </Text>
        </View>
        {/* Difficulty badge */}
        <View
          className="px-3 py-1 rounded-full"
          style={{ backgroundColor: DIFF_COLOR[difficulty] + "22" }}
        >
          <Text className="text-xs font-bold" style={{ color: DIFF_COLOR[difficulty] }}>
            {difficulty}
          </Text>
        </View>
      </View>

      {/* ── Progress bar ────────────────────────────────────────────────── */}
      <View className="h-1 bg-gray-100 mx-5 rounded-full overflow-hidden mb-3">
        <View
          className="h-1 bg-primary rounded-full"
          style={{ width: `${progress * 100}%` }}
        />
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
      >
        {/* ── Timer strip ─────────────────────────────────────────────────── */}
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center gap-x-1">
            <Ionicons name="timer-outline" size={14} color="#9CA3AF" />
            <Text className="text-gray-400 text-xs">{formatTime(questionTime)} on this question</Text>
          </View>
          <View className="flex-row items-center gap-x-1">
            <Ionicons name="time-outline" size={14} color="#9CA3AF" />
            <Text className="text-gray-400 text-xs">Total: {formatTime(totalTime)}</Text>
          </View>
        </View>

        {/* ── Question card ───────────────────────────────────────────────── */}
        <View className="bg-white rounded-2xl p-5 border border-gray-100 mb-4">
          <View className="flex-row items-center gap-x-2 mb-3">
            <View className="w-7 h-7 bg-primary/10 rounded-full items-center justify-center">
              <Text className="text-primary text-xs font-bold">{current + 1}</Text>
            </View>
            <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider">Question</Text>
          </View>
          {q && (
            <MathText
              text={q.question}
              style={{ fontSize: 15, lineHeight: 26, color: "#111827", fontWeight: "500" }}
            />
          )}
        </View>

        {/* ── Show answer button (question phase) ─────────────────────────── */}
        {phase === "question" && (
          <View className="gap-y-3">
            <TouchableOpacity
              className="bg-primary rounded-2xl py-4 items-center"
              onPress={handleReveal}
              activeOpacity={0.85}
            >
              <Text className="text-white font-bold text-base">Show Answer</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-white border border-gray-200 rounded-2xl py-3 items-center flex-row justify-center gap-x-2"
              onPress={handleSkip}
              activeOpacity={0.85}
            >
              <Ionicons name="play-skip-forward" size={16} color="#9CA3AF" />
              <Text className="text-gray-400 font-semibold text-sm">Skip</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Answer card + grading (revealed phase) ──────────────────────── */}
        {phase === "revealed" && q && (
          <>
            <View className="bg-accent/5 border border-accent/20 rounded-2xl p-5 mb-5">
              <View className="flex-row items-center gap-x-2 mb-3">
                <Ionicons name="checkmark-circle" size={16} color="#27AE60" />
                <Text className="text-xs font-bold text-accent uppercase tracking-wider">Solution</Text>
              </View>
              <MathText
                text={q.solution}
                style={{ fontSize: 14, lineHeight: 24, color: "#1f2937" }}
              />
            </View>

            <View className="mb-2">
              <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                How did you do?
              </Text>
              <View className="flex-row gap-x-3">
                <ResultButton
                  label="Got it!"
                  icon="checkmark-circle"
                  color="#10B981"
                  bg="#DCFCE7"
                  result="correct"
                />
                <ResultButton
                  label="Struggled"
                  icon="warning"
                  color="#F59E0B"
                  bg="#FEF9C3"
                  result="struggled"
                />
                <ResultButton
                  label="Skipped"
                  icon="remove-circle"
                  color="#9CA3AF"
                  bg="#F3F4F6"
                  result="skipped"
                />
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
