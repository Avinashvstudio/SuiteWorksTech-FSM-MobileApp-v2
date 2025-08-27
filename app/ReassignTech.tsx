import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from "react-native";
import { Dropdown } from "react-native-element-dropdown";
import { DatePickerInput } from "react-native-paper-dates";
import { Provider as PaperProvider } from "react-native-paper";
import { CalenderTheme, Colors } from "@/common/styles";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useDropdownData } from "@/hooks/useDropDownList";
import { useJobSchedule } from "@/hooks/useJobSchedule";
import { Controller, useForm } from "react-hook-form";
import Toast from "react-native-toast-message";

const ReassignTech = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const jobData = route.params.scheduleData || {};

  const { reassignTech, isReassigning } = useJobSchedule();
  const technicians: any = useDropdownData("getEmployees");

  const dropdownData = {
    technicians: (Array.isArray(technicians.items)
      ? technicians.items
      : []
    ).map((item) => ({
      label: item.label,
      value: item.value,
    })),
  };

  const assignedTechnicianId = jobData["Assigned Technician"];

  const technician = technicians?.items.find(
    (t) => t.id === assignedTechnicianId
  );

  const internalId = technician?.value;

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      reassignmentDate: new Date(),
      newTechnician: "",
      reasonForReassignment: "",
      specialNotes: "",
    },
  });

  const onSubmit = (data) => {
    console.log("data", data);
    const reassignData = {
      currentTechnician: internalId || "",
      jobId: jobData["Internal ID"] || "",
      reassignmentDate: formatDate(data.reassignmentDate),
      newTechnician: data.newTechnician,
      reasonForReassignment: data.reasonForReassignment,
      specialNotes: data.specialNotes,
    };

    console.log("Reassign Tech Data:", JSON.stringify(reassignData, null, 2));

    reassignTech(reassignData, {
      onSuccess: (data: any) => {
        if (data.success === true) {
          Toast.show({
            type: "success",
            text1: "Technician Reassigned successfully",
            position: "top",
            visibilityTime: 10000,
            autoHide: true,
            topOffset: 50,
            bottomOffset: 50,
          });
        } else {
          Toast.show({
            type: "error",
            text1: "Error",
            text2: data.message,
            position: "top",
            visibilityTime: 10000,
            autoHide: true,
            topOffset: 50,
            bottomOffset: 50,
          });
        }

        navigation.goBack();
        console.log("first", data);
      },
      onError: (error) => {
        Toast.show({
          type: "error",
          text1: "Failed to reassign technician",
          position: "top",
          visibilityTime: 10000,
          autoHide: true,
          topOffset: 50,
          bottomOffset: 50,
        });
        console.log(error);
      },
    });
  };

  const formatDate = (date) => {
    if (!date) return "";
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const handleGoBack = () => navigation.goBack();

  return (
    <PaperProvider>
      <StatusBar style="light" />
      <View style={styles.headerContainer}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={handleGoBack}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.header}>Reassign Technician</Text>
        </View>
      </View>

      <ScrollView style={styles.container}>
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>JOB ID</Text>
          <View style={styles.disabledInput}>
            <Text>{`${jobData["Equipment Maintenance Job Order #"] || ""} (${
              jobData["Document Number"] || ""
            })`}</Text>
          </View>
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>CURRENT TECHNICIAN</Text>
          <View style={styles.disabledInput}>
            <Text>{jobData["Assigned Technician"] || ""}</Text>
          </View>
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>
            DATE OF REASSIGNMENT <Text style={styles.required}>*</Text>
          </Text>
          <Controller
            name="reassignmentDate"
            control={control}
            rules={{ required: "Reassignment date is required" }}
            render={({ field: { onChange, value } }) => (
              <PaperProvider theme={CalenderTheme}>
                <DatePickerInput
                  style={styles.dateInput}
                  value={value}
                  onChange={onChange}
                  inputMode="start"
                  locale="en"
                  presentationStyle="pageSheet"
                  saveLabel="Confirm Date"
                />
              </PaperProvider>
            )}
          />
          {errors.reassignmentDate && (
            <Text style={styles.errorText}>
              {errors.reassignmentDate.message}
            </Text>
          )}
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>
            ASSIGN NEW TECHNICIAN <Text style={styles.required}>*</Text>
          </Text>
          <Controller
            name="newTechnician"
            control={control}
            rules={{ required: "New technician is required" }}
            render={({ field: { onChange, value } }) => (
              <Dropdown
                style={styles.dropdown}
                placeholderStyle={styles.placeholderText}
                selectedTextStyle={styles.selectedText}
                data={dropdownData.technicians}
                maxHeight={200}
                labelField="label"
                valueField="value"
                placeholder="Select technician"
                value={value}
                onChange={(item) => onChange(item.value)}
              />
            )}
          />
          {errors.newTechnician && (
            <Text style={styles.errorText}>{errors.newTechnician.message}</Text>
          )}
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>
            REASON FOR REASSIGNMENT <Text style={styles.required}>*</Text>
          </Text>
          <Controller
            name="reasonForReassignment"
            control={control}
            rules={{ required: "Reason for reassignment is required" }}
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={styles.textArea}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                value={value}
                onChangeText={onChange}
                placeholder="Enter reason for reassignment"
                placeholderTextColor="#ccc"
              />
            )}
          />
          {errors.reasonForReassignment && (
            <Text style={styles.errorText}>
              {errors.reasonForReassignment.message}
            </Text>
          )}
        </View>

        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>SPECIAL NOTES / INSTRUCTIONS</Text>
          <Controller
            name="specialNotes"
            control={control}
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={styles.textArea}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                value={value}
                onChangeText={onChange}
                placeholder="Enter special notes or instructions"
                placeholderTextColor="#ccc"
              />
            )}
          />
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.cancelButton} onPress={handleGoBack}>
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.submitButton,
              isReassigning && styles.disabledButton,
            ]}
            onPress={handleSubmit(onSubmit)}
            disabled={isReassigning}
          >
            <Text style={styles.buttonText}>
              {isReassigning ? "Submitting..." : "Submit"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </PaperProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f5f5f5",
  },
  headerContainer: {
    backgroundColor: Colors.primary,
    paddingTop: 25,
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 6,
    gap: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  required: {
    color: "red",
  },
  errorText: {
    color: "red",
    fontSize: 12,
    marginTop: 4,
  },
  dropdown: {
    height: 50,
    borderColor: "#cccccc",
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 8,
    backgroundColor: "white",
  },
  placeholderText: {
    color: "#999",
  },
  selectedText: {
    color: "#333",
  },
  dateInput: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#cccccc",
    borderRadius: 4,
  },
  disabledInput: {
    backgroundColor: "#f0f0f0",
    borderWidth: 1,
    borderColor: "#cccccc",
    borderRadius: 4,
    padding: 12,
    height: 50,
    justifyContent: "center",
  },
  textArea: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#cccccc",
    borderRadius: 4,
    padding: 8,
    height: 120,
    textAlignVertical: "top",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
    marginBottom: 24,
  },
  cancelButton: {
    backgroundColor: "#6c757d",
    padding: 12,
    borderRadius: 4,
    alignItems: "center",
    flex: 1,
    marginRight: 8,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    padding: 12,
    borderRadius: 4,
    alignItems: "center",
    flex: 1,
    marginLeft: 8,
  },
  disabledButton: {
    opacity: 0.7,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
});

export default ReassignTech;
