import { View, Text, TouchableOpacity, StyleSheet, Button } from "react-native";
import React, { useEffect, useState } from "react";
import { FontAwesome5 } from "@expo/vector-icons";
import { Colors } from "@/common/styles";
import { useJobs } from "@/hooks/useJobs";
import { useRoute, useNavigation } from "@react-navigation/native";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useJobSchedule } from "@/hooks/useJobSchedule";
import { authService } from "@/services/authService";
import { useJobStore } from "@/store/globalStore";
import { apiClient } from "@/services/apiClient";
import { useUserData } from "@/hooks/useAuth";

interface StatBoxProps {
  title: string;
  count: string;
  iconName: string;
  onViewDetails: () => void;
}

const StatBox: React.FC<StatBoxProps> = ({
  title,
  count,
  iconName,
  onViewDetails,
}) => {
  return (
    <View style={styles.statBox}>
      <View style={styles.iconContainer}>
        <FontAwesome5 name={iconName} size={24} color={Colors.primary} />
      </View>
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={styles.statCount}>{count}</Text>
      <TouchableOpacity
        onPress={onViewDetails}
        style={styles.viewDetailsButton}
      >
        <Text style={styles.viewDetailsText}>View Details</Text>
      </TouchableOpacity>
    </View>
  );
};

const Dashboard: React.FC = () => {
  const navigation = useNavigation();
  const { jobSchedules, isLoading, error, refetch } = useJobSchedule();

  const { setUser, user } = useJobStore();

  const [consolidatedData, setConsolidatedData] = useState([]);
  const [pendingJobsCount, setPendingJobsCount] = useState(0);
  const [completedJobs, setCompletedJobs] = useState(0);

  const handleViewDetails = (section: string): void => {
    console.log(`View details for ${section}`);
    router.push(`${section}`);
  };
  const { jobs } = useJobs();

  const { data: userData } = useUserData();

  useEffect(() => {
    if (userData) {
      setUser(userData);
      
      // Configure API client with full user data including NetSuite credentials
      if (userData && userData.restletUrl) {
        apiClient.updateConfig(userData);
      }
    }
  }, [userData]);

  const uniqueJobsCount = Array.from(
    new Set(jobs.map((job) => job["Document Number"]).filter(Boolean))
  ).length;

  const pendingShipmentCount = jobs.filter(
    (job) => job["Equipment Status"]?.trim() === "Equipment Pending Maintenance"
  ).length;

  useEffect(() => {
    const groupAndConsolidate = (jobs) => {
      const grouped = {};

      jobs.forEach((item) => {
        const docNumber = item["Document Number"];
        if (!grouped[docNumber]) {
          grouped[docNumber] = [];
        }
        grouped[docNumber].push(item);
      });

      return Object.keys(grouped).map((docNumber) => {
        const entries = grouped[docNumber];
        const mainEntry = { ...entries[0] };

        if (entries.length > 1) {
          mainEntry.ConsolidatedCount = entries.length;

          const scheduledDates = [
            ...new Set(entries.map((e) => e["Scheduled Maintenance Date"])),
          ];
          if (scheduledDates.length > 1) {
            mainEntry["Scheduled Maintenance Date"] = scheduledDates
              .slice(0, 1)
              .join(", ");
          }

          const items = [...new Set(entries.map((e) => e["Item"]))];
          if (items.length > 1) {
            mainEntry["Item"] = items.join(", ");
          }

          const equipment = [...new Set(entries.map((e) => e["Equipment"]))];
          if (equipment.length > 1) {
            mainEntry["Equipment"] = equipment.join(", ");
          }

          const completionDates = entries
            .map((e) => e["Maintenance Completion Date"])
            .filter((date) => date && date.length > 0);

          if (completionDates.length > 0) {
            mainEntry["Maintenance Completion Date"] = completionDates
              .slice(0, 1)
              .join(", ");
          }

          const allStatuses = [
            ...new Set(entries.map((e) => e["Overall Job Status"])),
          ];
          if (allStatuses.length > 1) {
            mainEntry["Overall Job Status"] = "Mixed Status";
          }
        }

        return mainEntry;
      });
    };

    const notStartedJobs = jobSchedules.filter(
      (job) => job["Overall Job Status"] === "Not Started"
    );
    const completedJobs = jobSchedules.filter(
      (job) => job["Overall Job Status"] === "Completed"
    );

    const consolidatedPending = groupAndConsolidate(notStartedJobs);
    const consolidatedCompleted = groupAndConsolidate(completedJobs);

    // setConsolidatedData(consolidatedPending);
    setPendingJobsCount(consolidatedPending.length);

    // setConsolidatedData1(consolidatedCompleted);
    setCompletedJobs(consolidatedCompleted.length);
  }, [jobSchedules]);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View
        style={{
          backgroundColor: "#fff",
          borderRadius: 12,
          padding: 20,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 5,
          borderWidth: 1,
          borderColor: Colors.primary,
          marginVertical: 20,
        }}
      >
        <Text
          style={{
            fontSize: 18,
            fontWeight: "600",
            color: Colors.primary,
            marginBottom: 8,
          }}
        >
          Name: {user?.name}
        </Text>
        <Text
          style={{
            fontSize: 16,
            fontWeight: "500",
            color: "#333",
          }}
        >
          Role: {user?.role}
        </Text>
      </View>

      <View style={styles.row}>
        <StatBox
          title="Total Job Orders"
          count={String(uniqueJobsCount)}
          iconName="file-alt"
          onViewDetails={() => handleViewDetails("/(drawer)/maintenanceJOList")}
        />
        <StatBox
          title="Pending Shipments"
          count={String(pendingShipmentCount)}
          iconName="shipping-fast"
          onViewDetails={() => handleViewDetails("/(drawer)/shipEquipment")}
        />
      </View>

      <View style={styles.row}>
        <StatBox
          title="Pending Jobs"
          count={String(pendingJobsCount)}
          iconName="clock"
          onViewDetails={() => handleViewDetails("/(drawer)/pendingJobs")}
        />
        <StatBox
          title="Completed Jobs"
          count={String(completedJobs)}
          iconName="check-circle"
          onViewDetails={() => handleViewDetails("/CompletedJobs")}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: Colors.borderColor,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  statBox: {
    backgroundColor: Colors.primaryBackground,
    borderRadius: 10,
    padding: 16,
    width: "48%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    marginBottom: 12,
  },
  statTitle: {
    fontSize: 14,
    color: Colors.darkBackground,
    marginBottom: 6,
  },
  statCount: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.darkBackground,
    marginBottom: 12,
  },
  viewDetailsButton: {
    paddingVertical: 6,
  },
  viewDetailsText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: "500",
  },
});

export default Dashboard;
