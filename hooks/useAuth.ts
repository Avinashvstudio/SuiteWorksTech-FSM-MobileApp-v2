// src/hooks/useAuth.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  authService,
  LoginCredentials,
  UserData,
} from "@/services/authService";
import Toast from "react-native-toast-message";

import { useCallback, useEffect } from "react";
import { router } from "expo-router";
import { apiClient } from "@/services/apiClient";

// Auth query keys
export const authQueryKeys = {
  user: ["user"],
  isAuthenticated: ["isAuthenticated"],
};

// Custom hook for authentication status
export function useAuthStatus() {
  return useQuery({
    queryKey: authQueryKeys.isAuthenticated,
    queryFn: () => authService.isAuthenticated(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Custom hook for user data
export function useUserData() {
  return useQuery({
    queryKey: authQueryKeys.user,
    queryFn: () => authService.getUserData(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Custom hook for login
export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: LoginCredentials) =>
      authService.login(credentials),
    onSuccess: (data) => {
      console.log('Login response data:', data);
      console.log('User data from response:', data.userData);
      
      if (data.success && data.userData) {
        // Get the full server response with NetSuite credentials
        const fullUserData = data.userData;
        
        console.log('Full user data being stored:', fullUserData);
        console.log('Tabs data in user data:', fullUserData.tabs);
        
        // Configure API client with full NetSuite credentials
        apiClient.updateConfig(fullUserData);
        
        // Store the full user data including NetSuite credentials
        queryClient.setQueryData(authQueryKeys.user, fullUserData);

        queryClient.setQueryData(authQueryKeys.isAuthenticated, true);

        // Also store in AsyncStorage for persistence
        authService.storeUserData(fullUserData).then(() => {
          // User data stored successfully
        }).catch((error) => {
          console.error("Failed to store user data in AsyncStorage:", error);
        });

        Toast.show({
          type: "success",
          text1: "Login Successful",
          text2: "Welcome Back",
          position: "top",
          visibilityTime: 10000,
          autoHide: true,
          topOffset: 50,
          bottomOffset: 50,
        });
      }

      if (!data.success) {
        Toast.show({
          type: "error",
          text1: "Login Failed",
          text2: "Invalid Credentials",
          position: "top",
          visibilityTime: 10000,
          autoHide: true,
          topOffset: 50,
          bottomOffset: 50,
        });
      }
    },
    onError: (error) => {
      console.log("failed to login", error);
      Toast.show({
        type: "error",
        text1: "Login Failed",
        text2: "Probably server error",
        position: "top",
        visibilityTime: 10000,
        autoHide: true,
        topOffset: 50,
        bottomOffset: 50,
      });
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      queryClient.setQueryData(authQueryKeys.user, null);
      queryClient.setQueryData(authQueryKeys.isAuthenticated, false);
      queryClient.invalidateQueries();
      Toast.show({
        type: "success",
        text1: "Logged out Successfully",
        position: "top",
        visibilityTime: 10000,
        autoHide: true,
        topOffset: 50,
        bottomOffset: 50,
      });
      router.push("/(auth)/login");
    },
    onError: () => {
      Toast.show({
        type: "error",
        text1: "Error Logging Out",
        position: "top",
        visibilityTime: 10000,
        autoHide: true,
        topOffset: 50,
        bottomOffset: 50,
      });
    },
  });
}

export function useChangePassword() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (changePasswordData: {
      username: string;
      oldPassword: string;
      newPassword: string;
      instance?: string;
    }) => authService.changePassword(changePasswordData),
    onSuccess: (data) => {
      if (data.success) {
        // Optionally refresh user data if needed
        queryClient.invalidateQueries({ queryKey: authQueryKeys.user });
      }
    },
  });
}

// Combined hook for auth actions and state
export function useAuth() {
  const { data: isAuthenticated, isLoading: isAuthenticating } =
    useAuthStatus();
  const { data: user } = useUserData();
  const { mutate: login, isPending: isLoggingIn } = useLogin();
  const { mutate: logout, isPending: isLoggingOut } = useLogout();
  const {
    mutate: changePassword,
    isPending: isChangingPassword,
    error: changePasswordError,
    data: changePasswordResult,
  } = useChangePassword();

  const queryClient = useQueryClient();

  // Sync AsyncStorage data with React Query cache
  const syncStoredData = useCallback(async () => {
    try {
      const storedUserData = await authService.getUserData();
      if (storedUserData && !user) {
        console.log("🔄 Syncing stored user data to React Query cache");
        queryClient.setQueryData(authQueryKeys.user, storedUserData);
        queryClient.setQueryData(authQueryKeys.isAuthenticated, true);
      }
    } catch (error) {
      console.error("Error syncing stored data:", error);
    }
  }, [user, queryClient]);

  // Sync data when component mounts
  useEffect(() => {
    syncStoredData();
  }, [syncStoredData]);

  const loginHandler = useCallback(
    (credentials: LoginCredentials) => {
      login(credentials);
    },
    [login]
  );

  const logoutHandler = useCallback(() => {
    logout();
  }, [logout]);

  const changePasswordHandler = useCallback(
    (data: { username: string; oldPassword: string; newPassword: string; instance?: string }) => {
      changePassword(data);
    },
    [changePassword]
  );

  return {
    isAuthenticated: !!isAuthenticated,
    isAuthenticating,
    user,
    login: loginHandler,
    logout: logoutHandler,
    changePassword: changePasswordHandler,
    isLoggingIn,
    isLoggingOut,
    isChangingPassword,
    changePasswordError,
    changePasswordResult,
    syncStoredData,
  };
}
