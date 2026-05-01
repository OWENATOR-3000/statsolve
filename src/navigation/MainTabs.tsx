import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { HomeScreen } from "@/screens/HomeScreen";
import { SolverScreen } from "@/screens/SolverScreen";
import { LearnStack } from "@/navigation/LearnStack";
import { HistoryScreen } from "@/screens/HistoryScreen";
import { CalculatorScreen } from "@/screens/CalculatorScreen";
import type { MainTabParamList } from "@/types";

const Tab = createBottomTabNavigator<MainTabParamList>();

const PRIMARY   = "#1E4D8C";
const MUTED     = "#9CA3AF";
const TAB_BG    = "#FFFFFF";

export function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: PRIMARY,
        tabBarInactiveTintColor: MUTED,
        tabBarStyle: {
          backgroundColor: TAB_BG,
          borderTopWidth: 1,
          borderTopColor: "#E5E7EB",
          paddingBottom: 4,
          height: 60,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        tabBarIcon: ({ focused, color, size }) => {
          const icons: Record<keyof MainTabParamList, [string, string]> = {
            HomeTab:       ["home",       "home-outline"],
            SolveTab:      ["bulb",       "bulb-outline"],
            LearnTab:      ["book",       "book-outline"],
            HistoryTab:    ["time",       "time-outline"],
            CalculatorTab: ["calculator", "calculator-outline"],
          };
          const [active, inactive] = icons[route.name as keyof MainTabParamList];
          return (
            <Ionicons
              name={(focused ? active : inactive) as any}
              size={size}
              color={color}
            />
          );
        },
      })}
    >
      <Tab.Screen name="HomeTab"       component={HomeScreen}       options={{ title: "Home" }} />
      <Tab.Screen name="SolveTab"      component={SolverScreen}     options={{ title: "Solve" }} />
      <Tab.Screen name="LearnTab"      component={LearnStack}       options={{ title: "Learn" }} />
      <Tab.Screen name="HistoryTab"    component={HistoryScreen}    options={{ title: "History" }} />
      <Tab.Screen name="CalculatorTab" component={CalculatorScreen} options={{ title: "Calculator" }} />
    </Tab.Navigator>
  );
}
