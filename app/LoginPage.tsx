import {
  Image,
  Pressable,
  SafeAreaView,
  Text,
  TextInput,
  View,
  Dimensions,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useEffect, useState } from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useRouter } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { Colors } from "@/common/styles";

const { width, height } = Dimensions.get("window");

export default function LoginPage() {
  const [username, setUsername] = useState("praveen@suiteworkstech.co");
  const [password, setPassword] = useState("123456");
  const [errors, setErrors] = useState<{
    username?: string;
    password?: string;
  }>({});
  const [showPassword, setShowPassword] = useState(false);

  const { isAuthenticated, isAuthenticating, login, isLoggingIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated && !isAuthenticating) {
      const timeout = setTimeout(() => {
        router.push("/dashboard");
      }, 0);
      return () => clearTimeout(timeout);
    }
  }, [isAuthenticated, isAuthenticating]);

  const validate = (): boolean => {
    const newErrors: { username?: string; password?: string } = {};
    if (!username) newErrors.username = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(username))
      newErrors.username = "Enter a valid email";

    if (!password) newErrors.password = "Password is required";
    else if (password.length < 6)
      newErrors.password = "Password must be at least 6 characters";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSubmit = async () => {
    if (!validate()) return;

    try {
      await login({ username, password });
      console.log("Submitted:", { username, password });
    } catch (error) {
      console.error("Login error:", error);
      Alert.alert(
        "Error",
        "Failed to log in. Please check your credentials and try again."
      );
    }
  };

  const toggleShowPassword = () => setShowPassword((prev) => !prev);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
      >
        <StatusBar barStyle="dark-content" backgroundColor="white" />
        <ScrollView
          contentContainerStyle={styles.scrollViewContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.logoContainer}>
            <Image
              source={require("@/assets/images/splash-icon.png")}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>

          <View style={styles.contentContainer}>
            <View style={styles.profileImageContainer}>
              <Image
                source={require("@/assets/images/technician1.jpeg")}
                style={styles.profileImage}
                resizeMode="cover"
              />
            </View>

            <View style={styles.headerContainer}>
              <Text style={styles.welcomeText}>Welcome to </Text>
              <Text style={styles.headerText}>SuiteWorks Tech</Text>
              <Text style={styles.headerText}>Field Service App</Text>
            </View>

            <View style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={styles.fieldLabel}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholderTextColor={Colors.disabledButton}
                  placeholder="Enter Your Email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={username}
                  onChangeText={(text) => setUsername(text)}
                />
                {errors.username && (
                  <Text style={styles.errorText}>{errors.username}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.fieldLabel}>Password</Text>
                <View style={styles.passwordInputContainer}>
                  <TextInput
                    style={[styles.input, styles.passwordInput]}
                    placeholder="Enter Your Password"
                    placeholderTextColor={Colors.disabledButton}
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={(text) => setPassword(text)}
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={toggleShowPassword}
                  >
                    <Ionicons
                      name={showPassword ? "eye-off" : "eye"}
                      size={24}
                      color={Colors.primarkDark}
                    />
                  </TouchableOpacity>
                </View>
                {errors.password && (
                  <Text style={styles.errorText}>{errors.password}</Text>
                )}
              </View>

              <View style={styles.forgotPasswordContainer}>
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </View>

              <Pressable
                style={[
                  styles.loginButton,
                  (isLoggingIn || isAuthenticating) && styles.disabledButton,
                ]}
                onPress={onSubmit}
                disabled={isLoggingIn || isAuthenticating}
                android_ripple={{ color: Colors.primarkDark }}
              >
                <Text style={styles.loginButtonText}>
                  {isLoggingIn ? "LOGGING IN..." : "LOGIN"}
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    width: "100%",
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  logoContainer: {
    height: height * 0.13,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 15,
  },
  logoImage: {
    width: width * 0.8,
    height: 70,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  profileImageContainer: {
    alignItems: "center",
    marginTop: 10,
  },
  profileImage: {
    width: width * 0.48,
    height: width * 0.48,
    borderRadius: (width * 0.48) / 2,
  },
  headerContainer: {
    paddingHorizontal: 20,
    marginTop: 15,
    marginBottom: 10,
  },
  welcomeText: {
    color: Colors.darkBackground,
    fontWeight: "600",
    fontSize: 18,
    fontFamily: "Roboto",
  },
  headerText: {
    color: Colors.primary,
    fontWeight: "bold",
    fontSize: 24,
    fontFamily: "Roboto",
    lineHeight: 30,
  },
  formContainer: {
    padding: 20,
    gap: 20,
    borderWidth: 1,
    marginHorizontal: 10,
    borderRadius: 14,
    borderColor: Colors.primarkDark,
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.57,
    shadowRadius: 4.65,
    elevation: 6,
  },
  inputGroup: {
    gap: 6,
  },
  fieldLabel: {
    color: Colors.darkBackground,
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 2,
  },
  input: {
    borderWidth: 1,
    padding: 12,
    borderRadius: 8,
    borderColor: Colors.primarkDark,
    fontSize: 16,
  },
  passwordInputContainer: {
    position: "relative",
  },
  passwordInput: {
    paddingRight: 40, // Make space for the eye icon
  },
  eyeIcon: {
    position: "absolute",
    right: 10,
    top: 10,
  },
  forgotPasswordContainer: {
    alignItems: "flex-end",
    marginTop: -5,
  },
  forgotPasswordText: {
    color: Colors.darkBackground,
    fontWeight: "500",
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    marginTop: 10,
  },
  disabledButton: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    marginTop: 10,
  },
  loginButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  errorText: {
    color: "red",
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
});

//   const config = {
//     accountId: "11218546-SB1",
//     consumerKey:
//       "7cec6a5cc0af6bf9c3d9047d85f5fa4e766b7dd0bac50c733b546c3858daaf86",
//     consumerSecret:
//       "abdb028210df5cb462f99994609226ea9c26fe030ff6be23ca588e9b0e9b55ae",
//     tokenId: "2110450615de9d684bff3216a4de453b2e044cb314dec331175e62bbb8d9c8a7",
//     tokenSecret:
//       "7135bafff50d79f54dc1eb6994b4ca4b20dd356133ff60b1496ce10d52450e82",
//     scriptId: "14",
//     deployId: "1",
//     realm: "11218546_SB1",
//   };
