import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useRoute, RouteProp } from "@react-navigation/native";

import {
  MaterialIcons,
  Ionicons,
  FontAwesome5,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { useJobs } from "@/hooks/useJobs";
import { StatusBar } from "expo-status-bar";
import { Colors } from "@/common/styles";
import { useNavigation } from "expo-router";

type ViewJobScheduleRouteParams = {
  scheduleData?: Record<string, any>;
};

const ViewJobSchedule = () => {
  const navigation = useNavigation();
  const route =
    useRoute<RouteProp<{ params: ViewJobScheduleRouteParams }, "params">>();
  const jobScheduleData = route.params?.scheduleData || {};
  const { jobs, isLoading } = useJobs();

  const [isPrimaryInfoExpanded, setIsPrimaryInfoExpanded] = useState(true);
  const [isClassificationExpanded, setIsClassificationExpanded] =
    useState(true);
  const [isJobOrderExpanded, setIsJobOrderExpanded] = useState(true);
  const [jobDetails, setJobDetails] = useState<Record<string, any> | null>(
    null
  );

  useEffect(() => {
    if (
      jobs &&
      jobs.length > 0 &&
      jobScheduleData["Equipment Maintenance Job Order #"]
    ) {
      const matchingJob: any = jobs.find(
        (job) =>
          job["Document Number"] ===
          jobScheduleData["Equipment Maintenance Job Order #"]
      );
      setJobDetails(matchingJob);
    }
  }, [jobs, jobScheduleData]);

  const toggleSection = (section: any) => {
    switch (section) {
      case "primary":
        setIsPrimaryInfoExpanded(!isPrimaryInfoExpanded);
        break;
      case "classification":
        setIsClassificationExpanded(!isClassificationExpanded);
        break;
      case "jobOrder":
        setIsJobOrderExpanded(!isJobOrderExpanded);
        break;
      default:
        break;
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }
  const handleGoBack = () => {
    navigation.goBack();
  };

  return (
    <ScrollView style={styles.container}>
      <StatusBar style="light" />

      <View
        style={{
          backgroundColor: Colors.primary,
          justifyContent: "center",
          alignItems: "flex-start",
          padding: 22,
        }}
      >
        <View
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "flex-start",
            alignItems: "flex-end",
            marginTop: 7,
            gap: 16,
          }}
        >
          <TouchableOpacity onPress={handleGoBack}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text
            style={{
              color: "white",
              fontSize: 22,
              fontWeight: "500",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            Job Schedule
          </Text>
        </View>
      </View>
      <View style={styles.header}>
        <MaterialCommunityIcons
          name="calendar-clock"
          size={24}
          color="#45668e"
        />
        <Text style={styles.headerTitle}>Maintenance Job Schedule</Text>
      </View>

      <View style={styles.customerHeader}>
        <Text style={styles.documentNumber}>
          {jobScheduleData["Document Number"] || "122"}
        </Text>
        <Text style={styles.customerName}>
          {jobScheduleData["Customer Name"] || "CUST03 PrecisionTime Co."}
        </Text>
      </View>

      <View style={styles.section}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => toggleSection("primary")}
        >
          <MaterialIcons
            name={isPrimaryInfoExpanded ? "expand-more" : "chevron-right"}
            size={24}
            color="white"
          />
          <Text style={styles.sectionTitle}>Primary Information</Text>
        </TouchableOpacity>

        {isPrimaryInfoExpanded && (
          <View style={styles.sectionContent}>
            <View style={styles.row}>
              <View style={styles.column}>
                <Text style={styles.label}>DOCUMENT #</Text>
                <Text style={styles.value}>
                  {jobScheduleData["Document Number"] || " "}
                </Text>
              </View>
              <View style={styles.column}>
                <Text style={styles.label}>DATE</Text>
                <Text style={styles.value}>
                  {jobScheduleData["Date"] || "04/27/2025"}
                </Text>
              </View>
              <View style={styles.column}>
                <Text style={styles.label}>OVERALL JOB STATUS</Text>
                <Text style={styles.value}>
                  {jobScheduleData["Overall Job Status"] || "Not Started"}
                </Text>
              </View>
            </View>
            <View style={styles.row}>
              <View style={styles.column}>
                <Text style={styles.label}>CUSTOMER</Text>
                <Text style={styles.value}>
                  {jobScheduleData["Customer Name"] ||
                    "CUST03 PrecisionTime Co."}
                </Text>
              </View>
              <View style={styles.column}>
                <Text style={styles.label}>MEMO</Text>
                <Text style={styles.value}>
                  {jobDetails?.["Memo (Main)"] || ""}
                </Text>
              </View>
              <View style={styles.column}></View>
            </View>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => toggleSection("classification")}
        >
          <MaterialIcons
            name={isClassificationExpanded ? "expand-more" : "chevron-right"}
            size={24}
            color="white"
          />
          <Text style={styles.sectionTitle}>Classification</Text>
        </TouchableOpacity>

        {isClassificationExpanded && (
          <View style={styles.sectionContent}>
            <View style={styles.row}>
              <View style={styles.column}>
                <Text style={styles.label}>DEPARTMENT</Text>
                <Text style={styles.value}>{jobDetails?.Department || ""}</Text>
              </View>
              <View style={styles.column}>
                <Text style={styles.label}>CLASS</Text>
                <Text style={styles.value}>{jobDetails?.Class || ""}</Text>
              </View>
              <View style={styles.column}>
                <Text style={styles.label}>LOCATION</Text>
                <Text style={styles.value}>
                  {jobScheduleData["Location"] || "US Warehouse"}
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => toggleSection("jobOrder")}
        >
          <MaterialIcons
            name={isJobOrderExpanded ? "expand-more" : "chevron-right"}
            size={24}
            color="white"
          />
          <Text style={styles.sectionTitle}>
            Equipment Maintenance Job Order
          </Text>
        </TouchableOpacity>

        {isJobOrderExpanded && (
          <View style={styles.sectionContent}>
            <View style={styles.row}>
              <View style={styles.column}>
                <Text style={styles.label}>OPPORTUNITY</Text>
                <Text style={styles.value}>{jobDetails?.Item || ""}</Text>
              </View>
              <View style={styles.column}>
                <Text style={styles.label}>INCLUDED MAINTENANCE</Text>
                <Text style={styles.value}>
                  {jobDetails?.["Included Maintenance"] || "Test"}
                </Text>
              </View>
              <View style={styles.column}>
                <Text style={styles.label}>INSTRUCTIONS/SPECIFICATIONS</Text>
                <Text style={styles.value}>
                  {jobDetails?.["Instructions/Specifications"] || "Test"}
                </Text>
              </View>
            </View>
            <View style={styles.row}>
              <View style={styles.column}>
                <Text style={styles.label}>RENTAL SALES ORDER #</Text>
                <Text style={styles.value}>
                  {jobDetails?.["Rental Sales Order #"] || ""}
                </Text>
              </View>
              <View style={styles.column}>
                <Text style={styles.label}>EXCLUSIONS</Text>
                <Text style={styles.value}>
                  {jobDetails?.Exclusions || "Test"}
                </Text>
              </View>
              <View style={styles.column}>
                <Text style={styles.label}>TECHNICAL TYPE</Text>
                <Text style={styles.value}>
                  {jobScheduleData["Technician Type"] || "In House"}
                </Text>
              </View>
            </View>
            <View style={styles.row}>
              <View style={styles.column}>
                <Text style={styles.label}>
                  EQUIPMENT MAINTENANCE JOB ORDER #
                </Text>
                <Text style={styles.value}>
                  {jobScheduleData["Equipment Maintenance Job Order #"] ||
                    "Equip Maintenance Job Order #EQJOB65"}
                </Text>
              </View>
              <View style={styles.column}></View>
              <View style={styles.column}>
                <Text style={styles.label}>ASSIGNED TECHNICIAN</Text>
                <Text style={styles.value}>
                  {jobScheduleData["Assigned Technician"] ||
                    "Santosh V Santosh V"}
                </Text>
              </View>
            </View>
            <View style={styles.row}>
              <View style={styles.column}>
                <Text style={styles.label}>MAINTENANCE OCCURRENCE TYPE</Text>
                <Text style={styles.value}>
                  {jobScheduleData["Maintenance Occurrence Type"] ||
                    "Recurring"}
                </Text>
              </View>
              <View style={styles.column}></View>
              <View style={styles.column}></View>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    padding: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#45668e",
    marginLeft: 8,
  },
  customerHeader: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 4,
    marginBottom: 10,
    borderColor: "#ddd",
    borderWidth: 1,
  },
  documentNumber: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  customerName: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: "row",
    marginBottom: 10,
    alignItems: "center",
    marginLeft: 10,
  },
  actionButton: {
    backgroundColor: "#fff",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginRight: 10,
    borderColor: "#ddd",
    borderWidth: 1,
  },
  actionButtonText: {
    color: "#333",
    fontSize: 14,
  },
  iconButtons: {
    flexDirection: "row",
    marginLeft: "auto",
  },
  iconButton: {
    padding: 6,
    marginLeft: 8,
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 4,
    marginBottom: 10,
    overflow: "hidden",
    borderColor: "#ddd",
    borderWidth: 1,
    padding: 10,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: Colors.primary,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "white",
  },
  sectionContent: {
    padding: 12,
  },
  row: {
    flexDirection: "row",
    marginBottom: 12,
  },
  column: {
    flex: 1,
    marginRight: 10,
  },
  label: {
    fontSize: 12,
    color: "#888",
    marginBottom: 4,
  },
  value: {
    fontSize: 14,
    color: "#333",
  },
});

export default ViewJobSchedule;
