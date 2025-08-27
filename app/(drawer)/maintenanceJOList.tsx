import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from "react-native";
import {
  DataTable,
  Provider as PaperProvider,
  IconButton,
} from "react-native-paper";
import { Colors } from "@/common/styles";
import { useJobs } from "@/hooks/useJobs";
import { Dropdown } from "react-native-element-dropdown";
import { DatePickerInput } from "react-native-paper-dates";
import { AntDesign, Ionicons } from "@expo/vector-icons";
// import DateTimePicker from "@react-native-community/datetimepicker";
import { useRoute, useNavigation } from "@react-navigation/native";
import Entypo from "@expo/vector-icons/Entypo";
import { useJobStore } from "@/store/globalStore";
import { MaintenanceJO } from "@/types";

interface Filters {
  status: string;
  customer: string;
  dateStart: string;
  equipment: string;
  dateEnd: string;
}
const MaintenanceJOList = () => {
  const navigation = useNavigation();
  const { jobs, isLoading, error, refetch } = useJobs();
  const [filteredJobs, setFilteredJobs] = useState<MaintenanceJO[]>([]);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [isFilterCollapsed, setIsFilterCollapsed] = useState(true);
  const [filters, setFilters] = useState<Filters>({
    status: "",
    customer: "",
    equipment: "",
    dateStart: "",
    dateEnd: "",
  });

  const [isAscending, setIsAscending] = useState<boolean>(false);

  const [page, setPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [itemsPerPageList] = useState([5, 10, 20]);
  const { setTotalJobs } = useJobStore();

  const handleNavigateToJobOrder = (jobData: MaintenanceJO) => {
    (navigation as any).navigate("viewJO", {
      jobData,
      viewOnly: true,
    });
  };

  const uniqueStatuses = React.useMemo(() => {
    const statuses = Array.from(
      new Set(jobs.map((job) => job["Equipment Status"]).filter(Boolean))
    );
    return [
      { label: "All Statuses", value: "" },
      ...statuses.map((status) => ({ label: status, value: status })),
    ];
  }, [jobs]);

  const uniqueCustomers = React.useMemo(() => {
    const customers = Array.from(
      new Set(jobs.map((job) => job["Customer"]).filter(Boolean))
    );
    return [
      { label: "All Customers", value: "" },
      ...customers.map((customer) => ({ label: customer, value: customer })),
    ];
  }, [jobs]);

  const uniqueEquipment = React.useMemo(() => {
    const equipment = Array.from(
      new Set(jobs.map((job) => job["Equipment"]).filter(Boolean))
    );
    return [
      { label: "All Equipment", value: "" },
      ...equipment.map((item) => ({ label: item, value: item })),
    ];
  }, [jobs]);

  const getFilteredJobs: any = React.useCallback(() => {
    let results = [...jobs];

    if (filters.status) {
      results = results.filter((job) =>
        job["Equipment Status"]?.includes(filters.status)
      );
    }

    if (filters.customer) {
      results = results.filter((job) =>
        job["Customer"]?.includes(filters.customer)
      );
    }

    if (filters.equipment) {
      results = results.filter((job) =>
        job["Equipment"]?.includes(filters.equipment)
      );
    }
    if (filters.dateStart) {
      results = results.filter((job) => {
        if (!job["Maintenance Start date"]) return false;

        // Parse MM/DD/YYYY format
        const jobDateParts = job["Maintenance Start date"].split("/");
        const filterDateParts = filters.dateStart.split("/");

        // Create dates (month is 0-indexed in JavaScript)
        const jobDate = new Date(
          parseInt(jobDateParts[2]), // year
          parseInt(jobDateParts[0]) - 1, // month (0-indexed)
          parseInt(jobDateParts[1]) // day
        );

        const filterDate = new Date(
          parseInt(filterDateParts[2]), // year
          parseInt(filterDateParts[0]) - 1, // month (0-indexed)
          parseInt(filterDateParts[1]) // day
        );

        // Reset time portion for comparison
        jobDate.setHours(0, 0, 0, 0);
        filterDate.setHours(0, 0, 0, 0);

        return (
          !isNaN(jobDate.getTime()) &&
          !isNaN(filterDate.getTime()) &&
          jobDate >= filterDate
        );
      });
    }

    if (filters.dateEnd) {
      results = results.filter((job) => {
        if (!job["Maintenance End date"]) return false;

        // Parse MM/DD/YYYY format
        const jobDateParts = job["Maintenance End date"].split("/");
        const filterDateParts = filters.dateEnd.split("/");

        // Create dates (month is 0-indexed in JavaScript)
        const jobDate = new Date(
          parseInt(jobDateParts[2]), // year
          parseInt(jobDateParts[0]) - 1, // month (0-indexed)
          parseInt(jobDateParts[1]) // day
        );

        const filterDate = new Date(
          parseInt(filterDateParts[2]), // year
          parseInt(filterDateParts[0]) - 1, // month (0-indexed)
          parseInt(filterDateParts[1]) // day
        );

        // Reset time portion for comparison
        jobDate.setHours(0, 0, 0, 0);
        filterDate.setHours(0, 0, 0, 0);

        return (
          !isNaN(jobDate.getTime()) &&
          !isNaN(filterDate.getTime()) &&
          jobDate <= filterDate
        );
      });
    }

    return results;
  }, [filters, jobs]);

  // Apply filters - separate page reset from filter application
  const applyFilters = () => {
    setFilteredJobs(getFilteredJobs());
  };

  useEffect(() => {
    const uniqueJobsCount = Array.from(
      new Set(jobs.map((job) => job["Document Number"]).filter(Boolean))
    ).length;

    setTotalJobs(uniqueJobsCount);
  }, [jobs]);

  // Reset page separately to avoid double-updates
  useEffect(() => {
    setPage(0);
  }, [filters]);

  // Fix 3: Update filtered jobs when jobs or filters change
  useEffect(() => {
    applyFilters();
  }, [getFilteredJobs]);

  // Set initial filtered jobs when jobs first load
  useEffect(() => {
    if (jobs.length > 0) {
      setFilteredJobs(jobs);
    }
  }, [jobs.length]);

  const resetFilters = () => {
    setStartDate(null);
    setEndDate(null);
    setFilters({
      status: "",
      customer: "",
      equipment: "",
      dateStart: "",
      dateEnd: "",
    });
  };

  // Calculate pagination values
  const from = page * itemsPerPage;
  const to = Math.min((page + 1) * itemsPerPage, filteredJobs.length);
  const sortedJobs: MaintenanceJO[] = [...filteredJobs].sort((a, b) => {
    const docA = a["Document Number"]?.toUpperCase() || "";
    const docB = b["Document Number"]?.toUpperCase() || "";

    // Extract numeric part after letters if needed
    const numA = parseInt(docA.replace(/\D/g, ""), 10);
    const numB = parseInt(docB.replace(/\D/g, ""), 10);

    return isAscending ? numA - numB : numB - numA;
  });

  const paginatedJobs: MaintenanceJO[] = sortedJobs.slice(from, to);

  // console.log("jobs", paginatedJobs[0]["Document Number"]);

  // Helper function to determine status style
  const getStatusColor = (status: string) => {
    if (!status) return "#6c757d";
    if (status.includes("Completed")) return "#28a745";
    if (status.includes("Under Maintenance")) return "#ffc107";
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
          <Text style={styles.filterLabel}>Customer:</Text>
          <Dropdown
            style={styles.dropdown}
            data={uniqueCustomers}
            labelField="label"
            valueField="value"
            placeholder="Select Customer"
            value={filters.customer}
            onChange={(item) =>
              setFilters((prev) => ({ ...prev, customer: item.value }))
            }
            maxHeight={300}
            search
            itemTextStyle={{ fontSize: 12 }}
            selectedTextStyle={{ fontSize: 14 }}
          />
        </View>

        <View style={styles.filterColumn}>
          <Text style={styles.filterLabel}>Equipment:</Text>
          <Dropdown
            style={styles.dropdown}
            data={uniqueEquipment}
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
      </View>

      <View
        style={[
          styles.filterGrid,
          {
            alignItems: "flex-start",
            paddingRight: 12,
          },
        ]}
      >
        {/* <View style={[styles.filterColumn, { alignItems: "center" }]}>
          <Text style={styles.filterLabel}>Start After:</Text>

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
                  dateStart: formattedDate,
                }));
              }
            }}
          />
        </View> */}

        {/* <View
          style={[styles.filterColumn, { alignItems: "center", marginLeft: 8 }]}
        >
          <Text style={styles.filterLabel}>End Before:</Text>

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
                  dateEnd: formattedDate,
                }));
              }
            }}
          />
        </View> */}

        <View
          style={[
            styles.filterColumn,
            styles.buttonColumn,
            { justifyContent: "center", width: 60 },
          ]}
        >
          <TouchableOpacity style={styles.resetButton} onPress={resetFilters}>
            <Text style={styles.resetButtonText}>Reset Filters</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const MaintenanceContent = () => {
    if (isLoading && filteredJobs.length === 0) {
      return (
        <View style={styles.container}>
          <Text style={styles.loadingText}>Loading maintenance jobs...</Text>
        </View>
      );
    }

    if (error && filteredJobs.length === 0) {
      return (
        <View style={styles.container}>
          <Text style={styles.errorText}>
            Error loading jobs: {error.message}
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
          <Text style={styles.title}>Maintenance Job Order </Text>

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
          <TouchableOpacity
            onPress={() => refetch()}
            style={{
              zIndex: 10,
              paddingRight: 10,
            }}
          >
            <Ionicons name="refresh" size={20} color={Colors.primary} />
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
              {/* Fixed Job # Column */}
              <View style={styles.fixedColumnContainer}>
                <DataTable>
                  <DataTable.Header style={styles.tableHeader}>
                    <DataTable.Title
                      onPress={() => setIsAscending((prev) => !prev)}
                      style={[styles.jobNumberColumn, { width: 100 }]}
                    >
                      <Text style={styles.headerText}>
                        Job #{"  "}
                        <AntDesign
                          name={isAscending ? "caretup" : "caretdown"}
                          size={16}
                          style={{ marginTop: 4, marginLeft: 6 }}
                        />
                      </Text>
                    </DataTable.Title>
                  </DataTable.Header>

                  {paginatedJobs.length > 0 ? (
                    paginatedJobs.map((item, index) => {
                      const uniqueKey = `fixed-${index}-${item["Document Number"]}`;
                      return (
                        <DataTable.Row
                          key={uniqueKey}
                          style={styles.dataRow}
                          onPress={() => handleNavigateToJobOrder(item)}
                        >
                          <DataTable.Cell
                            style={[styles.jobNumberColumn, { width: 100 }]}
                          >
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
                        <Text style={styles.emptyText}>No Jobs</Text>
                      </DataTable.Cell>
                    </DataTable.Row>
                  )}
                </DataTable>
              </View>

              {/* Scrollable columns */}
              <ScrollView horizontal style={styles.scrollableContainer}>
                <DataTable>
                  <DataTable.Header style={styles.tableHeader}>
                    <DataTable.Title style={styles.jobNumberColumn}>
                      <Text style={styles.headerText}>View</Text>
                    </DataTable.Title>
                    <DataTable.Title style={[styles.column, styles.dateColumn]}>
                      <Text style={styles.headerText}>Date</Text>
                    </DataTable.Title>
                    <DataTable.Title
                      style={[styles.column, styles.customerColumnTitle]}
                    >
                      <Text style={styles.headerText}>Customer</Text>
                    </DataTable.Title>
                    <DataTable.Title
                      style={[styles.column, styles.orderColumn]}
                    >
                      <Text style={styles.headerText}>Order #</Text>
                    </DataTable.Title>
                    <DataTable.Title
                      style={[styles.column, styles.technicianColumn]}
                    >
                      <Text style={styles.headerText}>Technician</Text>
                    </DataTable.Title>
                    <DataTable.Title
                      style={[styles.column, styles.equipmentColumnTitle]}
                    >
                      <Text style={styles.headerText}>Equipment</Text>
                    </DataTable.Title>
                    <DataTable.Title
                      style={[styles.column, styles.quantityColumn]}
                    >
                      <Text style={styles.headerText}>Qty</Text>
                    </DataTable.Title>
                    <DataTable.Title style={[styles.typeColumnTitle]}>
                      <Text style={styles.headerText}>Type</Text>
                    </DataTable.Title>
                    <DataTable.Title style={[styles.column, styles.dateColumn]}>
                      <Text style={styles.headerText}>Start Date</Text>
                    </DataTable.Title>
                    <DataTable.Title style={[styles.column, styles.dateColumn]}>
                      <Text style={styles.headerText}>End Date</Text>
                    </DataTable.Title>
                    <DataTable.Title
                      style={[styles.column, styles.statusColumn]}
                    >
                      <Text style={styles.headerText}>Status</Text>
                    </DataTable.Title>
                  </DataTable.Header>

                  {paginatedJobs.length > 0 ? (
                    paginatedJobs.map((item: MaintenanceJO, index: number) => {
                      const uniqueKey = `scrollable-${index}-${item["Document Number"]}`;
                      return (
                        <DataTable.Row
                          key={uniqueKey}
                          style={styles.dataRow}
                          onPress={() => handleNavigateToJobOrder(item)}
                        >
                          <DataTable.Cell style={styles.jobNumberColumn}>
                            <Entypo
                              name="eye"
                              size={24}
                              color={Colors.primary}
                            />
                          </DataTable.Cell>
                          <DataTable.Cell
                            style={[styles.column, styles.dateColumn]}
                          >
                            <Text>{item["Date"]}</Text>
                          </DataTable.Cell>
                          <DataTable.Cell
                            style={[styles.column, styles.customerColumn]}
                          >
                            <Text>{item["Customer"]}</Text>
                          </DataTable.Cell>
                          <DataTable.Cell
                            style={[styles.column, styles.orderColumn]}
                          >
                            <Text>{item["Rental Sales Order #"]}</Text>
                          </DataTable.Cell>
                          <DataTable.Cell
                            style={[styles.column, styles.technicianColumn]}
                          >
                            <Text>{item["Technician Assigned"]}</Text>
                          </DataTable.Cell>
                          <DataTable.Cell
                            style={[styles.column, styles.equipmentColumn]}
                          >
                            <Text>{item["Equipment"]}</Text>
                          </DataTable.Cell>
                          <DataTable.Cell
                            style={[styles.column, styles.quantityColumn]}
                          >
                            <Text>{item["Quantity"]}</Text>
                          </DataTable.Cell>
                          <DataTable.Cell
                            style={[styles.column, styles.typeColumn]}
                          >
                            <Text>{item["Maintenance Occurrence Type"]}</Text>
                          </DataTable.Cell>
                          <DataTable.Cell
                            style={[styles.column, styles.dateColumn]}
                          >
                            <Text>{item["Maintenance Start date"]}</Text>
                          </DataTable.Cell>
                          <DataTable.Cell
                            style={[styles.column, styles.dateColumn]}
                          >
                            <Text>{item["Maintenance End date"]}</Text>
                          </DataTable.Cell>
                          <DataTable.Cell
                            style={[styles.column, styles.statusColumn]}
                          >
                            <View style={styles.statusBadge}>
                              <Text style={styles.statusText}>
                                {item["Equipment Status"]}
                              </Text>
                            </View>
                          </DataTable.Cell>
                        </DataTable.Row>
                      );
                    })
                  ) : (
                    <DataTable.Row style={styles.emptyRow}>
                      <DataTable.Cell>
                        <Text style={styles.emptyText}>
                          No maintenance jobs match the filter criteria
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
            numberOfPages={Math.ceil(filteredJobs.length / itemsPerPage)}
            onPageChange={setPage}
            label={`${from + 1}-${to} of ${filteredJobs.length}`}
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
      <MaintenanceContent />
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
    width: 110,
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
  },
  column: {
    justifyContent: "center",
  },
  jobNumberColumn: {
    width: 60,
    justifyContent: "center",
  },
  dateColumn: {
    width: 110,
  },
  customerColumnTitle: {
    width: 180,
  },

  customerColumn: {
    width: 180,
    display: "flex",
    justifyContent: "flex-start",
    paddingLeft: 20,
  },
  orderColumn: {
    width: 100,
  },
  technicianColumn: {
    width: 150,
  },
  equipmentColumnTitle: {
    width: 190,
    display: "flex",
    justifyContent: "flex-start",
    paddingLeft: 10,
  },
  equipmentColumn: {
    width: 190,
    display: "flex",
    justifyContent: "flex-start",
    paddingLeft: 10,
  },
  quantityColumn: {
    width: 60,
  },
  typeColumnTitle: {
    width: 110,
    display: "flex",
    justifyContent: "center",
  },
  typeColumn: {
    width: 110,
    display: "flex",
    justifyContent: "flex-start",
    paddingLeft: 20,
  },
  statusColumn: {
    width: 150,
    textAlign: "left",
    alignItems: "flex-start",
    justifyContent: "flex-start",
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

export default MaintenanceJOList;
