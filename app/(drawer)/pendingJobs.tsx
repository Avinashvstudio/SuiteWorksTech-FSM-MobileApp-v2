import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  StyleSheet,
} from "react-native";
import { DataTable, Provider as PaperProvider } from "react-native-paper";
import { Colors } from "@/common/styles";
import { useJobSchedule, JobSchedule } from "@/hooks/useJobSchedule";
import { Dropdown } from "react-native-element-dropdown";
// import DateTimePicker from "@react-native-community/datetimepicker";
import { useNavigation } from "@react-navigation/native";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import Entypo from "@expo/vector-icons/Entypo";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import Feather from "@expo/vector-icons/Feather";
import { useJobStore } from "@/store/globalStore";

interface Filters {
  status: string;
  name: string;
  item: string;
  equipment: string;
  scheduledDateStart: string;
  scheduledDateEnd: string;
}

const PendingJobs = () => {
  const navigation = useNavigation();
  const { jobSchedules, isLoading, error, refetch } = useJobSchedule();
  const [filteredSchedules, setFilteredSchedules] = useState<JobSchedule[]>([]);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [isFilterCollapsed, setIsFilterCollapsed] = useState(true);
  const [filters, setFilters] = useState<Filters>({
    status: "",
    name: "",
    item: "",
    equipment: "",
    scheduledDateStart: "",
    scheduledDateEnd: "",
  });

  // Define a type for user with at least a 'role' property
  interface User {
    role?: string;
    // add other properties as needed
  }

  const { user } = useJobStore() as { user: User };

  const [page, setPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [itemsPerPageList] = useState([5, 10, 20]);
  const [isAscending, setIsAscending] = useState<boolean>(false);

  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const { setPendingJobs } = useJobStore();

  // const handleNavigateToJobSchedule = (scheduleData) => {
  //   navigation.navigate("PerformJob", {
  //     scheduleData,
  //     viewOnly: true,
  //   });
  // };
  const handlePerformJob = (scheduleData: any) => {
    (navigation as any).navigate("PerformJob", {
      scheduleData,
      viewOnly: true,
    });
  };
  const handleReassignJob = (scheduleData: any) => {
    (navigation as any).navigate("ReassignTech", {
      scheduleData,
      viewOnly: true,
    });
  };

  const [consolidatedData, setConsolidatedData] = useState<any[]>([]);

  useEffect(() => {
    const notStartedJobs = jobSchedules.filter(
      (job) =>
        job["Overall Job Status"] === "Not Started" ||
        job["Overall Job Status"] === "Started"
    );

    const groupedByDocNumber: any = {};

    notStartedJobs.forEach((item) => {
      const docNumber = item["Document Number"];
      if (typeof docNumber === "undefined") {
        return;
      }

      if (!groupedByDocNumber[docNumber]) {
        groupedByDocNumber[docNumber] = [];
      }

      groupedByDocNumber[docNumber].push(item);
    });

    const consolidated = Object.keys(groupedByDocNumber).map((docNumber) => {
      const entries = groupedByDocNumber[docNumber];
      const mainEntry = { ...entries[0] };

      if (entries.length > 1) {
        mainEntry.ConsolidatedCount = entries.length;

        const scheduledDates = [
          ...new Set(entries.map((e: any) => e["Scheduled Maintenance Date"])),
        ];
        if (scheduledDates.length > 1) {
          mainEntry["Scheduled Maintenance Date"] = scheduledDates
            .slice(0, 1)
            .join(", ");
        }

        const items = [...new Set(entries.map((e: any) => e["Item"]))];
        if (items.length > 1) {
          mainEntry["Item"] = items.join(", ");
        }

        const equipment = [...new Set(entries.map((e: any) => e["Equipment"]))];
        if (equipment.length > 1) {
          mainEntry["Equipment"] = equipment.join(", ");
        }

        const completionDates = entries
          .map((e: any) => e["Maintenance Completion Date"])
          .filter((date: any) => date && date.length > 0);

        if (completionDates.length > 0) {
          mainEntry["Maintenance Completion Date"] = completionDates
            .slice(0, 1)
            .join(", ");
        }

        const allStatuses = [
          ...new Set(entries.map((e: any) => e["Overall Job Status"])),
        ];
        if (allStatuses.length > 1) {
          mainEntry["Overall Job Status"] = "Mixed Status";
        }
      }

      return mainEntry;
    });

    setConsolidatedData(consolidated);
    setPendingJobs(consolidatedData.length);
  }, [jobSchedules]);

  console.log(consolidatedData.length);

  const uniqueStatuses = React.useMemo(() => {
    const statuses = Array.from(
      new Set(
        consolidatedData
          .map((schedule) => schedule["Overall Job Status"])
          .filter(Boolean)
      )
    );

    console.log("status", statuses);
    return [
      { label: "All Statuses", value: "" },
      ...statuses.map((status) => ({ label: status, value: status })),
    ];
  }, [consolidatedData]);

  const uniqueNames = React.useMemo(() => {
    const names = Array.from(
      new Set(
        consolidatedData
          .map((schedule) => schedule["Customer Name"])
          .filter(Boolean)
      )
    );
    return [
      { label: "All Customers", value: "" },
      ...names.map((name) => ({ label: name, value: name })),
    ];
  }, [consolidatedData]);

  const uniqueLocation = React.useMemo(() => {
    const items = Array.from(
      new Set(
        consolidatedData.map((schedule) => schedule["Location"]).filter(Boolean)
      )
    );
    return [
      { label: "All Locations", value: "" },
      ...items.map((item) => ({ label: item, value: item })),
    ];
  }, [consolidatedData]);

  const uniqueTechs = React.useMemo(() => {
    const equipment = Array.from(
      new Set(
        consolidatedData
          .map((schedule) => schedule["Assigned Technician"])
          .filter(Boolean)
      )
    );
    return [
      { label: "All Technicians", value: "" },
      ...equipment.map((item) => ({ label: item, value: item })),
    ];
  }, [consolidatedData]);

  const getFilteredSchedules = React.useCallback(() => {
    let results = [...consolidatedData];

    if (filters.status) {
      results = results.filter((schedule) =>
        (schedule["Overall Job Status"] as string)?.includes(filters.status)
      );
    }

    if (filters.name) {
      results = results.filter((schedule) =>
        (schedule["Customer Name"] as string)?.includes(filters.name)
      );
    }

    if (filters.item) {
      results = results.filter((schedule) =>
        (schedule["Location"] as string)?.includes(filters.item)
      );
    }

    if (filters.equipment) {
      results = results.filter((schedule) =>
        (schedule["Assigned Technician"] as string)?.includes(filters.equipment)
      );
    }

    if (filters.scheduledDateStart) {
      results = results.filter((schedule) => {
        if (!schedule["Scheduled Maintenance Date"]) return false;

        // Parse MM/DD/YYYY format
        const scheduleDateParts = (
          schedule["Scheduled Maintenance Date"] as string
        ).split("/");
        const filterDateParts = filters.scheduledDateStart.split("/");

        // Create dates (month is 0-indexed in JavaScript)
        const scheduleDate = new Date(
          parseInt(scheduleDateParts[2]), // year
          parseInt(scheduleDateParts[0]) - 1, // month (0-indexed)
          parseInt(scheduleDateParts[1]) // day
        );

        const filterDate = new Date(
          parseInt(filterDateParts[2]), // year
          parseInt(filterDateParts[0]) - 1, // month (0-indexed)
          parseInt(filterDateParts[1]) // day
        );

        // Reset time portion for comparison
        scheduleDate.setHours(0, 0, 0, 0);
        filterDate.setHours(0, 0, 0, 0);

        return (
          !isNaN(scheduleDate.getTime()) &&
          !isNaN(filterDate.getTime()) &&
          scheduleDate >= filterDate
        );
      });
    }

    if (filters.scheduledDateEnd) {
      results = results.filter((schedule) => {
        if (!schedule["Scheduled Maintenance Date"]) return false;

        // Parse MM/DD/YYYY format
        const scheduleDateParts = (
          schedule["Scheduled Maintenance Date"] as string
        ).split("/");
        const filterDateParts = filters.scheduledDateEnd.split("/");

        // Create dates (month is 0-indexed in JavaScript)
        const scheduleDate = new Date(
          parseInt(scheduleDateParts[2]), // year
          parseInt(scheduleDateParts[0]) - 1, // month (0-indexed)
          parseInt(scheduleDateParts[1]) // day
        );

        const filterDate = new Date(
          parseInt(filterDateParts[2]), // year
          parseInt(filterDateParts[0]) - 1, // month (0-indexed)
          parseInt(filterDateParts[1]) // day
        );

        // Reset time portion for comparison
        scheduleDate.setHours(0, 0, 0, 0);
        filterDate.setHours(0, 0, 0, 0);

        return (
          !isNaN(scheduleDate.getTime()) &&
          !isNaN(filterDate.getTime()) &&
          scheduleDate <= filterDate
        );
      });
    }

    return results;
  }, [filters, consolidatedData]);

  const applyFilters = () => {
    setFilteredSchedules(getFilteredSchedules());
  };

  useEffect(() => {
    setPage(0);
  }, [filters]);

  useEffect(() => {
    applyFilters();
  }, [getFilteredSchedules]);

  useEffect(() => {
    if (consolidatedData.length > 0) {
      setFilteredSchedules(consolidatedData);
    }
  }, [consolidatedData.length]);

  const resetFilters = () => {
    setStartDate(null);
    setEndDate(null);
    setFilters({
      status: "",
      name: "",
      item: "",
      equipment: "",
      scheduledDateStart: "",
      scheduledDateEnd: "",
    });
  };

  const from = page * itemsPerPage;
  const to = Math.min((page + 1) * itemsPerPage, filteredSchedules.length);

  const paginatedSchedules = isAscending
    ? [...filteredSchedules].slice(from, to)
    : [...filteredSchedules].reverse().slice(from, to);

  const getStatusColor = (status: string) => {
    if (!status) return "#6c757d";
    if (status.includes("Completed")) return "#28a745";
    if (status === "Not Started") return "#007bff";
    return "#6c757d";
  };

  const FiltersSection = () => (
    <View style={[styles.filtersContainer, isFilterCollapsed && styles.hidden]}>
      <View style={styles.filterGrid}>
        <View style={styles.filterColumn}>
          <Text style={styles.filterLabel}>Status:</Text>
          <Dropdown
            style={styles.dropdown}
            data={uniqueStatuses}
            labelField="label"
            valueField="value"
            placeholder="Select Status"
            value={filters.status}
            onChange={(item) =>
              setFilters((prev) => ({ ...prev, status: item.value }))
            }
            maxHeight={300}
            itemTextStyle={{ fontSize: 12 }}
            selectedTextStyle={{ fontSize: 14 }}
          />
        </View>

        <View style={styles.filterColumn}>
          <Text style={styles.filterLabel}>Customer Name:</Text>
          <Dropdown
            style={styles.dropdown}
            data={uniqueNames}
            labelField="label"
            valueField="value"
            placeholder="Select Name"
            value={filters.name}
            onChange={(item) =>
              setFilters((prev) => ({ ...prev, name: item.value }))
            }
            maxHeight={300}
            search
            itemTextStyle={{ fontSize: 12 }}
            selectedTextStyle={{ fontSize: 14 }}
          />
        </View>

        <View style={styles.filterColumn}>
          <Text style={styles.filterLabel}>Location:</Text>
          <Dropdown
            style={styles.dropdown}
            data={uniqueLocation}
            labelField="label"
            valueField="value"
            placeholder="Select Item"
            value={filters.item}
            onChange={(item) =>
              setFilters((prev) => ({ ...prev, item: item.value }))
            }
            maxHeight={300}
            search
            itemTextStyle={{ fontSize: 12 }}
            selectedTextStyle={{ fontSize: 14 }}
          />
        </View>
      </View>

      <View style={styles.filterGrid}>
        <View style={styles.filterColumn}>
          <Text style={styles.filterLabel}>Technicians:</Text>
          <Dropdown
            style={styles.dropdown}
            data={uniqueTechs}
            labelField="label"
            valueField="value"
            placeholder="Select Equipment"
            value={filters.equipment}
            onChange={(item) =>
              setFilters((prev) => ({ ...prev, equipment: item.value }))
            }
            maxHeight={300}
            search
            itemTextStyle={{ fontSize: 12 }}
            selectedTextStyle={{ fontSize: 14 }}
          />
        </View>

        {/* <View style={[styles.filterColumn, { alignItems: "center" }]}>
          <Text style={styles.filterLabel}>Schedule After:</Text>

          <DateTimePicker
            value={startDate || new Date()}
            mode="date"
            display="default"
            onChange={(event, date) => {
              setShowStartDatePicker(false);
              if (event.type === "set" && date) {
                setStartDate(date);

                // Format date as MM/DD/YYYY for API
                const month = String(date.getMonth() + 1).padStart(2, "0");
                const day = String(date.getDate()).padStart(2, "0");
                const year = date.getFullYear();
                const formattedDate = `${month}/${day}/${year}`;

                setFilters((prev) => ({
                  ...prev,
                  scheduledDateStart: formattedDate,
                }));
              }
            }}
          />
        </View> */}

        {/* <View style={[styles.filterColumn, { alignItems: "center" }]}>
          <Text style={styles.filterLabel}>Schedule Before:</Text>

          <DateTimePicker
            value={endDate || new Date()}
            mode="date"
            display="default"
            onChange={(event, date) => {
              setShowEndDatePicker(false);
              if (event.type === "set" && date) {
                setEndDate(date);

                // Format date as MM/DD/YYYY for API
                const month = String(date.getMonth() + 1).padStart(2, "0");
                const day = String(date.getDate()).padStart(2, "0");
                const year = date.getFullYear();
                const formattedDate = `${month}/${day}/${year}`;

                setFilters((prev) => ({
                  ...prev,
                  scheduledDateEnd: formattedDate,
                }));
              }
            }}
          />
        </View> */}
      </View>

      <View style={styles.filterGrid}>
        <View style={[styles.filterColumn, styles.buttonColumn]}>
          <TouchableOpacity style={styles.resetButton} onPress={resetFilters}>
            <Text style={styles.resetButtonText}>Reset Filters</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const JobScheduleContent = () => {
    if (isLoading && filteredSchedules.length === 0) {
      return (
        <View style={styles.container}>
          <Text style={styles.loadingText}>Loading pending jobs</Text>
        </View>
      );
    }

    if (error && filteredSchedules.length === 0) {
      return (
        <View style={styles.container}>
          <Text style={styles.errorText}>
            Error loading job schedules: {error.message}
          </Text>
          <TouchableOpacity style={styles.button} onPress={() => refetch()}>
            <Text style={styles.buttonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <TouchableOpacity
            style={styles.filterToggleButton}
            onPress={() => setIsFilterCollapsed(!isFilterCollapsed)}
          >
            <Ionicons
              name={isFilterCollapsed ? "filter" : "filter-outline"}
              size={18}
              color="white"
            />
            <Text style={styles.filterToggleText}>
              {isFilterCollapsed ? " Filters" : " Hide"}
            </Text>
          </TouchableOpacity>
        </View>

        <FiltersSection />

        <View style={styles.tableContainer}>
          <ScrollView
            refreshControl={
              <RefreshControl refreshing={isLoading} onRefresh={refetch} />
            }
          >
            <View style={styles.tableRow}>
              {/* Fixed Document Number Column */}
              <View style={styles.fixedColumnContainer}>
                <DataTable>
                  <DataTable.Header style={styles.tableHeader}>
                    <DataTable.Title
                      style={styles.jobNumberColumn}
                      onPress={() => setIsAscending((prev) => !prev)}
                    >
                      <Text style={styles.headerText}>
                        Doc #{" "}
                        <AntDesign
                          name={isAscending ? "caretup" : "caretdown"}
                          size={16}
                          style={{ marginTop: 4, marginLeft: 6 }}
                        />
                      </Text>
                    </DataTable.Title>
                  </DataTable.Header>

                  {paginatedSchedules.length > 0 ? (
                    paginatedSchedules.map((item, index) => {
                      const uniqueKey = `fixed-${index}-${item["Document Number"]}`;
                      return (
                        <DataTable.Row key={uniqueKey} style={styles.dataRow}>
                          <DataTable.Cell style={styles.jobNumberColumn}>
                            <Text style={styles.jobNumberText}>
                              {item["Document Number"]}
                            </Text>
                          </DataTable.Cell>
                        </DataTable.Row>
                      );
                    })
                  ) : (
                    <DataTable.Row style={styles.emptyRow}>
                      <DataTable.Cell>
                        <Text style={styles.emptyText}>No Schedules</Text>
                      </DataTable.Cell>
                    </DataTable.Row>
                  )}
                </DataTable>
              </View>

              {/* Scrollable columns */}
              <ScrollView horizontal style={styles.scrollableContainer}>
                <DataTable>
                  <DataTable.Header style={styles.tableHeader}>
                    {/* <DataTable.Title style={styles.jobNumberColumn}>
                      <Text style={styles.headerText}>View</Text>
                    </DataTable.Title> */}
                    <DataTable.Title style={styles.column}>
                      <Text style={styles.headerText}>Perform Job</Text>
                    </DataTable.Title>
                    {user?.role === "Manager" && (
                      <DataTable.Title style={[styles.column, { width: 150 }]}>
                        <Text style={styles.headerText}>
                          Reassign Technician
                        </Text>
                      </DataTable.Title>
                    )}

                    {/* <DataTable.Title style={styles.column}>
                      <Text style={styles.headerText}>Internal ID</Text>
                    </DataTable.Title> */}
                    <DataTable.Title style={styles.nameColumn}>
                      <Text style={styles.headerText}>Customer Name</Text>
                    </DataTable.Title>
                    <DataTable.Title style={styles.column}>
                      <Text style={styles.headerText}>Date</Text>
                    </DataTable.Title>
                    <DataTable.Title style={styles.column}>
                      <Text style={styles.headerText}>Job Status</Text>
                    </DataTable.Title>
                    <DataTable.Title style={styles.column}>
                      <Text style={styles.headerText}>Occurrence Type</Text>
                    </DataTable.Title>
                    <DataTable.Title style={[styles.locationColumn, {}]}>
                      <Text style={styles.headerText}>Location</Text>
                    </DataTable.Title>
                    <DataTable.Title style={styles.column}>
                      <Text style={styles.headerText}>Assigned Technician</Text>
                    </DataTable.Title>
                    <DataTable.Title style={styles.column}>
                      <Text style={styles.headerText}>Technician Type</Text>
                    </DataTable.Title>
                  </DataTable.Header>

                  {paginatedSchedules.length > 0 ? (
                    paginatedSchedules.map((item, index) => {
                      const uniqueKey = `scrollable-${index}-${item["Document Number"]}`;
                      return (
                        <DataTable.Row
                          key={uniqueKey}
                          style={styles.dataRow}
                          // onPress={() => handleNavigateToJobSchedule(item)}
                        >
                          {/* <DataTable.Cell style={styles.jobNumberColumn}>
                            <Entypo
                              name="eye"
                              size={24}
                              color={Colors.primary}
                            />
                          </DataTable.Cell> */}
                          <DataTable.Cell
                            style={styles.column}
                            onPress={() => handlePerformJob(item)}
                          >
                            <Feather
                              name="user-check"
                              size={24}
                              color={Colors.primary}
                            />
                          </DataTable.Cell>
                          {user?.role === "Manager" && (
                            <DataTable.Cell
                              style={[styles.column, { width: 150 }]}
                              onPress={() => handleReassignJob(item)}
                            >
                              <FontAwesome5
                                name="users-cog"
                                size={24}
                                color={Colors.primary}
                              />
                            </DataTable.Cell>
                          )}

                          {/* <DataTable.Cell style={styles.column}>
                            <Text>{item["Internal ID"]}</Text>
                          </DataTable.Cell> */}
                          <DataTable.Cell style={styles.nameColumn}>
                            <Text>{item["Customer Name"]}</Text>
                          </DataTable.Cell>
                          <DataTable.Cell style={styles.column}>
                            <Text>{item["Date"]}</Text>
                          </DataTable.Cell>
                          <DataTable.Cell style={styles.column}>
                            <Text>{item["Overall Job Status"]}</Text>
                          </DataTable.Cell>
                          <DataTable.Cell style={styles.column}>
                            <Text>{item["Maintenance Occurrence Type"]}</Text>
                          </DataTable.Cell>
                          <DataTable.Cell style={styles.locationColumn}>
                            <Text>{item["Location"]}</Text>
                          </DataTable.Cell>
                          <DataTable.Cell style={styles.column}>
                            <Text>{item["Assigned Technician"]}</Text>
                          </DataTable.Cell>
                          <DataTable.Cell style={styles.column}>
                            <Text>{item["Technician Type"] || "N/A"}</Text>
                          </DataTable.Cell>
                        </DataTable.Row>
                      );
                    })
                  ) : (
                    <DataTable.Row style={styles.emptyRow}>
                      <DataTable.Cell>
                        <Text style={styles.emptyText}>
                          No job schedules match the filter criteria
                        </Text>
                      </DataTable.Cell>
                    </DataTable.Row>
                  )}
                </DataTable>
              </ScrollView>
            </View>
          </ScrollView>
        </View>

        {/* Pagination controls */}
        <View style={styles.paginationContainer}>
          <View style={styles.itemsPerPageSelector}>
            <Dropdown
              style={styles.itemsDropdown}
              data={itemsPerPageList.map((value) => ({
                label: String(value),
                value,
              }))}
              labelField="label"
              valueField="value"
              placeholder="10"
              value={itemsPerPage}
              onChange={(item) => setItemsPerPage(item.value)}
              maxHeight={150}
              selectedTextStyle={{ color: "white" }}
              iconStyle={{ tintColor: "white" }}
            />
          </View>

          <DataTable.Pagination
            page={page}
            numberOfPages={Math.ceil(filteredSchedules.length / itemsPerPage)}
            onPageChange={setPage}
            label={`${from + 1}-${to} of ${filteredSchedules.length}`}
            showFastPaginationControls
            theme={{
              colors: {
                primary: Colors.primary,
              },
            }}
          />
        </View>
      </View>
    );
  };

  return (
    <PaperProvider>
      <JobScheduleContent />
    </PaperProvider>
  );
};

const styles = StyleSheet.create({
  datePickerButton: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    padding: 10,
    width: "100%",
    alignItems: "flex-start",
  },
  container: {
    flex: 1,
    padding: 8,
    backgroundColor: "#f5f5f5",
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.primary,
  },
  filterToggleButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 5,
    flexDirection: "row",
    alignItems: "center",
  },
  filterToggleText: {
    color: "white",
    fontWeight: "500",
  },
  filtersContainer: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  hidden: {
    display: "none",
  },
  filterGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 9,
  },
  filterColumn: {
    flex: 1,
    marginHorizontal: 4,
  },
  buttonColumn: {
    justifyContent: "flex-end",
  },
  filterLabel: {
    fontSize: 12,
    marginBottom: 4,
    color: "#555",
  },
  dropdown: {
    height: 40,
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 8,
  },
  datePicker: {
    height: 40,
    backgroundColor: "white",
    fontSize: 8,
    padding: 0,
    color: Colors.primary,
  },
  resetButton: {
    backgroundColor: "#f0f0f0",
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 5,
    height: 35,
    justifyContent: "center",
    padding: 8,
    alignItems: "center",
    marginTop: 16,
    marginLeft: 8,
  },
  resetButtonText: {
    color: "#666",
  },
  tableContainer: {
    flex: 1,
    backgroundColor: "white",
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    overflow: "hidden",
  },
  tableRow: {
    flexDirection: "row",
  },
  fixedColumnContainer: {
    width: 100,
    zIndex: 1,
    backgroundColor: "white",
    borderRightWidth: 1,
    borderRightColor: "#eee",
  },
  scrollableContainer: {
    flex: 1,
  },
  dataTable: {
    backgroundColor: "white",
  },
  tableHeader: {
    backgroundColor: Colors.primary,
  },
  headerText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
  },
  dataRow: {
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    minHeight: 48,
    height: 50,
  },
  column: {
    justifyContent: "center",
    width: 110,
  },
  nameColumn: {
    width: 180,
  },
  jobNumberColumn: {
    width: 70,
    justifyContent: "center",
  },
  dateColumn: {
    width: 110,
  },
  customerColumn: {
    width: 180,
  },
  locationColumn: {
    width: 170,
    paddingLeft: 10,
  },
  orderColumn: {
    width: 100,
  },
  technicianColumn: {
    width: 150,
  },
  equipmentColumn: {
    width: 200,
  },
  quantityColumn: {
    width: 60,
  },
  typeColumn: {
    width: 150,
  },
  statusColumn: {
    width: 150,
    textAlign: "left",
    alignItems: "flex-start",
  },
  jobNumberText: {
    fontWeight: "600",
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    backgroundColor: "white",
    alignItems: "flex-start",
    justifyContent: "flex-start",
  },
  statusText: {
    color: "black",
    textAlign: "left",
    fontSize: 12,
    alignItems: "flex-start",
    justifyContent: "flex-start",
  },
  emptyRow: {
    height: 100,
    backgroundColor: "white",
  },
  loadingText: {
    marginTop: 10,
    textAlign: "center",
  },
  errorText: {
    color: "red",
    textAlign: "center",
    marginBottom: 16,
  },
  button: {
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignSelf: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.primary,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  itemsPerPageSelector: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
  },
  itemsDropdown: {
    height: 30,
    width: 60,
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 4,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
});

export default PendingJobs;

// import { View, Text } from "react-native";
// import React from "react";
// import { useJobs } from "@/hooks/useJobs";

// const pendingJobs = () => {
//   const csf = [
//     {
//       "Equipment Maintenance JO #": "1",
//       "Date ": "10/23/2024 ",
//       "Customer ": "CUST01 ASL Cloud Tech ",
//       "Rental Sales Order # ": "Sales Order #SO04 ",
//       "Technician Assigned ": "EMP02 ",
//       "Equipment ": "Main spring ",
//       "Quantity ": "1 ",
//       "Maintenance Occurrence Type ": " ",
//       "Maintenance Start date ": "11/08/2024 ",
//       "Maintenance End date ": "03/04/2028 ",
//       "Equipment Status ": "Equipment Pending Maintenance ",
//     },
//   ];

//   const list = [
//     {
//       "Equipment Maintenance JO #  ": "1  ",
//       "Date  ": "10/23/2024  ",
//       "Customer  ": "CUST01 ASL Cloud Tech  ",
//       "Rental Sales Order #  ": "Sales Order #SO04  ",
//       "Technician Assigned  ": "EMP02  ",
//       "Equipment  ": "Main spring  ",
//       "Quantity  ": "1  ",
//       "Maintenance Occurrence Type  ": "  ",
//       "Maintenance Start date  ": "11/08/2024  ",
//       "Maintenance End date  ": "03/04/2028  ",
//       "Equipment Status  ": "Equipment Pending Maintenance  ",
//     },
//     {
//       "Equipment Maintenance JO #  ": "EQJOB02  ",
//       "Date  ": "11/11/2024  ",
//       "Customer  ": "CUST01 ASL Cloud Tech  ",
//       "Rental Sales Order #  ": "Sales Order #SO04  ",
//       "Technician Assigned  ": "EMP02  ",
//       "Equipment  ": "Test Inventory Item 8  ",
//       "Quantity  ": "1  ",
//       "Maintenance Occurrence Type  ": "  ",
//       "Maintenance Start date  ": "01/01/2025  ",
//       "Maintenance End date  ": "11/30/2027  ",
//       "Equipment Status  ": "Equipment Under Maintenance  ",
//     },
//     {
//       "Equipment Maintenance JO #  ": "EQJOB02  ",
//       "Date  ": "11/11/2024  ",
//       "Customer  ": "CUST01 ASL Cloud Tech  ",
//       "Rental Sales Order #  ": "Sales Order #SO04  ",
//       "Technician Assigned  ": "EMP02  ",
//       "Equipment  ": "Main spring  ",
//       "Quantity  ": "1  ",
//       "Maintenance Occurrence Type  ": "  ",
//       "Maintenance Start date  ": "11/01/2024  ",
//       "Maintenance End date  ": "04/18/2025  ",
//       "Equipment Status  ": "Equipment Under Maintenance  ",
//     },
//     {
//       "Equipment Maintenance JO #  ": "EQJOB03  ",
//       "Date  ": "11/15/2024  ",
//       "Customer  ": "CUST01 ASL Cloud Tech  ",
//       "Rental Sales Order #  ": "Sales Order #SO04  ",
//       "Technician Assigned  ": "EMP02  ",
//       "Equipment  ": "Main spring  ",
//       "Quantity  ": "1  ",
//       "Maintenance Occurrence Type  ": "One-time  ",
//       "Maintenance Start date  ": "01/01/2025  ",
//       "Maintenance End date  ": "12/31/2026  ",
//       "Equipment Status  ": "Equipment Maintenance Completed  ",
//     },
//     {
//       "Equipment Maintenance JO #  ": "EQJOB03  ",
//       "Date  ": "11/15/2024  ",
//       "Customer  ": "CUST01 ASL Cloud Tech  ",
//       "Rental Sales Order #  ": "Sales Order #SO04  ",
//       "Technician Assigned  ": "EMP02  ",
//       "Equipment  ": "Test Inventory Item 8  ",
//       "Quantity  ": "1  ",
//       "Maintenance Occurrence Type  ": "Recurring  ",
//       "Maintenance Start date  ": "11/15/2024  ",
//       "Maintenance End date  ": "03/21/2025  ",
//       "Equipment Status  ": "Equipment Maintenance Completed  ",
//     },
//     {
//       "Equipment Maintenance JO #  ": "EQJOB03  ",
//       "Date  ": "11/15/2024  ",
//       "Customer  ": "CUST01 ASL Cloud Tech  ",
//       "Rental Sales Order #  ": "Sales Order #SO04  ",
//       "Technician Assigned  ": "EMP02  ",
//       "Equipment  ": "  ",
//       "Quantity  ": "1  ",
//       "Maintenance Occurrence Type  ": "  ",
//       "Maintenance Start date  ": "  ",
//       "Maintenance End date  ": "  ",
//       "Equipment Status  ": "  ",
//     },
//     {
//       "Equipment Maintenance JO #  ": "EQJOB03  ",
//       "Date  ": "11/15/2024  ",
//       "Customer  ": "CUST01 ASL Cloud Tech  ",
//       "Rental Sales Order #  ": "Sales Order #SO04  ",
//       "Technician Assigned  ": "EMP02  ",
//       "Equipment  ": "  ",
//       "Quantity  ": "-1  ",
//       "Maintenance Occurrence Type  ": "  ",
//       "Maintenance Start date  ": "  ",
//       "Maintenance End date  ": "  ",
//       "Equipment Status  ": "  ",
//     },
//     {
//       "Equipment Maintenance JO #  ": "EQJOB03  ",
//       "Date  ": "11/15/2024  ",
//       "Customer  ": "CUST01 ASL Cloud Tech  ",
//       "Rental Sales Order #  ": "Sales Order #SO04  ",
//       "Technician Assigned  ": "EMP02  ",
//       "Equipment  ": "Main spring  ",
//       "Quantity  ": "1  ",
//       "Maintenance Occurrence Type  ": "Recurring  ",
//       "Maintenance Start date  ": "11/04/2024  ",
//       "Maintenance End date  ": "11/30/2024  ",
//       "Equipment Status  ": "Equipment Maintenance Completed  ",
//     },
//     {
//       "Equipment Maintenance JO #  ": "EQJOB03  ",
//       "Date  ": "11/15/2024  ",
//       "Customer  ": "CUST01 ASL Cloud Tech  ",
//       "Rental Sales Order #  ": "Sales Order #SO04  ",
//       "Technician Assigned  ": "EMP02  ",
//       "Equipment  ": "Test Inventory Item 10  ",
//       "Quantity  ": "1  ",
//       "Maintenance Occurrence Type  ": "One-time  ",
//       "Maintenance Start date  ": "12/12/2024  ",
//       "Maintenance End date  ": "12/04/2024  ",
//       "Equipment Status  ": "Equipment Under Maintenance  ",
//     },
//     {
//       "Equipment Maintenance JO #  ": "EQJOB03  ",
//       "Date  ": "11/15/2024  ",
//       "Customer  ": "CUST01 ASL Cloud Tech  ",
//       "Rental Sales Order #  ": "Sales Order #SO04  ",
//       "Technician Assigned  ": "EMP02  ",
//       "Equipment  ": "Test Inventory Item 8  ",
//       "Quantity  ": "1  ",
//       "Maintenance Occurrence Type  ": "One-time  ",
//       "Maintenance Start date  ": "12/17/2024  ",
//       "Maintenance End date  ": "07/17/2025  ",
//       "Equipment Status  ": "Equipment Maintenance Completed  ",
//     },
//     {
//       "Equipment Maintenance JO #  ": "EQJOB03  ",
//       "Date  ": "11/15/2024  ",
//       "Customer  ": "CUST01 ASL Cloud Tech  ",
//       "Rental Sales Order #  ": "Sales Order #SO04  ",
//       "Technician Assigned  ": "EMP02  ",
//       "Equipment  ": "Main spring  ",
//       "Quantity  ": "1  ",
//       "Maintenance Occurrence Type  ": "Usage Based  ",
//       "Maintenance Start date  ": "12/03/2024  ",
//       "Maintenance End date  ": "12/27/2024  ",
//       "Equipment Status  ": "Equipment Maintenance Completed  ",
//     },
//     {
//       "Equipment Maintenance JO #  ": "EQJOB04  ",
//       "Date  ": "11/16/2024  ",
//       "Customer  ": "CUST01 ASL Cloud Tech  ",
//       "Rental Sales Order #  ": "Sales Order #SO04  ",
//       "Technician Assigned  ": "EMP02  ",
//       "Equipment  ": "Main spring  ",
//       "Quantity  ": "1  ",
//       "Maintenance Occurrence Type  ": "Recurring  ",
//       "Maintenance Start date  ": "01/01/2025  ",
//       "Maintenance End date  ": "12/31/2026  ",
//       "Equipment Status  ": "Equipment Pending Maintenance  ",
//     },
//     {
//       "Equipment Maintenance JO #  ": "EQJOB05  ",
//       "Date  ": "11/16/2024  ",
//       "Customer  ": "CUST01 ASL Cloud Tech  ",
//       "Rental Sales Order #  ": "Sales Order #SO04  ",
//       "Technician Assigned  ": "EMP02  ",
//       "Equipment  ": "Main spring  ",
//       "Quantity  ": "1  ",
//       "Maintenance Occurrence Type  ": "Recurring  ",
//       "Maintenance Start date  ": "01/01/2025  ",
//       "Maintenance End date  ": "12/31/2026  ",
//       "Equipment Status  ": "Equipment Pending Maintenance  ",
//     },
//     {
//       "Equipment Maintenance JO #  ": "EQJOB06  ",
//       "Date  ": "11/18/2024  ",
//       "Customer  ": "CUST01 ASL Cloud Tech  ",
//       "Rental Sales Order #  ": "Sales Order #SO04  ",
//       "Technician Assigned  ": "EMP02  ",
//       "Equipment  ": "Main spring  ",
//       "Quantity  ": "1  ",
//       "Maintenance Occurrence Type  ": "Recurring  ",
//       "Maintenance Start date  ": "01/01/2025  ",
//       "Maintenance End date  ": "12/31/2026  ",
//       "Equipment Status  ": "Equipment Pending Maintenance  ",
//     },
//     {
//       "Equipment Maintenance JO #  ": "EQJOB07  ",
//       "Date  ": "11/18/2024  ",
//       "Customer  ": "CUST01 ASL Cloud Tech  ",
//       "Rental Sales Order #  ": "Sales Order #SO04  ",
//       "Technician Assigned  ": "EMP02  ",
//       "Equipment  ": "Main spring  ",
//       "Quantity  ": "1  ",
//       "Maintenance Occurrence Type  ": "Recurring  ",
//       "Maintenance Start date  ": "11/01/2024  ",
//       "Maintenance End date  ": "11/30/2024  ",
//       "Equipment Status  ": "Equipment Pending Maintenance  ",
//     },
//     {
//       "Equipment Maintenance JO #  ": "EQJOB08  ",
//       "Date  ": "11/19/2024  ",
//       "Customer  ": "CUST02 Test Customer 14  ",
//       "Rental Sales Order #  ": "   ",
//       "Technician Assigned  ": "  ",
//       "Equipment  ": "Safe patient handling tools  ",
//       "Quantity  ": "1  ",
//       "Maintenance Occurrence Type  ": "Recurring  ",
//       "Maintenance Start date  ": "12/31/2024  ",
//       "Maintenance End date  ": "06/06/2026  ",
//       "Equipment Status  ": "Equipment Pending Maintenance  ",
//     },
//     {
//       "Equipment Maintenance JO #  ": "EQJOB09  ",
//       "Date  ": "11/23/2024  ",
//       "Customer  ": "CUST01 ASL Cloud Tech  ",
//       "Rental Sales Order #  ": "Sales Order #SO04  ",
//       "Technician Assigned  ": "EMP02  ",
//       "Equipment  ": "Main spring  ",
//       "Quantity  ": "1  ",
//       "Maintenance Occurrence Type  ": "Recurring  ",
//       "Maintenance Start date  ": "11/01/2024  ",
//       "Maintenance End date  ": "11/30/2024  ",
//       "Equipment Status  ": "Equipment Pending Maintenance  ",
//     },
//     {
//       "Equipment Maintenance JO #  ": "EQJOB10  ",
//       "Date  ": "11/24/2024  ",
//       "Customer  ": "CUST02 Test Customer 14  ",
//       "Rental Sales Order #  ": "   ",
//       "Technician Assigned  ": "  ",
//       "Equipment  ": "Balance wheel  ",
//       "Quantity  ": "1  ",
//       "Maintenance Occurrence Type  ": "Recurring  ",
//       "Maintenance Start date  ": "02/01/2024  ",
//       "Maintenance End date  ": "12/31/2024  ",
//       "Equipment Status  ": "Equipment Pending Maintenance  ",
//     },
//     {
//       "Equipment Maintenance JO #  ": "EQJOB11  ",
//       "Date  ": "11/26/2024  ",
//       "Customer  ": "CUST01 ASL Cloud Tech  ",
//       "Rental Sales Order #  ": "Sales Order #SO02  ",
//       "Technician Assigned  ": "Santosh V  ",
//       "Equipment  ": "Safe patient handling tools  ",
//       "Quantity  ": "1  ",
//       "Maintenance Occurrence Type  ": "Recurring  ",
//       "Maintenance Start date  ": "05/05/2023  ",
//       "Maintenance End date  ": "12/31/2027  ",
//       "Equipment Status  ": "Equipment Under Maintenance  ",
//     },
//     {
//       "Equipment Maintenance JO #  ": "EQJOB11  ",
//       "Date  ": "11/26/2024  ",
//       "Customer  ": "CUST01 ASL Cloud Tech  ",
//       "Rental Sales Order #  ": "Sales Order #SO02  ",
//       "Technician Assigned  ": "Santosh V  ",
//       "Equipment  ": "Main spring  ",
//       "Quantity  ": "1  ",
//       "Maintenance Occurrence Type  ": "Recurring  ",
//       "Maintenance Start date  ": "01/01/2023  ",
//       "Maintenance End date  ": "12/31/2023  ",
//       "Equipment Status  ": "Equipment Under Maintenance  ",
//     },
//     {
//       "Equipment Maintenance JO #  ": "EQJOB12  ",
//       "Date  ": "11/26/2024  ",
//       "Customer  ": "CUST01 ASL Cloud Tech  ",
//       "Rental Sales Order #  ": "   ",
//       "Technician Assigned  ": "  ",
//       "Equipment  ": "Balance wheel  ",
//       "Quantity  ": "1  ",
//       "Maintenance Occurrence Type  ": "Recurring  ",
//       "Maintenance Start date  ": "03/03/2024  ",
//       "Maintenance End date  ": "03/03/2027  ",
//       "Equipment Status  ": "Equipment Maintenance Completed  ",
//     },
//     {
//       "Equipment Maintenance JO #  ": "EQJOB12  ",
//       "Date  ": "11/26/2024  ",
//       "Customer  ": "CUST01 ASL Cloud Tech  ",
//       "Rental Sales Order #  ": "   ",
//       "Technician Assigned  ": "  ",
//       "Equipment  ": "Battery  ",
//       "Quantity  ": "1  ",
//       "Maintenance Occurrence Type  ": "Recurring  ",
//       "Maintenance Start date  ": "01/01/2023  ",
//       "Maintenance End date  ": "12/31/2023  ",
//       "Equipment Status  ": "Equipment Maintenance Completed  ",
//     },
//     {
//       "Equipment Maintenance JO #  ": "EQJOB13  ",
//       "Date  ": "11/29/2024  ",
//       "Customer  ": "CUST02 Test Customer 14  ",
//       "Rental Sales Order #  ": "   ",
//       "Technician Assigned  ": "  ",
//       "Equipment  ": "Main spring  ",
//       "Quantity  ": "1  ",
//       "Maintenance Occurrence Type  ": "Recurring  ",
//       "Maintenance Start date  ": "01/01/2024  ",
//       "Maintenance End date  ": "12/31/2024  ",
//       "Equipment Status  ": "Equipment Pending Maintenance  ",
//     },
//     {
//       "Equipment Maintenance JO #  ": "EQJOB13  ",
//       "Date  ": "11/29/2024  ",
//       "Customer  ": "CUST02 Test Customer 14  ",
//       "Rental Sales Order #  ": "   ",
//       "Technician Assigned  ": "  ",
//       "Equipment  ": "Test Inventory Item 10  ",
//       "Quantity  ": "1  ",
//       "Maintenance Occurrence Type  ": "Recurring  ",
//       "Maintenance Start date  ": "01/01/2024  ",
//       "Maintenance End date  ": "12/31/2024  ",
//       "Equipment Status  ": "Equipment Under Maintenance  ",
//     },
//     {
//       "Equipment Maintenance JO #  ": "EQJOB13  ",
//       "Date  ": "11/29/2024  ",
//       "Customer  ": "CUST02 Test Customer 14  ",
//       "Rental Sales Order #  ": "   ",
//       "Technician Assigned  ": "  ",
//       "Equipment  ": "Battery  ",
//       "Quantity  ": "1  ",
//       "Maintenance Occurrence Type  ": "Recurring  ",
//       "Maintenance Start date  ": "01/01/2024  ",
//       "Maintenance End date  ": "12/31/2024  ",
//       "Equipment Status  ": "Equipment Pending Maintenance  ",
//     },
//     {
//       "Equipment Maintenance JO #  ": "EQJOB14  ",
//       "Date  ": "11/29/2024  ",
//       "Customer  ": "CUST01 ASL Cloud Tech  ",
//       "Rental Sales Order #  ": "   ",
//       "Technician Assigned  ": "  ",
//       "Equipment  ": "Main spring  ",
//       "Quantity  ": "1  ",
//       "Maintenance Occurrence Type  ": "Recurring  ",
//       "Maintenance Start date  ": "01/01/2024  ",
//       "Maintenance End date  ": "12/31/2024  ",
//       "Equipment Status  ": "Equipment Maintenance Completed  ",
//     },
//     {
//       "Equipment Maintenance JO #  ": "EQJOB14  ",
//       "Date  ": "11/29/2024  ",
//       "Customer  ": "CUST01 ASL Cloud Tech  ",
//       "Rental Sales Order #  ": "   ",
//       "Technician Assigned  ": "  ",
//       "Equipment  ": "Battery  ",
//       "Quantity  ": "1  ",
//       "Maintenance Occurrence Type  ": "Recurring  ",
//       "Maintenance Start date  ": "01/01/2024  ",
//       "Maintenance End date  ": "12/31/2024  ",
//       "Equipment Status  ": "Equipment Maintenance Completed  ",
//     },
//     {
//       "Equipment Maintenance JO #  ": "EQJOB14  ",
//       "Date  ": "11/29/2024  ",
//       "Customer  ": "CUST01 ASL Cloud Tech  ",
//       "Rental Sales Order #  ": "   ",
//       "Technician Assigned  ": "  ",
//       "Equipment  ": "Test Inventory Item 7  ",
//       "Quantity  ": "1  ",
//       "Maintenance Occurrence Type  ": "Recurring  ",
//       "Maintenance Start date  ": "01/01/2024  ",
//       "Maintenance End date  ": "12/31/2024  ",
//       "Equipment Status  ": "Equipment Maintenance Completed  ",
//     },
//     {
//       "Equipment Maintenance JO #  ": "EQJOB15  ",
//       "Date  ": "12/02/2024  ",
//       "Customer  ": "CUST02 Test Customer 14  ",
//       "Rental Sales Order #  ": "   ",
//       "Technician Assigned  ": "  ",
//       "Equipment  ": "Safe patient handling tools  ",
//       "Quantity  ": "1  ",
//       "Maintenance Occurrence Type  ": "Recurring  ",
//       "Maintenance Start date  ": "01/01/2024  ",
//       "Maintenance End date  ": "12/31/2025  ",
//       "Equipment Status  ": "Equipment Maintenance Completed  ",
//     },
//     {
//       "Equipment Maintenance JO #  ": "EQJOB15  ",
//       "Date  ": "12/02/2024  ",
//       "Customer  ": "CUST02 Test Customer 14  ",
//       "Rental Sales Order #  ": "   ",
//       "Technician Assigned  ": "  ",
//       "Equipment  ": "Test Inventory Item 10  ",
//       "Quantity  ": "3  ",
//       "Maintenance Occurrence Type  ": "One-time  ",
//       "Maintenance Start date  ": "05/05/2024  ",
//       "Maintenance End date  ": "12/31/2024  ",
//       "Equipment Status  ": "Equipment Maintenance Completed  ",
//     },
//     {
//       "Equipment Maintenance JO #  ": "EQJOB16  ",
//       "Date  ": "12/02/2024  ",
//       "Customer  ": "CUST02 Test Customer 14  ",
//       "Rental Sales Order #  ": "   ",
//       "Technician Assigned  ": "  ",
//       "Equipment  ": "Safe patient handling tools  ",
//       "Quantity  ": "1  ",
//       "Maintenance Occurrence Type  ": "Recurring  ",
//       "Maintenance Start date  ": "01/01/2024  ",
//       "Maintenance End date  ": "12/31/2024  ",
//       "Equipment Status  ": "Equipment Pending Maintenance  ",
//     },
//     {
//       "Equipment Maintenance JO #  ": "EQJOB16  ",
//       "Date  ": "12/02/2024  ",
//       "Customer  ": "CUST02 Test Customer 14  ",
//       "Rental Sales Order #  ": "   ",
//       "Technician Assigned  ": "  ",
//       "Equipment  ": "  ",
//       "Quantity  ": "1  ",
//       "Maintenance Occurrence Type  ": "  ",
//       "Maintenance Start date  ": "  ",
//       "Maintenance End date  ": "  ",
//       "Equipment Status  ": "  ",
//     },
//     {
//       "Equipment Maintenance JO #  ": "EQJOB16  ",
//       "Date  ": "12/02/2024  ",
//       "Customer  ": "CUST02 Test Customer 14  ",
//       "Rental Sales Order #  ": "   ",
//       "Technician Assigned  ": "  ",
//       "Equipment  ": "  ",
//       "Quantity  ": "-1  ",
//       "Maintenance Occurrence Type  ": "  ",
//       "Maintenance Start date  ": "  ",
//       "Maintenance End date  ": "  ",
//       "Equipment Status  ": "  ",
//     },
//     {
//       "Equipment Maintenance JO #  ": "EQJOB17  ",
//       "Date  ": "12/08/2024  ",
//       "Customer  ": "CUST02 Test Customer 14  ",
//       "Rental Sales Order #  ": "   ",
//       "Technician Assigned  ": "  ",
//       "Equipment  ": "Main spring  ",
//       "Quantity  ": "1  ",
//       "Maintenance Occurrence Type  ": "Recurring  ",
//       "Maintenance Start date  ": "01/01/2024  ",
//       "Maintenance End date  ": "01/31/2024  ",
//       "Equipment Status  ": "Equipment Under Maintenance  ",
//     },
//     {
//       "Equipment Maintenance JO #  ": "EQJOB18  ",
//       "Date  ": "12/08/2024  ",
//       "Customer  ": "CUST02 Test Customer 14  ",
//       "Rental Sales Order #  ": "   ",
//       "Technician Assigned  ": "  ",
//       "Equipment  ": "Main spring  ",
//       "Quantity  ": "1  ",
//       "Maintenance Occurrence Type  ": "Recurring  ",
//       "Maintenance Start date  ": "01/01/2024  ",
//       "Maintenance End date  ": "01/31/2024  ",
//       "Equipment Status  ": "Equipment Under Maintenance  ",
//     },
//     {
//       "Equipment Maintenance JO #  ": "EQJOB19  ",
//       "Date  ": "12/14/2024  ",
//       "Customer  ": "CUST02 Test Customer 14  ",
//       "Rental Sales Order #  ": "   ",
//       "Technician Assigned  ": "  ",
//       "Equipment  ": "Main spring  ",
//       "Quantity  ": "1  ",
//       "Maintenance Occurrence Type  ": "Usage Based  ",
//       "Maintenance Start date  ": "12/14/2024  ",
//       "Maintenance End date  ": "03/15/2025  ",
//       "Equipment Status  ": "Equipment Maintenance Completed  ",
//     },
//     {
//       "Equipment Maintenance JO #  ": "EQJOB19  ",
//       "Date  ": "12/14/2024  ",
//       "Customer  ": "CUST02 Test Customer 14  ",
//       "Rental Sales Order #  ": "   ",
//       "Technician Assigned  ": "  ",
//       "Equipment  ": "Test Inventory Item 10  ",
//       "Quantity  ": "1  ",
//       "Maintenance Occurrence Type  ": "Usage Based  ",
//       "Maintenance Start date  ": "12/08/2024  ",
//       "Maintenance End date  ": "12/18/2024  ",
//       "Equipment Status  ": "Equipment Maintenance Completed  ",
//     },
//     {
//       "Equipment Maintenance JO #  ": "EQJOB19  ",
//       "Date  ": "12/14/2024  ",
//       "Customer  ": "CUST02 Test Customer 14  ",
//       "Rental Sales Order #  ": "   ",
//       "Technician Assigned  ": "  ",
//       "Equipment  ": "Test Inventory Item 5  ",
//       "Quantity  ": "1  ",
//       "Maintenance Occurrence Type  ": "Usage Based  ",
//       "Maintenance Start date  ": "12/25/2024  ",
//       "Maintenance End date  ": "12/20/2024  ",
//       "Equipment Status  ": "Equipment Maintenance Completed  ",
//     },
//     {
//       "Equipment Maintenance JO #  ": "EQJOB20  ",
//       "Date  ": "12/15/2024  ",
//       "Customer  ": "CUST02 Test Customer 14  ",
//       "Rental Sales Order #  ": "   ",
//       "Technician Assigned  ": "EMP02  ",
//       "Equipment  ": "Safe patient handling tools  ",
//       "Quantity  ": "1  ",
//       "Maintenance Occurrence Type  ": "Recurring  ",
//       "Maintenance Start date  ": "01/01/2024  ",
//       "Maintenance End date  ": "12/31/2024  ",
//       "Equipment Status  ": "Equipment Maintenance Completed  ",
//     },
//     {
//       "Equipment Maintenance JO #  ": "EQJOB20  ",
//       "Date  ": "12/15/2024  ",
//       "Customer  ": "CUST02 Test Customer 14  ",
//       "Rental Sales Order #  ": "   ",
//       "Technician Assigned  ": "EMP02  ",
//       "Equipment  ": "Main spring  ",
//       "Quantity  ": "1  ",
//       "Maintenance Occurrence Type  ": "Usage Based  ",
//       "Maintenance Start date  ": "01/01/2024  ",
//       "Maintenance End date  ": "12/31/2024  ",
//       "Equipment Status  ": "Equipment Maintenance Completed  ",
//     },
//     {
//       "Equipment Maintenance JO #  ": "EQJOB20  ",
//       "Date  ": "12/15/2024  ",
//       "Customer  ": "CUST02 Test Customer 14  ",
//       "Rental Sales Order #  ": "   ",
//       "Technician Assigned  ": "EMP02  ",
//       "Equipment  ": "Main spring  ",
//       "Quantity  ": "1  ",
//       "Maintenance Occurrence Type  ": "Recurring  ",
//       "Maintenance Start date  ": "01/01/2024  ",
//       "Maintenance End date  ": "12/31/2024  ",
//       "Equipment Status  ": "Equipment Under Maintenance  ",
//     },
//     {
//       "Equipment Maintenance JO #  ": "EQJOB20  ",
//       "Date  ": "12/15/2024  ",
//       "Customer  ": "CUST02 Test Customer 14  ",
//       "Rental Sales Order #  ": "   ",
//       "Technician Assigned  ": "EMP02  ",
//       "Equipment  ": "Main spring  ",
//       "Quantity  ": "1  ",
//       "Maintenance Occurrence Type  ": "Usage Based  ",
//       "Maintenance Start date  ": "12/18/2024  ",
//       "Maintenance End date  ": "12/28/2024  ",
//       "Equipment Status  ": "Equipment Under Maintenance  ",
//     },
//     {
//       "Equipment Maintenance JO #  ": "EQJOB20  ",
//       "Date  ": "12/15/2024  ",
//       "Customer  ": "CUST02 Test Customer 14  ",
//       "Rental Sales Order #  ": "   ",
//       "Technician Assigned  ": "EMP02  ",
//       "Equipment  ": "  ",
//       "Quantity  ": "1  ",
//       "Maintenance Occurrence Type  ": "  ",
//       "Maintenance Start date  ": "  ",
//       "Maintenance End date  ": "  ",
//       "Equipment Status  ": "  ",
//     },
//     {
//       "Equipment Maintenance JO #  ": "EQJOB20  ",
//       "Date  ": "12/15/2024  ",
//       "Customer  ": "CUST02 Test Customer 14  ",
//       "Rental Sales Order #  ": "   ",
//       "Technician Assigned  ": "EMP02  ",
//       "Equipment  ": "  ",
//       "Quantity  ": "-1  ",
//       "Maintenance Occurrence Type  ": "  ",
//       "Maintenance Start date  ": "  ",
//       "Maintenance End date  ": "  ",
//       "Equipment Status  ": "  ",
//     },
//     {
//       "Equipment Maintenance JO #  ": "EQJOB21  ",
//       "Date  ": "12/16/2024  ",
//       "Customer  ": "CUST02 Test Customer 14  ",
//       "Rental Sales Order #  ": "   ",
//       "Technician Assigned  ": "  ",
//       "Equipment  ": "Main spring  ",
//       "Quantity  ": "1  ",
//       "Maintenance Occurrence Type  ": "Recurring  ",
//       "Maintenance Start date  ": "01/01/2024  ",
//       "Maintenance End date  ": "12/31/2024  ",
//       "Equipment Status  ": "Equipment Under Maintenance  ",
//     },
//     {
//       "Equipment Maintenance JO #  ": "EQJOB22  ",
//       "Date  ": "12/16/2024  ",
//       "Customer  ": "CUST02 Test Customer 14  ",
//       "Rental Sales Order #  ": "   ",
//       "Technician Assigned  ": "  ",
//       "Equipment  ": "Safe patient handling tools  ",
//       "Quantity  ": "1  ",
//       "Maintenance Occurrence Type  ": "Usage Based  ",
//       "Maintenance Start date  ": "01/01/2024  ",
//       "Maintenance End date  ": "12/31/2024  ",
//       "Equipment Status  ": "Equipment Pending Maintenance  ",
//     },
//     {
//       "Equipment Maintenance JO #  ": "EQJOB22  ",
//       "Date  ": "12/16/2024  ",
//       "Customer  ": "CUST02 Test Customer 14  ",
//       "Rental Sales Order #  ": "   ",
//       "Technician Assigned  ": "  ",
//       "Equipment  ": "  ",
//       "Quantity  ": "1  ",
//       "Maintenance Occurrence Type  ": "  ",
//       "Maintenance Start date  ": "  ",
//       "Maintenance End date  ": "  ",
//       "Equipment Status  ": "  ",
//     },
//     {
//       "Equipment Maintenance JO #  ": "EQJOB22  ",
//       "Date  ": "12/16/2024  ",
//       "Customer  ": "CUST02 Test Customer 14  ",
//       "Rental Sales Order #  ": "   ",
//       "Technician Assigned  ": "  ",
//       "Equipment  ": "  ",
//       "Quantity  ": "-1  ",
//       "Maintenance Occurrence Type  ": "  ",
//       "Maintenance Start date  ": "  ",
//       "Maintenance End date  ": "  ",
//       "Equipment Status  ": "  ",
//     },
//     {
//       "Equipment Maintenance JO #  ": "EQJOB22  ",
//       "Date  ": "12/16/2024  ",
//       "Customer  ": "CUST02 Test Customer 14  ",
//       "Rental Sales Order #  ": "   ",
//       "Technician Assigned  ": "  ",
//       "Equipment  ": "Test Inventory Item 10  ",
//       "Quantity  ": "1  ",
//       "Maintenance Occurrence Type  ": "Recurring  ",
//       "Maintenance Start date  ": "01/01/2024  ",
//       "Maintenance End date  ": "12/31/2024  ",
//       "Equipment Status  ": "Equipment Pending Maintenance  ",
//     },
//     {
//       "Equipment Maintenance JO #  ": "EQJOB22  ",
//       "Date  ": "12/16/2024  ",
//       "Customer  ": "CUST02 Test Customer 14  ",
//       "Rental Sales Order #  ": "   ",
//       "Technician Assigned  ": "  ",
//       "Equipment  ": "  ",
//       "Quantity  ": "1  ",
//       "Maintenance Occurrence Type  ": "  ",
//       "Maintenance Start date  ": "  ",
//       "Maintenance End date  ": "  ",
//       "Equipment Status  ": "  ",
//     },
//     {
//       "Equipment Maintenance JO #  ": "EQJOB22  ",
//       "Date  ": "12/16/2024  ",
//       "Customer  ": "CUST02 Test Customer 14  ",
//       "Rental Sales Order #  ": "   ",
//       "Technician Assigned  ": "  ",
//       "Equipment  ": "  ",
//       "Quantity  ": "-1  ",
//       "Maintenance Occurrence Type  ": "  ",
//       "Maintenance Start date  ": "  ",
//       "Maintenance End date  ": "  ",
//       "Equipment Status  ": "  ",
//     },
//     {
//       "Equipment Maintenance JO #  ": "EQJOB23  ",
//       "Date  ": "12/18/2024  ",
//       "Customer  ": "CUST02 Test Customer 14  ",
//       "Rental Sales Order #  ": "   ",
//       "Technician Assigned  ": "  ",
//       "Equipment  ": "Main spring  ",
//       "Quantity  ": "1  ",
//       "Maintenance Occurrence Type  ": "Recurring  ",
//       "Maintenance Start date  ": "01/01/2024  ",
//       "Maintenance End date  ": "12/31/2024  ",
//       "Equipment Status  ": "Equipment Maintenance Completed  ",
//     },
//     {
//       "Equipment Maintenance JO #  ": "EQJOB24  ",
//       "Date  ": "12/18/2024  ",
//       "Customer  ": "CUST02 Test Customer 14  ",
//       "Rental Sales Order #  ": "   ",
//       "Technician Assigned  ": "  ",
//       "Equipment  ": "Safe patient handling tools  ",
//       "Quantity  ": "1  ",
//       "Maintenance Occurrence Type  ": "Usage Based  ",
//       "Maintenance Start date  ": "01/01/2024  ",
//       "Maintenance End date  ": "12/31/2024  ",
//       "Equipment Status  ": "Equipment Maintenance Completed  ",
//     },
//     {
//       "Equipment Maintenance JO #  ": "EQJOB25  ",
//       "Date  ": "12/18/2024  ",
//       "Customer  ": "CUST02 Test Customer 14  ",
//       "Rental Sales Order #  ": "   ",
//       "Technician Assigned  ": "  ",
//       "Equipment  ": "Main spring  ",
//       "Quantity  ": "1  ",
//       "Maintenance Occurrence Type  ": "Recurring  ",
//       "Maintenance Start date  ": "01/01/2024  ",
//       "Maintenance End date  ": "06/30/2024  ",
//       "Equipment Status  ": "Equipment Maintenance Completed  ",
//     },
//     {
//       "Equipment Maintenance JO #  ": "EQJOB26  ",
//       "Date  ": "12/18/2024  ",
//       "Customer  ": "CUST02 Test Customer 14  ",
//       "Rental Sales Order #  ": "   ",
//       "Technician Assigned  ": "  ",
//       "Equipment  ": "Main spring  ",
//       "Quantity  ": "1  ",
//       "Maintenance Occurrence Type  ": "Usage Based  ",
//       "Maintenance Start date  ": "01/01/2024  ",
//       "Maintenance End date  ": "12/31/2024  ",
//       "Equipment Status  ": "Equipment Maintenance Completed  ",
//     },
//     {
//       "Equipment Maintenance JO #  ": "EQJOB27  ",
//       "Date  ": "12/18/2024  ",
//       "Customer  ": "CUST02 Test Customer 14  ",
//       "Rental Sales Order #  ": "   ",
//       "Technician Assigned  ": "EMP01  ",
//       "Equipment  ": "Safe patient handling tools  ",
//       "Quantity  ": "1  ",
//       "Maintenance Occurrence Type  ": "One-time  ",
//       "Maintenance Start date  ": "01/01/2024  ",
//       "Maintenance End date  ": "12/31/2024  ",
//       "Equipment Status  ": "Equipment Maintenance Completed  ",
//     },
//     {
//       "Equipment Maintenance JO #  ": "EQJOB28  ",
//       "Date  ": "12/23/2024  ",
//       "Customer  ": "CUST02 Test Customer 14  ",
//       "Rental Sales Order #  ": "Sales Order #SO03  ",
//       "Technician Assigned  ": "EMP02  ",
//       "Equipment  ": "Safe patient handling tools  ",
//       "Quantity  ": "1  ",
//       "Maintenance Occurrence Type  ": "Recurring  ",
//       "Maintenance Start date  ": "01/01/2024  ",
//       "Maintenance End date  ": "12/31/2024  ",
//       "Equipment Status  ": "Equipment Under Maintenance  ",
//     },
//     {
//       "Equipment Maintenance JO #  ": "EQJOB29  ",
//       "Date  ": "01/04/2025  ",
//       "Customer  ": "CUST02 Test Customer 14  ",
//       "Rental Sales Order #  ": "   ",
//       "Technician Assigned  ": "EMP02  ",
//       "Equipment  ": "Safe patient handling tools  ",
//       "Quantity  ": "1  ",
//       "Maintenance Occurrence Type  ": "Recurring  ",
//       "Maintenance Start date  ": "01/01/2024  ",
//       "Maintenance End date  ": "06/30/2024  ",
//       "Equipment Status  ": "Equipment Maintenance Completed  ",
//     },
//     {
//       "Equipment Maintenance JO #  ": "EQJOB30  ",
//       "Date  ": "01/04/2025  ",
//       "Customer  ": "CUST02 Test Customer 14  ",
//       "Rental Sales Order #  ": "   ",
//       "Technician Assigned  ": "  ",
//       "Equipment  ": "Safe patient handling tools  ",
//       "Quantity  ": "1  ",
//       "Maintenance Occurrence Type  ": "Usage Based  ",
//       "Maintenance Start date  ": "01/01/2024  ",
//       "Maintenance End date  ": "12/31/2024  ",
//       "Equipment Status  ": "Equipment Maintenance Completed  ",
//     },
//     {
//       "Equipment Maintenance JO #  ": "EQJOB31  ",
//       "Date  ": "01/07/2025  ",
//       "Customer  ": "CUST02 Test Customer 14  ",
//       "Rental Sales Order #  ": "   ",
//       "Technician Assigned  ": "EMP02  ",
//       "Equipment  ": "Main spring  ",
//       "Quantity  ": "1  ",
//       "Maintenance Occurrence Type  ": "Recurring  ",
//       "Maintenance Start date  ": "01/01/2024  ",
//       "Maintenance End date  ": "06/30/2024  ",
//       "Equipment Status  ": "Equipment Under Maintenance  ",
//     },
//     {
//       "Equipment Maintenance JO #  ": "EQJOB32  ",
//       "Date  ": "01/12/2025  ",
//       "Customer  ": "CUST02 Test Customer 14  ",
//       "Rental Sales Order #  ": "   ",
//       "Technician Assigned  ": "EMP02  ",
//       "Equipment  ": "Main spring  ",
//       "Quantity  ": "3  ",
//       "Maintenance Occurrence Type  ": "Recurring  ",
//       "Maintenance Start date  ": "01/01/2024  ",
//       "Maintenance End date  ": "06/30/2024  ",
//       "Equipment Status  ": "Equipment Pending Maintenance  ",
//     },
//     {
//       "Equipment Maintenance JO #  ": "EQJOB33  ",
//       "Date  ": "01/13/2025  ",
//       "Customer  ": "CUST02 Test Customer 14  ",
//       "Rental Sales Order #  ": "   ",
//       "Technician Assigned  ": "EMP02  ",
//       "Equipment  ": "Main spring  ",
//       "Quantity  ": "1  ",
//       "Maintenance Occurrence Type  ": "Recurring  ",
//       "Maintenance Start date  ": "01/01/2024  ",
//       "Maintenance End date  ": "06/30/2024  ",
//       "Equipment Status  ": "Equipment Pending Maintenance  ",
//     },
//     {
//       "Equipment Maintenance JO #  ": "EQJOB33  ",
//       "Date  ": "01/13/2025  ",
//       "Customer  ": "CUST02 Test Customer 14  ",
//       "Rental Sales Order #  ": "   ",
//       "Technician Assigned  ": "EMP02  ",
//       "Equipment  ": "Main spring  ",
//       "Quantity  ": "1  ",
//       "Maintenance Occurrence Type  ": "Recurring  ",
//       "Maintenance Start date  ": "01/01/2024  ",
//       "Maintenance End date  ": "06/30/2024  ",
//       "Equipment Status  ": "Equipment Pending Maintenance  ",
//     },
//     {
//       "Equipment Maintenance JO #  ": "EQJOB33  ",
//       "Date  ": "01/13/2025  ",
//       "Customer  ": "CUST02 Test Customer 14  ",
//       "Rental Sales Order #  ": "   ",
//       "Technician Assigned  ": "EMP02  ",
//       "Equipment  ": "Main spring  ",
//       "Quantity  ": "1  ",
//       "Maintenance Occurrence Type  ": "Recurring  ",
//       "Maintenance Start date  ": "01/01/2024  ",
//       "Maintenance End date  ": "06/30/2024  ",
//       "Equipment Status  ": "Equipment Pending Maintenance  ",
//     },
//     {
//       "Equipment Maintenance JO #  ": "EQJOB33  ",
//       "Date  ": "01/13/2025  ",
//       "Customer  ": "CUST02 Test Customer 14  ",
//       "Rental Sales Order #  ": "   ",
//       "Technician Assigned  ": "EMP02  ",
//       "Equipment  ": "Test Inventory Item 10  ",
//       "Quantity  ": "1  ",
//       "Maintenance Occurrence Type  ": "One-time  ",
//       "Maintenance Start date  ": "01/01/2024  ",
//       "Maintenance End date  ": "06/30/2024  ",
//       "Equipment Status  ": "Equipment Pending Maintenance  ",
//     },
//     {
//       "Equipment Maintenance JO #  ": "EQJOB33  ",
//       "Date  ": "01/13/2025  ",
//       "Customer  ": "CUST02 Test Customer 14  ",
//       "Rental Sales Order #  ": "   ",
//       "Technician Assigned  ": "EMP02  ",
//       "Equipment  ": "Safe patient handling tools  ",
//       "Quantity  ": "1  ",
//       "Maintenance Occurrence Type  ": "Usage Based  ",
//       "Maintenance Start date  ": "01/01/2024  ",
//       "Maintenance End date  ": "06/20/2024  ",
//       "Equipment Status  ": "Equipment Pending Maintenance  ",
//     },
//     {
//       "Equipment Maintenance JO #  ": "EQJOB33  ",
//       "Date  ": "01/13/2025  ",
//       "Customer  ": "CUST02 Test Customer 14  ",
//       "Rental Sales Order #  ": "   ",
//       "Technician Assigned  ": "EMP02  ",
//       "Equipment  ": "Test Inventory Item 10  ",
//       "Quantity  ": "1  ",
//       "Maintenance Occurrence Type  ": "Recurring  ",
//       "Maintenance Start date  ": "01/01/2024  ",
//       "Maintenance End date  ": "06/30/2024  ",
//       "Equipment Status  ": "Equipment Pending Maintenance  ",
//     },
//     {
//       "Equipment Maintenance JO #  ": "EQJOB33  ",
//       "Date  ": "01/13/2025  ",
//       "Customer  ": "CUST02 Test Customer 14  ",
//       "Rental Sales Order #  ": "   ",
//       "Technician Assigned  ": "EMP02  ",
//       "Equipment  ": "Test Inventory Item 10  ",
//       "Quantity  ": "1  ",
//       "Maintenance Occurrence Type  ": "Recurring  ",
//       "Maintenance Start date  ": "01/01/2024  ",
//       "Maintenance End date  ": "06/30/2024  ",
//       "Equipment Status  ": "Equipment Maintenance Completed  ",
//     },
//     {
//       "Equipment Maintenance JO #  ": "EQJOB34  ",
//       "Date  ": "01/19/2025  ",
//       "Customer  ": "CUST01 ASL Cloud Tech  ",
//       "Rental Sales Order #  ": "Sales Order #SO46  ",
//       "Technician Assigned  ": "EMP02  ",
//       "Equipment  ": "Safe patient handling tools  ",
//       "Quantity  ": "1  ",
//       "Maintenance Occurrence Type  ": "Recurring  ",
//       "Maintenance Start date  ": "01/01/2024  ",
//       "Maintenance End date  ": "03/31/2024  ",
//       "Equipment Status  ": "Equipment Maintenance Completed  ",
//     },
//     {
//       "Equipment Maintenance JO #  ": "EQJOB35  ",
//       "Date  ": "01/19/2025  ",
//       "Customer  ": "CUST01 ASL Cloud Tech  ",
//       "Rental Sales Order #  ": "Sales Order #SO46  ",
//       "Technician Assigned  ": "Venkatesh  ",
//       "Equipment  ": "Safe patient handling tools  ",
//       "Quantity  ": "1  ",
//       "Maintenance Occurrence Type  ": "Usage Based  ",
//       "Maintenance Start date  ": "01/01/2024  ",
//       "Maintenance End date  ": "03/31/2024  ",
//       "Equipment Status  ": "Equipment Under Maintenance  ",
//     },
//     {
//       "Equipment Maintenance JO #  ": "EQJOB36  ",
//       "Date  ": "01/20/2025  ",
//       "Customer  ": "CUST01 ASL Cloud Tech  ",
//       "Rental Sales Order #  ": "Sales Order #SO47  ",
//       "Technician Assigned  ": "EMP02  ",
//       "Equipment  ": "Safe patient handling tools  ",
//       "Quantity  ": "1  ",
//       "Maintenance Occurrence Type  ": "Recurring  ",
//       "Maintenance Start date  ": "01/01/2024  ",
//       "Maintenance End date  ": "03/31/2024  ",
//       "Equipment Status  ": "Equipment Maintenance Completed  ",
//     },
//     {
//       "Equipment Maintenance JO #  ": "EQJOB37  ",
//       "Date  ": "01/20/2025  ",
//       "Customer  ": "CUST01 ASL Cloud Tech  ",
//       "Rental Sales Order #  ": "Sales Order #SO02  ",
//       "Technician Assigned  ": "EMP01  ",
//       "Equipment  ": "Safe patient handling tools  ",
//       "Quantity  ": "1  ",
//       "Maintenance Occurrence Type  ": "Usage Based  ",
//       "Maintenance Start date  ": "01/01/2024  ",
//       "Maintenance End date  ": "12/31/2024  ",
//       "Equipment Status  ": "Equipment Under Maintenance  ",
//     },
//     {
//       "Equipment Maintenance JO #  ": "EQJOB38  ",
//       "Date  ": "02/15/2025  ",
//       "Customer  ": "CUST02 Test Customer 14  ",
//       "Rental Sales Order #  ": "   ",
//       "Technician Assigned  ": "Santosh V  ",
//       "Equipment  ": "Test Inventory Item 4  ",
//       "Quantity  ": "1  ",
//       "Maintenance Occurrence Type  ": "Recurring  ",
//       "Maintenance Start date  ": "02/15/2025  ",
//       "Maintenance End date  ": "07/19/2025  ",
//       "Equipment Status  ": "Equipment Maintenance Completed  ",
//     },
//     {
//       "Equipment Maintenance JO #  ": "EQJOB39  ",
//       "Date  ": "02/15/2025  ",
//       "Customer  ": "CUST02 Test Customer 14  ",
//       "Rental Sales Order #  ": "   ",
//       "Technician Assigned  ": "VEN01  ",
//       "Equipment  ": "Safe patient handling tools  ",
//       "Quantity  ": "1  ",
//       "Maintenance Occurrence Type  ": "One-time  ",
//       "Maintenance Start date  ": "02/13/2025  ",
//       "Maintenance End date  ": "02/20/2025  ",
//       "Equipment Status  ": "Equipment Maintenance Completed  ",
//     },
//     {
//       "Equipment Maintenance JO #  ": "EQJOB40  ",
//       "Date  ": "02/15/2025  ",
//       "Customer  ": "CUST01 ASL Cloud Tech  ",
//       "Rental Sales Order #  ": "   ",
//       "Technician Assigned  ": "Santosh V  ",
//       "Equipment  ": "Safe patient handling tools  ",
//       "Quantity  ": "1  ",
//       "Maintenance Occurrence Type  ": "Recurring  ",
//       "Maintenance Start date  ": "01/01/2024  ",
//       "Maintenance End date  ": "03/31/2024  ",
//       "Equipment Status  ": "Equipment Maintenance Completed  ",
//     },
//     {
//       "Equipment Maintenance JO #  ": "EQJOB41  ",
//       "Date  ": "02/15/2025  ",
//       "Customer  ": "CUST01 ASL Cloud Tech  ",
//       "Rental Sales Order #  ": "   ",
//       "Technician Assigned  ": "VEN01  ",
//       "Equipment  ": "Safe patient handling tools  ",
//       "Quantity  ": "1  ",
//       "Maintenance Occurrence Type  ": "Recurring  ",
//       "Maintenance Start date  ": "01/01/2024  ",
//       "Maintenance End date  ": "03/31/2024  ",
//       "Equipment Status  ": "Equipment Maintenance Completed  ",
//     },
//     {
//       "Equipment Maintenance JO #  ": "EQJOB42  ",
//       "Date  ": "02/16/2025  ",
//       "Customer  ": "CUST01 ASL Cloud Tech  ",
//       "Rental Sales Order #  ": "   ",
//       "Technician Assigned  ": "EMP02  ",
//       "Equipment  ": "Safe patient handling tools  ",
//       "Quantity  ": "1  ",
//       "Maintenance Occurrence Type  ": "Recurring  ",
//       "Maintenance Start date  ": "01/01/2024  ",
//       "Maintenance End date  ": "03/31/2024  ",
//       "Equipment Status  ": "Equipment Maintenance Completed  ",
//     },
//     {
//       "Equipment Maintenance JO #  ": "EQJOB42  ",
//       "Date  ": "02/16/2025  ",
//       "Customer  ": "CUST01 ASL Cloud Tech  ",
//       "Rental Sales Order #  ": "   ",
//       "Technician Assigned  ": "EMP02  ",
//       "Equipment  ": "Safe patient handling tools  ",
//       "Quantity  ": "1  ",
//       "Maintenance Occurrence Type  ": "Usage Based  ",
//       "Maintenance Start date  ": "01/01/2024  ",
//       "Maintenance End date  ": "03/31/2024  ",
//       "Equipment Status  ": "Equipment Maintenance Completed  ",
//     },
//     {
//       "Equipment Maintenance JO #  ": "EQJOB43  ",
//       "Date  ": "02/16/2025  ",
//       "Customer  ": "CUST01 ASL Cloud Tech  ",
//       "Rental Sales Order #  ": "   ",
//       "Technician Assigned  ": "EMP01  ",
//       "Equipment  ": "Safe patient handling tools  ",
//       "Quantity  ": "1  ",
//       "Maintenance Occurrence Type  ": "Recurring  ",
//       "Maintenance Start date  ": "01/01/2024  ",
//       "Maintenance End date  ": "03/31/2024  ",
//       "Equipment Status  ": "Equipment Pending Maintenance  ",
//     },
//     {
//       "Equipment Maintenance JO #  ": "EQJOB43  ",
//       "Date  ": "02/16/2025  ",
//       "Customer  ": "CUST01 ASL Cloud Tech  ",
//       "Rental Sales Order #  ": "   ",
//       "Technician Assigned  ": "EMP01  ",
//       "Equipment  ": "Maintenance charges  ",
//       "Quantity  ": "1  ",
//       "Maintenance Occurrence Type  ": "One-time  ",
//       "Maintenance Start date  ": "02/20/2025  ",
//       "Maintenance End date  ": "02/14/2025  ",
//       "Equipment Status  ": "Equipment Under Maintenance  ",
//     },
//     {
//       "Equipment Maintenance JO #  ": "EQJOB43  ",
//       "Date  ": "02/16/2025  ",
//       "Customer  ": "CUST01 ASL Cloud Tech  ",
//       "Rental Sales Order #  ": "   ",
//       "Technician Assigned  ": "EMP01  ",
//       "Equipment  ": "  ",
//       "Quantity  ": "1  ",
//       "Maintenance Occurrence Type  ": "  ",
//       "Maintenance Start date  ": "  ",
//       "Maintenance End date  ": "  ",
//       "Equipment Status  ": "  ",
//     },
//     {
//       "Equipment Maintenance JO #  ": "EQJOB43  ",
//       "Date  ": "02/16/2025  ",
//       "Customer  ": "CUST01 ASL Cloud Tech  ",
//       "Rental Sales Order #  ": "   ",
//       "Technician Assigned  ": "EMP01  ",
//       "Equipment  ": "  ",
//       "Quantity  ": "-1  ",
//       "Maintenance Occurrence Type  ": "  ",
//       "Maintenance Start date  ": "  ",
//       "Maintenance End date  ": "  ",
//       "Equipment Status  ": "  ",
//     },
//     {
//       "Equipment Maintenance JO #  ": "EQJOB44  ",
//       "Date  ": "02/16/2025  ",
//       "Customer  ": "CUST01 ASL Cloud Tech  ",
//       "Rental Sales Order #  ": "   ",
//       "Technician Assigned  ": "EMP01  ",
//       "Equipment  ": "Safe patient handling tools  ",
//       "Quantity  ": "1  ",
//       "Maintenance Occurrence Type  ": "Recurring  ",
//       "Maintenance Start date  ": "01/01/2024  ",
//       "Maintenance End date  ": "03/31/2024  ",
//       "Equipment Status  ": "Equipment Under Maintenance  ",
//     },
//     {
//       "Equipment Maintenance JO #  ": "EQJOB45  ",
//       "Date  ": "02/16/2025  ",
//       "Customer  ": "CUST01 ASL Cloud Tech  ",
//       "Rental Sales Order #  ": "   ",
//       "Technician Assigned  ": "EMP01  ",
//       "Equipment  ": "Safe patient handling tools  ",
//       "Quantity  ": "1  ",
//       "Maintenance Occurrence Type  ": "Recurring  ",
//       "Maintenance Start date  ": "01/01/2024  ",
//       "Maintenance End date  ": "03/31/2024  ",
//       "Equipment Status  ": "Equipment Pending Maintenance  ",
//     },
//     {
//       "Equipment Maintenance JO #  ": "EQJOB46  ",
//       "Date  ": "02/19/2025  ",
//       "Customer  ": "CUST03 PrecisionTime Co.  ",
//       "Rental Sales Order #  ": "Sales Order #SO55  ",
//       "Technician Assigned  ": "Venkatesh  ",
//       "Equipment  ": "Watch - Model 12X00A  ",
//       "Quantity  ": "1  ",
//       "Maintenance Occurrence Type  ": "Recurring  ",
//       "Maintenance Start date  ": "01/01/2025  ",
//       "Maintenance End date  ": "03/31/2025  ",
//       "Equipment Status  ": "Equipment Maintenance Completed  ",
//     },
//     {
//       "Equipment Maintenance JO #  ": "EQJOB47  ",
//       "Date  ": "02/19/2025  ",
//       "Customer  ": "CUST03 PrecisionTime Co.  ",
//       "Rental Sales Order #  ": "   ",
//       "Technician Assigned  ": "Venkatesh  ",
//       "Equipment  ": "Watch - Model 12X00A  ",
//       "Quantity  ": "1  ",
//       "Maintenance Occurrence Type  ": "Usage Based  ",
//       "Maintenance Start date  ": "01/01/2025  ",
//       "Maintenance End date  ": "03/31/2025  ",
//       "Equipment Status  ": "Equipment Under Maintenance  ",
//     },
//     {
//       "Equipment Maintenance JO #  ": "EQJOB48  ",
//       "Date  ": "02/25/2025  ",
//       "Customer  ": "CUST01 ASL Cloud Tech  ",
//       "Rental Sales Order #  ": "   ",
//       "Technician Assigned  ": "Vendor Contact  ",
//       "Equipment  ": "Main spring  ",
//       "Quantity  ": "1  ",
//       "Maintenance Occurrence Type  ": "One-time  ",
//       "Maintenance Start date  ": "02/13/2025  ",
//       "Maintenance End date  ": "02/12/2025  ",
//       "Equipment Status  ": "Equipment Under Maintenance  ",
//     },
//     {
//       "Equipment Maintenance JO #  ": "EQJOB49  ",
//       "Date  ": "02/25/2025  ",
//       "Customer  ": "CUST01 ASL Cloud Tech  ",
//       "Rental Sales Order #  ": "   ",
//       "Technician Assigned  ": "EMP02  ",
//       "Equipment  ": "Safe patient handling tools  ",
//       "Quantity  ": "1  ",
//       "Maintenance Occurrence Type  ": "One-time  ",
//       "Maintenance Start date  ": "02/06/2025  ",
//       "Maintenance End date  ": "04/24/2025  ",
//       "Equipment Status  ": "Equipment Pending Maintenance  ",
//     },
//     {
//       "Equipment Maintenance JO #  ": "EQJOB49  ",
//       "Date  ": "02/25/2025  ",
//       "Customer  ": "CUST01 ASL Cloud Tech  ",
//       "Rental Sales Order #  ": "   ",
//       "Technician Assigned  ": "EMP02  ",
//       "Equipment  ": "  ",
//       "Quantity  ": "1  ",
//       "Maintenance Occurrence Type  ": "  ",
//       "Maintenance Start date  ": "  ",
//       "Maintenance End date  ": "  ",
//       "Equipment Status  ": "  ",
//     },
//     {
//       "Equipment Maintenance JO #  ": "EQJOB49  ",
//       "Date  ": "02/25/2025  ",
//       "Customer  ": "CUST01 ASL Cloud Tech  ",
//       "Rental Sales Order #  ": "   ",
//       "Technician Assigned  ": "EMP02  ",
//       "Equipment  ": "  ",
//       "Quantity  ": "-1  ",
//       "Maintenance Occurrence Type  ": "  ",
//       "Maintenance Start date  ": "  ",
//       "Maintenance End date  ": "  ",
//       "Equipment Status  ": "  ",
//     },
//     {
//       "Equipment Maintenance JO #  ": "EQJOB50  ",
//       "Date  ": "02/26/2025  ",
//       "Customer  ": "CUST03 PrecisionTime Co.  ",
//       "Rental Sales Order #  ": "   ",
//       "Technician Assigned  ": "EMP01  ",
//       "Equipment  ": "Watch - Model 12X00A  ",
//       "Quantity  ": "1  ",
//       "Maintenance Occurrence Type  ": "Recurring  ",
//       "Maintenance Start date  ": "01/01/2025  ",
//       "Maintenance End date  ": "03/31/2025  ",
//       "Equipment Status  ": "Equipment Maintenance Completed  ",
//     },
//     {
//       "Equipment Maintenance JO #  ": "EQJOB51  ",
//       "Date  ": "02/26/2025  ",
//       "Customer  ": "CUST01 ASL Cloud Tech  ",
//       "Rental Sales Order #  ": "   ",
//       "Technician Assigned  ": "EMP01  ",
//       "Equipment  ": "Safe patient handling tools  ",
//       "Quantity  ": "1  ",
//       "Maintenance Occurrence Type  ": "Recurring  ",
//       "Maintenance Start date  ": "01/01/2025  ",
//       "Maintenance End date  ": "03/31/2025  ",
//       "Equipment Status  ": "Equipment Under Maintenance  ",
//     },
//     {
//       "Equipment Maintenance JO #  ": "EQJOB52  ",
//       "Date  ": "03/26/2025  ",
//       "Customer  ": "CUST03 PrecisionTime Co.  ",
//       "Rental Sales Order #  ": "Sales Order #SO59  ",
//       "Technician Assigned  ": "EMP01  ",
//       "Equipment  ": "Watch - Model 12X00A  ",
//       "Quantity  ": "1  ",
//       "Maintenance Occurrence Type  ": "Recurring  ",
//       "Maintenance Start date  ": "01/01/2025  ",
//       "Maintenance End date  ": "03/31/2025  ",
//       "Equipment Status  ": "Equipment Maintenance Completed  ",
//     },
//     {
//       "Equipment Maintenance JO #  ": "EQJOB53  ",
//       "Date  ": "03/26/2025  ",
//       "Customer  ": "CUST03 PrecisionTime Co.  ",
//       "Rental Sales Order #  ": "Sales Order #SO60  ",
//       "Technician Assigned  ": "Venkatesh  ",
//       "Equipment  ": "Watch - Model 12X00A  ",
//       "Quantity  ": "1  ",
//       "Maintenance Occurrence Type  ": "Usage Based  ",
//       "Maintenance Start date  ": "01/01/2025  ",
//       "Maintenance End date  ": "03/31/2025  ",
//       "Equipment Status  ": "Equipment Under Maintenance  ",
//     },
//     {
//       "Equipment Maintenance JO #  ": "EQJOB54  ",
//       "Date  ": "04/04/2025  ",
//       "Customer  ": "CUST03 PrecisionTime Co.  ",
//       "Rental Sales Order #  ": "Sales Order #SO60  ",
//       "Technician Assigned  ": "EMP01  ",
//       "Equipment  ": "Watch - Model 12X00A  ",
//       "Quantity  ": "1  ",
//       "Maintenance Occurrence Type  ": "Recurring  ",
//       "Maintenance Start date  ": "01/01/2025  ",
//       "Maintenance End date  ": "03/31/2025  ",
//       "Equipment Status  ": "Equipment Maintenance Completed  ",
//     },
//     {
//       "Equipment Maintenance JO #  ": "EQJOB55  ",
//       "Date  ": "04/04/2025  ",
//       "Customer  ": "CUST03 PrecisionTime Co.  ",
//       "Rental Sales Order #  ": "Sales Order #SO59  ",
//       "Technician Assigned  ": "EMP01  ",
//       "Equipment  ": "Watch - Model 12X00A  ",
//       "Quantity  ": "1  ",
//       "Maintenance Occurrence Type  ": "Usage Based  ",
//       "Maintenance Start date  ": "01/01/2025  ",
//       "Maintenance End date  ": "03/31/2025  ",
//       "Equipment Status  ": "Equipment Under Maintenance  ",
//     },
//     {
//       "Equipment Maintenance JO #  ": "EQJOB56  ",
//       "Date  ": "04/09/2025  ",
//       "Customer  ": "CUST03 PrecisionTime Co.  ",
//       "Rental Sales Order #  ": "   ",
//       "Technician Assigned  ": "Santosh V  ",
//       "Equipment  ": "Watch - Model 12X00A  ",
//       "Quantity  ": "1  ",
//       "Maintenance Occurrence Type  ": "Recurring  ",
//       "Maintenance Start date  ": "01/01/2025  ",
//       "Maintenance End date  ": "03/31/2025  ",
//       "Equipment Status  ": "Equipment Under Maintenance  ",
//     },
//     {
//       "Equipment Maintenance JO #  ": "EQJOB57  ",
//       "Date  ": "04/09/2025  ",
//       "Customer  ": "CUST03 PrecisionTime Co.  ",
//       "Rental Sales Order #  ": "   ",
//       "Technician Assigned  ": "Santosh V  ",
//       "Equipment  ": "Watch - Model 12X00A  ",
//       "Quantity  ": "1  ",
//       "Maintenance Occurrence Type  ": "Recurring  ",
//       "Maintenance Start date  ": "01/01/2025  ",
//       "Maintenance End date  ": "03/31/2025  ",
//       "Equipment Status  ": "Equipment Under Maintenance  ",
//     },
//     {
//       "Equipment Maintenance JO #  ": "EQJOB58  ",
//       "Date  ": "04/09/2025  ",
//       "Customer  ": "CUST03 PrecisionTime Co.  ",
//       "Rental Sales Order #  ": "   ",
//       "Technician Assigned  ": "Santosh V  ",
//       "Equipment  ": "Watch - Model 12X00A  ",
//       "Quantity  ": "1  ",
//       "Maintenance Occurrence Type  ": "Recurring  ",
//       "Maintenance Start date  ": "01/01/2025  ",
//       "Maintenance End date  ": "03/31/2025  ",
//       "Equipment Status  ": "Equipment Maintenance Completed  ",
//     },
//     {
//       "Equipment Maintenance JO #  ": "EQJOB59  ",
//       "Date  ": "04/09/2025  ",
//       "Customer  ": "CUST03 PrecisionTime Co.  ",
//       "Rental Sales Order #  ": "   ",
//       "Technician Assigned  ": "Venkatesh  ",
//       "Equipment  ": "Watch - Model 12X00A  ",
//       "Quantity  ": "1  ",
//       "Maintenance Occurrence Type  ": "Usage Based  ",
//       "Maintenance Start date  ": "01/01/2025  ",
//       "Maintenance End date  ": "03/31/2025  ",
//       "Equipment Status  ": "Equipment Under Maintenance  ",
//     },
//     {
//       "Equipment Maintenance JO #  ": "EQJOB60  ",
//       "Date  ": "04/17/2025  ",
//       "Customer  ": "CUST03 PrecisionTime Co.  ",
//       "Rental Sales Order #  ": "   ",
//       "Technician Assigned  ": "Venkatesh  ",
//       "Equipment  ": "Watch - Model 12X00A  ",
//       "Quantity  ": "1  ",
//       "Maintenance Occurrence Type  ": "Recurring  ",
//       "Maintenance Start date  ": "01/01/2025  ",
//       "Maintenance End date  ": "03/31/2025  ",
//       "Equipment Status  ": "Equipment Under Maintenance  ",
//     },
//     {
//       "Equipment Maintenance JO #  ": "EQJOB61  ",
//       "Date  ": "04/17/2025  ",
//       "Customer  ": "CUST03 PrecisionTime Co.  ",
//       "Rental Sales Order #  ": "   ",
//       "Technician Assigned  ": "Santosh V  ",
//       "Equipment  ": "Watch - Model 12X00A  ",
//       "Quantity  ": "1  ",
//       "Maintenance Occurrence Type  ": "Recurring  ",
//       "Maintenance Start date  ": "01/01/2025  ",
//       "Maintenance End date  ": "03/31/2025  ",
//       "Equipment Status  ": "Equipment Maintenance Completed  ",
//     },
//     {
//       "Equipment Maintenance JO #  ": "EQJOB62  ",
//       "Date  ": "04/17/2025  ",
//       "Customer  ": "CUST03 PrecisionTime Co.  ",
//       "Rental Sales Order #  ": "   ",
//       "Technician Assigned  ": "Santosh V  ",
//       "Equipment  ": "Watch - Model 12X00A  ",
//       "Quantity  ": "1  ",
//       "Maintenance Occurrence Type  ": "Usage Based  ",
//       "Maintenance Start date  ": "01/01/2025  ",
//       "Maintenance End date  ": "03/31/2025  ",
//       "Equipment Status  ": "Equipment Under Maintenance  ",
//     },
//     {
//       "Equipment Maintenance JO #  ": "EQJOB63  ",
//       "Date  ": "04/18/2025  ",
//       "Customer  ": "CUST01 ASL Cloud Tech  ",
//       "Rental Sales Order #  ": "   ",
//       "Technician Assigned  ": "EMP01  ",
//       "Equipment  ": "Safe patient handling tools  ",
//       "Quantity  ": "1  ",
//       "Maintenance Occurrence Type  ": "Recurring  ",
//       "Maintenance Start date  ": "01/01/2024  ",
//       "Maintenance End date  ": "03/31/2024  ",
//       "Equipment Status  ": "Equipment Under Maintenance  ",
//     },
//     {
//       "Equipment Maintenance JO #  ": "EQJOB64  ",
//       "Date  ": "04/18/2025  ",
//       "Customer  ": "CUST03 PrecisionTime Co.  ",
//       "Rental Sales Order #  ": "   ",
//       "Technician Assigned  ": "Santosh V  ",
//       "Equipment  ": "Watch - Model 12X00A  ",
//       "Quantity  ": "1  ",
//       "Maintenance Occurrence Type  ": "Recurring  ",
//       "Maintenance Start date  ": "01/01/2025  ",
//       "Maintenance End date  ": "03/31/2025  ",
//       "Equipment Status  ": "Equipment Under Maintenance  ",
//     },
//     {
//       "Equipment Maintenance JO #  ": "EQJOB65  ",
//       "Date  ": "04/21/2025  ",
//       "Customer  ": "CUST03 PrecisionTime Co.  ",
//       "Rental Sales Order #  ": "   ",
//       "Technician Assigned  ": "Santosh V  ",
//       "Equipment  ": "Watch - Model 12X00A  ",
//       "Quantity  ": "1  ",
//       "Maintenance Occurrence Type  ": "Recurring  ",
//       "Maintenance Start date  ": "01/01/2025  ",
//       "Maintenance End date  ": "03/31/2025  ",
//       "Equipment Status  ": "Equipment Pending Maintenance  ",
//     },
//   ];

//   return (
//     <View>
//       <Text>pendingJobs</Text>
//     </View>
//   );
// };

// export default pendingJobs;
