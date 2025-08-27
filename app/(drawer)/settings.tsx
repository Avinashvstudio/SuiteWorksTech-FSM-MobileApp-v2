import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useForm, Controller } from "react-hook-form";

import { useMutation } from "@tanstack/react-query";
import { authService } from "@/services/authService";
import { Colors } from "@/common/styles";
import { router, useNavigation } from "expo-router";

type FormData = {
  username: string;
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export const ChangePasswordScreen = () => {
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const navigation = useNavigation();
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    getValues,
    setValue,
  } = useForm<FormData>({
    defaultValues: {
      username: "",
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // useEffect(() => {
  //   if (!authService.isAuthenticated) {
  //     router.push("/login");
  //   }
  // }, []);

  // Load the user's email when component mounts
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userData = await authService.getUserData();
        if (userData && userData.username) {
          setValue("username", userData.username);
        }
      } catch (error) {
        console.error("Error loading user data:", error);
      }
    };

    loadUserData();
  }, [setValue]);

  const changePasswordMutation = useMutation({
    mutationFn: (data: {
      username: string;
      oldPassword: string;
      newPassword: string;
    }) => authService.changePassword(data),
    onSuccess: (response) => {
      if (response.success) {
        setSuccessMessage(response.message || "Password changed successfully");
        reset({
          username: getValues("username"),
          oldPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        Alert.alert("Error", response.message || "Failed to change password");
      }
    },
    onError: (error) => {
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "An unexpected error occurred"
      );
    },
  });

  const onSubmit = (data: FormData) => {
    setSuccessMessage(null);

    changePasswordMutation.mutate({
      username: data.username,
      oldPassword: data.oldPassword,
      newPassword: data.newPassword,
    });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.formContainer}>
          <Text style={styles.title}>Change Password</Text>

          {successMessage && (
            <View style={styles.successMessage}>
              <Text style={styles.successText}>{successMessage}</Text>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <Controller
              control={control}
              rules={{
                required: "Email is required",
                pattern: {
                  value: /\S+@\S+\.\S+/,
                  message: "Please enter a valid email",
                },
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles.input, errors.username && styles.inputError]}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  placeholder="Email address"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={false}
                  placeholderTextColor="#ccc"
                />
              )}
              name="username"
            />
            {errors.username && (
              <Text style={styles.errorText}>{errors.username.message}</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Current Password</Text>
            <Controller
              control={control}
              rules={{
                required: "Current password is required",
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[
                    styles.input,
                    errors.oldPassword && styles.inputError,
                  ]}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  placeholder="Current password"
                  secureTextEntry
                  placeholderTextColor="#ccc"
                />
              )}
              name="oldPassword"
            />
            {errors.oldPassword && (
              <Text style={styles.errorText}>{errors.oldPassword.message}</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>New Password</Text>
            <Controller
              control={control}
              rules={{
                required: "New password is required",
                minLength: {
                  value: 6,
                  message: "Password must be at least 6 characters",
                },
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[
                    styles.input,
                    errors.newPassword && styles.inputError,
                  ]}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  placeholder="New password"
                  secureTextEntry
                  placeholderTextColor="#ccc"
                />
              )}
              name="newPassword"
            />
            {errors.newPassword && (
              <Text style={styles.errorText}>{errors.newPassword.message}</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm New Password</Text>
            <Controller
              control={control}
              rules={{
                required: "Please confirm your new password",
                validate: (value) =>
                  value === getValues("newPassword") ||
                  "Passwords do not match",
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[
                    styles.input,
                    errors.confirmPassword && styles.inputError,
                  ]}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  placeholder="Confirm new password"
                  secureTextEntry
                  placeholderTextColor="#ccc"
                />
              )}
              name="confirmPassword"
            />
            {errors.confirmPassword && (
              <Text style={styles.errorText}>
                {errors.confirmPassword.message}
              </Text>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.button,
              changePasswordMutation.isPending && styles.buttonDisabled,
            ]}
            onPress={handleSubmit(onSubmit)}
            disabled={changePasswordMutation.isPending}
          >
            {changePasswordMutation.isPending ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.buttonText}>Change Password</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
  },
  formContainer: {
    margin: 20,
    backgroundColor: "#ffffff",
    borderRadius: 10,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
  },
  inputError: {
    borderColor: "#ff3b30",
  },
  errorText: {
    color: "#ff3b30",
    fontSize: 14,
    marginTop: 5,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 6,
    padding: 14,
    alignItems: "center",
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: Colors.primaryLight,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
  },
  cancelButton: {
    padding: 14,
    alignItems: "center",
    marginTop: 10,
  },
  cancelButtonText: {
    color: Colors.primary,
    fontSize: 16,
  },
  successMessage: {
    backgroundColor: "#d4edda",
    borderColor: "#c3e6cb",
    borderWidth: 1,
    borderRadius: 6,
    padding: 15,
    marginBottom: 20,
  },
  successText: {
    color: "#155724",
    textAlign: "center",
  },
});

export default ChangePasswordScreen;
