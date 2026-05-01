import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { TopicListScreen }     from "@/screens/TopicListScreen";
import { TopicDetailScreen }   from "@/screens/TopicDetailScreen";
import { TutorialScreen }      from "@/screens/TutorialScreen";
import { PracticeScreen }      from "@/screens/PracticeScreen";
import { PracticeReviewScreen } from "@/screens/PracticeReviewScreen";
import type { LearnStackParamList } from "@/types";

const Stack = createNativeStackNavigator<LearnStackParamList>();

export function LearnStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TopicList"      component={TopicListScreen} />
      <Stack.Screen name="TopicDetail"    component={TopicDetailScreen} />
      <Stack.Screen name="Tutorial"       component={TutorialScreen} />
      <Stack.Screen name="Practice"       component={PracticeScreen} />
      <Stack.Screen name="PracticeReview" component={PracticeReviewScreen} />
    </Stack.Navigator>
  );
}
