import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { LoginScreen } from "@/screens/auth/LoginScreen";
import { SignUpScreen } from "@/screens/auth/SignUpScreen";
import type { AuthStackParamList } from "@/types";

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#F2F4F7" },
      }}
    >
      <Stack.Screen name="Login"  component={LoginScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
    </Stack.Navigator>
  );
}
