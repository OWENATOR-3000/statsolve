import React, { useEffect, useRef, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  Alert, ActivityIndicator, Modal, FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useSolverStore } from "@/stores/solverStore";
import { useAuthStore } from "@/stores/authStore";
import { streamSolve } from "@/services/api";
import { saveQuestion, getQuestionCount } from "@/database/questions";
import { TOPICS } from "@/utils/topicList";
import { StepCard } from "@/components/StepCard";
import { TimerBar } from "@/components/TimerBar";

const FREE_SAVE_LIMIT = 5;

export function SolverScreen() {
  const store = useSolverStore();
  const { user } = useAuthStore();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [showTopicPicker, setShowTopicPicker] = useState(false);
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const [isSaving, setIsSaving]     = useState(false);

  const isPremium = user?.subscription_status === "premium";
  const atSaveLimit = !isPremium && savedCount >= FREE_SAVE_LIMIT;

  // Cleanup timer on unmount
  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  function startTimer() {
    store.startTimer();
    timerRef.current = setInterval(() => store.tickTimer(), 1000);
  }

  function stopTimer() {
    store.stopTimer();
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }

  async function pickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please allow photo access in Settings.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      store.setImage(asset.uri, `data:image/jpeg;base64,${asset.base64}`);
    }
  }

  async function handleSolve() {
    if (!store.question.trim() && !store.imageBase64) {
      Alert.alert("Nothing to solve", "Type a question or attach a photo.");
      return;
    }

    store.setStreaming(true);
    startTimer();

    await streamSolve(
      {
        question: store.question,
        topic:    store.selectedTopic ?? undefined,
        imageBase64: store.imageBase64 ?? undefined,
      },
      {
        onDelta:      (text) => store.appendSolutionChunk(text),
        onValidation: (passed) => store.setVerified(passed),
        onDone: async () => {
          stopTimer();
          store.setStreaming(false);
          // Check how many questions already saved before showing prompt
          const count = await getQuestionCount();
          setSavedCount(count);
          setShowSavePrompt(true);
        },
        onError: (msg) => {
          stopTimer();
          store.setError(msg);
          Alert.alert("Error", msg);
        },
      }
    );
  }

  function handleReset() {
    stopTimer();
    store.reset();
  }

  async function handleSave() {
    setIsSaving(true);
    const { question, imageUri, selectedTopic, solution, timerSeconds, isVerified } =
      useSolverStore.getState();
    const id = await saveQuestion({
      question_text:      question,
      image_path:         imageUri ?? undefined,
      topic:              selectedTopic ?? undefined,
      solution,
      time_spent_seconds: timerSeconds,
      is_bookmarked:      false,
      is_verified:        isVerified ?? false,
    });
    store.setSavedId(id);
    setIsSaving(false);
    setShowSavePrompt(false);
  }

  function handleDontSave() {
    setShowSavePrompt(false);
  }

  // Split solution into step cards
  const steps = store.solution
    .split(/(?=\*\*Step \d+:)/g)
    .filter(Boolean);

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <View className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 pt-4 pb-3">
          <Text className="text-xl font-bold text-primary">Solve a Question</Text>
          {store.solution ? (
            <TouchableOpacity onPress={handleReset}>
              <Text className="text-primary-light font-semibold text-sm">New</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <ScrollView className="flex-1 px-5" keyboardShouldPersistTaps="handled">
          {/* Topic selector */}
          <TouchableOpacity
            className="bg-white border border-gray-200 rounded-xl px-4 py-3 mb-3 flex-row items-center justify-between"
            onPress={() => setShowTopicPicker(true)}
          >
            <View className="flex-row items-center gap-x-2">
              <Ionicons name="library-outline" size={16} color="#9CA3AF" />
              <Text className={store.selectedTopic ? "text-gray-800 font-medium" : "text-gray-400"}>
                {store.selectedTopic ?? "Select topic (optional)"}
              </Text>
            </View>
            <View className="flex-row items-center gap-x-1">
              {store.selectedTopic && (
                <TouchableOpacity
                  onPress={(e) => { e.stopPropagation(); store.setTopic(null); }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close-circle" size={16} color="#9CA3AF" />
                </TouchableOpacity>
              )}
              <Ionicons name="chevron-down" size={16} color="#9CA3AF" />
            </View>
          </TouchableOpacity>
          {!store.selectedTopic && (
            <Text className="text-xs text-gray-400 -mt-1 mb-3 px-1">
              Selecting a topic helps the AI give more precise, structured answers
            </Text>
          )}

          {/* Question input */}
          <View className="bg-white border border-gray-200 rounded-xl mb-3 overflow-hidden">
            <TextInput
              className="px-4 pt-3 pb-2 text-base text-gray-900 min-h-[120px]"
              placeholder="Type your statistics question here…"
              value={store.question}
              onChangeText={store.setQuestion}
              multiline
              textAlignVertical="top"
              editable={!store.isStreaming}
            />
            {/* Image attachment strip */}
            <View className="flex-row items-center justify-between border-t border-gray-100 px-4 py-2">
              {store.imageUri ? (
                <View className="flex-row items-center gap-x-2">
                  <Ionicons name="image" size={16} color="#27AE60" />
                  <Text className="text-accent text-xs font-medium">Photo attached</Text>
                  <TouchableOpacity onPress={store.clearImage}>
                    <Ionicons name="close-circle" size={16} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  className="flex-row items-center gap-x-1"
                  onPress={pickImage}
                  disabled={store.isStreaming}
                >
                  <Ionicons name="camera-outline" size={18} color="#4A90D9" />
                  <Text className="text-primary-light text-xs font-semibold">
                    Attach photo
                  </Text>
                </TouchableOpacity>
              )}
              <Text className="text-gray-400 text-xs">
                {store.question.length} chars
              </Text>
            </View>
          </View>

          {/* Solve button */}
          {!store.solution && (
            <TouchableOpacity
              className={`rounded-xl py-4 items-center mb-5 ${store.isStreaming ? "bg-gray-300" : "bg-primary"}`}
              onPress={handleSolve}
              disabled={store.isStreaming}
            >
              {store.isStreaming ? (
                <View className="flex-row items-center gap-x-2">
                  <ActivityIndicator color="#fff" size="small" />
                  <Text className="text-white font-bold">Solving…</Text>
                </View>
              ) : (
                <Text className="text-white font-bold text-base">Solve Step by Step</Text>
              )}
            </TouchableOpacity>
          )}

          {/* Timer */}
          {(store.isStreaming || store.solution) && (
            <TimerBar seconds={store.timerSeconds} isRunning={store.isStreaming} />
          )}

          {/* Solution steps */}
          {steps.map((step, i) => (
            <StepCard key={i} text={step} index={i} isLast={i === steps.length - 1 && !store.isStreaming} />
          ))}

          {/* Verification badge */}
          {store.isVerified !== null && !store.isStreaming && (
            <View className={`flex-row items-center gap-x-2 rounded-xl px-4 py-3 mb-4 ${store.isVerified ? "bg-accent/10" : "bg-warning/10"}`}>
              <Ionicons
                name={store.isVerified ? "checkmark-circle" : "warning"}
                size={20}
                color={store.isVerified ? "#27AE60" : "#E67E22"}
              />
              <Text className={`text-sm font-semibold ${store.isVerified ? "text-accent" : "text-warning"}`}>
                {store.isVerified
                  ? "Answer verified — calculations confirmed"
                  : "Cross-check recommended — review the steps"}
              </Text>
            </View>
          )}

          <View className="h-12" />
        </ScrollView>
      </View>

      {/* ── Save prompt modal ─────────────────────────────────────────── */}
      <Modal visible={showSavePrompt} transparent animationType="fade">
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl px-6 pt-6 pb-10">
            {atSaveLimit ? (
              <>
                <View className="items-center mb-4">
                  <View className="w-14 h-14 bg-warning/10 rounded-full items-center justify-center mb-3">
                    <Ionicons name="lock-closed" size={28} color="#E67E22" />
                  </View>
                  <Text className="text-lg font-bold text-gray-800 text-center">
                    Save limit reached
                  </Text>
                  <Text className="text-gray-500 text-sm text-center mt-2">
                    Free accounts can save up to {FREE_SAVE_LIMIT} questions.
                    Upgrade to Premium to save unlimited solutions.
                  </Text>
                </View>
                <View className="flex-row gap-x-3 mt-2">
                  <TouchableOpacity
                    className="flex-1 bg-gray-100 rounded-2xl py-4 items-center"
                    onPress={handleDontSave}
                  >
                    <Text className="text-gray-600 font-semibold">Dismiss</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="flex-1 bg-primary rounded-2xl py-4 items-center"
                    onPress={handleDontSave}
                  >
                    <Text className="text-white font-bold">Upgrade</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <View className="items-center mb-4">
                  <View className="w-14 h-14 bg-primary/10 rounded-full items-center justify-center mb-3">
                    <Ionicons name="bookmark" size={28} color="#1E4D8C" />
                  </View>
                  <Text className="text-lg font-bold text-gray-800 text-center">
                    Save this solution?
                  </Text>
                  <Text className="text-gray-500 text-sm text-center mt-2">
                    {isPremium
                      ? "Save to your history to review anytime."
                      : `${FREE_SAVE_LIMIT - savedCount} of ${FREE_SAVE_LIMIT} free saves remaining.`}
                  </Text>
                </View>
                <View className="flex-row gap-x-3 mt-2">
                  <TouchableOpacity
                    className="flex-1 bg-gray-100 rounded-2xl py-4 items-center"
                    onPress={handleDontSave}
                    disabled={isSaving}
                  >
                    <Text className="text-gray-600 font-semibold">Don't Save</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="flex-1 bg-primary rounded-2xl py-4 items-center"
                    onPress={handleSave}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text className="text-white font-bold">Save to History</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Topic picker modal */}
      <Modal visible={showTopicPicker} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView className="flex-1 bg-surface">
          <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-200">
            <Text className="text-lg font-bold text-gray-800">Select Topic</Text>
            <TouchableOpacity onPress={() => setShowTopicPicker(false)}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            className="px-5 py-4 border-b border-gray-100"
            onPress={() => { store.setTopic(null); setShowTopicPicker(false); }}
          >
            <Text className="text-muted">No topic selected</Text>
          </TouchableOpacity>
          <FlatList
            data={TOPICS}
            keyExtractor={(t) => t.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                className="flex-row items-center gap-x-3 px-5 py-4 border-b border-gray-100"
                onPress={() => { store.setTopic(item.title); setShowTopicPicker(false); }}
              >
                <View className="rounded-xl p-2" style={{ backgroundColor: item.color + "22" }}>
                  <Ionicons name={item.icon as any} size={20} color={item.color} />
                </View>
                <Text className="text-gray-800 font-medium">{item.title}</Text>
              </TouchableOpacity>
            )}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
