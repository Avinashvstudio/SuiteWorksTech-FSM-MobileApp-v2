import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { CalenderTheme, Colors } from "@/common/styles";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Controller, useForm } from "react-hook-form";
import { PaperProvider } from "react-native-paper";
import { DatePickerInput } from "react-native-paper-dates";
import { useRoute } from "@react-navigation/native";
import { useEquipmentUsageLog } from "@/hooks/useEquipmentUsageLog";
import Toast from "react-native-toast-message";

interface FormData {
  usageId: number;
  usageDate: Date;
  utilizedUnits: string;
}

interface EquipmentUsageLogRouteParams {
  data?: any;
}

const equipmentUsageLog = () => {
  const route = useRoute() as { params?: EquipmentUsageLogRouteParams };
  const navigation = useNavigation();
  const { updateEquipUsage } = useEquipmentUsageLog();

  const equipLogDetails = route.params?.data || {};

  console.log("E", equipLogDetails);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    defaultValues: {
      usageId: equipLogDetails.internalid || 0,
      usageDate: new Date(),
      utilizedUnits: "",
    },
  });

  const formatDateForAPI = (date: Date): string => {
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const onSubmit = (data: FormData) => {
    if (!data.usageId) {
      Alert.alert("Error", "Equipment ID is missing");
      return;
    }

    if (!data.utilizedUnits || isNaN(Number(data.utilizedUnits))) {
      Alert.alert("Error", "Please enter a valid number for utilized units");
      return;
    }

    const apiData = {
      type: "addUsageLog" as const,
      usageId: data.usageId,
      units: Number(data.utilizedUnits),
      usageDate: formatDateForAPI(data.usageDate),
    };

    console.log("Submitting usage log:", apiData);

    updateEquipUsage.mutate(apiData, {
      onSuccess: (data: any) => {
        if (data.success === "true" || data.success === true) {
          Toast.show({
            type: "success",
            text1: "Equipment Usage Units Updated successfully",
            position: "top",
            visibilityTime: 10000,
            autoHide: true,
            topOffset: 50,
            bottomOffset: 50,
          });
          reset();

          navigation.goBack();
        } else {
          Toast.show({
            type: "error",
            text1: "Error Updating Equipment Usage Units",
            position: "top",
            visibilityTime: 10000,
            autoHide: true,
            topOffset: 50,
            bottomOffset: 50,
          });
        }
      },
      onError: (error) => {
        Toast.show({
          type: "error",
          text1: "Failed to Update Equip Usage",
          position: "top",
          visibilityTime: 10000,
          autoHide: true,
          topOffset: 50,
          bottomOffset: 50,
        });
        console.log("Error Updating", error);
      },
    });
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" hidden={true} />
      <ScrollView>
        <View style={styles.contentContainer}>
          <View
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "flex-start",
              alignItems: "flex-end",
              padding: 10,
              gap: 16,
              backgroundColor: Colors.primary,
            }}
          >
            <TouchableOpacity
              style={{
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
              }}
              onPress={handleGoBack}
            >
              <Ionicons name="arrow-back" size={24} color="white" />
              <Text style={styles.header}>Enter Usage</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[
              styles.submitButton,
              updateEquipUsage.isPending && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit(onSubmit)}
            disabled={updateEquipUsage.isPending}
          >
            <Text style={styles.submitButtonText}>
              {updateEquipUsage.isPending ? "Submitting..." : "Submit"}
            </Text>
          </TouchableOpacity>

          <View style={styles.formContainer}>
            {/* Display equipment info */}
            {equipLogDetails.Equipment && (
              <View style={styles.infoSection}>
                <Text style={styles.infoLabel}>Equipment:</Text>
                <Text style={styles.infoValue}>
                  {equipLogDetails.Equipment}
                </Text>
              </View>
            )}

            <View style={styles.formRow}>
              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>USAGE DATE *</Text>
                <Controller
                  name="usageDate"
                  control={control}
                  rules={{ required: "Usage date is required" }}
                  render={({ field: { onChange, value } }) => (
                    <PaperProvider theme={CalenderTheme}>
                      <DatePickerInput
                        style={styles.dateInput}
                        value={value}
                        onChange={onChange}
                        inputMode="start"
                        locale="en"
                        presentationStyle="pageSheet"
                      />
                    </PaperProvider>
                  )}
                />
                {errors.usageDate && (
                  <Text style={styles.errorText}>
                    {errors.usageDate.message}
                  </Text>
                )}
              </View>

              <View style={styles.formField}>
                <Text style={styles.fieldLabel}>ENTER UTILIZED UNITS *</Text>
                <Controller
                  name="utilizedUnits"
                  control={control}
                  rules={{
                    required: "Utilized units is required",
                    pattern: {
                      value: /^\d+(\.\d+)?$/,
                      message: "Please enter a valid number",
                    },
                  }}
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      style={styles.textInput}
                      value={value}
                      onChangeText={onChange}
                      placeholder="Enter Utilized Units"
                      placeholderTextColor="#ccc"
                      keyboardType="numeric"
                    />
                  )}
                />
                {errors.utilizedUnits && (
                  <Text style={styles.errorText}>
                    {errors.utilizedUnits.message}
                  </Text>
                )}
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    fontSize: 20,
    padding: 12,
    fontWeight: "bold",
    marginLeft: 12,
    color: "white",
  },
  contentContainer: {},
  headerTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: Colors.primary,
    marginBottom: 15,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 4,
    alignSelf: "flex-start",
    marginVertical: 15,
    margin: 16,
  },
  submitButtonDisabled: {
    backgroundColor: "#ccc",
  },
  submitButtonText: {
    color: "#fff",
    fontWeight: "500",
    fontSize: 16,
  },
  formContainer: {
    padding: 16,
  },
  infoSection: {
    marginBottom: 20,
    padding: 12,
    backgroundColor: "#f8f9fa",
    borderRadius: 4,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4a5568",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: "#2d3748",
  },
  formRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },
  formField: {
    width: "48%",
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 14,
    color: "#4a5568",
    marginBottom: 8,
    fontWeight: "500",
  },
  dateInput: {
    height: 50,
    borderWidth: 1,
    borderColor: "#cbd5e0",
    borderRadius: 4,
    paddingHorizontal: 10,
    justifyContent: "center",
  },
  textInput: {
    height: 50,
    borderWidth: 1,
    borderColor: "#cbd5e0",
    borderRadius: 4,
    paddingHorizontal: 10,
  },
  errorText: {
    color: "#e53e3e",
    fontSize: 12,
    marginTop: 4,
  },
});

export default equipmentUsageLog;
