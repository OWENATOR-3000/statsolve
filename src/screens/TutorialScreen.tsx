import React, { useEffect, useRef, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { streamTutorial } from "@/services/api";
import { getTopicById } from "@/utils/topicList";
import { StepCard } from "@/components/StepCard";
import type { Difficulty } from "@/types";

// ── Parse the streamed tutorial into named sections ───────────────────────────
// Gemini returns sections like: ## Introduction\n...  ## Key Concepts\n...
function parseSections(text: string): Array<{ title: string; body: string }> {
  const lines = text.split("\n");
  const sections: Array<{ title: string; body: string }> = [];
  let current: { title: string; body: string } | null = null;

  for (const line of lines) {
    const heading = line.match(/^#{1,3}\s+(.+)/);
    if (heading) {
      if (current) sections.push(current);
      current = { title: heading[1].trim(), body: "" };
    } else if (current) {
      current.body += line + "\n";
    } else {
      // Text before any heading — treat as intro
      current = { title: "Overview", body: line + "\n" };
    }
  }
  if (current && current.body.trim()) sections.push(current);
  return sections.filter((s) => s.body.trim().length > 0);
}

// ── Difficulty badge ──────────────────────────────────────────────────────────
const DIFF_COLOR: Record<Difficulty, string> = {
  Beginner:     "#10B981",
  Intermediate: "#F59E0B",
  Advanced:     "#EF4444",
};

export function TutorialScreen() {
  const navigation = useNavigation<any>();
  const route      = useRoute<any>();
  const { topicId, difficulty } = route.params as { topicId: string; difficulty: Difficulty };

  const topic = getTopicById(topicId);

  const [rawText, setRawText]   = useState("");
  const [isDone, setIsDone]     = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [streaming, setStreaming] = useState(true);

  const scrollRef = useRef<ScrollView>(null);

  // Append streamed chunks to rawText
  function handleDelta(chunk: string) {
    setRawText((prev) => {
      const next = prev + chunk;
      return next;
    });
    // Auto-scroll to bottom while streaming
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 30);
  }

  useEffect(() => {
    if (!topic) return;
    setStreaming(true);
    streamTutorial(topic.title, difficulty, {
      onDelta: handleDelta,
      onDone:  () => { setIsDone(true); setStreaming(false); },
      onError: (msg) => { setError(msg); setStreaming(false); },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sections = isDone ? parseSections(rawText) : [];

  if (!topic) {
    return (
      <SafeAreaView className="flex-1 bg-surface items-center justify-center px-10">
        <Text className="text-gray-400 text-center">Topic not found.</Text>
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
        <Text className="flex-1 text-center text-base font-bold text-gray-800" numberOfLines={1}>
          {topic.title}
        </Text>
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

      {/* ── Error state ─────────────────────────────────────────────────── */}
      {error && (
        <View className="mx-5 mt-4 bg-red-50 rounded-2xl p-4 flex-row items-center gap-x-3">
          <Ionicons name="alert-circle" size={20} color="#EF4444" />
          <Text className="flex-1 text-red-600 text-sm">{error}</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text className="text-primary font-semibold text-sm">Go back</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        ref={scrollRef}
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40 }}
      >
        {/* ── Streaming in progress — show raw text as it arrives ────────── */}
        {streaming && (
          <>
            <View className="flex-row items-center gap-x-2 mb-4">
              <ActivityIndicator size="small" color="#1E4D8C" />
              <Text className="text-primary text-sm font-medium">Generating tutorial…</Text>
            </View>
            {rawText ? (
              <View className="bg-white rounded-2xl p-4 border border-gray-100">
                <Text className="text-gray-700 text-sm leading-relaxed">{rawText}</Text>
              </View>
            ) : null}
          </>
        )}

        {/* ── Done — render parsed sections as StepCards ────────────────── */}
        {isDone && (
          <>
            {/* Topic hero strip */}
            <View
              className="rounded-2xl px-4 py-3 mb-4 flex-row items-center gap-x-3"
              style={{ backgroundColor: topic.color + "18" }}
            >
              <View
                className="w-10 h-10 rounded-xl items-center justify-center"
                style={{ backgroundColor: topic.color + "33" }}
              >
                <Ionicons name={topic.icon as any} size={20} color={topic.color} />
              </View>
              <View className="flex-1">
                <Text className="font-bold text-gray-800 text-sm">{topic.title}</Text>
                <Text className="text-gray-400 text-xs">{difficulty} Tutorial</Text>
              </View>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            </View>

            {sections.length > 0 ? (
              sections.map((section, i) => (
                <StepCard
                  key={i}
                  text={`**${section.title}**\n\n${section.body.trim()}`}
                  index={i}
                  isLast={i === sections.length - 1}
                />
              ))
            ) : (
              // Fallback — if sections couldn't be parsed, show raw
              <View className="bg-white rounded-2xl p-4 border border-gray-100">
                <Text className="text-gray-700 text-sm leading-relaxed">{rawText}</Text>
              </View>
            )}

            {/* ── Bottom CTAs ─────────────────────────────────────────────── */}
            <View className="gap-y-3 mt-4">
              <TouchableOpacity
                className="bg-primary rounded-2xl py-4 flex-row items-center justify-center gap-x-2"
                onPress={() => navigation.navigate("Practice", { topicId, difficulty })}
                activeOpacity={0.85}
              >
                <Ionicons name="pencil" size={18} color="white" />
                <Text className="text-white font-bold text-base">Practice Questions</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="bg-white border border-gray-200 rounded-2xl py-4 flex-row items-center justify-center gap-x-2"
                onPress={() => navigation.goBack()}
                activeOpacity={0.85}
              >
                <Ionicons name="arrow-back" size={18} color="#6B7280" />
                <Text className="text-gray-600 font-semibold text-base">Back to Topic</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
