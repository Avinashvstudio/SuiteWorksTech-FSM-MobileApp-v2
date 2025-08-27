import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Dropdown, MultiSelect } from "react-native-element-dropdown";
import { DatePickerInput } from "react-native-paper-dates";
import { Provider as PaperProvider } from "react-native-paper";
import Checkbox from "expo-checkbox";
import { CalenderTheme, Colors } from "@/common/styles";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useDropdownData } from "@/hooks/useDropDownList";
import { TimePickerModal } from "react-native-paper-dates";
import { Controller, useForm } from "react-hook-form";
import { useJobSchedule } from "@/hooks/useJobSchedule";
import * as ImagePicker from "expo-image-picker";
import { Image } from "react-native";
import Toast from "react-native-toast-message";
import { usePerformJobDetails } from "@/hooks/usePerformJobDetails";
import { useLocation } from "@/hooks/useLocation";
import { JobLocation, JobLocationData } from "@/types";
// import * as Manipulator from "expo-image-manipulator";
import * as ImageManipulator from "expo-image-manipulator";

export default function PerformJob() {
  const [jobDetailsExpanded, setJobDetailsExpanded] = useState(true);
  const [techHoursExpanded, setTechHoursExpanded] = useState(true);
  const [chargeCustomer, setChargeCustomer] = useState(false);
  const [generatePO, setGeneratePO] = useState(false);
  const [isStartTimePickerVisible, setStartTimePickerVisible] = useState(false);
  const [isEndTimePickerVisible, setEndTimePickerVisible] = useState(false);
  const [imagesBase64, setImagesBase64] = useState<string[]>([]);
  
  // Location tracking states
  const [startLocation, setStartLocation] = useState<JobLocation | null>(null);
  const [endLocation, setEndLocation] = useState<JobLocation | null>(null);
  const [isLocationCaptured, setIsLocationCaptured] = useState(false);
  const [isCapturingEndLocation, setIsCapturingEndLocation] = useState(false);

  const navigation = useNavigation();
  const route: any = useRoute();
  const jobData = route.params.scheduleData || {};

  const { performJobDetails } = usePerformJobDetails(jobData["Internal ID"]);
  const { getCurrentLocation, locationPermission, isLocationEnabled } = useLocation();

  console.log("per", performJobDetails);
  console.log("pere", jobData["Internal ID"]);

  const maintenanceJobStatus = useDropdownData(
    "getlist_Maintenance Job Status"
  );
  const technicians = useDropdownData("getEmployees");
  const equipment = useDropdownData("getItems");
  const technicianType = useDropdownData("getlist_Technician Type");
  const vendors = useDropdownData("getVendors");
  const { performJob, isPerforming } = useJobSchedule();

  console.log("ven", vendors);

  const dropdownData = {
    maintenanceJobStatus: (Array.isArray(maintenanceJobStatus.items)
      ? maintenanceJobStatus.items
      : []
    ).map((item) => ({
      label: item.label,
      value: item.value,
    })),
    technicians: (Array.isArray(technicians.items)
      ? technicians.items
      : []
    ).map((item) => ({
      label: item.label,
      value: item.value,
    })),
    equipment: (Array.isArray(equipment.items) ? equipment.items : []).map(
      (item) => ({
        label: item.label,
        value: item.value,
      })
    ),
    vendors: (Array.isArray(vendors.items) ? vendors.items : []).map(
      (item) => ({
        label: item.label,
        value: item.value,
      })
    ),
  };

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      maintenanceCompletionDate: new Date(),
      maintenanceJobStatus: jobData["Overall Job Status"] || "Not Started",
      dayOfWork: new Date(),
      startTime: { hours: 0, minutes: 0 },
      endTime: { hours: 0, minutes: 0 },
      supportTechnicians: [],
      itemsUsed: [],
      technicianComments: "",
      customerCharge: "",
      vendor: "",
      expenseIncurred: "",
      photo: "",
      photoName: `${jobData["Internal ID"]}`,
    },
  });

  const jobStatus = watch("maintenanceJobStatus");
  const MAX_PHOTOS = 5;

  // Watch for job status changes to capture start location
  useEffect(() => {
    // Check both string and numeric values for job status
    if ((jobStatus === "Started" || jobStatus === 2) && !startLocation) {
      captureStartLocation();
    }
  }, [jobStatus, startLocation]);

  // Capture start location when job status changes to "Started"
  const captureStartLocation = async () => {
    try {
      console.log("Attempting to capture start location...");
      const location = await getCurrentLocation();
      if (location) {
        setStartLocation(location);
        setIsLocationCaptured(true);
        console.log("Start location captured successfully:", location);
        Toast.show({
          type: "success",
          text1: "Start location captured",
          text2: `Lat: ${location.latitude.toFixed(6)}, Lng: ${location.longitude.toFixed(6)}`,
          position: "top",
          visibilityTime: 3000,
        });
      } else {
        console.log("Failed to capture start location - no location returned");
        Alert.alert(
          "Location Capture Failed", 
          "Unable to capture your current location. Please ensure location services are enabled and try again."
        );
      }
    } catch (error) {
      console.error("Error capturing start location:", error);
      Alert.alert(
        "Location Error", 
        "Failed to capture start location. Please check your location settings and try again."
      );
    }
  };

  // Capture end location when submitting
  const captureEndLocation = async (): Promise<JobLocation | null> => {
    try {
      setIsCapturingEndLocation(true);
      console.log("Attempting to capture end location...");
      const location = await getCurrentLocation();
      if (location) {
        setEndLocation(location);
        console.log("End location captured successfully:", location);
        Toast.show({
          type: "success",
          text1: "End location captured",
          text2: `Lat: ${location.latitude.toFixed(6)}, Lng: ${location.longitude.toFixed(6)}`,
          position: "top",
          visibilityTime: 3000,
        });
        setIsCapturingEndLocation(false);
        return location; // Return the actual location object
      } else {
        console.log("Failed to capture end location - no location returned");
        setIsCapturingEndLocation(false);
        return null;
      }
    } catch (error) {
      console.error("Error capturing end location:", error);
      setIsCapturingEndLocation(false);
      return null;
    }
  };

  const handleAddImage = async (fromCamera = false) => {
    const getPermissions = fromCamera
      ? ImagePicker.requestCameraPermissionsAsync
      : ImagePicker.requestMediaLibraryPermissionsAsync;

    const { status } = await getPermissions();
    if (status !== "granted") {
      Alert.alert("Permission denied");
      return;
    }

    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ base64: false, quality: 0.7 })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          base64: false,
          quality: 0.7,
          allowsMultipleSelection: true,
        });

    if (result.canceled || !result.assets?.length) return;

    try {
      const newBase64sPromises = result.assets.map(async (asset) => {
        const manipResult = await ImageManipulator.manipulateAsync(
          asset.uri,
          [{ resize: { width: 800 } }],
          {
            compress: 0.5,
            format: ImageManipulator.SaveFormat.JPEG,
            base64: true,
          }
        );

        const approxSizeKB = manipResult.base64
          ? (manipResult.base64.length * 0.00075).toFixed(2)
          : "0";
        console.log(`Compressed Base64 size (approx KB): ${approxSizeKB}`);

        return manipResult.base64 ?? "";
      });

      const newBase64s = await Promise.all(newBase64sPromises);

      const combined = [...imagesBase64, ...newBase64s];

      if (combined.length > MAX_PHOTOS) {
        Alert.alert("Limit reached", `Only ${MAX_PHOTOS} photos allowed.`);
        setImagesBase64(combined.slice(0, MAX_PHOTOS));
      } else {
        setImagesBase64(combined);
      }
    } catch (error) {
      console.error("Error manipulating images:", error);
      Alert.alert("Error", "Failed to process some images.");
    }
  };

  // const pickImageFromLibrary = async () => {
  //   const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  //   if (status !== "granted") {
  //     Alert.alert("Permission denied", "Media library access is required.");
  //     return;
  //   }

  //   const result = await ImagePicker.launchImageLibraryAsync({
  //     mediaTypes: ImagePicker.MediaTypeOptions.Images,
  //     base64: false,
  //     quality: 0.7,
  //     allowsEditing: false,
  //   });

  //   if (!result.canceled && result.assets?.[0]?.uri) {
  //     try {
  //       const manipResult = await ImageManipulator.manipulateAsync(
  //         result.assets[0].uri,
  //         [{ resize: { width: 800 } }],
  //         {
  //           compress: 0.5,
  //           format: ImageManipulator.SaveFormat.JPEG,
  //           base64: true,
  //         }
  //       );

  //       setImageBase64(manipResult.base64);

  //       const approxSizeKB = (manipResult.base64.length * 0.00075).toFixed(2);
  //       console.log(`Compressed Base64 size (approx KB): ${approxSizeKB}`);
  //     } catch (error) {
  //       console.error("Error manipulating image:", error);
  //       Alert.alert("Error", "Failed to process image.");
  //     }
  //   }
  // };

  // const takePhotoWithCamera = async () => {
  //   const { status } = await ImagePicker.requestCameraPermissionsAsync();
  //   if (status !== "granted") {
  //     Alert.alert("Permission denied", "Camera access is required.");
  //     return;
  //   }

  //   const result = await ImagePicker.launchCameraAsync({
  //     base64: true,
  //     quality: 0.2,
  //   });

  //   if (!result.canceled && result.assets?.[0]?.base64) {
  //     setImageBase64(result.assets[0].base64);
  //   }
  // };

  const removeImage = (index: any) => {
    setImagesBase64((prev) => prev.filter((_, i) => i !== index));
  };

  const techPerform = jobData["Assigned Technician"];

  const techP = technicians?.items.find((t) => t.id === techPerform);

  const techInternalId = techP?.value;

  const techType = jobData["Technician Type"];
  const techT = technicianType?.items.find((t) => t.label === techType);

  const techTypeId = techT?.value;

  console.log("fdsaffdsa", techInternalId, techTypeId);

  const onSubmit = async (data: any) => {
    const formattedStartTime = formatTime(data.startTime);
    const formattedEndTime = formatTime(data.endTime);

    // Always capture end location before submitting
    console.log("About to capture end location...");
    let endLocationCaptured = false;
    const capturedEndLocation = await captureEndLocation();
    endLocationCaptured = !!capturedEndLocation;
    console.log("End location capture result:", endLocationCaptured);
    console.log("Captured end location object:", capturedEndLocation);
    
    if (!endLocationCaptured) {
      Alert.alert(
        "Location Required",
        "Unable to capture your current location. Please check your location settings and try again.",
        [{ text: "OK" }]
      );
      return;
    }
    
    // Update the endLocation state with the captured location
    if (capturedEndLocation && typeof capturedEndLocation === 'object') {
      setEndLocation(capturedEndLocation);
      console.log("Updated endLocation state with:", capturedEndLocation);
    }
    
    // Small delay to ensure state update completes
    await new Promise(resolve => setTimeout(resolve, 100));
    
    console.log("End location captured successfully, proceeding with submission...");

    const performJobData = {
      id: jobData["Internal ID"],
      maintenanceCompletionDate: formatDate(data.maintenanceCompletionDate),
      maintenanceJobStatus: data.maintenanceJobStatus,
      dayOfWork: formatDate(data.dayOfWork),
      startTime: formattedStartTime,
      endTime: formattedEndTime,
      supportTechnicians: data.supportTechnicians,
      itemsUsed: data.itemsUsed,
      technicianComments: data.technicianComments,
      chargeCustomer: chargeCustomer,
      customerCharge: chargeCustomer ? data.customerCharge : "",
      generatePO: generatePO,
      vendor: generatePO ? data.vendor : "",
      expenseIncurred: generatePO ? data.expenseIncurred : "",
      technicianPerformed: techInternalId || "",
      technicianType: techTypeId || "",
      photos: imagesBase64,
      // Include location data in the required format
      startMap: startLocation?.googleMapsUrl || "",
      endMap: capturedEndLocation?.googleMapsUrl || "", // Use the captured location directly
    };
    
    // Verify endMap is set correctly
    console.log("Captured end location object:", capturedEndLocation);
    console.log("Captured end location googleMapsUrl:", capturedEndLocation?.googleMapsUrl);
    console.log("Final endMap value in performJobData:", performJobData.endMap);

    console.log("performed Job", JSON.stringify(performJobData, null, 2));
    console.log("Location data:", {
      startMap: performJobData.startMap,
      endMap: performJobData.endMap,
      startLocation: startLocation,
      endLocation: endLocation
    });
    console.log("End location capture result:", endLocationCaptured);
    console.log("Final endMap value:", performJobData.endMap);

    performJob(performJobData, {
      onSuccess: (data: any) => {
        if (data.status === 200) {
          Toast.show({
            type: "success",
            text1: "Job Performed successfully",
            position: "top",
            visibilityTime: 10000,
            autoHide: true,
            topOffset: 50,
            bottomOffset: 50,
          });
          navigation.goBack();
        } else {
          Toast.show({
            type: "error",
            text1: "Error Performing Job",
            position: "top",
            visibilityTime: 10000,
            autoHide: true,
            topOffset: 50,
            bottomOffset: 50,
          });
        }
      },
      onError: (error) => {
        Alert.alert("Error", `Failed to perform job: ${error.message}`);
        Toast.show({
          type: "error",
          text1: "Failed to perform job",
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

  const formatTime = (timeObj: any) => {
    if (!timeObj) return "";
    const { hours, minutes } = timeObj;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )}`;
  };

  const formatDate = (date: any) => {
    if (!date) return "";
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const toggleJobDetails = () => setJobDetailsExpanded(!jobDetailsExpanded);
  const toggleTechHours = () => setTechHoursExpanded(!techHoursExpanded);

  const onDismissStartTime = () => setStartTimePickerVisible(false);
  const onDismissEndTime = () => setEndTimePickerVisible(false);

  const onConfirmStartTime = ({
    hours,
    minutes,
  }: {
    hours: number;
    minutes: number;
  }) => {
    setValue("startTime", { hours, minutes });
    setStartTimePickerVisible(false);
  };

  const onConfirmEndTime = ({
    hours,
    minutes,
  }: {
    hours: number;
    minutes: number;
  }) => {
    setValue("endTime", { hours, minutes });
    setEndTimePickerVisible(false);
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
          <Text style={styles.header}>Perform Job</Text>
        </View>
      </View>

      <ScrollView style={styles.container}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={toggleJobDetails}
        >
          <View style={styles.sectionHeaderContent}>
            <Text style={styles.sectionHeaderText}>Job Details</Text>
            <Text>{jobDetailsExpanded ? "▼" : "▶"}</Text>
          </View>
        </TouchableOpacity>

        {jobDetailsExpanded && (
          <View style={styles.sectionContent}>
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>SCHEDULED MAINTENANCE DATE</Text>
              <View style={styles.disabledInput}>
                <Text>{performJobDetails.scheduleDate || ""}</Text>
              </View>
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>MAINTENANCE COMPLETION DATE</Text>
              <Controller
                name="maintenanceCompletionDate"
                control={control}
                rules={{ required: "Completion date is required" }}
                render={({ field: { onChange, value } }) => (
                  <PaperProvider theme={CalenderTheme}>
                    <DatePickerInput
                      onChange={onChange}
                      value={value}
                      inputMode="start"
                      locale="en"
                      saveLabel="Confirm Date"
                      style={styles.dateInput}
                      presentationStyle="pageSheet"
                    />
                  </PaperProvider>
                )}
              />
              {errors.maintenanceCompletionDate && (
                <Text style={styles.errorText}>
                  {errors.maintenanceCompletionDate.message}
                </Text>
              )}
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>MAINTENANCE JOB STATUS</Text>
              <Controller
                name="maintenanceJobStatus"
                control={control}
                rules={{ required: "Job status is required" }}
                render={({ field: { onChange, value } }) => (
                  <Dropdown
                    style={styles.dropdown}
                    data={dropdownData.maintenanceJobStatus}
                    labelField="label"
                    valueField="value"
                    placeholder="Select status"
                    value={value}
                    onChange={(item) => onChange(item.value)}
                  />
                )}
              />
              {errors.maintenanceJobStatus && (
                <Text style={styles.errorText}>
                  {typeof errors.maintenanceJobStatus?.message === "string"
                    ? errors.maintenanceJobStatus.message
                    : ""}
                </Text>
              )}
              
              {/* Location Status Indicator */}
              {jobStatus === "Started" && (
                <View style={styles.locationStatusContainer}>
                  <View style={styles.locationStatusRow}>
                    <Ionicons 
                      name={startLocation ? "checkmark-circle" : "location-outline"} 
                      size={20} 
                      color={startLocation ? Colors.primary : "#666"} 
                    />
                    <Text style={styles.locationStatusText}>
                      {startLocation ? "Start location captured" : "Waiting for start location..."}
                    </Text>
                  </View>
                  {startLocation && (
                    <Text style={styles.locationCoordinates}>
                      Lat: {startLocation.latitude.toFixed(6)}, Lng: {startLocation.longitude.toFixed(6)}
                    </Text>
                  )}
                  {!startLocation && (
                    <TouchableOpacity 
                      style={styles.captureLocationButton}
                      onPress={captureStartLocation}
                    >
                      <Ionicons name="location" size={16} color="white" />
                      <Text style={styles.captureLocationButtonText}>Capture Start Location</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>TECHNICIAN TYPE</Text>
              <View style={styles.disabledInput}>
                <Text>{jobData["Technician Type"] || " "}</Text>
              </View>
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>TECHNICIAN PERFORMED</Text>
              <View style={styles.disabledInput}>
                <Text>{jobData["Assigned Technician"] || ""}</Text>
              </View>
            </View>

            {jobStatus === 3 && (
              <View style={styles.conditionalFields}>
                <View style={styles.checkboxField}>
                  <Text style={styles.fieldLabel}>CHARGE CUSTOMER</Text>
                  <Checkbox
                    value={chargeCustomer}
                    onValueChange={setChargeCustomer}
                    color={Colors.primary}
                  />
                </View>

                {chargeCustomer && (
                  <View style={styles.fieldContainer}>
                    <Text style={styles.fieldLabel}>CUSTOMER CHARGE</Text>
                    <Controller
                      name="customerCharge"
                      control={control}
                      rules={
                        chargeCustomer
                          ? { required: "Customer charge is required" }
                          : {}
                      }
                      render={({ field: { onChange, value } }) => (
                        <TextInput
                          style={[styles.textInput]}
                          value={value}
                          onChangeText={onChange}
                          keyboardType="numeric"
                          placeholder="Enter amount"
                          placeholderTextColor="#ccc"
                        />
                      )}
                    />
                    {errors.customerCharge && (
                      <Text style={styles.errorText}>
                        {errors.customerCharge.message}
                      </Text>
                    )}
                  </View>
                )}

                <View style={styles.checkboxField}>
                  <Text style={styles.fieldLabel}>GENERATE PO</Text>
                  <Checkbox
                    value={generatePO}
                    onValueChange={setGeneratePO}
                    color={Colors.primary}
                  />
                </View>

                {generatePO && (
                  <>
                    <View style={styles.fieldContainer}>
                      <Text style={styles.fieldLabel}>VENDOR</Text>

                      <Controller
                        name="vendor"
                        control={control}
                        rules={
                          generatePO ? { required: "Vendor is required" } : {}
                        }
                        render={({ field: { onChange, value } }) => (
                          <Dropdown
                            style={styles.dropdown}
                            data={dropdownData.vendors}
                            labelField="label"
                            valueField="value"
                            placeholder="Select status"
                            value={value}
                            onChange={(item) => onChange(item.value)}
                          />
                        )}
                      />
                      {errors.vendor && (
                        <Text style={styles.errorText}>
                          {errors.vendor.message}
                        </Text>
                      )}
                    </View>

                    <View style={styles.fieldContainer}>
                      <Text style={styles.fieldLabel}>EXPENSE INCURRED</Text>
                      <Controller
                        name="expenseIncurred"
                        control={control}
                        rules={
                          generatePO
                            ? { required: "Expense amount is required" }
                            : {}
                        }
                        render={({ field: { onChange, value } }) => (
                          <TextInput
                            style={styles.textInput}
                            value={value}
                            onChangeText={onChange}
                            keyboardType="numeric"
                            placeholder="Enter expense amount"
                            placeholderTextColor="#ccc"
                          />
                        )}
                      />
                      {errors.expenseIncurred && (
                        <Text style={styles.errorText}>
                          {errors.expenseIncurred.message}
                        </Text>
                      )}
                    </View>
                  </>
                )}
              </View>
            )}
          </View>
        )}

        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={toggleTechHours}
        >
          <View style={styles.sectionHeaderContent}>
            <Text style={styles.sectionHeaderText}>Technician Hours</Text>
            <Text>{techHoursExpanded ? "▼" : "▶"}</Text>
          </View>
        </TouchableOpacity>

        {techHoursExpanded && (
          <View style={styles.sectionContent}>
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>
                DAY OF WORK <Text style={styles.required}>*</Text>
              </Text>
              <Controller
                name="dayOfWork"
                control={control}
                rules={{ required: "Day of work is required" }}
                render={({ field: { onChange, value } }) => (
                  <PaperProvider theme={CalenderTheme}>
                    <DatePickerInput
                      style={styles.dateInput}
                      value={value}
                      onChange={onChange}
                      inputMode="start"
                      saveLabel="Confirm Date"
                      locale="en"
                      presentationStyle="pageSheet"
                    />
                  </PaperProvider>
                )}
              />
              {errors.dayOfWork && (
                <Text style={styles.errorText}>{errors.dayOfWork.message}</Text>
              )}
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>
                START TIME <Text style={styles.required}>*</Text>
              </Text>
              <Controller
                name="startTime"
                control={control}
                rules={{ required: "Start time is required" }}
                render={({ field: { value } }) => (
                  <TouchableOpacity
                    style={styles.timeInput}
                    onPress={() => setStartTimePickerVisible(true)}
                  >
                    <Text>
                      {value
                        ? `${String(value.hours).padStart(2, "0")}:${String(
                            value.minutes
                          ).padStart(2, "0")}`
                        : "Select start time"}
                    </Text>
                  </TouchableOpacity>
                )}
              />
              {errors.startTime && (
                <Text style={styles.errorText}>{errors.startTime.message}</Text>
              )}
              <PaperProvider theme={CalenderTheme}>
                <TimePickerModal
                  visible={isStartTimePickerVisible}
                  onDismiss={onDismissStartTime}
                  onConfirm={onConfirmStartTime}
                  hours={watch("startTime")?.hours || 9}
                  minutes={watch("startTime")?.minutes || 0}
                  use24HourClock
                />
              </PaperProvider>
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>
                END TIME <Text style={styles.required}>*</Text>
              </Text>
              <Controller
                name="endTime"
                control={control}
                rules={{ required: "End time is required" }}
                render={({ field: { value } }) => (
                  <TouchableOpacity
                    style={styles.timeInput}
                    onPress={() => setEndTimePickerVisible(true)}
                  >
                    <Text>
                      {value
                        ? `${String(value.hours).padStart(2, "0")}:${String(
                            value.minutes
                          ).padStart(2, "0")}`
                        : "Select end time"}
                    </Text>
                  </TouchableOpacity>
                )}
              />
              {errors.endTime && (
                <Text style={styles.errorText}>{errors.endTime.message}</Text>
              )}
              <PaperProvider theme={CalenderTheme}>
                <TimePickerModal
                  visible={isEndTimePickerVisible}
                  onDismiss={onDismissEndTime}
                  onConfirm={onConfirmEndTime}
                  hours={watch("endTime")?.hours || 17}
                  minutes={watch("endTime")?.minutes || 0}
                  use24HourClock
                />
              </PaperProvider>
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>SUPPORT TECHNICIANS</Text>
              <Controller
                name="supportTechnicians"
                control={control}
                render={({ field: { onChange, value } }) => (
                  <MultiSelect
                    style={styles.dropdown}
                    placeholderStyle={styles.placeholderStyle}
                    selectedTextStyle={styles.selectedTextStyle}
                    inputSearchStyle={styles.inputSearchStyle}
                    iconStyle={styles.iconStyle}
                    data={dropdownData.technicians}
                    labelField="label"
                    valueField="value"
                    placeholder="Select technicians"
                    value={value}
                    search
                    searchPlaceholder="Search..."
                    onChange={onChange}
                    maxHeight={200}
                  />
                )}
              />
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>ITEMS USED</Text>
              <Controller
                name="itemsUsed"
                control={control}
                render={({ field: { onChange, value } }) => (
                  <MultiSelect
                    style={styles.dropdown}
                    placeholderStyle={styles.placeholderStyle}
                    selectedTextStyle={styles.selectedTextStyle}
                    inputSearchStyle={styles.inputSearchStyle}
                    iconStyle={styles.iconStyle}
                    data={dropdownData.equipment}
                    labelField="label"
                    valueField="value"
                    placeholder="Select items"
                    value={value}
                    search
                    searchPlaceholder="Search..."
                    onChange={onChange}
                    maxHeight={200}
                  />
                )}
              />
            </View>

            <View style={{ flexDirection: "row", gap: 10, marginBottom: 10 }}>
              {imagesBase64.length < MAX_PHOTOS && (
                <>
                  <TouchableOpacity
                    onPress={() => handleAddImage(false)}
                    style={styles.button}
                  >
                    <Text style={styles.buttonText}>Pick from Gallery</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleAddImage(true)}
                    style={styles.button}
                  >
                    <Text style={styles.buttonText}>Take Photo</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>

            <View style={styles.imageGrid}>
              {imagesBase64.map((base64, index) => (
                <View key={index} style={styles.imageWrapper}>
                  <Image
                    source={{ uri: `data:image/jpeg;base64,${base64}` }}
                    style={styles.imageThumb}
                  />
                  <TouchableOpacity
                    style={styles.removeIcon}
                    onPress={() => removeImage(index)}
                  >
                    <Ionicons name="close-circle" size={24} color="red" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>TECHNICIAN COMMENTS</Text>
              <Controller
                name="technicianComments"
                control={control}
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={[styles.textInput, styles.textArea]}
                    value={value}
                    onChangeText={onChange}
                    multiline
                    numberOfLines={4}
                    placeholder="Enter comments"
                    placeholderTextColor="#ccc"
                  />
                )}
              />
            </View>
          </View>
        )}

        {/* Location Summary Section */}
        {(startLocation || endLocation) && (
          <View style={styles.locationSummaryContainer}>
            <Text style={styles.locationSummaryTitle}>Location Information</Text>
            
            {startLocation && (
              <View style={styles.locationItem}>
                <View style={styles.locationItemHeader}>
                  <Ionicons name="play-circle" size={20} color={Colors.primary} />
                  <Text style={styles.locationItemTitle}>Start Location</Text>
                </View>
                <Text style={styles.locationItemCoordinates}>
                  Lat: {startLocation.latitude.toFixed(6)}, Lng: {startLocation.longitude.toFixed(6)}
                </Text>
                <Text style={styles.locationItemTime}>
                  Captured: {new Date(startLocation.timestamp).toLocaleTimeString()}
                </Text>
              </View>
            )}
            
            {isCapturingEndLocation && (
              <View style={styles.locationItem}>
                <View style={styles.locationItemHeader}>
                  <Ionicons name="location" size={20} color="#ff9800" />
                  <Text style={styles.locationItemTitle}>End Location</Text>
                </View>
                <Text style={styles.locationItemCoordinates}>
                  Capturing current location...
                </Text>
              </View>
            )}
            
            {endLocation && !isCapturingEndLocation && (
              <View style={styles.locationItem}>
                <View style={styles.locationItemHeader}>
                  <Ionicons name="stop-circle" size={20} color={Colors.primary} />
                  <Text style={styles.locationItemTitle}>End Location</Text>
                </View>
                <Text style={styles.locationItemCoordinates}>
                  Lat: {endLocation.latitude.toFixed(6)}, Lng: {endLocation.longitude.toFixed(6)}
                </Text>
                <Text style={styles.locationItemTime}>
                  Captured: {new Date(endLocation.timestamp).toLocaleTimeString()}
                </Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.cancelButton} onPress={handleGoBack}>
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.submitButton, (isPerforming || isCapturingEndLocation) && styles.disabledButton]}
            onPress={handleSubmit(onSubmit)}
            disabled={isPerforming || isCapturingEndLocation}
          >
            <Text style={styles.buttonText}>
              {isPerforming ? "Submitting..." : 
               isCapturingEndLocation ? "Capturing Location..." : "Submit"}
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* End Location Status */}
        {endLocation && (
          <View style={styles.endLocationStatus}>
            <Text style={styles.endLocationStatusText}>
              ✅ End location captured and ready to submit
            </Text>
            <Text style={styles.endLocationCoordinates}>
              Lat: {endLocation.latitude.toFixed(6)}, Lng: {endLocation.longitude.toFixed(6)}
            </Text>
          </View>
        )}
      </ScrollView>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: Colors.primary,
    padding: 10,
    borderRadius: 8,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
  imageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 15,
  },
  imageWrapper: {
    position: "relative",
    width: 80,
    height: 80,
  },
  imageThumb: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
  },
  removeIcon: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "white",
    borderRadius: 12,
  },
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f5f5f5",
  },
  headerContainer: {
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "flex-start",
    padding: 16,
    paddingTop: 25,
  },
  headerContent: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "flex-end",
    marginTop: 7,
    gap: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginLeft: 14,
    color: "white",
  },
  sectionHeader: {
    backgroundColor: "#ddd",
    padding: 12,
    borderRadius: 4,
    marginBottom: 16,
  },
  sectionHeaderContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionHeaderText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  sectionContent: {
    marginBottom: 16,
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
  dateInput: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
  },
  timeInput: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 4,
    backgroundColor: "white",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  textInput: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "black",
    color: "black",
    borderRadius: 4,
    padding: 8,
    height: 40,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  dropdown: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 8,
    backgroundColor: "white",
  },
  disabledInput: {
    backgroundColor: "#eee",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    padding: 8,
    height: 40,
    justifyContent: "center",
  },
  conditionalFields: {
    marginTop: 16,
    padding: 12,
    backgroundColor: "#f0f7ff",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#d0e3ff",
  },
  checkboxField: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 16,
    justifyContent: "space-around",
    marginTop: 16,
    marginBottom: 32,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    padding: 12,
    borderRadius: 4,
    alignItems: "center",
    width: 120,
  },
  cancelButton: {
    backgroundColor: "#888",
    padding: 12,
    borderRadius: 4,
    alignItems: "center",
    width: 120,
  },
  disabledButton: {
    backgroundColor: "#cccccc",
  },

  errorText: {
    color: "red",
    fontSize: 12,
    marginTop: 4,
  },
  placeholderStyle: {
    fontSize: 16,
    color: "#888",
  },
  selectedTextStyle: {
    fontSize: 16,
    color: Colors.primary,
  },
  iconStyle: {
    width: 20,
    height: 20,
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 16,
  },
  locationStatusContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: "#f0f7ff",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#d0e3ff",
  },
  locationStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  locationStatusText: {
    fontSize: 12,
    color: "#333",
    fontWeight: "500",
  },
  locationCoordinates: {
    fontSize: 10,
    color: "#666",
    fontFamily: "monospace",
    marginLeft: 28,
  },
  captureLocationButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.primary,
    padding: 8,
    borderRadius: 4,
    marginTop: 8,
    alignSelf: "flex-start",
    gap: 6,
  },
  captureLocationButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "500",
  },
  locationSummaryContainer: {
    backgroundColor: "#f8f9fa",
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  locationSummaryTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  locationItem: {
    backgroundColor: "white",
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#dee2e6",
  },
  locationItemHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  locationItemTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  locationItemCoordinates: {
    fontSize: 12,
    color: "#666",
    fontFamily: "monospace",
    marginBottom: 4,
  },
  locationItemTime: {
    fontSize: 11,
    color: "#888",
    fontStyle: "italic",
  },
  endLocationStatus: {
    backgroundColor: "#e8f5e8",
    padding: 12,
    borderRadius: 6,
    marginTop: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#4caf50",
    alignItems: "center",
  },
  endLocationStatusText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2e7d32",
    marginBottom: 4,
  },
  endLocationCoordinates: {
    fontSize: 12,
    color: "#666",
    fontFamily: "monospace",
  },
});
