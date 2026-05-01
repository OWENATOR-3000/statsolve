import React from "react";
import { View, Text, FlatList, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { TOPICS } from "@/utils/topicList";
import type { Topic } from "@/types";

export function TopicListScreen() {
  const navigation = useNavigation<any>();

  function renderTopic({ item }: { item: Topic }) {
    return (
      <TouchableOpacity
        className="bg-white rounded-2xl mx-5 mb-3 p-4 flex-row items-center gap-x-4"
        onPress={() => navigation.navigate("TopicDetail", { topicId: item.id })}
      >
        <View className="rounded-xl p-3" style={{ backgroundColor: item.color + "22" }}>
          <Ionicons name={item.icon as any} size={22} color={item.color} />
        </View>
        <View className="flex-1">
          <Text className="text-gray-800 font-bold text-sm">{item.title}</Text>
          <Text className="text-muted text-xs mt-0.5" numberOfLines={1}>
            {item.description}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <View className="px-5 pt-4 pb-3">
        <Text className="text-xl font-bold text-primary">Topics</Text>
        <Text className="text-muted text-sm mt-0.5">
          {TOPICS.length} topics covered
        </Text>
      </View>
      <FlatList
        data={TOPICS}
        keyExtractor={(t) => t.id}
        renderItem={renderTopic}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </SafeAreaView>
  );
}
