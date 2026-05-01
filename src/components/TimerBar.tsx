import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { formatDuration } from "@/utils/formatters";

interface Props {
  seconds:   number;
  isRunning: boolean;
}

export function TimerBar({ seconds, isRunning }: Props) {
  return (
    <View className="flex-row items-center gap-x-2 bg-white rounded-xl px-4 py-2 mb-4 border border-gray-100">
      <Ionicons
        name={isRunning ? "timer" : "timer-outline"}
        size={16}
        color={isRunning ? "#E67E22" : "#6B7280"}
      />
      <Text className={`text-sm font-semibold ${isRunning ? "text-warning" : "text-muted"}`}>
        {isRunning ? "Solving…" : "Time taken:"} {formatDuration(seconds)}
      </Text>
    </View>
  );
}
