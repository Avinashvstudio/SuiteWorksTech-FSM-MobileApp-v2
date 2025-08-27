import { ActivityIndicator, Text, View } from "react-native";
import Login from "./(auth)/login";
import PerformJob from "./PerformJob";
import LoginPage from "./LoginPage";
import { StatusBar } from "expo-status-bar";

export default function Index() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
      }}
    >
      <StatusBar style="light" />
      {/* <ActivityIndicator size="large" color="#00ff00" /> */}
      {/* <LoginPage /> */}
      <Login />
    </View>
  );
}
