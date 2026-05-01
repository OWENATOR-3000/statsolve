import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useAuthStore } from "@/stores/authStore";
import { getDB } from "@/database/schema";
import type { Difficulty } from "@/types";

// ─── Types ─────────────────────────────────────────────────────────────────
interface Stats {
  totalSolved: number;
  bookmarked: number;
  topicsExplored: number;
  avgTimeSeconds: number;
  verifiedCount: number;
}

// ─── Helpers ───────────────────────────────────────────────────────────────
function getInitials(email: string, name?: string | null): string {
  if (name) {
    const parts = name.trim().split(" ");
    return parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : parts[0].slice(0, 2).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

function formatTime(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  return `${Math.round(seconds / 60)}m`;
}

function getDifficultyColor(d: Difficulty) {
  return d === "Beginner" ? "#27AE60" : d === "Intermediate" ? "#E67E22" : "#E74C3C";
}

// ─── Sub-components ────────────────────────────────────────────────────────
function StatCard({
  icon,
  value,
  label,
  color,
}: {
  icon: string;
  value: string;
  label: string;
  color: string;
}) {
  return (
    <View className="flex-1 bg-white rounded-2xl p-4 items-center" style={{ minWidth: "22%" }}>
      <View
        className="w-10 h-10 rounded-full items-center justify-center mb-2"
        style={{ backgroundColor: color + "18" }}
      >
        <Ionicons name={icon as any} size={20} color={color} />
      </View>
      <Text className="text-lg font-bold text-gray-800">{value}</Text>
      <Text className="text-xs text-gray-400 text-center mt-0.5">{label}</Text>
    </View>
  );
}

function DailyRing({ used, limit }: { used: number; limit: number }) {
  const pct = Math.min(used / limit, 1);
  const remaining = Math.max(limit - used, 0);
  // Simple segmented bar instead of SVG ring for simplicity
  return (
    <View className="bg-white rounded-2xl p-5">
      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-sm font-bold text-gray-800">Daily Questions</Text>
        <Text className="text-xs text-gray-400">
          {remaining} of {limit} remaining
        </Text>
      </View>
      <View className="h-3 bg-gray-100 rounded-full overflow-hidden">
        <View
          className="h-full rounded-full"
          style={{
            width: `${pct * 100}%`,
            backgroundColor: pct >= 1 ? "#E74C3C" : pct >= 0.6 ? "#E67E22" : "#27AE60",
          }}
        />
      </View>
      <View className="flex-row justify-between mt-1.5">
        <Text className="text-xs text-gray-400">{used} used</Text>
        <Text className="text-xs text-gray-400">Resets midnight</Text>
      </View>
    </View>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────
export function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { user, signOut, refreshProfile } = useAuthStore();
  const [stats, setStats] = useState<Stats>({
    totalSolved: 0,
    bookmarked: 0,
    topicsExplored: 0,
    avgTimeSeconds: 0,
    verifiedCount: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  const isPremium = user?.subscription_status === "premium";
  const difficulty: Difficulty = user?.preferred_difficulty ?? "Intermediate";

  // Reload profile + stats every time screen is focused
  useFocusEffect(
    useCallback(() => {
      refreshProfile();
      loadStats();
    }, [])
  );

  async function loadStats() {
    try {
      setLoadingStats(true);
      const db = await getDB();
      const row = await db.getFirstAsync<{
        total: number;
        bookmarked: number;
        topics: number;
        avg_time: number;
        verified: number;
      }>(
        `SELECT
           COUNT(*)                             AS total,
           SUM(CASE WHEN is_bookmarked=1 THEN 1 ELSE 0 END) AS bookmarked,
           COUNT(DISTINCT topic)                AS topics,
           AVG(time_spent_seconds)              AS avg_time,
           SUM(CASE WHEN is_verified=1   THEN 1 ELSE 0 END) AS verified
         FROM solved_questions`
      );
      setStats({
        totalSolved: row?.total ?? 0,
        bookmarked: row?.bookmarked ?? 0,
        topicsExplored: row?.topics ?? 0,
        avgTimeSeconds: row?.avg_time ?? 0,
        verifiedCount: row?.verified ?? 0,
      });
    } finally {
      setLoadingStats(false);
    }
  }

  function handleSignOut() {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: () => signOut() },
    ]);
  }

  if (!user) return null;

  const initials = getInitials(user.email, user.display_name);

  return (
    <SafeAreaView className="flex-1 bg-surface">
      {/* Top bar */}
      <View className="flex-row items-center px-5 pt-3 pb-2">
        <TouchableOpacity
          className="w-9 h-9 bg-white rounded-full items-center justify-center shadow-sm border border-gray-100"
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={20} color="#1E4D8C" />
        </TouchableOpacity>
        <Text className="flex-1 text-center text-lg font-bold text-gray-800">Profile</Text>
        <View className="w-9" />
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* ── Avatar hero ──────────────────────────────────────────────── */}
        <View className="items-center pt-6 pb-8 mx-5 bg-white rounded-3xl mt-3 shadow-sm">
          {/* Avatar circle */}
          <View
            className="w-24 h-24 rounded-full items-center justify-center mb-4"
            style={{ backgroundColor: "#1E4D8C" }}
          >
            <Text className="text-white text-3xl font-bold">{initials}</Text>
          </View>

          <Text className="text-xl font-bold text-gray-800">
            {user.display_name ?? user.email.split("@")[0]}
          </Text>
          <Text className="text-gray-400 text-sm mt-1">{user.email}</Text>

          {/* Subscription badge */}
          <View
            className="flex-row items-center gap-x-1.5 px-4 py-1.5 rounded-full mt-3"
            style={{ backgroundColor: isPremium ? "#1E4D8C" : "#F2F4F7" }}
          >
            <Ionicons
              name={isPremium ? "star" : "star-outline"}
              size={13}
              color={isPremium ? "#FFD700" : "#9CA3AF"}
            />
            <Text
              className="text-xs font-bold"
              style={{ color: isPremium ? "#fff" : "#9CA3AF" }}
            >
              {isPremium ? "Premium Member" : "Free Plan"}
            </Text>
          </View>
        </View>

        {/* ── Stats row ─────────────────────────────────────────────────── */}
        <Text className="text-sm font-bold text-gray-500 uppercase tracking-wider px-5 mt-6 mb-3">
          Your Stats
        </Text>

        {loadingStats ? (
          <ActivityIndicator color="#1E4D8C" className="my-4" />
        ) : (
          <View className="flex-row gap-x-3 px-5">
            <StatCard
              icon="checkmark-circle"
              value={String(stats.totalSolved)}
              label="Solved"
              color="#1E4D8C"
            />
            <StatCard
              icon="bookmark"
              value={String(stats.bookmarked)}
              label="Saved"
              color="#E67E22"
            />
            <StatCard
              icon="library"
              value={String(stats.topicsExplored)}
              label="Topics"
              color="#27AE60"
            />
            <StatCard
              icon="timer"
              value={stats.avgTimeSeconds > 0 ? formatTime(stats.avgTimeSeconds) : "—"}
              label="Avg Time"
              color="#9B59B6"
            />
          </View>
        )}

        {/* Verified accuracy pill */}
        {stats.totalSolved > 0 && (
          <View className="mx-5 mt-3 bg-white rounded-2xl px-5 py-3 flex-row items-center justify-between">
            <View className="flex-row items-center gap-x-2">
              <Ionicons name="shield-checkmark" size={18} color="#27AE60" />
              <Text className="text-sm font-semibold text-gray-700">Verified Answers</Text>
            </View>
            <View className="flex-row items-center gap-x-1">
              <Text className="text-sm font-bold text-accent">{stats.verifiedCount}</Text>
              <Text className="text-xs text-gray-400">
                / {stats.totalSolved} (
                {Math.round((stats.verifiedCount / stats.totalSolved) * 100)}%)
              </Text>
            </View>
          </View>
        )}

        {/* ── Daily progress ────────────────────────────────────────────── */}
        {!isPremium && (
          <>
            <Text className="text-sm font-bold text-gray-500 uppercase tracking-wider px-5 mt-6 mb-3">
              Today's Usage
            </Text>
            <View className="mx-5">
              <DailyRing used={user.daily_solves_used ?? 0} limit={5} />
            </View>
          </>
        )}

        {/* ── Subscription card ─────────────────────────────────────────── */}
        <Text className="text-sm font-bold text-gray-500 uppercase tracking-wider px-5 mt-6 mb-3">
          Subscription
        </Text>
        {isPremium ? (
          <View className="mx-5 bg-primary rounded-2xl p-5">
            <View className="flex-row items-center gap-x-3 mb-2">
              <Ionicons name="star" size={22} color="#FFD700" />
              <Text className="text-white text-base font-bold">Premium Active</Text>
            </View>
            <Text className="text-white/70 text-sm">Unlimited questions · All topics · Priority support</Text>
            {user.subscription_expires_at && (
              <Text className="text-white/50 text-xs mt-2">
                Renews {new Date(user.subscription_expires_at).toLocaleDateString()}
              </Text>
            )}
          </View>
        ) : (
          <TouchableOpacity
            className="mx-5 bg-white rounded-2xl p-5 border-2 border-dashed border-primary/30"
            onPress={() => navigation.navigate("Upgrade")}
            activeOpacity={0.8}
          >
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center gap-x-2">
                <Ionicons name="rocket" size={20} color="#1E4D8C" />
                <Text className="text-primary font-bold text-base">Upgrade to Premium</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#1E4D8C" />
            </View>
            <Text className="text-gray-500 text-sm">
              Unlock unlimited questions, all topics, and photo solving.
            </Text>
            <View className="flex-row gap-x-3 mt-3">
              {["Unlimited solves", "All 16 topics", "Photo questions"].map((f) => (
                <View key={f} className="flex-row items-center gap-x-1">
                  <Ionicons name="checkmark-circle" size={13} color="#27AE60" />
                  <Text className="text-xs text-gray-600">{f}</Text>
                </View>
              ))}
            </View>
          </TouchableOpacity>
        )}

        {/* ── Preferences ───────────────────────────────────────────────── */}
        <Text className="text-sm font-bold text-gray-500 uppercase tracking-wider px-5 mt-6 mb-3">
          Preferences
        </Text>
        <View className="mx-5 bg-white rounded-2xl overflow-hidden">
          <View className="px-5 py-4 border-b border-gray-50 flex-row items-center justify-between">
            <View className="flex-row items-center gap-x-3">
              <Ionicons name="bar-chart" size={18} color="#1E4D8C" />
              <Text className="text-gray-700 font-medium">Default Difficulty</Text>
            </View>
            <View
              className="px-3 py-1 rounded-full"
              style={{ backgroundColor: getDifficultyColor(difficulty) + "20" }}
            >
              <Text
                className="text-xs font-bold"
                style={{ color: getDifficultyColor(difficulty) }}
              >
                {difficulty}
              </Text>
            </View>
          </View>
          <View className="px-5 py-4 flex-row items-center justify-between">
            <View className="flex-row items-center gap-x-3">
              <Ionicons name="mail" size={18} color="#1E4D8C" />
              <Text className="text-gray-700 font-medium">Account Email</Text>
            </View>
            <Text className="text-gray-400 text-sm" numberOfLines={1}>
              {user.email}
            </Text>
          </View>
        </View>

        {/* ── Feedback ──────────────────────────────────────────────────── */}
        <View className="mx-5 mt-6 bg-blue-50 rounded-2xl px-4 py-4 flex-row items-start gap-x-3">
          <Ionicons name="chatbubble-ellipses-outline" size={18} color="#3B82F6" style={{ marginTop: 1 }} />
          <View className="flex-1">
            <Text className="text-sm font-bold text-blue-700 mb-0.5">Send us feedback</Text>
            <Text className="text-xs text-blue-500 leading-relaxed">
              We'd love to hear from you — bugs, suggestions, or anything else.{"\n"}
              <Text className="font-semibold">jkay4972@gmail.com</Text>
            </Text>
          </View>
        </View>

        {/* ── Sign out ──────────────────────────────────────────────────── */}
        <View className="mx-5 mt-4">
          <TouchableOpacity
            className="bg-white rounded-2xl py-4 items-center flex-row justify-center gap-x-2 border border-red-100"
            onPress={handleSignOut}
            activeOpacity={0.8}
          >
            <Ionicons name="log-out-outline" size={20} color="#E74C3C" />
            <Text className="text-red-500 font-bold text-base">Sign Out</Text>
          </TouchableOpacity>
        </View>

        {/* App version */}
        <Text className="text-center text-gray-300 text-xs mt-6">StatSolve v1.0.0</Text>

      </ScrollView>
    </SafeAreaView>
  );
}
