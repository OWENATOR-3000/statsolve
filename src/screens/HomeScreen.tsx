import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useAuthStore } from "@/stores/authStore";
import { getQuestions } from "@/database/questions";
import { TOPICS } from "@/utils/topicList";
import { truncate, formatRelativeDate } from "@/utils/formatters";
import type { SolvedQuestion } from "@/types";

export function HomeScreen() {
  const { user } = useAuthStore();
  const navigation = useNavigation<any>();
  const [recent, setRecent] = useState<SolvedQuestion[]>([]);

  const isPremium = user?.subscription_status === "premium";
  const dailyLeft = Math.max(0, 5 - (user?.daily_solves_used ?? 0));

  useEffect(() => {
    getQuestions(3).then(setRecent);
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View className="flex-row justify-between items-center mt-4 mb-6">
          <View className="flex-1">
            <Text className="text-2xl font-bold text-primary">
              {greeting()}{user?.display_name ? `, ${user.display_name.split(" ")[0]}` : ""}
            </Text>
            <Text className="text-gray-500 text-sm mt-0.5">What would you like to study?</Text>
          </View>
          <View className="flex-row items-center gap-x-2">
            {isPremium && (
              <View className="bg-primary/10 px-3 py-1 rounded-full">
                <Text className="text-primary text-xs font-bold">PREMIUM</Text>
              </View>
            )}
            <TouchableOpacity
              className="w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm border border-gray-100"
              onPress={() => navigation.navigate("Profile")}
            >
              <Ionicons name="person-circle-outline" size={24} color="#1E4D8C" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Free tier banner */}
        {!isPremium && (
          <TouchableOpacity
            className="bg-primary rounded-2xl p-4 mb-5 flex-row items-center justify-between"
            onPress={() => navigation.navigate("Upgrade")}
          >
            <View className="flex-1">
              <Text className="text-white font-bold text-base">
                {dailyLeft} free question{dailyLeft !== 1 ? "s" : ""} left today
              </Text>
              <Text className="text-white/70 text-xs mt-0.5">
                Upgrade for unlimited solving
              </Text>
            </View>
            <Ionicons name="arrow-forward-circle" size={28} color="white" />
          </TouchableOpacity>
        )}

        {/* Quick Solve CTA */}
        <TouchableOpacity
          className="bg-primary-light rounded-2xl p-5 mb-5 flex-row items-center gap-x-4"
          onPress={() => navigation.navigate("SolveTab")}
        >
          <View className="bg-primary rounded-xl p-3">
            <Ionicons name="bulb" size={24} color="white" />
          </View>
          <View className="flex-1">
            <Text className="text-white font-bold text-base">Solve a Question</Text>
            <Text className="text-white/80 text-xs mt-0.5">
              Type or photograph any stats problem
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="white" />
        </TouchableOpacity>

        {/* Topics section */}
        <Text className="text-lg font-bold text-gray-800 mb-3">Topics</Text>
        <View className="flex-row flex-wrap gap-3 mb-6">
          {TOPICS.slice(0, 6).map((topic) => (
            <TouchableOpacity
              key={topic.id}
              className="bg-white rounded-2xl p-4 flex-row items-center gap-x-3"
              style={{ width: "47%" }}
              onPress={() => navigation.navigate("LearnTab", { screen: "TopicDetail", params: { topicId: topic.id } })}
            >
              <View className="rounded-xl p-2" style={{ backgroundColor: topic.color + "22" }}>
                <Ionicons name={topic.icon as any} size={20} color={topic.color} />
              </View>
              <Text className="text-gray-800 font-semibold text-xs flex-1" numberOfLines={2}>
                {topic.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent questions */}
        {recent.length > 0 && (
          <>
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-lg font-bold text-gray-800">Recent</Text>
              <TouchableOpacity onPress={() => navigation.navigate("HistoryTab")}>
                <Text className="text-primary text-sm font-semibold">See all</Text>
              </TouchableOpacity>
            </View>
            {recent.map((q) => (
              <TouchableOpacity
                key={q.id}
                className="bg-white rounded-2xl p-4 mb-3 flex-row items-start gap-x-3"
                onPress={() => {
                    const root = navigation.getParent() ?? navigation;
                    root.navigate("Solution", { questionId: q.id });
                  }}
              >
                <Ionicons name="document-text-outline" size={20} color="#6B7280" style={{ marginTop: 2 }} />
                <View className="flex-1">
                  <Text className="text-gray-800 text-sm font-medium" numberOfLines={2}>
                    {truncate(q.question_text, 100)}
                  </Text>
                  <View className="flex-row items-center gap-x-2 mt-1">
                    {q.topic && (
                      <Text className="text-primary text-xs font-semibold">{q.topic}</Text>
                    )}
                    <Text className="text-muted text-xs">
                      {q.created_at ? formatRelativeDate(q.created_at) : ""}
                    </Text>
                    {q.is_verified && (
                      <View className="flex-row items-center gap-x-1">
                        <Ionicons name="checkmark-circle" size={12} color="#27AE60" />
                        <Text className="text-accent text-xs">Verified</Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
