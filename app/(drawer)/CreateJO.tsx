import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  Pressable,
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import { Dropdown } from "react-native-element-dropdown";
import { Entypo, Ionicons } from "@expo/vector-icons";
import { DatePickerInput } from "react-native-paper-dates";
import { Provider as PaperProvider, Button } from "react-native-paper";
import { useDropdownData } from "@/hooks/useDropDownList";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useJobs } from "@/hooks/useJobs";
import { CalenderTheme, Colors } from "@/common/styles";
import { formatDateToYYYYMMDD } from "@/utils";
import Toast from "react-native-toast-message";
import { router } from "expo-router";
import { MaintenanceJO } from "@/types";

const CreateJO = () => {
  const route: any = useRoute();
  const navigation = useNavigation();
  const { jobs, isLoading: jobsLoading, createJob, isCreating } = useJobs();
  const viewOnly = route.params?.viewOnly || false;
  const jobData = useMemo(() => {
    return transformJobData(route.params?.jobData || {});
  }, []);

  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const defaultValues = useMemo(() => {
    return {
      documentNumber: "",
      customer: "",
      date: "",
      postingPeriod: "",
      rentalSalesOrder: "",
      department: " ",
      location: "",
      class: "",
      maintenanceType: "",
      technicianAssigned: "",
      technicianType: "",
      includedMaintenance: "",
      instructions: "",
      exclusions: "",
      equipmentStatus: "",
      opportunity: "",
      memo: "",
      items: [],
    };
  }, []);

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm({
    defaultValues: defaultValues,
  });

  const [expandedSections, setExpandedSections] = useState<any>({
    primaryInfo: true,
    salesInfo: true,
    classification: true,
    maintenance: true,
    scopeOfServices: true,
    items: true,
  });

  const [shouldEnableInterval, setShouldEnableInterval] = useState(false);
  const [shouldEnableDay, setShouldEnableDay] = useState(false);
  const [shouldEnableWeekDay, setShouldEnableWeekDay] = useState(false);
  const [shouldEnableMonth, setShouldEnableMonth] = useState(false);
  const [shouldEnableBiMonthQuarterly, setShouldEnableBiMonthQuarterly] =
    useState(false);
  const [shouldEnableThreshold, setShouldEnableThreshold] = useState(false);

  type ItemType = {
    chargeItem?: string;
    equipment?: string;
    quantity?: string;
    equipmentUsageUnits?: string;
    rate?: string;
    amount?: string;
    date?: string;
    maintenanceOccurrenceType?: string;
    maintenanceStartDate?: string;
    maintenanceEndDate?: string;
    maintenanceFrequency?: string;
    maintenanceInterval?: string;
    maintenanceDay?: string;
    maintenanceWeekDay?: string;
    maintenanceMonth?: string;
    maintenanceType?: string;
    technicianType?: string;
    maintenanceMonthBiQuarterly?: string;
    maintenanceThreshold?: string;
    maintenanceCoverageLimit?: string;
    [key: string]: any;
  };

  const [items, setItems] = useState<ItemType[]>([]);
  const [showItemModal, setShowItemModal] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [itemIndex, setItemIndex] = useState(-1);

  const customers = useDropdownData("getCustomers");

  const employees = useDropdownData("getEmployees");
  const postingPeriod1 = useDropdownData("getPostingPeriod");

  const postingPeriod = {
    items: [...postingPeriod1.items].sort(
      (a, b) => Number(a.value) - Number(b.value)
    ),
  };

  const equipmentUsageUnits = useDropdownData("getEquipmentUsageUnits");
  const department = useDropdownData("getDepartment");
  const getClass = useDropdownData("getClass");
  const opportunity = useDropdownData("getOpp");
  const locations = useDropdownData("getLocations");

  const serviceOrders1 = useDropdownData("getSO");
  const serviceOrders = {
    items: Array.from(
      new Map(serviceOrders1.items.map((item) => [item.label, item])).values()
    ).sort((a, b) => Number(a.value) - Number(b.value)),
  };

  const chargeItem = useDropdownData("getChargeItems");
  const equipmentList = useDropdownData("getItems");
  const equipmentStatus = useDropdownData("getlist_Equipment Status");

  const maintenanceOccurrenceTypes = useDropdownData(
    "getlist_Maintenance Occurrence Type"
  );
  const maintenanceFrequency = useDropdownData("getlist_Billing Cycle");
  const maintenanceInterval = useDropdownData("getlist_Billing Interval");

  const maintenanceDay1 = useDropdownData("getlist_Billing Day");

  const maintenanceDay = {
    items: [...maintenanceDay1.items].sort(
      (a, b) => Number(a.value) - Number(b.value)
    ),
  };

  const maintenanceWeekDay1 = useDropdownData("getlist_Billing Week Day");

  const maintenanceWeekDay = {
    items: [...maintenanceWeekDay1.items].sort(
      (a, b) => Number(a.value) - Number(b.value)
    ),
  };

  const maintenanceMonth1 = useDropdownData("getlist_Billing Month");

  const maintenanceMonth = {
    items: [...maintenanceMonth1.items].sort(
      (a, b) => Number(a.value) - Number(b.value)
    ),
  };

  const maintenanceType = useDropdownData("getlist_Maintenance Type");
  const technicianType = useDropdownData("getlist_Technician Type");
  const chargeItems = useDropdownData("getChargeItems");
  const maintenanceMonthBiQuarterly = useDropdownData(
    "getlist_Billing Months for Bi-mon/qtr"
  );
  const dropdownPlaceholder = { label: "Select an option", value: "" };

  const jobDocNumber = useMemo(() => jobData?.documentNumber, [jobData]);
  useEffect(() => {
    if (viewOnly && jobs && jobs.length > 0 && jobDocNumber) {
      const jobItems = jobs.filter(
        (job) => job["Document Number"] === jobDocNumber
      );

      const transformedItems: any = jobItems.map((job) => {
        const sanitizeDate = (dateStr: string | undefined) => {
          if (!dateStr) return "";

          try {
            if (dateStr.includes("/")) {
              const [month, day, year] = dateStr.split("/");

              const formattedDate = new Date(
                `${month.padStart(2, "0")}/${day.padStart(2, "0")}/${year}`
              );
              return isNaN(formattedDate.getTime())
                ? ""
                : formattedDate.toISOString().split("T")[0];
            }

            const date = new Date(dateStr);
            return isNaN(date.getTime())
              ? ""
              : date.toISOString().split("T")[0];
          } catch (error) {
            console.error("Error parsing date:", dateStr, error);
            return "";
          }
        };

        return {
          chargeItem: "",
          equipment: job.Equipment || "",
          quantity: job.Quantity || "1",
          equipmentUsageUnits: job["Equipment Usage Units"] || "",
          rate: "",
          amount: "",
          date: sanitizeDate(job.Date),
          maintenanceOccurrenceType: job["Maintenance Occurrence Type"] || "",
          maintenanceStartDate: job["Maintenance Start date"],
          maintenanceEndDate: job["Maintenance End date"],
          maintenanceFrequency: job["Maintenance Frequency"] || "",
          maintenanceInterval: job["Maintenance Interval"] || "",
          maintenanceDay: job["Maintenance Day"] || "",
          maintenanceWeekDay: job["Maintenance Week Day"] || "",
          maintenanceMonth: job["Maintenance Month"] || "",
          maintenanceType: job["Maintenance Type"] || "",
          technicianType: job["Technician Type"] || "",
          maintenanceMonthBiQuarterly:
            job["Maintenance Month (Bi-Month/Quarterly)"] || "",
          maintenanceThreshold:
            job["Maintenance Threshold (In Usage Units)"] || "",
          maintenanceCoverageLimit:
            job["Maintenance Coverage Limit (In Usage Units)"] || "",
        };
      });

      setItems(transformedItems);

      console.log("tras", transformedItems);
    } else if (!viewOnly && jobData.items && jobData.items.length > 0) {
      setItems(jobData.items);
    }
  }, [viewOnly, jobs, jobDocNumber]);

  useEffect(() => {
    if (Object.keys(jobData).length > 0) {
      Object.keys(jobData).forEach((key) => {
        if (key !== "items") {
          setValue(key, jobData[key]);
        }
      });
    }
  }, [jobData, setValue]);

  function transformJobData(data: any) {
    if (!data || Object.keys(data).length === 0) return {};

    const sanitizeDate = (dateStr: any) => {
      if (!dateStr) return "";

      try {
        if (dateStr.includes("/")) {
          const [month, day, year] = dateStr.split("/");

          const formattedDate = new Date(
            `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
          );
          return isNaN(formattedDate.getTime())
            ? ""
            : formattedDate.toISOString().split("T")[0];
        }

        const date = new Date(dateStr);
        return isNaN(date.getTime()) ? "" : date.toISOString().split("T")[0];
      } catch (error) {
        console.error("Error parsing date:", dateStr, error);
        return "";
      }
    };

    return {
      documentNumber: data["Document Number"] || "",
      customer: data.Customer || "",
      date: sanitizeDate(data.Date),
      memo: data["Memo (Main)"] || "",
      equipmentStatus: data["Equipment Status"] || "",
      postingPeriod: data.Period || "",
      opportunity: "",
      rentalSalesOrder: data["Rental Sales Order #"] || "",
      department: data.Department || "",
      location: data.Location || "",
      class: data.Class || "",
      maintenanceType: data["Maintenance Type"] || "",
      technicianAssigned: data["Technician Assigned"] || "",
      technicianType: data["Technician Type"] || "",
      includedMaintenance: data["Included Maintenance"] || "",
      instructions: data["Instructions/Specifications"] || "",
      exclusions: data["Exclusions"] || "",
      items: [],
    };
  }
  // useEffect(() => {
  //   const maintenanceOccurrenceType = watch("maintenanceOccurrenceType");
  //   const maintenanceFrequency = watch("maintenanceFrequency");

  //   // Rule 1: When 'Maintenance Occurrence Type' is 'Usage based'
  //   setShouldEnableThreshold(maintenanceOccurrenceType === "usage_based");

  //   // Rules 2, 3, 4: Fields enabled based on 'Maintenance Frequency'
  //   if (maintenanceFrequency) {
  //     // For Monthly or Yearly frequency
  //     if (["monthly", "yearly"].includes(maintenanceFrequency)) {
  //       setShouldEnableInterval(true);
  //       setShouldEnableDay(true);
  //       setShouldEnableWeekDay(false);
  //       setShouldEnableMonth(true);
  //       setShouldEnableBiMonthQuarterly(true);
  //     }
  //     // For Weekly frequency
  //     else if (maintenanceFrequency === "weekly") {
  //       setShouldEnableInterval(true);
  //       setShouldEnableDay(false);
  //       setShouldEnableWeekDay(true);
  //       setShouldEnableMonth(true);
  //       setShouldEnableBiMonthQuarterly(false);
  //     }
  //     // For Daily frequency
  //     else if (maintenanceFrequency === "daily") {
  //       setShouldEnableInterval(true);
  //       setShouldEnableDay(true);
  //       setShouldEnableWeekDay(true);
  //       setShouldEnableMonth(true);
  //       setShouldEnableBiMonthQuarterly(true);
  //     }
  //     // Default case - disable all
  //     else {
  //       setShouldEnableInterval(false);
  //       setShouldEnableDay(false);
  //       setShouldEnableWeekDay(false);
  //       setShouldEnableMonth(false);
  //       setShouldEnableBiMonthQuarterly(false);
  //     }
  //   } else {
  //     // If no frequency is selected, disable all relevant fields
  //     setShouldEnableInterval(false);
  //     setShouldEnableDay(false);
  //     setShouldEnableWeekDay(false);
  //     setShouldEnableMonth(false);
  //     setShouldEnableBiMonthQuarterly(false);
  //   }
  // }, [watch("maintenanceOccurrenceType"), watch("maintenanceFrequency")]);

  const toggleSection = (section: any) => {
    setExpandedSections((prev: any) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };
  const formatDateForSubmission = (dateStr: any) => {
    if (!dateStr) return "";

    try {
      if (dateStr.includes("-")) {
        const [year, month, day] = dateStr.split("-");
        return `${month}/${day}/${year}`;
      }
      return dateStr;
    } catch (error) {
      console.error("Error formatting date for submission:", error);
      return dateStr;
    }
  };

  // const onSubmit = async (data) => {
  //   try {
  //     setSubmissionError(null);

  //     const formattedData = {
  //       ...data,
  //       date: formatDateForSubmission(data.date),
  //       items: items.map((item) => ({
  //         ...item,
  //         date: formatDateForSubmission(item.date),
  //         maintenanceStartDate: formatDateForSubmission(
  //           item.maintenanceStartDate
  //         ),
  //         maintenanceEndDate: formatDateForSubmission(item.maintenanceEndDate),
  //       })),
  //     };

  //     console.log(
  //       "Submitting job data:",
  //       JSON.stringify(formattedData, null, 2)
  //     );
  //     console.log(
  //       "items for this job",
  //       JSON.stringify(formattedData.items, null, 2)
  //     );

  //     await createJob(formattedData);

  //     // navigation.goBack();
  //   } catch (error) {f
  //     console.error("Error creating job:", error);
  //     setSubmissionError(
  //       error.message || "Failed to create job. Please try again."
  //     );
  //   }
  // };

  const onSubmit = async (data: any) => {
    try {
      setSubmissionError(null);
      setIsSubmitting(true);

      console.log("Raw items in state:", items);
      console.log(
        "Are all items unique?",
        new Set(items).size === items.length
      );

      const formattedData = {
        ...data,
        date: formatDateForSubmission(data.date),
        items: items.map((item) =>
          JSON.parse(
            JSON.stringify({
              // Deep clone
              ...item,
              date: formatDateForSubmission(item.date),
              maintenanceStartDate: formatDateForSubmission(
                item.maintenanceStartDate
              ),
              maintenanceEndDate: formatDateForSubmission(
                item.maintenanceEndDate
              ),
            })
          )
        ),
      };

      console.log(
        "Submitting job data:",
        JSON.stringify(formattedData, null, 2)
      );
      console.log(
        "items for this job",
        JSON.stringify(formattedData.items, null, 2)
      );

      createJob(formattedData, {
        onSuccess: (data) => {
          console.log("Job successfully created:", data);

          if (data.success) {
            Toast.show({
              type: "success",
              text1: "Job created successfully",
              position: "top",
              visibilityTime: 10000,
              autoHide: true,
              topOffset: 50,
              bottomOffset: 50,
            });
            reset(defaultValues);
            setItems([]);
            setErrorMessage("");
            router.push("/dashboard");
          } else if (!data.success) {
            Toast.show({
              type: "error",
              text1: "Error creating job",
              text2: data.message,
              position: "top",
              visibilityTime: 20000,
              autoHide: true,
              topOffset: 50,
              bottomOffset: 50,
            });
            setErrorMessage(`Error: ${data.message}`);
          }
        },
        onError: (error) => {
          console.error("Failed to create job:", error);
          setErrorMessage(`Error: ${error}`);
          setSubmissionError(
            error.message || "Failed to create job. Please try again."
          );
          Toast.show({
            type: "error",
            text1: "Erroe creating Job",
            text2: error.message,
            position: "top",
            visibilityTime: 5000,
            autoHide: true,
            topOffset: 50,
            bottomOffset: 50,
          });
        },
        onSettled: () => {
          setIsSubmitting(false);
          setErrorMessage("");
        },
      });
    } catch (error: any) {
      console.error("Error creating job:", error);
      setSubmissionError(
        error.message || "Failed to create job. Please try again."
      );
      setIsSubmitting(false);
    }
  };

  const handleAddItem = () => {
    setCurrentItem({});
    setItemIndex(-1);
    setShowItemModal(true);
  };

  const handleEditItem = useCallback((item: any, index: any) => {
    setCurrentItem({ ...item });
    setItemIndex(index);
    setShowItemModal(true);
  }, []);

  const handleSaveItem = (itemData: any) => {
    if (itemIndex >= 0) {
      const updatedItems = [...items];
      updatedItems[itemIndex] = itemData;
      setItems(updatedItems);
    } else {
      setItems([...items, itemData]);
    }
    setShowItemModal(false);
  };

  const handleDeleteItem = (index: any) => {
    const updatedItems = [...items];
    updatedItems.splice(index, 1);
    setItems(updatedItems);
  };

  const renderSection = (title: any, sectionKey: any, content: any) => (
    <View style={styles.sectionContainer}>
      <TouchableOpacity
        style={styles.sectionHeader}
        onPress={() => toggleSection(sectionKey)}
        disabled={viewOnly}
      >
        <Ionicons
          name={
            expandedSections[sectionKey] ? "chevron-down" : "chevron-forward"
          }
          size={20}
          color="#505050"
        />
        <Text style={styles.sectionTitle}>{title}</Text>
      </TouchableOpacity>

      {expandedSections[sectionKey] && (
        <View style={styles.sectionContent}>{content}</View>
      )}
    </View>
  );

  type FormFieldName = keyof typeof defaultValues;

  const renderTextField = (
    name: FormFieldName,
    label: string,
    required = false,
    disabled = false
  ) => (
    <Controller
      control={control}
      name={name}
      rules={{ required: required ? `${label} is required` : false }}
      render={({ field: { onChange, onBlur, value } }) => (
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>
            {label} {required && <Text style={styles.required}>*</Text>}
          </Text>
          <TextInput
            style={[
              styles.textInput,
              errors[name as keyof typeof errors] && styles.errorInput,
              viewOnly && styles.disabledInput,
              disabled && { backgroundColor: "#cccc" },
            ]}
            onBlur={onBlur}
            onChangeText={onChange}
            value={typeof value === "string" ? value : ""}
            editable={!viewOnly && !disabled}
          />
          {errors[name as keyof typeof errors] && !viewOnly && (
            <Text style={styles.errorText}>
              {(errors[name as keyof typeof errors] as any)?.message}
            </Text>
          )}
        </View>
      )}
    />
  );

  // const renderDateField = (name, label, required = false) => (
  //   <Controller
  //     control={control}
  //     name={name}
  //     rules={{ required: required ? `${label} is required` : false }}
  //     render={({ field: { onChange, value } }) => (
  //       <View style={styles.fieldContainer}>
  //         <Text style={styles.fieldLabel}>
  //           {label} {required && <Text style={styles.required}>*</Text>}
  //         </Text>
  //         {viewOnly ? (
  //           <TextInput
  //             style={[styles.textInput, styles.disabledInput]}
  //             value={value}
  //             editable={false}
  //           />
  //         ) : (
  //           <DatePickerInput
  //             style={[styles.dateInput, errors[name] && styles.errorInput]}
  //             locale="en"
  //             label=""
  //             value={value ? new Date(value) : undefined}
  //             onChange={(date) =>
  //               onChange(date ? date.toISOString().split("T")[0] : null)
  //             }
  //             inputMode="start"
  //             mode="outlined"
  //             outlineColor="#ccc"
  //             activeOutlineColor="#007bff"
  //             disabled={viewOnly}
  //           />
  //         )}
  //         {errors[name] && !viewOnly && (
  //           <Text style={styles.errorText}>{errors[name].message}</Text>
  //         )}
  //       </View>
  //     )}
  //   />
  // );
  const renderDateField = (
    name: keyof typeof defaultValues,
    label: string,
    required = false
  ) => (
    <Controller
      control={control}
      name={name}
      rules={{ required: required ? `${label} is required` : false }}
      render={({ field: { onChange, value } }) => {
        let dateValue;

        if (value) {
          if (typeof value === "string" && value.includes("/")) {
            const [month, day, year] = value.split("/");
            dateValue = new Date(
              `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
            );
          } else {
            dateValue =
              typeof value === "string" ||
              typeof value === "number" ||
              value instanceof Date
                ? new Date(value)
                : undefined;
          }
        }

        const isValidDate = dateValue && !isNaN(dateValue.getTime());

        const formattedDisplayDate =
          isValidDate && dateValue ? dateValue.toLocaleDateString() : "";

        return (
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>
              {label} {required && <Text style={styles.required}>*</Text>}
            </Text>
            {viewOnly ? (
              <TextInput
                style={[styles.textInput, styles.disabledInput]}
                value={formattedDisplayDate}
                editable={false}
              />
            ) : (
              <PaperProvider theme={CalenderTheme}>
                <DatePickerInput
                  style={[
                    styles.modalDateInput,
                    errors[name] && styles.errorInput,
                  ]}
                  locale="en"
                  value={isValidDate ? dateValue : undefined}
                  onChange={(date) =>
                    onChange(date ? formatDateToYYYYMMDD(date) : "")
                  }
                  inputMode="start"
                  mode="outlined"
                  saveLabel="Confirm Date"
                  outlineColor="#ccc"
                  activeOutlineColor="#007bff"
                  iconColor={Colors.primary}
                  disabled={viewOnly}
                  presentationStyle="pageSheet"
                />
              </PaperProvider>
            )}
            {errors[name] && !viewOnly && (
              <Text style={styles.errorText}>
                {(errors[name] as any)?.message}
              </Text>
            )}
          </View>
        );
      }}
    />
  );

  const renderDropdown = (
    name: keyof typeof defaultValues,
    label: any,
    items: any,
    required = false,
    isLoading = false,
    disabled = false,
    hasError = false,
    onRetry = () => {}
  ) => (
    <Controller
      control={control}
      name={name}
      rules={{ required: required ? `${label} is required` : false }}
      render={({ field: { onChange, value } }) => (
        <View style={styles.fieldContainer}>
          <View
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <Text style={styles.fieldLabel}>
              {label} {required && <Text style={styles.required}>*</Text>}
            </Text>
            {!isLoading && items.length === 0 && (
              <TouchableOpacity
                onPress={onRetry}
                style={{
                  zIndex: 10,
                  paddingHorizontal: 8,
                }}
              >
                <Ionicons name="refresh" size={20} color={Colors.primary} />
              </TouchableOpacity>
            )}
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#007bff" />
            </View>
          ) : viewOnly ? (
            <TextInput
              style={[styles.textInput, styles.disabledInput]}
              value={
                items.find((item: any) => item.value === value)?.label || value
              }
              editable={false}
            />
          ) : (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                width: "100%",
              }}
            >
              <Dropdown
                style={[
                  { width: "100%" },
                  styles.dropdown,
                  errors[name] && styles.errorInput,
                  disabled && { backgroundColor: "#cccc" },
                ]}
                placeholderStyle={styles.placeholderText}
                selectedTextStyle={styles.selectedText}
                data={items}
                labelField="label"
                valueField="value"
                placeholder="Select an option"
                value={
                  typeof value === "string"
                    ? value
                    : Array.isArray(value)
                    ? value.join(", ")
                    : ""
                }
                onChange={(item) => onChange(item.value)}
                search
                searchPlaceholder="Search..."
                disable={viewOnly || disabled}
              />
            </View>
          )}
          {errors[name] && !viewOnly && (
            <Text style={styles.errorText}>
              {(errors[name] as any)?.message}
            </Text>
          )}
        </View>
      )}
    />
  );

  const renderTextArea = (
    name: keyof typeof defaultValues,
    label: string,
    required = false
  ) => (
    <Controller
      control={control}
      name={name}
      rules={{ required: required ? `${label} is required` : false }}
      render={({ field: { onChange, onBlur, value } }) => (
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>
            {label} {required && <Text style={styles.required}>*</Text>}
          </Text>
          <TextInput
            style={[
              styles.textArea,
              errors[name] && styles.errorInput,
              viewOnly && styles.disabledInput,
            ]}
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            multiline
            numberOfLines={4}
            editable={!viewOnly}
          />
          {errors[name] && !viewOnly && (
            <Text style={styles.errorText}>
              {(errors[name] as any)?.message}
            </Text>
          )}
        </View>
      )}
    />
  );

  const primaryInfoContent = (
    <View>
      <View style={styles.row}>
        <View style={styles.col}>
          {renderTextField(
            "documentNumber",
            "Document # (Auto Generated)",
            false,
            true
          )}
        </View>
        <View style={styles.col}>
          {renderDropdown(
            "customer",
            "Customer",
            customers.items,
            true,
            customers.isLoading,
            false,
            !!customers.error,
            customers.refetch
          )}
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.col}>{renderDateField("date", "Date", true)}</View>
        <View style={styles.col}>{renderTextArea("memo", "Memo")}</View>
      </View>

      <View style={styles.row}>
        <View style={styles.col}>
          {renderDropdown(
            "equipmentStatus",
            "Status",
            equipmentStatus.items,
            false,
            false,
            true,
            !!equipmentStatus.error,
            equipmentStatus.refetch
          )}
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.col}>
          {renderDropdown(
            "postingPeriod",
            "Posting Period",
            postingPeriod.items,
            true,
            postingPeriod1.isLoading,
            false,
            !!postingPeriod1.error,
            postingPeriod1.refetch
          )}
        </View>
      </View>
    </View>
  );

  const salesInfoContent = (
    <View>
      <View style={styles.row}>
        <View style={styles.col}>
          {renderDropdown("opportunity", "Opportunity", [])}
        </View>
        <View style={styles.col}>
          {renderDropdown(
            "rentalSalesOrder",
            "Sales Order #",
            serviceOrders.items,
            false,
            serviceOrders1.isLoading,
            false,
            !!serviceOrders1.error,
            serviceOrders1.refetch
          )}
        </View>
      </View>
    </View>
  );

  const classificationContent = (
    <View>
      <View style={styles.row}>
        <View style={styles.col}>
          {renderDropdown(
            "department",
            "Department",
            department.items,
            false,
            department.isLoading,
            false,
            !!department.error,
            department.refetch
          )}
        </View>
        <View style={styles.col}>
          {renderDropdown(
            "location",
            "Location",
            locations.items,
            true,
            locations.isLoading,
            false,
            !!locations.error,
            locations.refetch
          )}
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.col}>
          {renderDropdown(
            "class",
            "Class",
            getClass.items,
            false,
            getClass.isLoading,
            false,
            !!getClass.error,
            getClass.refetch
          )}
        </View>
      </View>
    </View>
  );

  const maintenanceContent = (
    <View>
      <View style={styles.row}>
        <View style={styles.col}>
          {renderDropdown(
            "maintenanceType",
            "Maintenance Type",
            maintenanceType.items,
            true,
            maintenanceType.isLoading,
            false,
            !!maintenanceType.error,
            maintenanceType.refetch
          )}
        </View>
      </View>
      <View style={styles.row}>
        <View style={styles.col}>
          {renderDropdown(
            "technicianAssigned",
            "Technician Assigned",
            employees.items,
            true,
            employees.isLoading,
            false,
            !!employees.error,
            employees.refetch
          )}
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.col}>
          {renderDropdown(
            "technicianType",
            "Technician Type",
            technicianType.items,
            true,
            technicianType.isLoading,
            false,
            !!technicianType.error,
            technicianType.refetch
          )}
        </View>
      </View>

      {/* <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>Reactive Maintenance:</Text>
        <Text style={styles.infoText}>
          Equipment is sent out for maintenance and returned after maintenance
          is completed. It requires inventory movement.
        </Text>
      </View> */}

      {/* <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>Preventive Maintenance:</Text>
        <Text style={styles.infoText}>
          Equipment remains at the customer location once it is sold to them.
          The company performs only preventive maintenance service. There is no
          movement of inventory.
        </Text>
      </View> */}
    </View>
  );

  const scopeOfServicesContent = (
    <View>
      <View style={styles.row}>
        <View style={styles.col}>
          {renderTextArea("includedMaintenance", "Included Maintenance", true)}
        </View>
        <View style={styles.col}>
          {renderTextArea("instructions", "Instructions/Specifications", true)}
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.col}>
          {renderTextArea("exclusions", "Exclusions", true)}
        </View>
      </View>
    </View>
  );

  const itemsContent = (
    <View>
      <View style={styles.itemsHeader}>
        <Text style={styles.itemsHeaderText}>Items</Text>
        {!viewOnly && (
          <TouchableOpacity
            style={styles.addItemButton}
            onPress={handleAddItem}
          >
            <Ionicons
              name="add-circle-outline"
              size={20}
              color={Colors.primary}
            />
            <Text style={styles.addItemText}>Add Item</Text>
          </TouchableOpacity>
        )}
      </View>

      {!viewOnly && (
        <TouchableOpacity
          style={styles.clearButton}
          onPress={() => setItems([])}
          disabled={items.length === 0}
        >
          <Text
            style={[
              styles.clearButtonText,
              items.length === 0 && styles.disabledText,
            ]}
          >
            Clear All Lines
          </Text>
        </TouchableOpacity>
      )}

      <View style={styles.itemsList}>
        {items.length > 0 ? (
          <View style={styles.itemsTable}>
            <View style={styles.itemsTableHeader}>
              {/* <Text
                style={[
                  styles.itemsTableCell,
                  styles.itemsTableHeaderText,
                  styles.chargeItemCol,
                ]}
              >
                Charge Item
              </Text> */}
              <Text
                style={[
                  styles.itemsTableCell,
                  styles.itemsTableHeaderText,
                  styles.equipmentCol,
                ]}
              >
                Equipment
              </Text>
              <Text
                style={[
                  styles.itemsTableCell,
                  styles.itemsTableHeaderText,
                  styles.typeCol,
                ]}
              >
                Maintenance Type
              </Text>
              {viewOnly && (
                <Text
                  style={[
                    styles.itemsTableCell,
                    styles.itemsTableHeaderText,
                    styles.actionCol,
                  ]}
                >
                  View
                </Text>
              )}
              {!viewOnly && (
                <Text
                  style={[
                    styles.itemsTableCell,
                    styles.itemsTableHeaderText,
                    styles.actionCol,
                  ]}
                >
                  Actions
                </Text>
              )}
            </View>

            {items.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.itemsTableRow}
                onPress={() => handleEditItem(item, index)}
              >
                {/* <Text style={[styles.itemsTableCell, styles.chargeItemCol]}>
                  {item.chargeItemLabel || "-"}
                </Text> */}
                {/* {console.log("fewafewa", items)} */}
                <Text style={[styles.itemsTableCell, styles.equipmentCol]}>
                  {equipmentList.items.find((e) => e.value === item.equipment)
                    ?.label || "-"}
                </Text>
                <Text style={[styles.itemsTableCell, styles.typeCol]}>
                  {maintenanceOccurrenceTypes.items.find(
                    (e) => e.value === item.maintenanceOccurrenceType
                  )?.label || "-"}
                </Text>
                {viewOnly && (
                  <View
                    style={[
                      styles.itemsTableCell,
                      styles.actionCol,
                      styles.actionButtons,
                    ]}
                  >
                    <TouchableOpacity
                      onPress={() => handleEditItem(item, index)}
                      style={styles.editButton}
                    >
                      <Entypo name="eye" size={24} color={Colors.primary} />
                    </TouchableOpacity>
                  </View>
                )}
                {!viewOnly && (
                  <View
                    style={[
                      styles.itemsTableCell,
                      styles.actionCol,
                      styles.actionButtons,
                    ]}
                  >
                    <TouchableOpacity
                      onPress={() => handleEditItem(item, index)}
                      style={styles.editButton}
                    >
                      <Ionicons
                        name="create-outline"
                        size={18}
                        color="#007bff"
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteItem(index)}
                      style={styles.deleteButton}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={18}
                        color="#dc3545"
                      />
                    </TouchableOpacity>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <Text style={styles.emptyItemsText}>No items added yet</Text>
        )}
      </View>
    </View>
  );

  return (
    <PaperProvider>
      <ScrollView style={styles.container}>
        <Text style={styles.heading}>
          {viewOnly ? "Job Order" : "Create Job Order"}
        </Text>

        {renderSection(
          "Primary Information",
          "primaryInfo",
          primaryInfoContent
        )}
        {renderSection("Sales Information", "salesInfo", salesInfoContent)}
        {renderSection(
          "Classification",
          "classification",
          classificationContent
        )}
        {renderSection("Maintenance", "maintenance", maintenanceContent)}
        {renderSection(
          "Scope of Services",
          "scopeOfServices",
          scopeOfServicesContent
        )}
        {renderSection("Items", "items", itemsContent)}
        {errorMessage && (
          <Text style={{ color: "red", textAlign: "center" }}>
            {errorMessage}
          </Text>
        )}
        {!viewOnly && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSubmit(onSubmit)}
            >
              <Text style={styles.saveButtonText}>
                {isSubmitting ? "Creating..." : "Create"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <ItemModal
        visible={showItemModal}
        item={currentItem}
        onClose={() => setShowItemModal(false)}
        onSave={handleSaveItem}
        dropdownData={{
          chargeItems: chargeItems.items.map((item) => ({
            label: item.label,
            value: item.value,
            loading: chargeItems.isLoading,
            refetch: chargeItems.refetch,
          })),
          equipmentList: equipmentList.items.map((item) => ({
            label: item.label,
            value: item.value,
            loading: equipmentList.isLoading,
            refetch: equipmentList.refetch,
          })),
          department: department.items.map((item) => ({
            label: item.label,
            value: item.value,
            loading: department.isLoading,
            refetch: department.refetch,
          })),
          class: getClass.items.map((item) => ({
            label: item.label,
            value: item.value,
            loading: getClass.isLoading,
            refetch: getClass.refetch,
          })),
          maintenanceOccurrenceTypes: maintenanceOccurrenceTypes.items.map(
            (item) => ({
              label: item.label,
              value: item.value,
              loading: maintenanceOccurrenceTypes.isLoading,
              refetch: maintenanceOccurrenceTypes.refetch,
            })
          ),
          maintenanceFrequency: maintenanceFrequency.items.map((item) => ({
            label: item.label,
            value: item.value,
            loading: maintenanceFrequency.isLoading,
            refetch: maintenanceFrequency.refetch,
          })),
          maintenanceInterval: maintenanceInterval.items.map((item) => ({
            label: item.label,
            value: item.value,
            loading: maintenanceInterval.isLoading,
            refetch: maintenanceInterval.refetch,
          })),
          maintenanceDay: maintenanceDay.items.map((item) => ({
            label: item.label,
            value: item.value,
            loading: maintenanceDay1.isLoading,
            refetch: maintenanceDay1.refetch,
          })),
          maintenanceWeekDay: maintenanceWeekDay.items.map((item) => ({
            label: item.label,
            value: item.value,
            loading: maintenanceWeekDay1.isLoading,
            refetch: maintenanceWeekDay1.refetch,
          })),
          maintenanceMonth: maintenanceMonth.items.map((item) => ({
            label: item.label,
            value: item.value,
            loading: maintenanceMonth1.isLoading,
            refetch: maintenanceMonth1.refetch,
          })),
          maintenanceMonthBiQuarterly: maintenanceMonthBiQuarterly.items.map(
            (item) => ({
              label: item.label,
              value: item.value,
              loading: maintenanceMonthBiQuarterly.isLoading,
              refetch: maintenanceMonthBiQuarterly.refetch,
            })
          ),
          equipmentUsageUnits: equipmentUsageUnits.items.map((item) => ({
            label: item.label,
            value: item.value,
            loading: equipmentUsageUnits.isLoading,
            refetch: equipmentUsageUnits.refetch,
          })),
          serviceOrders: serviceOrders.items.map((item) => ({
            lable: item.docNumber,
            value: item["Internal ID"],
            loading: serviceOrders1.isLoading,
            refetch: serviceOrders1.refetch,
          })),
        }}
        isLoading={{
          chargeItems: chargeItems.isLoading,
          equipmentList: equipmentList.isLoading,
          department: department.isLoading,
          getClass: getClass.isLoading,
          maintenanceOccurrenceTypes: maintenanceOccurrenceTypes.isLoading,
          maintenanceFrequency: maintenanceFrequency.isLoading,
          maintenanceInterval: maintenanceInterval.isLoading,
          maintenanceDay: maintenanceDay1.isLoading,
          maintenanceWeekDay: maintenanceWeekDay1.isLoading,
          maintenanceMonth: maintenanceMonth1.isLoading,
          maintenanceMonthBiQuarterly: maintenanceMonthBiQuarterly.isLoading,
          equipmentUsageUnits: equipmentUsageUnits.isLoading,
          serviceOrders: serviceOrders1.isLoading,
        }}
        viewOnly={viewOnly}
      />
    </PaperProvider>
  );
};

type ItemModalProps = {
  visible: boolean;
  item: any;
  onClose: () => void;
  onSave: (itemData: any) => void;
  dropdownData: any;
  isLoading: any;
  viewOnly: boolean;
};

const ItemModal = ({
  visible,
  item,
  onClose,
  onSave,
  dropdownData,
  isLoading,
  viewOnly,
}: ItemModalProps) => {
  const defaultValues = useMemo(() => {
    return {
      chargeItem: "",
      equipment: "",
      quantity: "1",
      equipmentUsageUnits: "",
      memo: "",
      rate: "",
      amount: "",
      maintenanceOccurrenceType: "",
      maintenanceStartDate: "",
      maintenanceEndDate: "",
      maintenanceFrequency: "",
      maintenanceInterval: "",
      maintenanceDay: "",
      maintenanceWeekDay: "",
      maintenanceMonth: "",
      maintenanceMonthBiQuarterly: "",
      maintenanceThreshold: "",
      maintenanceCoverageLimit: "",
      ...(item || {}),
    };
  }, [item]);

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm({
    defaultValues: defaultValues,
  });
  const prevItemRef = useRef();
  useEffect(() => {
    if (item) {
      // console.log("Resetting form with full item data:", item);
      reset(defaultValues);
    } else {
      reset(defaultValues);
    }
  }, [item, reset, defaultValues]);

  useEffect(() => {
    reset(defaultValues);
  }, [reset]);

  const maintenanceOccurrenceType = watch("maintenanceOccurrenceType");
  const maintenanceFrequency = watch("maintenanceFrequency");
  const maintenanceInterval = watch("maintenanceInterval");
  const quantity = watch("quantity");
  const rate = watch("rate");

  useEffect(() => {
    if (quantity && rate) {
      const calculatedAmount = parseFloat(quantity) * parseFloat(rate);
      setValue("amount", calculatedAmount.toFixed(2));
    } else {
      setValue("amount", "");
    }
  }, [quantity, rate, setValue]);

  useEffect(() => {
    if (!viewOnly) {
      if (maintenanceOccurrenceType === "usagebased") {
        setValue("maintenanceFrequency", "");
        setValue("maintenanceInterval", "");
        setValue("maintenanceDay", "");
        setValue("maintenanceWeekDay", "");
        setValue("maintenanceMonth", "");
        setValue("maintenanceMonthBiQuarterly", "");
      } else {
        setValue("maintenanceThreshold", "");
        setValue("maintenanceCoverageLimit", "");
      }
    }
  }, [maintenanceOccurrenceType, setValue]);

  const shouldEnableThreshold = maintenanceOccurrenceType === 3;
  const shouldEnableFrequency = !shouldEnableThreshold;

  const shouldEnableInterval = shouldEnableFrequency && !!maintenanceFrequency;
  const shouldEnableDay =
    shouldEnableFrequency && [3, 4, 1].includes(maintenanceFrequency);
  const shouldEnableWeekDay =
    shouldEnableFrequency &&
    [2, 1].includes(maintenanceFrequency) &&
    ![1].includes(maintenanceInterval) &&
    ![2, 3].includes(maintenanceInterval);
  const shouldEnableMonth =
    shouldEnableFrequency &&
    [2, 3, 4, 1].includes(maintenanceFrequency) &&
    ![1].includes(maintenanceInterval) &&
    ![2, 3].includes(maintenanceInterval);
  const shouldEnableBiMonthQuarterly =
    shouldEnableFrequency &&
    [3, 1].includes(maintenanceFrequency) &&
    ![1].includes(maintenanceInterval);

  const shouldEnableUsageUnit = maintenanceOccurrenceType === 2;

  const handleSaveItem = (data: any) => {
    const chargeItemLabel =
      dropdownData.chargeItems.find(
        (item: any) => item.value === data.chargeItem
      )?.label || "";
    const equipmentLabel =
      dropdownData.equipmentList.find(
        (item: any) => item.value === data.equipment
      )?.label || "";
    const maintenanceOccurrenceTypeLabel =
      dropdownData.maintenanceOccurrenceTypes.find(
        (item: any) => item.value === data.maintenanceOccurrenceType
      )?.label || "";

    const savedData = {
      ...data,
    };

    Toast.show({
      type: "success",
      text1: "Item created",
      position: "top",
      visibilityTime: 5000,
      autoHide: true,
      topOffset: 50,
      bottomOffset: 50,
    });
    onSave(savedData);
    onClose();
  };

  const renderInputField = (
    name: any,
    label: any,
    keyboardType = "default",
    required = false,
    disabled = false
  ) => (
    <Controller
      control={control}
      name={name}
      rules={{ required: required ? `${label} is required` : false }}
      render={({ field: { onChange, onBlur, value } }) => {
        const displayValue =
          value !== undefined && value !== null && value !== ""
            ? String(value)
            : "";

        return (
          <View style={styles.modalFieldContainer}>
            <Text style={styles.modalFieldLabel}>
              {label} {required && <Text style={styles.required}>*</Text>}
            </Text>
            {viewOnly ? (
              <TextInput
                style={[styles.modalInput, styles.disabledInput]}
                value={displayValue}
                editable={false}
                selectTextOnFocus={false}
              />
            ) : (
              <TextInput
                style={[
                  styles.modalInput,
                  errors[name] && styles.errorInput,
                  disabled && styles.disabledInput,
                ]}
                onBlur={onBlur}
                onChangeText={onChange}
                value={String(value || "")}
                keyboardType={keyboardType}
                editable={!disabled}
              />
            )}
            {errors[name] && (
              <Text style={styles.errorText}>
                {errors[name].message as any}
              </Text>
            )}
          </View>
        );
      }}
    />
  );

  const renderDropdownField = (
    name: any,
    label: any,
    items = [],
    required = false,
    disabled = false,
    loading = false,
    onRetry = null
  ) => {
    const hasItems = Array.isArray(items) && items.length > 0;
    const showRetry = !loading && !hasItems && typeof onRetry === "function";

    return (
      <Controller
        control={control}
        name={name}
        rules={{ required: required ? `${label} is required` : false }}
        render={({ field: { onChange, value } }) => (
          <View style={styles.modalFieldContainer}>
            <Text style={styles.modalFieldLabel}>
              {label} {required && <Text style={styles.required}>*</Text>}
            </Text>
            {items.length === 0 && (
              <TouchableOpacity
                onPress={() => onRetry}
                style={{
                  position: "absolute",
                  right: 0,
                  bottom: 40,
                  zIndex: 10,
                  padding: 5,
                }}
              >
                <Ionicons name="refresh" size={20} color={Colors.primary} />
              </TouchableOpacity>
            )}

            {viewOnly ? (
              <TextInput
                style={[styles.modalInput, styles.disabledInput]}
                value={
                  label === "Charge Item"
                    ? "Maintenance Charge Item"
                    : value || ""
                }
                editable={false}
              />
            ) : loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#007bff" />
              </View>
            ) : (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  width: "100%",
                }}
              >
                <Dropdown
                  style={[
                    { width: "100%" },
                    styles.modalDropdown,
                    errors[name] && styles.errorInput,
                    disabled && styles.disabledDropdown,
                  ]}
                  placeholderStyle={styles.placeholderText}
                  selectedTextStyle={styles.selectedText}
                  data={items || []}
                  labelField="label"
                  valueField="value"
                  placeholder="Select an option"
                  value={value}
                  onChange={(item) => {
                    console.log(`Dropdown ${name} changed:`, item.value);
                    onChange(item.value);
                  }}
                  search
                  searchPlaceholder="Search..."
                  disable={disabled}
                />
              </View>
            )}

            {errors[name] && (
              <Text style={styles.errorText}>
                {errors[name].message as any}
              </Text>
            )}
          </View>
        )}
      />
    );
  };

  const renderDateField = (
    name: any,
    label: any,
    required = false,
    disabled = false
  ) => (
    <Controller
      control={control}
      name={name}
      rules={{ required: required ? `${label} is required` : false }}
      render={({ field: { onChange, value } }) => (
        <View style={styles.modalFieldContainer}>
          <Text style={styles.modalFieldLabel}>
            {label} {required && <Text style={styles.required}>*</Text>}
          </Text>
          {viewOnly ? (
            <TextInput
              style={[styles.modalInput, styles.disabledInput]}
              value={value || ""}
              editable={false}
            />
          ) : (
            <PaperProvider theme={CalenderTheme}>
              <DatePickerInput
                style={[
                  styles.modalDateInput,
                  errors[name] && styles.errorInput,
                  disabled && styles.disabledInput,
                ]}
                locale="en"
                label=""
                value={value ? new Date(value) : undefined}
                onChange={(date) =>
                  onChange(date ? formatDateToYYYYMMDD(date) : "")
                }
                inputMode="start"
                saveLabel="Confirm Date"
                mode="outlined"
                outlineColor="#ccc"
                iconColor={Colors.primary}
                activeOutlineColor="#007bff"
                presentationStyle="pageSheet"
                disabled={disabled}
              />
            </PaperProvider>
          )}
          {errors[name] && (
            <Text style={styles.errorText}>{errors[name].message as any}</Text>
          )}
        </View>
      )}
    />
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {viewOnly
                ? "View Item Details"
                : item && Object.keys(item).length > 0
                ? "Edit Item"
                : "Add New Item"}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          {/* {__DEV__ && (
            <View
              style={{ padding: 10, backgroundColor: "#eee", marginBottom: 10 }}
            >
              <Text>Current Item:</Text>
              <Text>{JSON.stringify(item, null, 2)}</Text>
            </View>
          )} */}

          <ScrollView style={styles.modalContent}>
            {/* Charge Item and Equipment */}

            {/* {__DEV__ && (
              <View
                style={{
                  padding: 10,
                  backgroundColor: "#ffffdd",
                  marginBottom: 10,
                }}
              >
                <Text style={{ fontSize: 12 }}>Debug Info:</Text>
                <Text style={{ fontSize: 10 }}>
                  Charge Items: {dropdownData.chargeItems?.length || 0} items
                </Text>
                <Text style={{ fontSize: 10 }}>
                  Equipment: {dropdownData.equipmentList?.length || 0} items
                </Text>
                <Text style={{ fontSize: 10 }}>
                  Maintenance Types:{" "}
                  {dropdownData.maintenanceOccurrenceTypes?.length || 0} items
                </Text>
              </View>
            )} */}
            <View style={styles.modalRow}>
              <View style={styles.modalCol}>
                {renderDropdownField(
                  "chargeItem",
                  "Charge Item",
                  dropdownData.chargeItems || [
                    {
                      label: "Maintenence Charge Item",
                      value: "Maintenence Charge Item",
                    },
                  ],
                  true,
                  viewOnly,
                  dropdownData.chargeItems.isLoading,
                  dropdownData.chargeItems.refetch
                )}
              </View>
            </View>
            <View style={styles.modalRow}>
              <View style={styles.modalCol}>
                {renderDropdownField(
                  "equipment",
                  "Equipment",
                  dropdownData.equipmentList,
                  false,
                  viewOnly,
                  dropdownData.equipmentList.isLoading,
                  dropdownData.equipmentList.refetch
                )}
              </View>
            </View>

            <View style={styles.modalRow}>
              <View style={styles.modalCol}>
                {renderInputField(
                  "quantity",
                  "Quantity",
                  "numeric",
                  true,
                  viewOnly
                )}
              </View>
              <View style={styles.modalCol}>
                {renderDropdownField(
                  "equipmentUsageUnits",
                  "Equip. Usage Units",
                  dropdownData.equipmentUsageUnits,
                  false,
                  shouldEnableUsageUnit,
                  dropdownData.equipmentUsageUnits.isLoading,
                  dropdownData.equipmentUsageUnits.refetch
                )}
              </View>
            </View>

            <View style={styles.modalRow}>
              <View style={styles.modalCol}>
                {renderInputField(
                  "rate",
                  "Rate",
                  "decimal-pad",
                  false,
                  viewOnly
                )}
              </View>
              <View style={styles.modalCol}>
                {renderInputField(
                  "amount",
                  "Amount",
                  "decimal-pad",
                  false,
                  true
                )}
              </View>
            </View>

            <View style={styles.modalRow}>
              <View style={styles.modalCol}>
                {renderDropdownField(
                  "maintenanceOccurrenceType",
                  "Maintenance Occurrence Type",
                  dropdownData.maintenanceOccurrenceTypes,
                  true,
                  viewOnly,
                  dropdownData.maintenanceOccurrenceTypes.isLoading,
                  dropdownData.maintenanceOccurrenceTypes.refetch
                )}
              </View>
              <View style={styles.modalCol}>
                {renderDropdownField(
                  "maintenanceFrequency",
                  "Maintenance Frequency",
                  dropdownData.maintenanceFrequency,
                  !shouldEnableThreshold,
                  viewOnly || shouldEnableThreshold,
                  dropdownData.maintenanceFrequency.isLoading,
                  dropdownData.maintenanceFrequency.refetch
                )}
              </View>
            </View>

            <View style={styles.modalRow}>
              <View style={styles.modalCol}>
                {renderDateField(
                  "maintenanceStartDate",
                  "Maintenance Start Date",
                  true,
                  viewOnly
                )}
              </View>
              <View style={styles.modalCol}>
                {renderDateField(
                  "maintenanceEndDate",
                  "Maintenance End Date",
                  true,
                  viewOnly
                )}
              </View>
            </View>

            <View style={styles.modalRow}>
              <View style={styles.modalCol}>
                {renderDropdownField(
                  "maintenanceInterval",
                  "Maintenance Interval",
                  dropdownData.maintenanceInterval,

                  shouldEnableInterval,
                  viewOnly || !shouldEnableInterval,
                  dropdownData.maintenanceInterval.isLoading,
                  dropdownData.maintenanceInterval.refetch
                )}
              </View>
            </View>

            <View style={styles.modalRow}>
              <View style={styles.modalCol}>
                {renderDropdownField(
                  "maintenanceDay",
                  "Maintenance Day",
                  dropdownData.maintenanceDay,
                  shouldEnableDay,
                  viewOnly || !shouldEnableDay,
                  dropdownData.maintenanceDay.isLoading,
                  dropdownData.maintenanceDay.refetch
                )}
              </View>
              <View style={styles.modalCol}>
                {renderDropdownField(
                  "maintenanceWeekDay",
                  "Maint. Week Day",
                  dropdownData.maintenanceWeekDay,
                  shouldEnableWeekDay,
                  viewOnly || !shouldEnableWeekDay,
                  dropdownData.maintenanceWeekDay.isLoading,
                  dropdownData.maintenanceWeekDay.refetch
                )}
              </View>
            </View>

            <View style={styles.modalRow}>
              <View style={styles.modalCol}>
                {renderDropdownField(
                  "maintenanceMonth",
                  "Maintenance Month",
                  dropdownData.maintenanceMonth,
                  shouldEnableMonth,
                  viewOnly || !shouldEnableMonth,
                  dropdownData.maintenanceMonth.isLoading,
                  dropdownData.maintenanceMonth.refetch
                )}
              </View>
            </View>
            <View style={styles.modalRow}>
              <View style={styles.modalCol}>
                {renderDropdownField(
                  "maintenanceMonthBiQuarterly",
                  "Maintenance Month (Bi-Month/Quarterly)",
                  dropdownData.maintenanceMonthBiQuarterly,
                  shouldEnableBiMonthQuarterly,
                  viewOnly || !shouldEnableBiMonthQuarterly,
                  dropdownData.maintenanceMonthBiQuarterly.isLoading,
                  dropdownData.maintenanceMonthBiQuarterly.refetch
                )}
              </View>
            </View>

            <View style={styles.modalRow}>
              <View style={styles.modalCol}>
                {renderInputField(
                  "maintenanceThreshold",
                  "Maintenance Threshold (Usage Units)",
                  "numeric",
                  shouldEnableThreshold,
                  viewOnly || !shouldEnableThreshold
                )}
              </View>
              <View style={styles.modalCol}>
                {renderInputField(
                  "maintenanceCoverageLimit",
                  "Maintenance Coverage Limit (Usage Units)",
                  "numeric",
                  shouldEnableThreshold,
                  viewOnly || !shouldEnableThreshold
                )}
              </View>
            </View>
          </ScrollView>

          {!viewOnly && (
            <View style={styles.modalFooter}>
              <Pressable
                onPress={handleSubmit(handleSaveItem)}
                style={styles.modalSaveButton}
              >
                <Text>Save</Text>
              </Pressable>
              <Pressable onPress={onClose} style={styles.modalCancelButton}>
                <Text>Cancel</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
    padding: 10,
  },
  heading: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 20,
    color: "#333",
  },
  sectionContainer: {
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
    color: "#333",
  },
  sectionContent: {
    padding: 16,
  },
  row: {
    flexDirection: "row",
    marginBottom: 12,
  },
  col: {
    flex: 1,
    marginRight: 8,
  },
  fieldContainer: {
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
    color: "#666",
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#fff",
    fontSize: 14,
  },
  dateInput: {
    backgroundColor: "transparent",
    width: "100%",
  },
  textArea: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#fff",
    fontSize: 14,
    height: 100,
    textAlignVertical: "top",
  },
  dropdown: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#fff",
  },
  placeholderText: {
    color: "black",
    fontSize: 14,
  },
  selectedText: {
    color: "black",
    fontSize: 14,
  },
  errorInput: {
    borderColor: "#dc3545",
  },
  errorText: {
    color: "#dc3545",
    fontSize: 12,
    marginTop: 2,
  },
  required: {
    color: "#dc3545",
  },
  loadingContainer: {
    paddingVertical: 10,
    alignItems: "center",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
    marginBottom: 40,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 4,
    alignItems: "center",
    marginRight: 12,
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: "#f8f9fa",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 4,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#dee2e6",
  },
  cancelButtonText: {
    color: "#495057",
    fontWeight: "600",
    fontSize: 16,
  },
  backButton: {
    backgroundColor: "#6c757d",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 4,
    alignItems: "center",
  },
  backButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  infoContainer: {
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 4,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  infoTitle: {
    fontWeight: "600",
    fontSize: 14,
    color: "#333",
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: "#666",
  },
  disabledInput: {
    backgroundColor: "#f8f9fa",
    color: "#6c757d",
  },

  itemsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  itemsHeaderText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  addItemButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  addItemText: {
    marginLeft: 4,
    color: Colors.primary,
    fontWeight: "500",
  },
  clearButton: {
    alignSelf: "flex-end",
    marginBottom: 12,
  },
  clearButtonText: {
    color: "#dc3545",
    fontWeight: "500",
    fontSize: 13,
  },
  disabledText: {
    color: "#adb5bd",
  },
  itemsList: {
    marginBottom: 16,
  },
  emptyItemsText: {
    textAlign: "center",
    padding: 20,
    color: "#6c757d",
    fontStyle: "italic",
  },
  itemsTable: {
    borderWidth: 1,
    borderColor: "#dee2e6",
    borderRadius: 4,
  },
  itemsTableHeader: {
    flexDirection: "row",
    backgroundColor: "#f8f9fa",
    borderBottomWidth: 1,
    borderBottomColor: "#dee2e6",
  },
  itemsTableHeaderText: {
    fontWeight: "600",
    color: "#495057",
  },
  itemsTableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    backgroundColor: "#fff",
  },

  itemsTableCell: {
    padding: 10,
    fontSize: 14,
  },
  chargeItemCol: {
    flex: 1,
  },
  equipmentCol: {
    flex: 2,
  },
  typeCol: {
    flex: 2,
  },
  actionCol: {
    flex: 1,
    justifyContent: "center",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  editButton: {
    padding: 4,
  },
  deleteButton: {
    padding: 4,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: 8,
    width: "90%",
    maxWidth: 700,
    maxHeight: "90%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  modalContent: {
    padding: 20,
    maxHeight: 500,
  },
  modalRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  modalCol: {
    flex: 1,
    marginRight: 8,
  },
  modalFieldContainer: {
    marginBottom: 12,
  },
  modalFieldLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
    color: "#666",
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#fff",
    fontSize: 14,
  },
  modalDateInput: {
    width: "100%",
    fontSize: 11,
    backgroundColor: "white",
    color: "black",
  },
  modalDropdown: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#fff",
  },
  disabledDropdown: {
    backgroundColor: "#f8f9fa",
    borderColor: "#dee2e6",
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  modalSaveButton: {
    marginRight: 12,
    backgroundColor: Colors.primary,

    padding: 12,
    borderRadius: 22,
    width: 80,
    color: "#fff",
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCancelButton: {
    borderColor: Colors.primary,
    borderWidth: 1,
    color: "black",
    padding: 12,
    borderRadius: 22,
    width: 80,

    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#28a745",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  createButtonText: {
    color: "#fff",
    fontWeight: "500",
    marginLeft: 4,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#ddd",
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
  },

  loadingText: {
    marginTop: 12,
    color: "#666",
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 12,
    color: "#666",
    fontSize: 16,
    fontWeight: "500",
  },
  emptySubText: {
    color: "#999",
    fontSize: 14,
    marginTop: 8,
  },
  listContainer: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  listHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    backgroundColor: "#f8f9fa",
  },
  listHeaderCell: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
  },
  listHeaderText: {
    fontWeight: "600",
    color: "#333",
    marginRight: 4,
  },
  listItem: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  listCell: {
    padding: 12,
    justifyContent: "center",
  },
  listCellText: {
    color: "#333",
    fontSize: 14,
  },
  docNumberCol: {
    flex: 2,
  },
  customerCol: {
    flex: 3,
  },
  dateCol: {
    flex: 2,
  },
  locationCol: {
    flex: 3,
  },
  statusCol: {
    flex: 2,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  statusOpen: {
    backgroundColor: "#cce5ff",
  },
  statusInProgress: {
    backgroundColor: "#fff3cd",
  },
  statusCompleted: {
    backgroundColor: "#d4edda",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
  },
});

export default CreateJO;
