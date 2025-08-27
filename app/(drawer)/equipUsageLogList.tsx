import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from "react-native";
import { DataTable, Provider as PaperProvider } from "react-native-paper";
import { Colors } from "@/common/styles";
import {
  useEquipmentUsageLog,
  EquipmentUsageLog,
} from "@/hooks/useEquipmentUsageLog";
import { Dropdown } from "react-native-element-dropdown";

import { useNavigation } from "@react-navigation/native";
import { AntDesign, FontAwesome, Ionicons } from "@expo/vector-icons";
import Entypo from "@expo/vector-icons/Entypo";
import { StyleSheet } from "react-native";

import { router } from "expo-router";
import { useForm } from "react-hook-form";

interface Filters {
  name: string;
  location: string;
  equipment: string;
  jobOrder: string;
  dateStart: string;
  dateEnd: string;
}

const EquipUsageLogList = () => {
  const navigation = useNavigation();
  const { equipmentLogs, isLoading, error, refetch } = useEquipmentUsageLog();
  const [filteredLogs, setFilteredLogs] = useState<EquipmentUsageLog[]>([]);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [isFilterCollapsed, setIsFilterCollapsed] = useState(true);
  const [filters, setFilters] = useState<Filters>({
    name: "",
    location: "",
    equipment: "",
    jobOrder: "",
    dateStart: "",
    dateEnd: "",
  });
  const [isAscending, setIsAscending] = useState<boolean>(false);

  const [page, setPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [itemsPerPageList] = useState([5, 10, 20]);

  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const handleNavigateToEquipmentLog = (logData: any) => {
    (navigation as any).navigate("viewEquipmentLog", {
      logData,
      viewOnly: true,
    });
  };

  const handleEnterUsage = (item: any) => {
    (navigation as any).navigate("equipmentUsageLog", {
      data: item,
    });
  };

  const uniqueNames = React.useMemo(() => {
    const names = Array.from(
      new Set(equipmentLogs.map((log) => log["Name"]).filter(Boolean))
    );
    return [
      { label: "All Names", value: "" },
      ...names.map((name) => ({ label: name, value: name })),
    ];
  }, [equipmentLogs]);

  const uniqueLocations = React.useMemo(() => {
    const locations = Array.from(
      new Set(equipmentLogs.map((log) => log["Location"]).filter(Boolean))
    );
    return [
      { label: "All Locations", value: "" },
      ...locations.map((location) => ({ label: location, value: location })),
    ];
  }, [equipmentLogs]);

  const uniqueEquipment = React.useMemo(() => {
    const equipment = Array.from(
      new Set(equipmentLogs.map((log) => log["Equipment"]).filter(Boolean))
    );
    return [
      { label: "All Equipment", value: "" },
      ...equipment.map((item) => ({ label: item, value: item })),
    ];
  }, [equipmentLogs]);

  const uniqueJobOrders = React.useMemo(() => {
    const jobOrders = Array.from(
      new Set(
        equipmentLogs
          .map((log) => log["Equipment Maintenance Job Order #"])
          .filter(Boolean)
      )
    );
    return [
      { label: "All Job Orders", value: "" },
      ...jobOrders.map((jobOrder) => ({ label: jobOrder, value: jobOrder })),
    ];
  }, [equipmentLogs]);

  const getFilteredLogs = React.useCallback(() => {
    let results = [...equipmentLogs];

    if (filters.name) {
      results = results.filter((log) => log["Name"]?.includes(filters.name));
    }

    if (filters.location) {
      results = results.filter((log) =>
        log["Location"]?.includes(filters.location)
      );
    }

    if (filters.equipment) {
      results = results.filter((log) =>
        log["Equipment"]?.includes(filters.equipment)
      );
    }

    if (filters.jobOrder) {
      results = results.filter((log) =>
        log["Equipment Maintenance Job Order #"]?.includes(filters.jobOrder)
      );
    }

    if (filters.dateStart) {
      results = results.filter((log) => {
        if (!log["Date"]) return false;

        const logDateParts = log["Date"].split("/");
        const filterDateParts = filters.dateStart.split("/");

        const logDate = new Date(
          parseInt(logDateParts[2]),
          parseInt(logDateParts[0]) - 1,
          parseInt(logDateParts[1])
        );

        const filterDate = new Date(
          parseInt(filterDateParts[2]),
          parseInt(filterDateParts[0]) - 1,
          parseInt(filterDateParts[1])
        );

        logDate.setHours(0, 0, 0, 0);
        filterDate.setHours(0, 0, 0, 0);

        return (
          !isNaN(logDate.getTime()) &&
          !isNaN(filterDate.getTime()) &&
          logDate >= filterDate
        );
      });
    }

    if (filters.dateEnd) {
      results = results.filter((log) => {
        if (!log["Date"]) return false;

        const logDateParts = log["Date"].split("/");
        const filterDateParts = filters.dateEnd.split("/");

        const logDate = new Date(
          parseInt(logDateParts[2]),
          parseInt(logDateParts[0]) - 1,
          parseInt(logDateParts[1])
        );

        const filterDate = new Date(
          parseInt(filterDateParts[2]),
          parseInt(filterDateParts[0]) - 1,
          parseInt(filterDateParts[1])
        );

        logDate.setHours(0, 0, 0, 0);
        filterDate.setHours(0, 0, 0, 0);

        return (
          !isNaN(logDate.getTime()) &&
          !isNaN(filterDate.getTime()) &&
          logDate <= filterDate
        );
      });
    }

    return results;
  }, [filters, equipmentLogs]);

  const handleNavigateToEquipUsage = (item: any) => {
    (navigation as any).navigate("ViewEquipUsage", {
      item,
      viewOnly: true,
    });
  };

  const applyFilters = () => {
    setFilteredLogs(getFilteredLogs());
  };

  useEffect(() => {
    setPage(0);
  }, [filters]);

  useEffect(() => {
    applyFilters();
  }, [getFilteredLogs]);

  useEffect(() => {
    if (equipmentLogs.length > 0) {
      setFilteredLogs(equipmentLogs);
    }
  }, [equipmentLogs.length]);

  const resetFilters = () => {
    setStartDate(null);
    setEndDate(null);
    setFilters({
      name: "",
      location: "",
      equipment: "",
      jobOrder: "",
      dateStart: "",
      dateEnd: "",
    });
  };

  const from = page * itemsPerPage;
  const to = Math.min((page + 1) * itemsPerPage, filteredLogs.length);

  const paginatedLogs = isAscending
    ? [...filteredLogs].slice(from, to)
    : [...filteredLogs].reverse().slice(from, to);

  const FiltersSection = () => (
    <View style={[styles.filtersContainer, isFilterCollapsed && styles.hidden]}>
      <View style={styles.filterGrid}>
        <View style={styles.filterColumn}>
          <Text style={styles.filterLabel}>Name:</Text>
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
            data={uniqueLocations}
            labelField="label"
            valueField="value"
            placeholder="Select Location"
            value={filters.location}
            onChange={(item) =>
              setFilters((prev) => ({ ...prev, location: item.value }))
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

      <View style={styles.filterGrid}>
        <View style={styles.filterColumn}>
          <Text style={styles.filterLabel}>Job Order:</Text>
          <Dropdown
            style={styles.dropdown}
            data={uniqueJobOrders}
            labelField="label"
            valueField="value"
            placeholder="Select Job Order"
            value={filters.jobOrder}
            onChange={(item) =>
              setFilters((prev) => ({ ...prev, jobOrder: item.value }))
            }
            maxHeight={300}
            search
            itemTextStyle={{ fontSize: 12 }}
            selectedTextStyle={{ fontSize: 14 }}
          />
        </View>

        <View style={[styles.filterColumn, { alignItems: "center" }]}>
          <Text style={styles.filterLabel}>Date After:</Text>
          {/* 
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
          /> */}
        </View>

        <View style={[styles.filterColumn, { alignItems: "center" }]}>
          <Text style={styles.filterLabel}>Date Before:</Text>

          {/* <DateTimePicker
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
          /> */}
        </View>
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

  const EquipmentUsageLogContent = () => {
    if (isLoading && filteredLogs.length === 0) {
      return (
        <View style={styles.container}>
          <Text style={styles.loadingText}>
            Loading equipment usage logs...
          </Text>
        </View>
      );
    }

    if (error && filteredLogs.length === 0) {
      return (
        <View style={styles.container}>
          <Text style={styles.errorText}>
            Error loading equipment usage logs: {error.message}
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
          <Text style={styles.title}>Equipment Usage Log List</Text>
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
                        />{" "}
                      </Text>
                    </DataTable.Title>
                  </DataTable.Header>

                  {paginatedLogs.length > 0 ? (
                    paginatedLogs.map((item, index) => {
                      const uniqueKey = `fixed-${index}-${item["Document Number"]}`;
                      return (
                        <DataTable.Row
                          key={uniqueKey}
                          style={styles.dataRow}
                          onPress={() => handleNavigateToEquipmentLog(item)}
                        >
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
                        <Text style={styles.emptyText}>No Logs</Text>
                      </DataTable.Cell>
                    </DataTable.Row>
                  )}
                </DataTable>
              </View>

              {/* Scrollable columns */}
              <ScrollView horizontal style={styles.scrollableContainer}>
                <DataTable>
                  <DataTable.Header style={styles.tableHeader}>
                    <DataTable.Title style={styles.viewColumn}>
                      <Text style={styles.headerText}>View</Text>
                    </DataTable.Title>
                    {/* <DataTable.Title style={styles.usageColumn}>
                      <Text style={styles.headerText}>Enter Usage</Text>
                    </DataTable.Title> */}
                    <DataTable.Title style={styles.nameColumn}>
                      <Text style={styles.headerText}>Name</Text>
                    </DataTable.Title>
                    <DataTable.Title style={styles.column}>
                      <Text style={styles.headerText}>Date</Text>
                    </DataTable.Title>
                    <DataTable.Title style={styles.locationColumn}>
                      <Text style={styles.headerText}>Location</Text>
                    </DataTable.Title>
                    <DataTable.Title style={styles.equipmentColumn}>
                      <Text style={styles.headerText}>Equipment</Text>
                    </DataTable.Title>
                    <DataTable.Title style={styles.column}>
                      <Text style={styles.headerText}>Job Order #</Text>
                    </DataTable.Title>
                    <DataTable.Title style={styles.column}>
                      <Text style={styles.headerText}>Usage Units</Text>
                    </DataTable.Title>
                    <DataTable.Title style={styles.column}>
                      <Text style={styles.headerText}>Coverage Limit</Text>
                    </DataTable.Title>
                    <DataTable.Title style={styles.column}>
                      <Text style={styles.headerText}>Threshold</Text>
                    </DataTable.Title>
                    <DataTable.Title style={styles.lastMaintenancecolumn}>
                      <Text style={styles.headerText}>Last Maintenance</Text>
                    </DataTable.Title>
                    <DataTable.Title style={styles.column}>
                      <Text style={styles.headerText}>Completed</Text>
                    </DataTable.Title>
                  </DataTable.Header>

                  {paginatedLogs.length > 0 ? (
                    paginatedLogs.map((item, index) => {
                      const uniqueKey = `scrollable-${index}-${item["Document Number"]}`;
                      return (
                        <DataTable.Row
                          key={uniqueKey}
                          style={[styles.dataRow, { height: 47 }]}
                          // onPress={() => handleNavigateToEquipmentLog(item)}
                        >
                          <DataTable.Cell
                            style={styles.viewColumn}
                            onPress={() => handleNavigateToEquipUsage(item)}
                          >
                            <Entypo
                              name="eye"
                              size={24}
                              color={Colors.primary}
                            />
                          </DataTable.Cell>
                          {/* <DataTable.Cell
                            style={styles.usageColumn}
                            onPress={() => handleEnterUsage(item)}
                          >
                            <FontAwesome
                              name="edit"
                              size={24}
                              color={Colors.primary}
                            />
                          </DataTable.Cell> */}
                          <DataTable.Cell style={styles.nameColumn}>
                            <Text>{item["Name"]}</Text>
                          </DataTable.Cell>
                          <DataTable.Cell style={styles.column}>
                            <Text>{item["Date"]}</Text>
                          </DataTable.Cell>
                          <DataTable.Cell style={styles.locationColumn}>
                            <Text>{item["Location"]}</Text>
                          </DataTable.Cell>
                          <DataTable.Cell style={styles.equipmentColumn}>
                            <Text>{item["Equipment"]}</Text>
                          </DataTable.Cell>
                          <DataTable.Cell style={styles.column}>
                            <Text>
                              {item["Equipment Maintenance Job Order #"]}
                            </Text>
                          </DataTable.Cell>
                          <DataTable.Cell style={styles.column}>
                            <Text>{item["Usage Units"] || "N/A"}</Text>
                          </DataTable.Cell>
                          <DataTable.Cell style={styles.column}>
                            <Text>
                              {item[
                                "Maintenance Coverage Limit (In Usage Units)"
                              ] || "N/A"}
                            </Text>
                          </DataTable.Cell>
                          <DataTable.Cell style={styles.column}>
                            <Text>
                              {item["Maintenance Threshold (In Usage Units)"] ||
                                "N/A"}
                            </Text>
                          </DataTable.Cell>
                          <DataTable.Cell style={styles.lastMaintenancecolumn}>
                            <Text>
                              {item["Last Maintenance"] ? "Yes" : "No"}
                            </Text>
                          </DataTable.Cell>
                          <DataTable.Cell style={styles.column}>
                            <Text>
                              {item["Maintenance Completed"] ? "Yes" : "No"}
                            </Text>
                          </DataTable.Cell>
                        </DataTable.Row>
                      );
                    })
                  ) : (
                    <DataTable.Row style={styles.emptyRow}>
                      <DataTable.Cell>
                        <Text style={styles.emptyText}>
                          No equipment usage logs match the filter criteria
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
            numberOfPages={Math.ceil(filteredLogs.length / itemsPerPage)}
            onPageChange={setPage}
            label={`${from + 1}-${to} of ${filteredLogs.length}`}
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
      <EquipmentUsageLogContent />
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
  },
  column: {
    justifyContent: "center",
    width: 110,
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
  orderColumn: {
    width: 100,
  },
  technicianColumn: {
    width: 150,
  },
  locationColumn: {
    width: 160,
    textAlign: "center",
  },

  equipmentColumn: {
    width: 160,
  },
  quantityColumn: {
    width: 60,
  },
  nameColumn: {
    width: 170,
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
  viewColumn: {
    width: 80,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  usageColumn: {
    width: 100,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  lastMaintenancecolumn: {
    width: 140,
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

export default EquipUsageLogList;
