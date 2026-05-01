import React, { useState, useCallback } from "react";
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import {
  getQuestions, getBookmarkedQuestions, searchQuestions, toggleBookmark,
} from "@/database/questions";
import { truncate, formatRelativeDate } from "@/utils/formatters";
import type { SolvedQuestion } from "@/types";

type Filter = "all" | "bookmarked";

export function HistoryScreen() {
  const navigation = useNavigation<any>();
  const [questions, setQuestions] = useState<SolvedQuestion[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  useFocusEffect(
    useCallback(() => {
      load(filter);
    }, [filter])
  );

  async function load(f: Filter) {
    const data = f === "bookmarked"
      ? await getBookmarkedQuestions()
      : await getQuestions(100);
    setQuestions(data);
  }

  async function handleSearch(text: string) {
    setQuery(text);
    if (text.trim()) {
      const results = await searchQuestions(text.trim());
      setQuestions(results);
    } else {
      load(filter);
    }
  }

  async function switchFilter(f: Filter) {
    setFilter(f);
    setQuery("");
    const data = f === "bookmarked"
      ? await getBookmarkedQuestions()
      : await getQuestions(100);
    setQuestions(data);
  }

  async function handleBookmark(q: SolvedQuestion) {
    const next = !q.is_bookmarked;
    await toggleBookmark(q.id!, next);
    // If in bookmarked tab and unbookmarking, remove from list
    if (filter === "bookmarked" && !next) {
      setQuestions((prev) => prev.filter((item) => item.id !== q.id));
    } else {
      setQuestions((prev) =>
        prev.map((item) => item.id === q.id ? { ...item, is_bookmarked: next } : item)
      );
    }
  }

  function renderItem({ item }: { item: SolvedQuestion }) {
    return (
      <TouchableOpacity
        className="bg-white rounded-2xl mx-5 mb-3 p-4"
        onPress={() => {
          const root = navigation.getParent() ?? navigation;
          root.navigate("Solution", { questionId: item.id });
        }}
        activeOpacity={0.75}
      >
        <View className="flex-row items-start gap-x-3">
          <View className="flex-1">
            <Text className="text-gray-800 text-sm font-medium" numberOfLines={2}>
              {truncate(item.question_text, 120)}
            </Text>
            <View className="flex-row items-center flex-wrap gap-x-3 mt-2">
              {item.topic && (
                <View className="bg-primary/10 rounded-full px-2 py-0.5">
                  <Text className="text-primary text-xs font-semibold">{item.topic}</Text>
                </View>
              )}
              {item.is_verified && (
                <View className="flex-row items-center gap-x-1">
                  <Ionicons name="checkmark-circle" size={12} color="#27AE60" />
                  <Text className="text-xs" style={{ color: "#27AE60" }}>Verified</Text>
                </View>
              )}
              <Text className="text-gray-400 text-xs">
                {item.created_at ? formatRelativeDate(item.created_at) : ""}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            className="p-1 mt-0.5"
            onPress={() => handleBookmark(item)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={item.is_bookmarked ? "bookmark" : "bookmark-outline"}
              size={20}
              color={item.is_bookmarked ? "#1E4D8C" : "#9CA3AF"}
            />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  }

  const emptyText = query
    ? "No questions match your search."
    : filter === "bookmarked"
    ? "No bookmarked questions yet.\nTap the bookmark icon on any solution to save it."
    : "No questions solved yet.\nHead to Solve to get started!";

  return (
    <SafeAreaView className="flex-1 bg-surface">
      {/* Header */}
      <View className="px-5 pt-4 pb-3">
        <Text className="text-xl font-bold text-primary mb-3">History</Text>

        {/* Filter tabs */}
        <View className="flex-row bg-white rounded-xl p-1 border border-gray-100 mb-3">
          {([
            { id: "all",        label: "All",        icon: "time-outline" },
            { id: "bookmarked", label: "Bookmarked", icon: "bookmark" },
          ] as { id: Filter; label: string; icon: string }[]).map((tab) => (
            <TouchableOpacity
              key={tab.id}
              className={`flex-1 flex-row items-center justify-center gap-x-1.5 py-2 rounded-lg ${
                filter === tab.id ? "bg-primary" : ""
              }`}
              onPress={() => switchFilter(tab.id)}
            >
              <Ionicons
                name={tab.icon as any}
                size={14}
                color={filter === tab.id ? "#fff" : "#9CA3AF"}
              />
              <Text
                className={`text-xs font-bold ${
                  filter === tab.id ? "text-white" : "text-gray-400"
                }`}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Search */}
        <View className="flex-row items-center bg-white rounded-xl px-4 py-2 border border-gray-200">
          <Ionicons name="search" size={18} color="#9CA3AF" />
          <TextInput
            className="flex-1 ml-2 text-base text-gray-800"
            placeholder={filter === "bookmarked" ? "Search saved…" : "Search questions…"}
            value={query}
            onChangeText={handleSearch}
          />
          {query ? (
            <TouchableOpacity onPress={() => handleSearch("")}>
              <Ionicons name="close-circle" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {questions.length === 0 ? (
        <View className="flex-1 items-center justify-center px-10">
          <Ionicons
            name={filter === "bookmarked" ? "bookmark-outline" : "document-text-outline"}
            size={48}
            color="#D1D5DB"
          />
          <Text className="text-gray-400 text-center mt-3 text-base">{emptyText}</Text>
        </View>
      ) : (
        <FlatList
          data={questions}
          keyExtractor={(q) => String(q.id)}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </SafeAreaView>
  );
}
