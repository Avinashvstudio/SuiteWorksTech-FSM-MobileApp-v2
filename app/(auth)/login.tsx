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
import { Dropdown } from "react-native-element-dropdown";

const { width, height } = Dimensions.get("window");

export default function Login() {
  const [username, setUsername] = useState("praveen@suiteworkstech.co");
  const [password, setPassword] = useState("123456");
  const [selectedInstance, setSelectedInstance] = useState("PROD");
  const [errors, setErrors] = useState<{
    username?: string;
    password?: string;
    instance?: string;
  }>({});
  const [showPassword, setShowPassword] = useState(false);

  const { isAuthenticated, isAuthenticating, login, isLoggingIn } = useAuth();
  const router = useRouter();

  const instances = [
    { label: "PROD", value: "PROD" },
    { label: "SB1", value: "SB1" },
    { label: "SB2", value: "SB2" },
  ];

  useEffect(() => {
    if (isAuthenticated && !isAuthenticating) {
      const timeout = setTimeout(() => {
        router.push("/dashboard");
      }, 0);
      return () => clearTimeout(timeout);
    }
  }, [isAuthenticated, isAuthenticating]);

  const validate = (): boolean => {
    const newErrors: { username?: string; password?: string; instance?: string } = {};
    if (!username) newErrors.username = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(username))
      newErrors.username = "Enter a valid email";

    if (!password) newErrors.password = "Password is required";
    else if (password.length < 6)
      newErrors.password = "Password must be at least 6 characters";

    if (!selectedInstance) newErrors.instance = "Please select an instance";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSubmit = async () => {
    if (!validate()) return;

    try {
      await login({ username, password, instance: selectedInstance });
      console.log("Submitted:", { username, password, instance: selectedInstance });
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

          {/* Technician Profile Image */}
          <View style={styles.profileImageContainer}>
            <Image
              source={require("@/assets/images/technician1.jpeg")}
              style={styles.profileImage}
              resizeMode="cover"
            />
          </View>

          {/* Company Branding Text */}
          <View style={styles.headerContainer}>
            <Text style={styles.welcomeText}>Welcome to </Text>
            <Text style={styles.headerText}>SuiteWorks Tech</Text>
            <Text style={styles.headerText}>Field Service App</Text>
          </View>

          <View style={styles.contentContainer}>
            

            <View style={styles.formContainer}>
              {/* Instance Selection */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Instance</Text>
                <Dropdown
                  style={styles.dropdown}
                  placeholderStyle={styles.placeholderStyle}
                  selectedTextStyle={styles.selectedTextStyle}
                  inputSearchStyle={styles.inputSearchStyle}
                  iconStyle={styles.iconStyle}
                  data={instances}
                  search
                  maxHeight={300}
                  labelField="label"
                  valueField="value"
                  placeholder="Select Instance"
                  searchPlaceholder="Search..."
                  value={selectedInstance}
                  onChange={(item) => {
                    setSelectedInstance(item.value);
                  }}
                  renderLeftIcon={() => (
                    <Ionicons 
                      name="server-outline" 
                      size={20} 
                      color={Colors.secondaryText} 
                      style={styles.dropdownIcon}
                    />
                  )}
                />
                {errors.instance && (
                  <Text style={styles.errorText}>{errors.instance}</Text>
                )}
              </View>

              {/* Username Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your email"
                    value={username}
                    onChangeText={setUsername}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
                {errors.username && (
                  <Text style={styles.errorText}>{errors.username}</Text>
                )}
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={toggleShowPassword}
                  >
                    <Ionicons
                      name={showPassword ? "eye-off" : "eye"}
                      size={24}
                      color={Colors.secondaryText}
                    />
                  </TouchableOpacity>
                </View>
                {errors.password && (
                  <Text style={styles.errorText}>{errors.password}</Text>
                )}
              </View>

              {/* Login Button */}
              <TouchableOpacity
                style={[styles.loginButton, isLoggingIn && styles.loginButtonDisabled]}
                onPress={onSubmit}
                disabled={isLoggingIn}
              >
                {isLoggingIn ? (
                  <Text style={styles.loginButtonText}>Signing In...</Text>
                ) : (
                  <Text style={styles.loginButtonText}>Sign In</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  // Main Logo Container
  logoContainer: {
    height: height * 0.13,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 55,
  },
  logoImage: {
    width: width * 0.8,
    height: 70,
  },
  
  // Profile Image Container
  profileImageContainer: {
    alignItems: "center",
    marginTop: 10,
  },
  profileImage: {
    width: width * 0.48,
    height: width * 0.48,
    borderRadius: (width * 0.48) / 2,
  },
  
  // Header Text Container
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
  contentContainer: {
    flex: 1,
    justifyContent: "flex-start",
    marginTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: Colors.primary,
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.secondaryText,
    textAlign: "center",
    marginBottom: 32,
  },
  formContainer: {
    gap: 20,
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.primaryText,
  },
  inputWrapper: {
    position: "relative",
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.borderColor,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    backgroundColor: "white",
  },
  eyeIcon: {
    position: "absolute",
    right: 16,
    top: 16,
  },
  dropdown: {
    borderWidth: 1,
    borderColor: Colors.borderColor,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    backgroundColor: "white",
  },
  placeholderStyle: {
    fontSize: 16,
    color: Colors.secondaryText,
  },
  selectedTextStyle: {
    fontSize: 16,
    color: Colors.primaryText,
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 16,
  },
  iconStyle: {
    width: 20,
    height: 20,
  },
  dropdownIcon: {
    marginRight: 8,
  },

  errorText: {
    color: "red",
    fontSize: 14,
    marginTop: 4,
  },
  loginButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
});

