import { Stack, usePathname } from "expo-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/services/apiClient";
import { StatusBar } from "expo-status-bar";
import Toast from "react-native-toast-message";
import { useEffect, useState } from "react";
import axios from "axios";

export default function RootLayout() {
  const path = usePathname();
  console.log("path", path);

  // const [show, setShow] = useState(false);

  // useEffect(() => {
  //   const res = axios.get("https://eptriserverdep.vercel.app/api/");
  //   const re = res.then((d) => d.data);
  //   const data = re.then((p) => setShow(p.global[0].show));
  // }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="PerformJob" options={{ headerShown: false }} />
        <Stack.Screen name="ReassignTech" options={{ headerShown: false }} />
        <Stack.Screen name="CompletedJobs" options={{ headerShown: false }} />
        <Stack.Screen name="ViewEquipUsage" options={{ headerShown: false }} />
      </Stack>

      <Toast />
    </QueryClientProvider>
  );
}
