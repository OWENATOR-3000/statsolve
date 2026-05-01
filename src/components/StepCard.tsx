import React, { useEffect, useRef } from "react";
import { View, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { MathText } from "./MathText";

interface Props {
  text:   string;
  index:  number;
  isLast: boolean;
}

export function StepCard({ text, index, isLast }: Props) {
  const opacity    = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity,    { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  const isFinalAnswer =
    text.includes("**Final Answer:**") ||
    text.toLowerCase().includes("final answer");

  return (
    <Animated.View
      style={{ opacity, transform: [{ translateY }] }}
      className={`rounded-2xl p-4 mb-3 border-l-4 ${
        isFinalAnswer ? "bg-green-50 border-green-500" : "bg-white border-blue-300"
      }`}
    >
      <View className="flex-row items-start gap-x-3">
        {/* Badge */}
        {isFinalAnswer ? (
          <Ionicons name="checkmark-circle" size={24} color="#27AE60" style={{ marginTop: 1, flexShrink: 0 }} />
        ) : (
          <View className="bg-primary rounded-full w-7 h-7 items-center justify-center mt-0.5 shrink-0">
            <Animated.Text className="text-white text-xs font-bold">{index + 1}</Animated.Text>
          </View>
        )}

        {/* Rendered math text */}
        <MathText
          text={text}
          isFinal={isFinalAnswer}
          style={{
            flex: 1,
            fontSize: 14,
            lineHeight: 22,
            color: isFinalAnswer ? "#1a7a45" : "#1f2937",
            fontWeight: isFinalAnswer ? "600" : "400",
          }}
        />
      </View>
    </Animated.View>
  );
}
