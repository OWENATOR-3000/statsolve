import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { getPracticeSession } from "@/database/practice";
import { MathText } from "@/components/MathText";
import type { PracticeSession, PracticeQuestion, PracticeResult } from "@/types";

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatTime(s: number) {
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return sec > 0 ? `${m}m ${sec}s` : `${m}m`;
}

function getScoreColor(pct: number): string {
  if (pct >= 0.8) return "#10B981";
  if (pct >= 0.5) return "#F59E0B";
  return "#EF4444";
}

function getScoreLabel(pct: number): string {
  if (pct >= 0.8) return "Excellent!";
  if (pct >= 0.6) return "Good work";
  if (pct >= 0.4) return "Keep practising";
  return "Don't give up!";
}

const RESULT_META: Record<PracticeResult, { icon: string; color: string; bg: string; label: string }> = {
  correct:   { icon: "checkmark-circle", color: "#10B981", bg: "#DCFCE7", label: "Got it!" },
  struggled: { icon: "warning",          color: "#F59E0B", bg: "#FEF9C3", label: "Struggled" },
  skipped:   { icon: "remove-circle",    color: "#9CA3AF", bg: "#F3F4F6", label: "Skipped" },
};

// ── Score ring (SVG-free simple version) ─────────────────────────────────────
function ScoreRing({ score, total }: { score: number; total: number }) {
  const pct = total > 0 ? score / total : 0;
  const color = getScoreColor(pct);
  const label = getScoreLabel(pct);
  const pctDisplay = Math.round(pct * 100);

  return (
    <View className="items-center py-6">
      <View
        className="w-32 h-32 rounded-full items-center justify-center border-8"
        style={{ borderColor: color }}
      >
        <Text className="text-4xl font-bold" style={{ color }}>{pctDisplay}%</Text>
      </View>
      <Text className="text-xl font-bold text-gray-800 mt-4">{label}</Text>
      <Text className="text-gray-400 text-sm mt-1">
        {score} of {total} correct
      </Text>
    </View>
  );
}

