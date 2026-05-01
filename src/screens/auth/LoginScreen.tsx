import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { supabase } from "@/services/supabase";
import type { AuthStackParamList } from "@/types";

type Nav = NativeStackNavigationProp<AuthStackParamList, "Login">;

export function LoginScreen() {
  const nav = useNavigation<Nav>();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Please enter your email and password.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (error) Alert.alert("Login Failed", error.message);
    // On success, authStore listener will redirect automatically
  }

  async function handleGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google" });
    if (error) Alert.alert("Error", error.message);
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-surface"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View className="flex-1 px-6 justify-center">
        {/* Header */}
        <View className="mb-10">
          <Text className="text-4xl font-bold text-primary mb-2">StatSolve</Text>
          <Text className="text-base text-muted">Your AI-powered statistics tutor</Text>
        </View>

        {/* Form */}
        <View className="gap-y-4">
          <View>
            <Text className="text-sm font-semibold text-gray-700 mb-1">Email</Text>
            <TextInput
              className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900"
              placeholder="you@university.ac.uk"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View>
            <Text className="text-sm font-semibold text-gray-700 mb-1">Password</Text>
            <TextInput
              className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>
        </View>

        {/* Login button */}
        <TouchableOpacity
          className="bg-primary rounded-xl py-4 mt-6 items-center"
          onPress={handleLogin}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text className="text-white font-bold text-base">Log In</Text>
          }
        </TouchableOpacity>

        {/* Divider */}
        <View className="flex-row items-center my-5">
          <View className="flex-1 h-px bg-gray-200" />
          <Text className="mx-3 text-muted text-sm">or</Text>
          <View className="flex-1 h-px bg-gray-200" />
        </View>

        {/* Google OAuth */}
        <TouchableOpacity
          className="bg-white border border-gray-200 rounded-xl py-4 items-center"
          onPress={handleGoogle}
        >
          <Text className="font-semibold text-gray-700">Continue with Google</Text>
        </TouchableOpacity>

        {/* Sign up link */}
        <TouchableOpacity
          className="mt-8 items-center"
          onPress={() => nav.navigate("SignUp")}
        >
          <Text className="text-muted text-sm">
            Don't have an account?{" "}
            <Text className="text-primary font-semibold">Sign up free</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
