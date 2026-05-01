import React, { useState } from "react";
import {
  View, Text, TouchableOpacity, ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { getTopicById } from "@/utils/topicList";
import type { Difficulty } from "@/types";

const DIFFICULTIES: Difficulty[] = ["Beginner", "Intermediate", "Advanced"];

const DIFFICULTY_META: Record<Difficulty, { icon: string; color: string; desc: string }> = {
  Beginner:     { icon: "leaf",       color: "#10B981", desc: "Definitions, examples and basic formulas" },
  Intermediate: { icon: "flame",      color: "#F59E0B", desc: "Worked problems and exam-style questions" },
  Advanced:     { icon: "rocket",     color: "#EF4444", desc: "Proofs, edge cases and tricky scenarios" },
};

export function TopicDetailScreen() {
  const navigation = useNavigation<any>();
  const route      = useRoute<any>();
  const { topicId } = route.params as { topicId: string };

  const topic = getTopicById(topicId);
  const [difficulty, setDifficulty] = useState<Difficulty>("Intermediate");

  if (!topic) {
    return (
      <SafeAreaView className="flex-1 bg-surface items-center justify-center px-10">
        <Ionicons name="alert-circle-outline" size={48} color="#D1D5DB" />
        <Text className="text-gray-400 text-center mt-3">Topic not found.</Text>
        <TouchableOpacity className="mt-4" onPress={() => navigation.goBack()}>
          <Text className="text-primary font-semibold">Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const meta = DIFFICULTY_META[difficulty];

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
        <Text className="flex-1 text-center text-lg font-bold text-gray-800">Learn</Text>
        <View className="w-9" />
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* ── Topic hero card ─────────────────────────────────────────────── */}
        <View
          className="mx-5 mt-3 rounded-3xl p-6"
          style={{ backgroundColor: topic.color + "18" }}
        >
          <View
            className="w-16 h-16 rounded-2xl items-center justify-center mb-4"
            style={{ backgroundColor: topic.color + "33" }}
          >
            <Ionicons name={topic.icon as any} size={32} color={topic.color} />
          </View>
          <Text className="text-2xl font-bold text-gray-900 mb-1">{topic.title}</Text>
          <Text className="text-gray-500 text-sm leading-relaxed">{topic.description}</Text>
        </View>

        {/* ── Difficulty selector ─────────────────────────────────────────── */}
        <View className="px-5 mt-6">
          <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
            Choose difficulty
          </Text>
          <View className="gap-y-2">
            {DIFFICULTIES.map((d) => {
              const m = DIFFICULTY_META[d];
              const active = difficulty === d;
              return (
                <TouchableOpacity
                  key={d}
                  className={`flex-row items-center gap-x-3 rounded-2xl px-4 py-3 border ${
                    active ? "bg-primary border-primary" : "bg-white border-gray-100"
                  }`}
                  onPress={() => setDifficulty(d)}
                  activeOpacity={0.8}
                >
                  <View
                    className="w-9 h-9 rounded-xl items-center justify-center"
                    style={{ backgroundColor: active ? "rgba(255,255,255,0.2)" : m.color + "22" }}
                  >
                    <Ionicons
                      name={m.icon as any}
                      size={18}
                      color={active ? "#fff" : m.color}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className={`font-bold text-sm ${active ? "text-white" : "text-gray-800"}`}>
                      {d}
                    </Text>
                    <Text className={`text-xs mt-0.5 ${active ? "text-white/70" : "text-gray-400"}`}>
                      {m.desc}
                    </Text>
                  </View>
                  {active && (
                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Action cards ────────────────────────────────────────────────── */}
        <View className="px-5 mt-6 gap-y-3">
          <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
            What would you like to do?
          </Text>

          {/* Tutorial CTA */}
          <TouchableOpacity
            className="bg-primary rounded-3xl p-5 flex-row items-center gap-x-4"
            onPress={() => navigation.navigate("Tutorial", { topicId: topic.id, difficulty })}
            activeOpacity={0.85}
          >
            <View className="w-12 h-12 bg-white/20 rounded-2xl items-center justify-center">
              <Ionicons name="book" size={24} color="#fff" />
            </View>
            <View className="flex-1">
              <Text className="text-white font-bold text-base">Read Tutorial</Text>
              <Text className="text-white/70 text-xs mt-0.5">
                AI-generated explanation at {difficulty.toLowerCase()} level
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.6)" />
          </TouchableOpacity>

          {/* Practice CTA */}
          <TouchableOpacity
            className="bg-white border border-gray-100 rounded-3xl p-5 flex-row items-center gap-x-4"
            onPress={() => navigation.navigate("Practice", { topicId: topic.id, difficulty })}
            activeOpacity={0.85}
          >
            <View className="w-12 h-12 rounded-2xl items-center justify-center" style={{ backgroundColor: topic.color + "22" }}>
              <Ionicons name="pencil" size={24} color={topic.color} />
            </View>
            <View className="flex-1">
              <Text className="text-gray-900 font-bold text-base">Practice Questions</Text>
              <Text className="text-gray-400 text-xs mt-0.5">
                5 questions — timed, self-graded
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
          </TouchableOpacity>
        </View>

        {/* ── Tip box ─────────────────────────────────────────────────────── */}
        <View className="mx-5 mt-5 bg-blue-50 rounded-2xl px-4 py-3 flex-row items-start gap-x-3">
          <Ionicons name="information-circle" size={18} color="#3B82F6" style={{ marginTop: 1 }} />
          <Text className="flex-1 text-xs text-blue-600 leading-relaxed">
            Start with the <Text className="font-bold">Tutorial</Text> to understand the concepts,
            then test yourself with <Text className="font-bold">Practice Questions</Text>.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