// ── Question review card ───────────────────────────────────────────────────────
function QuestionCard({ q, index }: { q: PracticeQuestion; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const result = q.result ?? "skipped";
  const meta = RESULT_META[result];

  return (
    <View className="bg-white rounded-2xl mb-3 overflow-hidden border border-gray-100">
      <TouchableOpacity
        className="flex-row items-start gap-x-3 p-4"
        onPress={() => setExpanded((e) => !e)}
        activeOpacity={0.8}
      >
        {/* Result badge */}
        <View
          className="w-8 h-8 rounded-full items-center justify-center mt-0.5"
          style={{ backgroundColor: meta.bg }}
        >
          <Ionicons name={meta.icon as any} size={18} color={meta.color} />
        </View>

        <View className="flex-1">
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-xs font-bold text-gray-400">Q{index + 1}</Text>
            <View
              className="px-2 py-0.5 rounded-full"
              style={{ backgroundColor: meta.bg }}
            >
              <Text className="text-xs font-bold" style={{ color: meta.color }}>
                {meta.label}
              </Text>
            </View>
          </View>
          <MathText
            text={q.question}
            style={{ fontSize: 13, lineHeight: 20, color: "#374151", fontWeight: "500" }}
          />
        </View>

        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={16}
          color="#9CA3AF"
          style={{ marginTop: 6 }}
        />
      </TouchableOpacity>

      {expanded && (
        <View className="px-4 pb-4 border-t border-gray-100">
          <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-3 mb-2">
            Solution
          </Text>
          <MathText
            text={q.solution}
            style={{ fontSize: 13, lineHeight: 21, color: "#1f2937" }}
          />
        </View>
      )}
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export function PracticeReviewScreen() {
  const navigation = useNavigation<any>();
  const route      = useRoute<any>();
  const { sessionId, fallback } = route.params as {
    sessionId: number;
    fallback?: PracticeSession;
  };

  const [session, setSession] = useState<PracticeSession | null>(fallback ?? null);
  const [loading, setLoading] = useState(!fallback);

  useEffect(() => {
    if (fallback) return;
    if (sessionId < 0) { setLoading(false); return; }
    getPracticeSession(sessionId)
      .then((s) => { setSession(s); setLoading(false); })
      .catch(() => setLoading(false));
  }, [sessionId]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-surface items-center justify-center">
        <ActivityIndicator size="large" color="#1E4D8C" />
      </SafeAreaView>
    );
  }

  if (!session) {
    return (
      <SafeAreaView className="flex-1 bg-surface items-center justify-center px-10">
        <Ionicons name="alert-circle-outline" size={48} color="#D1D5DB" />
        <Text className="text-gray-400 text-center mt-3">Session not found.</Text>
        <TouchableOpacity
          className="mt-4 bg-primary rounded-xl px-6 py-3"
          onPress={() => navigation.navigate("TopicList")}
        >
          <Text className="text-white font-semibold">Back to Topics</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const total   = session.questions.length;
  const correct = session.score;
  const struggled = session.questions.filter((q) => q.result === "struggled").length;
  const skipped   = session.questions.filter((q) => q.result === "skipped").length;
  const pct = total > 0 ? correct / total : 0;

  return (
    <SafeAreaView className="flex-1 bg-surface">
      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <View className="flex-row items-center px-5 pt-3 pb-2">
        <View className="w-9" />
        <Text className="flex-1 text-center text-base font-bold text-gray-800">
          Practice Review
        </Text>
        <TouchableOpacity
          className="w-9 h-9 bg-white rounded-full items-center justify-center border border-gray-100"
          onPress={() => navigation.navigate("TopicList")}
        >
          <Ionicons name="home-outline" size={18} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
      >
        {/* ── Topic & difficulty strip ─────────────────────────────────────── */}
        <View className="flex-row items-center justify-center gap-x-2 mt-2 mb-1">
          <Text className="text-sm font-semibold text-gray-500">{session.topic}</Text>
          <Text className="text-gray-300">·</Text>
          <Text className="text-sm font-semibold text-gray-500">{session.difficulty}</Text>
          <Text className="text-gray-300">·</Text>
          <Text className="text-sm text-gray-400">{formatTime(session.duration_seconds)}</Text>
        </View>

        {/* ── Score ring ───────────────────────────────────────────────────── */}
        <ScoreRing score={correct} total={total} />

        {/* ── Stat summary row ─────────────────────────────────────────────── */}
        <View className="flex-row gap-x-3 mb-6">
          {[
            { label: "Correct",   value: correct,   color: "#10B981", bg: "#DCFCE7" },
            { label: "Struggled", value: struggled,  color: "#F59E0B", bg: "#FEF9C3" },
            { label: "Skipped",   value: skipped,    color: "#9CA3AF", bg: "#F3F4F6" },
          ].map((stat) => (
            <View
              key={stat.label}
              className="flex-1 rounded-2xl p-3 items-center"
              style={{ backgroundColor: stat.bg }}
            >
              <Text className="text-xl font-bold" style={{ color: stat.color }}>{stat.value}</Text>
              <Text className="text-xs font-semibold mt-0.5" style={{ color: stat.color }}>
                {stat.label}
              </Text>
            </View>
          ))}
        </View>

        {/* ── Encouragement message ────────────────────────────────────────── */}
        {pct < 0.6 && (
          <View className="bg-blue-50 rounded-2xl px-4 py-3 mb-5 flex-row items-start gap-x-3">
            <Ionicons name="bulb-outline" size={18} color="#3B82F6" style={{ marginTop: 1 }} />
            <Text className="flex-1 text-xs text-blue-600 leading-relaxed">
              Review the solutions below and try again — each attempt builds understanding.
              Consider reading the <Text className="font-bold">Tutorial</Text> first if you're still stuck.
            </Text>
          </View>
        )}

        {/* ── Question breakdown ───────────────────────────────────────────── */}
        <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
          Review all questions
        </Text>
        {session.questions.map((q, i) => (
          <QuestionCard key={i} q={q} index={i} />
        ))}

        {/* ── Action buttons ───────────────────────────────────────────────── */}
        <View className="gap-y-3 mt-4">
          {/* Try again with same topic */}
          <TouchableOpacity
            className="bg-primary rounded-2xl py-4 flex-row items-center justify-center gap-x-2"
            onPress={() =>
              navigation.replace("Practice", {
                topicId: session.topicId ?? session.topic.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
                difficulty: session.difficulty,
              })
            }
            activeOpacity={0.85}
          >
            <Ionicons name="refresh" size={18} color="white" />
            <Text className="text-white font-bold text-base">Try Again</Text>
          </TouchableOpacity>

          {/* Back to topics */}
          <TouchableOpacity
            className="bg-white border border-gray-200 rounded-2xl py-4 flex-row items-center justify-center gap-x-2"
            onPress={() => navigation.navigate("TopicList")}
            activeOpacity={0.85}
          >
            <Ionicons name="list" size={18} color="#6B7280" />
            <Text className="text-gray-600 font-semibold text-base">All Topics</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
