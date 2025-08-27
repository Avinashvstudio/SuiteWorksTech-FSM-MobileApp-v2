import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Dimensions,
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
import Entypo from "@expo/vector-icons/Entypo";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import Checkbox from "expo-checkbox";
import { AntDesign } from "@expo/vector-icons";
import { useJobStore } from "@/store/globalStore";
import { useNavigation } from "expo-router";
import Toast from "react-native-toast-message";
import { useShipmentMaintenance } from "@/hooks/useShipmentDetails";

const { width, height } = Dimensions.get("window");

const ShipEquipment = () => {
  const {
    jobs,
    isLoading,
    error,
    refetch,
    postShipmentLines,
    isPostingShipmentLines,
  } = useJobs();

  const [page, setPage] = useState(0);
  const navigation = useNavigation();
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [itemsPerPageList] = useState([5, 10, 20]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedJobNumber, setSelectedJobNumber] = useState(null);
  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>(
    {}
  );
  const [isAscending, setIsAscending] = useState<boolean>(false);

  const pendingShipment = jobs.filter((job) =>
    job["Equipment Status"]?.includes("Equipment Pending Maintenance")
  );

  const from = page * itemsPerPage;
  const to = Math.min((page + 1) * itemsPerPage, pendingShipment.length);
  const paginatedJobs = isAscending
    ? [...pendingShipment].slice(from, to)
    : [...pendingShipment].reverse().slice(from, to);

  const jobItems = pendingShipment.filter(
    (job) => job["Document Number"] === selectedJobNumber
  );

  const handleOpenModal = (jobNumber: any) => {
    setSelectedJobNumber(jobNumber);

    const itemsForJob = pendingShipment.filter(
      (job) => job["Document Number"] === jobNumber
    );

    let initialSelectedState: Record<string, boolean> = {};
    itemsForJob.forEach((item, index) => {
      const itemKey = `${item["Document Number"]}-${index}`;
      if (selectedItems[itemKey] === undefined) {
        initialSelectedState[itemKey] = false;
      }
    });

    setSelectedItems((prev) => ({ ...prev, ...initialSelectedState }));
    setModalVisible(true);
  };

  const handleCheckboxChange = (itemKey: string, value: boolean) => {
    setSelectedItems((prev) => ({
      ...prev,
      [itemKey]: value,
    }));
  };

  const {
    shipmentItems,
    isLoading: shiploading,
    error: shiperror,
  } = useShipmentMaintenance();

  const handleMarkAll = () => {
    const updatedItems = { ...selectedItems };
    jobItems.forEach((item, index) => {
      const itemKey = `${item["Document Number"]}-${index}`;
      updatedItems[itemKey] = true;
    });
    setSelectedItems(updatedItems);
  };

  const handleUnmarkAll = () => {
    const updatedItems = { ...selectedItems };
    jobItems.forEach((item, index) => {
      const itemKey = `${item["Document Number"]}-${index}`;
      updatedItems[itemKey] = false;
    });
    setSelectedItems(updatedItems);
  };

  console.log("chekced", selectedItems);

  const handleSubmit = () => {
    const selectedLineIndices = Object.keys(selectedItems)
      .filter((key) => selectedItems[key])
      .map((key) => {
        const [_, index] = key.split("-");
        return parseInt(index);
      });

    console.log("Selected indices for maintenance:", selectedLineIndices);

    const jobId =
      selectedLineIndices.length > 0
        ? parseInt(jobItems[selectedLineIndices[0]]["Internal ID"] || "")
        : null;

    if (jobId && selectedLineIndices.length > 0) {
      postShipmentLines({
        jobId: jobId,
        lines: selectedLineIndices,
      });
    }

    if (isPostingShipmentLines) {
    }
    Toast.show({
      type: "info",
      text1: "Creating Shipment",
      position: "top",
      visibilityTime: 5000,
      autoHide: true,
      topOffset: 50,
      bottomOffset: 50,
    });

    setModalVisible(false);
  };

  const handleNavigateToJobOrder = (jobData: any) => {
    (navigation as any).navigate("viewJO", {
      jobData,
      viewOnly: true,
    });
  };

  const ShipmentModal = () => {
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Maintenance Shipment</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <Entypo name="cross" size={24} color="black" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
            >
              <Text style={styles.submitButtonText}>Submit</Text>
            </TouchableOpacity>

            <View style={styles.itemsHeaderContainer}>
              <Text style={styles.itemsLabel}>Items *</Text>
            </View>

            <View style={styles.checkboxButtonsContainer}>
              <TouchableOpacity
                style={styles.checkboxButton}
                onPress={handleMarkAll}
              >
                <Text style={styles.checkboxButtonText}>Mark All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.checkboxButton}
                onPress={handleUnmarkAll}
              >
                <Text style={styles.checkboxButtonText}>Unmark All</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.tableHeader}>
              <View style={styles.selectColumn}>
                <Text style={styles.tableHeaderText}>SELECT</Text>
              </View>
              {/* <View style={styles.chargeItemColumn}>
                <Text style={styles.tableHeaderText}>CHARGE ITEM</Text>
              </View> */}
              <View style={styles.equipmentColumn}>
                <Text style={styles.tableHeaderText}>EQUIPMENT</Text>
              </View>
              <View style={styles.quantityColumn}>
                <Text style={styles.tableHeaderText}>QTY</Text>
              </View>
              <View style={styles.stockColumn}>
                <Text style={styles.tableHeaderText}>STOCK AVAILABILITY</Text>
              </View>
            </View>

            <ScrollView style={{ maxHeight: 300, backgroundColor: "white" }}>
              {jobItems.length > 0 ? (
                jobItems.map((item, index) => {
                  const itemKey = `${item["Document Number"]}-${index}`;

                  const { shipmentItems, isLoading, error } =
                    useShipmentMaintenance(item["Internal ID"]);

                  console.log(shipmentItems, "fewf");

                  return (
                    <View key={itemKey} style={styles.tableRow}>
                      <View style={styles.selectColumn}>
                        <Checkbox
                          value={selectedItems[itemKey] || false}
                          onValueChange={(value) =>
                            handleCheckboxChange(itemKey, value)
                          }
                          color={
                            selectedItems[itemKey] ? Colors.primary : undefined
                          }
                          style={styles.checkbox}
                        />
                      </View>
                      {/* <View style={styles.chargeItemColumn}>
                        <Text>Maintenance charges</Text>
                      </View> */}
                      <View style={styles.equipmentColumn}>
                        <Text>{item["Equipment"] || "N/A"} </Text>
                      </View>

                      <View
                        style={[
                          styles.quantityValueColumn,
                          {
                            paddingLeft: 10,
                          },
                        ]}
                      >
                        <Text style={{ marginRight: 4 }}>
                          {item["Quantity"] || "1.0"}
                        </Text>
                      </View>
                      <View style={styles.stockColumn}>
                        <Text>{shipmentItems[index]?.stockAvailable}</Text>
                      </View>
                    </View>
                  );
                })
              ) : (
                <View style={styles.noItemsContainer}>
                  <Text style={styles.noItemsText}>
                    No items found for this job
                  </Text>
                </View>
              )}
            </ScrollView>

            <TouchableOpacity
              style={styles.submitButtonBottom}
              onPress={handleSubmit}
            >
              <Text style={styles.submitButtonText}>Submit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  const MaintenanceContent = () => {
    if (isLoading && pendingShipment.length === 0) {
      return (
        <View style={styles.container}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      );
    }

    if (error && pendingShipment.length === 0) {
      return (
        <View style={styles.container}>
          <Text style={styles.errorText}>
            Error loading pending: {error.message}
          </Text>
          <TouchableOpacity style={styles.button} onPress={() => refetch()}>
            <Text style={styles.buttonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <ShipmentModal />

        <View style={[styles.headerContainer, { backgroundColor: "white" }]}>
          <Text style={styles.title}>Pending Ship Equipment</Text>
        </View>

        <View style={styles.tableContainer}>
          <ScrollView
            refreshControl={
              <RefreshControl refreshing={isLoading} onRefresh={refetch} />
            }
          >
            <View style={styles.tableRow}>
              <View style={styles.fixedColumnContainer}>
                <DataTable style={{ borderRadius: 17 }}>
                  <DataTable.Header style={styles.headerBackground}>
                    <DataTable.Title
                      onPress={() => setIsAscending((prev) => !prev)}
                      style={styles.jobNumberColumn}
                    >
                      <Text style={styles.headerText}>
                        Job #{"  "}
                        <AntDesign
                          name={isAscending ? "caretup" : "caretdown"}
                          size={16}
                          style={{ marginTop: 4, marginLeft: 6 }}
                        />{" "}
                      </Text>
                    </DataTable.Title>
                  </DataTable.Header>

                  {paginatedJobs.length > 0 ? (
                    paginatedJobs.map((item, index) => (
                      <DataTable.Row
                        key={`fixed-${index}`}
                        style={styles.dataRow}
                      >
                        <DataTable.Cell style={styles.jobNumberColumn}>
                          <Text style={styles.jobNumberText}>
                            {item["Document Number"]}
                          </Text>
                        </DataTable.Cell>
                      </DataTable.Row>
                    ))
                  ) : (
                    <DataTable.Row style={styles.dataRow}>
                      <DataTable.Cell>
                        <Text style={styles.emptyText}>No Jobs</Text>
                      </DataTable.Cell>
                    </DataTable.Row>
                  )}
                </DataTable>
              </View>

              <ScrollView horizontal style={styles.scrollableContainer}>
                <DataTable>
                  <DataTable.Header style={styles.headerBackground}>
                    <DataTable.Title style={styles.viewShipColumn}>
                      <Text style={styles.headerText}>View</Text>
                    </DataTable.Title>
                    <DataTable.Title style={styles.viewShipColumn}>
                      <Text style={styles.headerText}>Ship</Text>
                    </DataTable.Title>
                    <DataTable.Title style={styles.column}>
                      <Text style={styles.headerText}>Date</Text>
                    </DataTable.Title>
                    <DataTable.Title style={styles.column}>
                      <Text style={styles.headerText}>Customer</Text>
                    </DataTable.Title>
                    <DataTable.Title style={styles.column}>
                      <Text style={styles.headerText}>Order #</Text>
                    </DataTable.Title>
                    <DataTable.Title style={styles.column}>
                      <Text style={styles.headerText}>Technician</Text>
                    </DataTable.Title>
                    <DataTable.Title style={styles.column}>
                      <Text style={styles.headerText}>Equipment</Text>
                    </DataTable.Title>
                    <DataTable.Title style={styles.column}>
                      <Text style={styles.headerText}>Qty</Text>
                    </DataTable.Title>
                    <DataTable.Title style={styles.column}>
                      <Text style={styles.headerText}>Type</Text>
                    </DataTable.Title>
                    <DataTable.Title style={styles.column}>
                      <Text style={styles.headerText}>Status</Text>
                    </DataTable.Title>
                  </DataTable.Header>

                  {paginatedJobs.length > 0 ? (
                    paginatedJobs.map((item, index) => (
                      <DataTable.Row
                        key={`scrollable-${index}`}
                        style={styles.dataRow}
                      >
                        <DataTable.Cell
                          style={styles.viewShipColumn}
                          onPress={() => handleNavigateToJobOrder(item)}
                        >
                          <Entypo name="eye" size={24} color={Colors.primary} />
                        </DataTable.Cell>
                        <DataTable.Cell style={styles.viewShipColumn}>
                          <TouchableOpacity
                            onPress={() =>
                              handleOpenModal(item["Document Number"])
                            }
                          >
                            <MaterialCommunityIcons
                              name="truck-delivery-outline"
                              size={24}
                              color={Colors.primary}
                            />
                          </TouchableOpacity>
                        </DataTable.Cell>
                        <DataTable.Cell style={styles.column}>
                          <Text>{item["Date"]}</Text>
                        </DataTable.Cell>
                        <DataTable.Cell style={styles.column}>
                          <Text>{item["Customer"]}</Text>
                        </DataTable.Cell>
                        <DataTable.Cell style={styles.column}>
                          <Text>{item["Rental Sales Order #"]}</Text>
                        </DataTable.Cell>
                        <DataTable.Cell style={styles.column}>
                          <Text>{item["Technician Assigned"]}</Text>
                        </DataTable.Cell>
                        <DataTable.Cell style={styles.column}>
                          <Text>{item["Equipment"]}</Text>
                        </DataTable.Cell>
                        <DataTable.Cell style={styles.column}>
                          <Text>{item["Quantity"]}</Text>
                        </DataTable.Cell>
                        <DataTable.Cell style={styles.column}>
                          <Text>{item["Maintenance Occurrence Type"]}</Text>
                        </DataTable.Cell>
                        <DataTable.Cell style={styles.column}>
                          <View style={styles.statusBadge}>
                            <Text style={styles.statusText}>
                              {item["Equipment Status"]}
                            </Text>
                          </View>
                        </DataTable.Cell>
                      </DataTable.Row>
                    ))
                  ) : (
                    <DataTable.Row>
                      <DataTable.Cell>
                        <Text style={styles.emptyText}>No Data</Text>
                      </DataTable.Cell>
                    </DataTable.Row>
                  )}
                </DataTable>
              </ScrollView>
            </View>
          </ScrollView>
        </View>

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
            numberOfPages={Math.ceil(pendingShipment.length / itemsPerPage)}
            onPageChange={setPage}
            label={`${from + 1}-${to} of ${pendingShipment.length}`}
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
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    // padding: 5,
  },
  loadingText: {
    textAlign: "center",
    padding: 20,
    fontSize: 16,
  },
  errorText: {
    textAlign: "center",
    padding: 20,
    color: "red",
    fontSize: 16,
  },
  button: {
    backgroundColor: Colors.primary,
    padding: 10,
    borderRadius: 5,
    marginHorizontal: 20,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
  headerContainer: {
    backgroundColor: Colors.primary,
    padding: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    color: "black",
    fontSize: 22,
    fontWeight: "bold",
  },
  tableContainer: {
    flex: 300,
    backgroundColor: "white",
  },

  fixedColumnContainer: {
    width: 110,
    backgroundColor: "white",
    zIndex: 1,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  scrollableContainer: {
    flex: 1,
  },
  modalTableContainer: {
    flex: 1,
    width: "100%",
    backgroundColor: "#fff",
  },

  headerBackground: {
    backgroundColor: Colors.primary,
  },
  headerText: {
    fontWeight: "bold",
    fontSize: 14,
    color: "white",
  },
  dataRow: {
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  jobNumberColumn: {
    flex: 1,
    justifyContent: "center",
  },
  jobNumberText: {
    fontWeight: "bold",
  },
  viewShipColumn: {
    width: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  column: {
    width: 130,
    justifyContent: "center",
  },
  emptyText: {
    fontStyle: "italic",
    color: "#888",
  },
  statusBadge: {
    padding: 5,
    borderRadius: 5,
    maxWidth: 120,
  },
  statusText: {
    fontSize: 12,
    textAlign: "left",
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
    backgroundColor: Colors.primary,
  },
  itemsPerPageSelector: {
    flexDirection: "row",
    alignItems: "center",
  },
  itemsDropdown: {
    width: 70,
    backgroundColor: Colors.primary,
    borderRadius: 5,
    height: 30,
    paddingHorizontal: 10,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: width * 0.9,
    maxHeight: height * 0.8,
    backgroundColor: "#f0f2f7",
    borderRadius: 10,
    padding: 15,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  closeButton: {
    padding: 5,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginBottom: 15,
    width: 100,
  },
  submitButtonBottom: {
    backgroundColor: Colors.primary,
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 15,
    width: 100,
  },
  submitButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  itemsHeaderContainer: {
    marginBottom: 10,
  },
  itemsLabel: {
    fontSize: 16,
    fontWeight: "bold",
  },
  checkboxButtonsContainer: {
    flexDirection: "row",
    marginBottom: 10,
  },
  checkboxButton: {
    backgroundColor: "#f5f5f5",
    padding: 8,
    borderRadius: 5,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  checkboxButtonText: {
    fontSize: 14,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#e0e0e0",
    padding: 4,
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
    justifyContent: "center",
    alignItems: "center",
  },
  tableHeaderText: {
    fontWeight: "bold",
    fontSize: 12,
  },
  selectColumn: {
    width: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  chargeItemColumn: {
    flex: 1.5,
    paddingHorizontal: 5,
  },
  equipmentColumn: {
    flex: 2,
    paddingHorizontal: 5,
  },
  quantityColumn: {
    width: 45,
    // paddingHorizontal: 5,
    justifyContent: "center",
  },
  quantityValueColumn: {
    width: 45,
    paddingHorizontal: 5,
    justifyContent: "center",
  },
  stockColumn: {
    width: 90,
    paddingHorizontal: 5,
    justifyContent: "center",
  },
  tableRow: {
    flexDirection: "row",
    backgroundColor: "white",
    padding: 5,
    borderBottomWidth: 1,

    borderBottomColor: "#e0e0e0",
    justifyContent: "space-between",
  },
  checkbox: {
    width: 20,
    height: 20,
  },
  noItemsContainer: {
    padding: 20,
    alignItems: "center",
  },
  noItemsText: {
    fontStyle: "italic",
    color: "#888",
  },
});

export default ShipEquipment;
