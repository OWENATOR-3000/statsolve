import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator, ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { supabase } from "@/services/supabase";
import type { AuthStackParamList } from "@/types";

type Nav = NativeStackNavigationProp<AuthStackParamList, "SignUp">;

export function SignUpScreen() {
  const nav = useNavigation<Nav>();
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);

  async function handleSignUp() {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }
    if (password.length < 8) {
      Alert.alert("Error", "Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { display_name: name.trim() || null } },
    });
    setLoading(false);

    if (error) {
      Alert.alert("Sign Up Failed", error.message);
      return;
    }

    // Create profile row (Supabase trigger can also do this automatically)
    if (data.user) {
      await supabase.from("profiles").upsert({
        id: data.user.id,
        email: email.trim(),
        display_name: name.trim() || null,
      });
    }

    Alert.alert(
      "Almost there!",
      "Check your email for a confirmation link, then come back and log in.",
      [{ text: "OK", onPress: () => nav.navigate("Login") }]
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-surface"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{ justifyContent: "center", flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View className="mb-10">
          <Text className="text-3xl font-bold text-primary mb-2">Create Account</Text>
          <Text className="text-base text-muted">Join StatSolve — it's free</Text>
        </View>

        <View className="gap-y-4">
          <View>
            <Text className="text-sm font-semibold text-gray-700 mb-1">Name (optional)</Text>
            <TextInput
              className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-base"
              placeholder="Your name"
              value={name}
              onChangeText={setName}
            />
          </View>

          <View>
            <Text className="text-sm font-semibold text-gray-700 mb-1">Email</Text>
            <TextInput
              className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-base"
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
              className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-base"
              placeholder="Min. 8 characters"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>
        </View>

        <TouchableOpacity
          className="bg-primary rounded-xl py-4 mt-6 items-center"
          onPress={handleSignUp}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text className="text-white font-bold text-base">Create Free Account</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity
          className="mt-6 items-center"
          onPress={() => nav.navigate("Login")}
        >
          <Text className="text-muted text-sm">
            Already have an account?{" "}
            <Text className="text-primary font-semibold">Log in</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
