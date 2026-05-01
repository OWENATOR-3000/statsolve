import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Share,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { getQuestionById, toggleBookmark } from "@/database/questions";
import { formatDuration, formatRelativeDate } from "@/utils/formatters";
import { StepCard } from "@/components/StepCard";
import { MathText } from "@/components/MathText";
import type { SolvedQuestion } from "@/types";

// ─── Split the stored solution text into step blocks ──────────────────────────
function parseSolutionSteps(solution: string): string[] {
  if (!solution?.trim()) return [];

  // Try each pattern in order — use whichever produces multiple chunks
  const patterns = [
    /(?=\*\*Step \d+:)/g,           // **Step 1: Title**  (exact match from SolverScreen)
    /(?=\*\*Step\s+\d+)/g,          // **Step 1**
    /(?=##\s+Step\s+\d+)/g,         // ## Step 1
    /(?=^Step\s+\d+\s*:)/gm,        // Step 1:  (line start)
  ];

  for (const pattern of patterns) {
    const parts = solution.split(pattern).map((s) => s.trim()).filter((s) => s.length > 5);
    if (parts.length > 1) return parts;
  }

  // Fallback: split on double newlines (paragraph blocks)
  const paragraphs = solution.split(/\n{2,}/).map((s) => s.trim()).filter((s) => s.length > 10);
  if (paragraphs.length > 1) return paragraphs;

  // Last resort: the whole solution as one card
  return [solution.trim()];
}

// ─── Stat pill ────────────────────────────────────────────────────────────────
function StatPill({ icon, label, color }: { icon: string; label: string; color: string }) {
  return (
    <View className="flex-row items-center gap-x-1.5 bg-white rounded-full px-3 py-1.5 border border-gray-100">
      <Ionicons name={icon as any} size={13} color={color} />
      <Text className="text-xs font-semibold" style={{ color }}>{label}</Text>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export function SolutionScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const questionId: number = route.params?.questionId;

  const [question, setQuestion] = useState<SolvedQuestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [steps, setSteps] = useState<string[]>([]);

  useEffect(() => {
    loadQuestion();
  }, [questionId]);

  async function loadQuestion() {
    setLoading(true);
    const q = await getQuestionById(questionId);
    if (q) {
      setQuestion(q);
      const parsed = parseSolutionSteps(q.solution);
      setSteps(parsed);
    }
    setLoading(false);
  }

  async function handleBookmark() {
    if (!question) return;
    const next = !question.is_bookmarked;
    await toggleBookmark(question.id!, next);
    setQuestion((prev) => prev ? { ...prev, is_bookmarked: next } : prev);
  }

  async function handleShare() {
    if (!question) return;
    try {
      // Clean markdown/LaTeX for plain-text sharing
      const cleanSolution = question.solution
        .replace(/\*\*/g, "")
        .replace(/\*/g, "")
        .replace(/#{1,3}\s/g, "")
        .trim();
      await Share.share({
        message: `📊 StatSolve — Step-by-Step Solution\n\nQuestion:\n${question.question_text}\n\nSolution:\n${cleanSolution}`,
        title: "StatSolve Solution",
      });
    } catch { /* user cancelled */ }
  }

  function handleSolveAgain() {
    // Navigate to Main → SolveTab, closing the modal in the process
    navigation.navigate("Main", { screen: "SolveTab" });
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-surface items-center justify-center">
        <ActivityIndicator size="large" color="#1E4D8C" />
      </SafeAreaView>
    );
  }

  if (!question) {
    return (
      <SafeAreaView className="flex-1 bg-surface items-center justify-center px-10">
        <Ionicons name="alert-circle-outline" size={48} color="#D1D5DB" />
        <Text className="text-gray-400 text-center mt-3">Question not found.</Text>
        <TouchableOpacity className="mt-4" onPress={() => navigation.goBack()}>
          <Text className="text-primary font-semibold">Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-surface">
      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <View className="flex-row items-center px-5 pt-3 pb-2">
        <TouchableOpacity
          className="w-9 h-9 bg-white rounded-full items-center justify-center border border-gray-100"
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={20} color="#1E4D8C" />
        </TouchableOpacity>
        <Text className="flex-1 text-center text-lg font-bold text-gray-800">Solution</Text>
        <View className="flex-row items-center gap-x-2">
          <TouchableOpacity
            className="w-9 h-9 bg-white rounded-full items-center justify-center border border-gray-100"
            onPress={handleShare}
          >
            <Ionicons name="share-outline" size={18} color="#1E4D8C" />
          </TouchableOpacity>
          <TouchableOpacity
            className="w-9 h-9 bg-white rounded-full items-center justify-center border border-gray-100"
            onPress={handleBookmark}
          >
            <Ionicons
              name={question.is_bookmarked ? "bookmark" : "bookmark-outline"}
              size={18}
              color={question.is_bookmarked ? "#1E4D8C" : "#9CA3AF"}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* ── Question card ───────────────────────────────────────────────── */}
        <View className="mx-5 mt-3 bg-white rounded-2xl p-5 border border-gray-100">
          <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
            Question
          </Text>
          <MathText
            text={question.question_text}
            style={{ fontSize: 15, lineHeight: 24, color: "#1f2937", fontWeight: "500" }}
          />

          {/* Meta pills */}
          <View className="flex-row flex-wrap gap-2 mt-4">
            {question.topic && (
              <StatPill icon="library-outline" label={question.topic} color="#1E4D8C" />
            )}
            {question.time_spent_seconds > 0 && (
              <StatPill
                icon="timer-outline"
                label={formatDuration(question.time_spent_seconds)}
                color="#E67E22"
              />
            )}
            {question.is_verified && (
              <StatPill icon="shield-checkmark" label="Verified" color="#27AE60" />
            )}
            {question.created_at && (
              <StatPill
                icon="calendar-outline"
                label={formatRelativeDate(question.created_at)}
                color="#9CA3AF"
              />
            )}
          </View>
        </View>

        {/* ── Steps ───────────────────────────────────────────────────────── */}
        <View className="flex-row items-center justify-between px-5 mt-5 mb-3">
          <Text className="text-sm font-bold text-gray-500 uppercase tracking-wider">
            Step-by-Step Solution
          </Text>
          <Text className="text-xs text-gray-400">{steps.length} steps</Text>
        </View>

        <View className="px-5">
          {steps.length > 0 ? (
            steps.map((step, i) => (
              <StepCard
                key={i}
                text={step}
                index={i}
                isLast={i === steps.length - 1}
              />
            ))
          ) : (
            <View className="bg-white rounded-2xl p-5 items-center">
              <Ionicons name="alert-circle-outline" size={36} color="#D1D5DB" />
              <Text className="text-gray-400 text-sm text-center mt-2">
                This question was saved without a solution.{"\n"}
                Solve it again to get the full step-by-step breakdown.
              </Text>
              <TouchableOpacity
                className="mt-4 bg-primary rounded-xl px-6 py-2"
                onPress={handleSolveAgain}
              >
                <Text className="text-white font-semibold text-sm">Solve Again</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ── Solve again CTA ─────────────────────────────────────────────── */}
        <View className="mx-5 mt-4">
          <TouchableOpacity
            className="bg-primary rounded-2xl py-4 flex-row items-center justify-center gap-x-2"
            onPress={handleSolveAgain}
            activeOpacity={0.85}
          >
            <Ionicons name="bulb-outline" size={18} color="white" />
            <Text className="text-white font-bold text-base">Solve a New Question</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
