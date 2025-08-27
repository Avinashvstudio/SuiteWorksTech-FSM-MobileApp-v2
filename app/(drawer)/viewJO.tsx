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
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import { Dropdown } from "react-native-element-dropdown";
import { Entypo, Ionicons } from "@expo/vector-icons";
import { DatePickerInput } from "react-native-paper-dates";
import { Provider as PaperProvider, Button } from "react-native-paper";
import { useDropdownData } from "@/hooks/useDropDownList";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useJobs } from "@/hooks/useJobs";
import { Colors } from "@/common/styles";

const MaintenanceJobOrder = () => {
  const route: any = useRoute();
  const navigation = useNavigation();
  const { jobs, isLoading: jobsLoading } = useJobs();
  const viewOnly = route.params?.viewOnly || false;
  const jobData = transformJobData(route.params?.jobData || {});

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm({
    defaultValues: jobData,
  });

  const [expandedSections, setExpandedSections] = useState({
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
  const locations = useDropdownData("getLocations");
  const serviceOrders = useDropdownData("getSO");
  const departments = useDropdownData("getDepartments");
  const equipmentList = useDropdownData("getlist_Equipment");

  const maintenanceOccurrenceTypes = useDropdownData(
    "getlist_Maintenance Occurrence Type"
  );
  const maintenanceFrequency = useDropdownData("getlist_Billing Cycle");
  const maintenanceInterval = useDropdownData("getlist_Billing Interval");
  const maintenanceDay = useDropdownData("getlist_Billing Day");
  const maintenanceWeekDay = useDropdownData("getlist_Billing Week Day");
  const maintenanceMonth = useDropdownData("getlist_Billing Month");
  const chargeItems = useDropdownData("getChargeItems");
  const maintenanceMonthBiQuarterly = useDropdownData(
    "getlist_Billing Months for Bi-mon/qtr"
  );
  const equipmentUsageUnits = useDropdownData("getlist_Equipment Usage Units");
  const dropdownPlaceholder = { label: "Select an option", value: "" };

  // console.log(
  //   "fe",
  //   chargeItems.items.map((item) => ({
  //     label: item.label,
  //     value: item.value,
  //   }))
  // );

  // console.log("fefewfwa", maintenanceFrequency);

  const jobDocNumber = useMemo(() => jobData?.documentNumber, [jobData]);
  useEffect(() => {
    if (viewOnly && jobs && jobs.length > 0 && jobDocNumber) {
      const jobItems = jobs.filter(
        (job) => job["Document Number"] === jobDocNumber
      );

      const transformedItems: any = jobItems.map((job) => {
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
          rate: job["Item Rate"] || "",
          amount: job["Amount"] || "",
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
    } else if (!viewOnly && jobData.items && jobData.items.length > 0) {
      setItems(jobData.items);
    }
  }, [viewOnly, jobs, jobDocNumber]);

  useEffect(() => {
    if (Object.keys(jobData).length > 0) {
      Object.keys(jobData).forEach((key) => {
        if (key !== "items") {
          setValue(
            key as keyof typeof jobData,
            jobData[key as keyof typeof jobData]
          );
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
      amount: data["Amount"] || "",
      rate: data["Item Rate"] || "",
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

  const toggleSection = (section: SectionKey) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const onSubmit = (data: any) => {
    const formData = {
      ...data,
      items: items,
    };
    console.log("Form submitted:", formData);
    navigation.goBack();
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

  type SectionKey = keyof typeof expandedSections;

  const renderSection = (title: any, sectionKey: SectionKey, content: any) => (
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

  const renderTextField = (
    name: FormFieldKeys,
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
              styles.textInput,
              errors[name as keyof typeof errors] && styles.errorInput,
              viewOnly && styles.disabledInput,
            ]}
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            editable={!viewOnly}
          />
          {errors[name as keyof typeof errors] && !viewOnly && (
            <Text style={styles.errorText}>
              {(errors as any)[name]?.message}
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
  type FormFieldKeys =
    | "documentNumber"
    | "customer"
    | "date"
    | "memo"
    | "equipmentStatus"
    | "postingPeriod"
    | "opportunity"
    | "rentalSalesOrder"
    | "department"
    | "location"
    | "class"
    | "maintenanceType"
    | "technicianAssigned"
    | "technicianType"
    | "includedMaintenance"
    | "instructions"
    | "exclusions"
    | "amount"
    | "rate"
    | "items";

  const renderDateField = (
    name: FormFieldKeys,
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
          if (typeof value === "string" && (value as string).includes("/")) {
            const [month, day, year] = (value as string).split("/");
            dateValue = new Date(
              `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
            );
          } else {
            dateValue = new Date(value as string);
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
              <DatePickerInput
                style={[styles.dateInput, errors[name] && styles.errorInput]}
                locale="en"
                label=""
                value={isValidDate ? dateValue : undefined}
                onChange={(date) =>
                  onChange(date ? date.toISOString().split("T")[0] : "")
                }
                inputMode="start"
                mode="outlined"
                outlineColor="#ccc"
                activeOutlineColor="#007bff"
                disabled={viewOnly}
              />
            )}
            {errors[name] && !viewOnly && (
              <Text style={styles.errorText}>
                {(errors as any)[name]?.message}
              </Text>
            )}
          </View>
        );
      }}
    />
  );

  const renderDropdown = (
    name: FormFieldKeys,
    label: any,
    items: any,
    required = false,
    isLoading = false
  ) => (
    <Controller
      control={control}
      name={name}
      rules={{ required: required ? `${label} is required` : false }}
      render={({ field: { onChange, value } }) => (
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>
            {label} {required && <Text style={styles.required}>*</Text>}
          </Text>
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
            <Dropdown
              style={[styles.dropdown, errors[name] && styles.errorInput]}
              placeholderStyle={styles.placeholderText}
              selectedTextStyle={styles.selectedText}
              data={items}
              labelField="label"
              valueField="value"
              placeholder={dropdownPlaceholder.label}
              value={value}
              onChange={(item) => onChange(item.value)}
              search
              searchPlaceholder="Search..."
              disable={viewOnly}
            />
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

  const renderTextArea = (name: any, label: any, required = false) => (
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
              errors[name as FormFieldKeys] && styles.errorInput,
              viewOnly && styles.disabledInput,
            ]}
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            multiline
            numberOfLines={4}
            editable={!viewOnly}
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

  // Form sections
  const primaryInfoContent = (
    <View>
      <View style={styles.row}>
        <View style={styles.col}>
          {renderTextField("documentNumber", "Document #")}
        </View>
      </View>
      <View style={styles.row}>
        <View style={styles.col}>
          {renderDropdown(
            "customer",
            "Customer",
            customers.items,
            true,
            customers.isLoading
          )}
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.col}>{renderDateField("date", "Date", true)}</View>
        <View style={styles.col}>{renderTextArea("memo", "Memo")}</View>
      </View>

      <View style={styles.row}>
        <View style={styles.col}>
          {renderDropdown("equipmentStatus", "Equipment Status", [
            { label: "Active", value: "active" },
            { label: "Inactive", value: "inactive" },
            { label: "Under Maintenance", value: "maintenance" },
          ])}
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.col}>
          {renderDropdown(
            "postingPeriod",
            "Posting Period",
            [
              { label: "January 2025", value: "jan2025" },
              { label: "February 2025", value: "feb2025" },
              { label: "March 2025", value: "mar2025" },
              { label: "April 2025", value: "apr2025" },
            ],
            true
          )}
        </View>
      </View>
    </View>
  );

  const salesInfoContent = (
    <View>
      <View style={styles.row}>
        <View style={styles.col}>
          {renderDropdown("opportunity", "Opportunity", [
            { label: "Opportunity 1", value: "opp1" },
            { label: "Opportunity 2", value: "opp2" },
          ])}
        </View>
        <View style={styles.col}>
          {renderDropdown(
            "rentalSalesOrder",
            "Rental Sales Order #",
            serviceOrders.items,
            false,
            serviceOrders.isLoading
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
            departments.items,
            false,
            departments.isLoading
          )}
        </View>
        <View style={styles.col}>
          {renderDropdown(
            "location",
            "Location",
            locations.items,
            true,
            locations.isLoading
          )}
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.col}>
          {renderDropdown("class", "Class", [
            { label: "Class A", value: "classA" },
            { label: "Class B", value: "classB" },
            { label: "Class C", value: "classC" },
          ])}
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
            [
              { label: "Reactive", value: "reactive" },
              { label: "Preventive", value: "preventive" },
            ],
            true
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
            employees.isLoading
          )}
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.col}>
          {renderDropdown(
            "technicianType",
            "Technician Type",
            [
              { label: "Mechanical", value: "mechanical" },
              { label: "Electrical", value: "electrical" },
              { label: "General", value: "general" },
            ],
            true
          )}
        </View>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>Reactive Maintenance:</Text>
        <Text style={styles.infoText}>
          Equipment is sent out for maintenance and returned after maintenance
          is completed. It requires inventory movement.
        </Text>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>Preventive Maintenance:</Text>
        <Text style={styles.infoText}>
          Equipment remains at the customer location once it is sold to them.
          The company performs only preventive maintenance service. There is no
          movement of inventory.
        </Text>
      </View>
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
                  {item.equipment || "-"}
                </Text>
                <Text style={[styles.itemsTableCell, styles.typeCol]}>
                  {item.maintenanceType || "-"}
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

        {!viewOnly && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSubmit(onSubmit)}
            >
              <Text style={styles.saveButtonText}>Save</Text>
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
          })),
          equipmentList: equipmentList.items.map((item) => ({
            label: item.label,
            value: item.value,
          })),
          maintenanceOccurrenceTypes: maintenanceOccurrenceTypes.items.map(
            (item) => ({ label: item.label, value: item.value })
          ),
          maintenanceFrequency: maintenanceFrequency.items.map((item) => ({
            label: item.label,
            value: item.value,
          })),
          maintenanceInterval: maintenanceInterval.items.map((item) => ({
            label: item.label,
            value: item.value,
          })),
          maintenanceDay: maintenanceDay.items.map((item) => ({
            label: item.label,
            value: item.value,
          })),
          maintenanceWeekDay: maintenanceWeekDay.items.map((item) => ({
            label: item.label,
            value: item.value,
          })),
          maintenanceMonth: maintenanceMonth.items.map((item) => ({
            label: item.label,
            value: item.value,
          })),
          maintenanceMonthBiQuarterly: maintenanceMonthBiQuarterly.items.map(
            (item) => ({ label: item.label, value: item.value })
          ),
          equipmentUsageUnits: equipmentUsageUnits.items.map((item) => ({
            label: item.label,
            value: item.value,
          })),
        }}
        isLoading={{
          chargeItems: chargeItems.isLoading,
          equipmentList: equipmentList.isLoading,
          maintenanceOccurrenceTypes: maintenanceOccurrenceTypes.isLoading,
          maintenanceFrequency: maintenanceFrequency.isLoading,
          maintenanceInterval: maintenanceInterval.isLoading,
          maintenanceDay: maintenanceDay.isLoading,
          maintenanceWeekDay: maintenanceWeekDay.isLoading,
          maintenanceMonth: maintenanceMonth.isLoading,
          maintenanceMonthBiQuarterly: maintenanceMonthBiQuarterly.isLoading,
          equipmentUsageUnits: equipmentUsageUnits.isLoading,
        }}
        viewOnly={viewOnly}
      />
    </PaperProvider>
  );
};

const ItemModal = ({
  visible,
  item,
  onClose,
  onSave,
  dropdownData,
  isLoading,
  viewOnly,
}: any) => {
  const defaultValues = useMemo(() => {
    return {
      chargeItem: "",
      equipment: "",
      quantity: "1",
      equipmentUsageUnits: "",
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
      reset(defaultValues);
    } else {
      reset(defaultValues);
    }
  }, [item, reset, defaultValues]);

  const maintenanceOccurrenceType = watch("maintenanceOccurrenceType");
  const maintenanceFrequency = watch("maintenanceFrequency");
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
    shouldEnableFrequency && [2, 1].includes(maintenanceFrequency);
  const shouldEnableMonth =
    shouldEnableFrequency && [2, 3, 4, 1].includes(maintenanceFrequency);
  const shouldEnableBiMonthQuarterly =
    shouldEnableFrequency && [3, 4, 1].includes(maintenanceFrequency);

  const handleSaveItem = (data: any) => {
    console.log("Saving item with data:", data);
    console.log("Dropdown data:", dropdownData);

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
      chargeItemLabel,
      equipmentLabel,
      maintenanceOccurrenceTypeLabel,
    };

    console.log("Final saved data:", savedData);
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

        console.log("Rendering Input Field:", name, { value });

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
                {typeof errors[name]?.message === "string"
                  ? errors[name]?.message
                  : ""}
              </Text>
            )}
          </View>
        );
      }}
    />
  );

  const renderDropdownField = (
    name: any,
    labe: any,
    items = [],
    required = false,
    disabled = false,
    loading = false
  ) => {
    // console.log(`Rendering dropdown: ${name}`, {
    //   itemsLength: items?.length || 0,
    //   loading,
    //   disabled,
    //   value: watch(name),
    // });

    return (
      <Controller
        control={control}
        name={name}
        rules={{ required: required ? `${labe} is required` : false }}
        render={({ field: { onChange, value } }) => (
          <View style={styles.modalFieldContainer}>
            <Text style={styles.modalFieldLabel}>
              {labe} {required && <Text style={styles.required}>*</Text>}
            </Text>
            {viewOnly ? (
              <TextInput
                style={[styles.modalInput, styles.disabledInput]}
                value={
                  labe === "Charge Item"
                    ? "Maintenence Charge Item"
                    : value || ""
                }
                editable={false}
              />
            ) : loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#007bff" />
              </View>
            ) : (
              <Dropdown
                style={[
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
            )}
            {errors[name] && (
              <Text style={styles.errorText}>
                {typeof errors[name]?.message === "string"
                  ? errors[name]?.message
                  : ""}
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
                onChange(date ? date.toISOString().split("T")[0] : null)
              }
              inputMode="start"
              mode="outlined"
              outlineColor="#ccc"
              activeOutlineColor="#007bff"
              disabled={disabled}
            />
          )}
          {errors[name] && (
            <Text style={styles.errorText}>
              {typeof errors[name]?.message === "string"
                ? errors[name]?.message
                : ""}
            </Text>
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
                  isLoading?.chargeItems
                )}
              </View>
            </View>
            <View style={styles.modalRow}>
              <View style={styles.modalCol}>
                {renderDropdownField(
                  "equipment",
                  "Equipment",
                  dropdownData.equipmentList || [
                    {
                      label: "Watch - Model 12X00A",
                      value: "Watch - Model 12X00A",
                    },
                    {
                      label: "Safe patient handling tools",
                      value: "Safe patient handling tools",
                    },
                    {
                      label: "Main spring",
                      value: "Main spring",
                    },
                  ],
                  // true,
                  viewOnly,
                  isLoading?.equipmentList
                )}
              </View>
            </View>

            {/* Quantity and Usage Units */}
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
                  "Equipment Usage Units",
                  dropdownData.equipmentUsageUnits,
                  false,
                  viewOnly,
                  isLoading.equipmentUsageUnits
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
                  isLoading.maintenanceOccurrenceTypes
                )}
              </View>
              <View style={styles.modalCol}>
                {renderDropdownField(
                  "maintenanceFrequency",
                  "Maintenance Frequency",
                  dropdownData.maintenanceFrequency,
                  !shouldEnableThreshold,
                  viewOnly || shouldEnableThreshold,
                  isLoading.maintenanceFrequency
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
                  isLoading.maintenanceInterval
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
                  isLoading.maintenanceDay
                )}
              </View>
              <View style={styles.modalCol}>
                {renderDropdownField(
                  "maintenanceWeekDay",
                  "Maintenance Week Day",
                  dropdownData.maintenanceWeekDay,
                  shouldEnableWeekDay,
                  viewOnly || !shouldEnableWeekDay,
                  isLoading.maintenanceWeekDay
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
                  isLoading.maintenanceMonth
                )}
              </View>
              <View style={styles.modalCol}>
                {renderDropdownField(
                  "maintenanceMonthBiQuarterly",
                  "Maintenance Month (Bi-Month/Quarterly)",
                  dropdownData.maintenanceMonthBiQuarterly,
                  shouldEnableBiMonthQuarterly,
                  viewOnly || !shouldEnableBiMonthQuarterly,
                  isLoading.maintenanceMonthBiQuarterly
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
              <Button
                mode="contained"
                onPress={handleSubmit(handleSaveItem)}
                style={styles.modalSaveButton}
              >
                Save
              </Button>
              <Button
                mode="outlined"
                onPress={onClose}
                style={styles.modalCancelButton}
              >
                Cancel
              </Button>
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
    padding: 16,
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
    justifyContent: "flex-end",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  modalSaveButton: {
    marginRight: 12,
    backgroundColor: Colors.primary,
    color: "white",
  },
  modalCancelButton: {
    borderColor: Colors.primary,
    color: "black",
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
  // loadingContainer: {
  //   flex: 1,
  //   justifyContent: "center",
  //   alignItems: "center",
  // },
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

export default MaintenanceJobOrder;
